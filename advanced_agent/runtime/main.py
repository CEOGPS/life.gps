# ============================================================
# Erebus Advanced Agent — FastAPI Backend v2
# Endpoints: /health  /wake  /chat  /task  /stream  /memory  /sync  /execute
# ============================================================

import os
import json
import asyncio
import subprocess
import webbrowser
from typing import Optional, AsyncGenerator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent.router  import ModelRouter
from agent.memory  import ErebusMemory
from agent.core    import ErebusAgent
from agent.planner import TaskPlanner


app = FastAPI(title="Erebus Advanced Agent", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Singletons ────────────────────────────────────────────────────────────────

_router  = ModelRouter()
_memory  = ErebusMemory()
_agent   = ErebusAgent(_router, _memory)
_planner = TaskPlanner(_router, _memory)


# ── Schemas ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    mode: str = "reasoning"
    system: str = ""
    history: list = []

class TaskRequest(BaseModel):
    task: str
    context: str = ""

class SyncRequest(BaseModel):
    crm: list = []
    tasks: list = []
    goals: list = []
    calendar: list = []
    contacts: list = []

class ExecuteRequest(BaseModel):
    action: str
    path: Optional[str] = ""
    content: Optional[str] = ""
    cmd: Optional[str] = ""
    url: Optional[str] = ""

class MemoryRequest(BaseModel):
    key: str
    value: str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":           "online",
        "model":            _router.get_active_model(),
        "models_available": _router.available_models(),
        "memory":           _memory.stats(),
    }


@app.get("/wake")
async def wake():
    """Frontend calls this to transition Erebus from DORMANT → ACTIVE."""
    return await _agent.wake()


@app.post("/chat")
async def chat(req: ChatRequest):
    """Single-turn reasoning with full soul + memory context."""
    try:
        return await _agent.reason(
            message=req.message,
            mode=req.mode,
            extra_history=req.history or None,
        )
    except Exception as e:
        return {
            "response": _router.local_fallback(req.message),
            "model":    "local",
            "error":    str(e),
        }


@app.post("/task")
async def run_task(req: TaskRequest):
    """Synchronous agentic task — collects all steps then returns."""
    try:
        result = await _planner.run_task_sync(req.task, req.context)
        return result
    except Exception as e:
        return {"error": str(e), "steps": []}


@app.post("/stream")
async def stream_task(req: TaskRequest):
    """Server-Sent Events — streams each step as Erebus works."""

    async def event_stream() -> AsyncGenerator[str, None]:
        async for event in _planner.run_task(req.task, req.context):
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",
            "Access-Control-Allow-Origin": "*",
        },
    )


@app.post("/sync")
async def sync_context(req: SyncRequest):
    """Frontend pushes localStorage data so Erebus has live context."""
    lifeos_data = {
        "crm":      req.crm,
        "tasks":    req.tasks,
        "goals":    req.goals,
        "calendar": req.calendar,
        "contacts": req.contacts,
    }
    _memory.sync_context(goals=req.goals, leads=req.crm)
    _planner.set_lifeos_data(lifeos_data)
    return {"status": "synced", "counts": {k: len(v) for k, v in lifeos_data.items()}}


@app.get("/memory")
async def get_memory():
    """Return Erebus's current memory state."""
    return {
        "stats":   _memory.stats(),
        "facts":   _memory.get_facts(50),
        "session": _memory.get_session(20),
        "goals":   _memory.get_goals(),
        "leads":   _memory.get_leads(),
    }


@app.post("/memory/learn")
async def learn_fact(req: MemoryRequest):
    """Manually teach Erebus a fact."""
    _memory.learn(req.key, req.value)
    return {"status": "learned", "key": req.key}


@app.delete("/memory/session")
async def clear_session():
    """Clear short-term session memory."""
    _memory.clear_session()
    return {"status": "cleared"}


@app.post("/execute")
async def execute(req: ExecuteRequest):
    """Local system execution — file I/O, shell commands, browser."""
    try:
        if req.action == "write_file":
            parent = os.path.dirname(req.path or "")
            if parent:
                os.makedirs(parent, exist_ok=True)
            with open(req.path, "w", encoding="utf-8") as f:
                f.write(req.content or "")
            return {"result": f"Written: {req.path} ({len(req.content or '')} chars)"}

        elif req.action == "read_file":
            if not os.path.exists(req.path):
                return {"result": f"Error: {req.path} not found"}
            with open(req.path, "r", encoding="utf-8") as f:
                return {"result": f.read()}

        elif req.action == "run_command":
            result = subprocess.run(
                req.cmd, shell=True, capture_output=True,
                text=True, timeout=30, cwd=os.path.expanduser("~"),
            )
            return {"result": result.stdout or result.stderr or "(no output)"}

        elif req.action == "open_browser":
            webbrowser.open(req.url or "")
            return {"result": f"Opened: {req.url}"}

        elif req.action == "list_dir":
            path = req.path or os.path.expanduser("~")
            return {"result": "\n".join(sorted(os.listdir(path)))}

        else:
            raise HTTPException(400, f"Unknown action: {req.action}")

    except Exception as e:
        return {"result": f"Error: {e}"}


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("FASTAPI_PORT", 8000))
    print(f"\n  Erebus v2 starting on port {port}")
    print(f"  Model: {_router.get_active_model()}")
    print(f"  Available: {_router.available_models()}")
    print(f"  Memory: {_memory.stats()}\n")
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
