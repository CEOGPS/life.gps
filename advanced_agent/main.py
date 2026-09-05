# advanced_agent/main.py
# Erebus Python Backend — FastAPI Server

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

# ─── Models ──────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    mode: str = "reasoning"
    history: Optional[List[dict]] = []

class ChatResponse(BaseModel):
    response: str
    model: Optional[str] = "backend"

# ─── App ──────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Erebus Python Backend",
    description="Autonomous reasoning engine for Erebus",
    version="1.0.0"
)

# ─── CORS ──────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Endpoints ────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "alive",
        "agent": "Erebus",
        "backend": "online",
        "version": "1.0.0"
    }

@app.get("/wake")
async def wake():
    return {
        "online": True,
        "backend": True,
        "model": "backend-ready",
        "message": "Erebus Python backend is online."
    }

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Simple response for now — you can connect to LLMs here
        response_text = f"Erebus received: '{request.message}'. Backend is online."
        
        return ChatResponse(
            response=response_text,
            model="backend"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/sync")
async def sync(data: dict):
    # Placeholder for LifeOS data sync
    return {"status": "synced", "received": len(data)}

# ─── CLI Entry ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )