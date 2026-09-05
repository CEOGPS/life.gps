"""
FastAPI server with AI fallback chain
Exposes unified inference endpoint across all AI providers
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import asyncio
from ai_fallback import get_ai_chain
import logging

logger = logging.getLogger(__name__)

app = FastAPI(
    title="LifeOS AI Fallback",
    description="Unified AI inference with automatic provider fallback",
    version="1.0.0"
)

class InferenceRequest(BaseModel):
    prompt: str
    model: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 500

class InferenceResponse(BaseModel):
    response: str
    provider: str
    model: str
    usage: dict

@app.on_event("startup")
async def startup():
    """Initialize AI chain on startup"""
    chain = get_ai_chain()
    logger.info(f"Loaded {len(chain.providers)} AI providers")
    for p in chain.providers:
        logger.info(f"  - {p.name} (priority {p.priority})")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "providers": [p.name for p in get_ai_chain().providers]
    }

@app.get("/providers")
async def list_providers():
    """List available AI providers"""
    chain = get_ai_chain()
    return {
        "providers": [
            {
                "name": p.name,
                "priority": p.priority,
                "models": p.models,
                "status": "ready"
            }
            for p in chain.providers
        ]
    }

@app.post("/infer", response_model=InferenceResponse)
async def infer(request: InferenceRequest):
    """
    Unified inference endpoint with fallback chain
    
    Priority order:
    1. Ollama (local, no latency)
    2. NVIDIA NIM (local GPU)
    3. OpenRouter (multi-model gateway)
    4. Groq (ultra-fast API)
    """
    try:
        chain = get_ai_chain()
        result = await chain.infer(
            prompt=request.prompt,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        return InferenceResponse(**result)
    except Exception as e:
        logger.error(f"Inference failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(request: InferenceRequest):
    """Chat endpoint (aliases /infer)"""
    return await infer(request)

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
