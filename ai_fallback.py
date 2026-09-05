"""
AI Fallback Chain Orchestrator
Handles failover between: Local Ollama → NVIDIA NIM → OpenRouter → Hermes
"""
import os
import json
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AIProvider:
    name: str
    base_url: str
    api_key: Optional[str] = None
    models: list = None
    priority: int = 0
    timeout: int = 30
    
    def __post_init__(self):
        if self.models is None:
            self.models = []

class AIFallbackChain:
    """Orchestrates AI model inference with automatic fallback"""
    
    def __init__(self):
        self.providers = self._init_providers()
        self.client = httpx.AsyncClient(timeout=30)
        
    def _init_providers(self) -> list:
        """Initialize providers from environment with priority order"""
        providers = []
        
        # 1. LOCAL OLLAMA (highest priority, no network latency)
        if os.getenv("OLLAMA_BASE_URL"):
            providers.append(AIProvider(
                name="ollama-local",
                base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
                models=["llama2:13b", "mistral:latest", "neural-chat:latest"],
                priority=1,
                timeout=60
            ))
        
        # 2. NVIDIA NIM (local GPU, fast inference)
        if os.getenv("NVIDIA_API_KEY"):
            providers.append(AIProvider(
                name="nvidia-nim",
                base_url=os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1"),
                api_key=os.getenv("NVIDIA_API_KEY"),
                models=["meta/llama2-70b", "meta/llama3-70b"],
                priority=2,
                timeout=45
            ))
        
        # 3. OPENROUTER (multi-model, cost-effective)
        if os.getenv("OPENROUTER_API_KEY"):
            providers.append(AIProvider(
                name="openrouter",
                base_url="https://openrouter.ai/api/v1",
                api_key=os.getenv("OPENROUTER_API_KEY"),
                models=[
                    "openai/gpt-4-turbo",
                    "anthropic/claude-3-opus",
                    "meta-llama/llama-2-70b-chat",
                    "mistralai/mistral-large",
                ],
                priority=3,
                timeout=30
            ))
        
        # 4. HERMES (Groq Llama, ultra-fast API)
        if os.getenv("GROQ_API_KEY"):
            providers.append(AIProvider(
                name="groq",
                base_url="https://api.groq.com/openai/v1",
                api_key=os.getenv("GROQ_API_KEY"),
                models=["llama-3.3-70b-versatile", "mixtral-8x7b-32768"],
                priority=4,
                timeout=20
            ))
        
        # Sort by priority
        return sorted(providers, key=lambda p: p.priority)
    
    async def infer(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 500,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Inference with automatic fallback chain
        
        Args:
            prompt: User prompt
            model: Preferred model (optional)
            temperature: Sampling temperature
            max_tokens: Max output tokens
            **kwargs: Additional parameters
            
        Returns:
            {
                "response": str,
                "provider": str,
                "model": str,
                "usage": {...}
            }
        """
        
        for provider in self.providers:
            try:
                logger.info(f"Attempting inference via {provider.name}")
                
                if provider.name == "ollama-local":
                    return await self._infer_ollama(provider, prompt, model, temperature, max_tokens)
                
                elif provider.name == "nvidia-nim":
                    return await self._infer_nvidia(provider, prompt, model, temperature, max_tokens)
                
                elif provider.name == "openrouter":
                    return await self._infer_openrouter(provider, prompt, model, temperature, max_tokens)
                
                elif provider.name == "groq":
                    return await self._infer_groq(provider, prompt, model, temperature, max_tokens)
                    
            except Exception as e:
                logger.warning(f"Provider {provider.name} failed: {str(e)}")
                continue
        
        raise RuntimeError("All AI providers exhausted, inference failed")
    
    async def _infer_ollama(self, provider: AIProvider, prompt: str, model: Optional[str], temp: float, max_tok: int) -> Dict:
        """Ollama local inference"""
        model = model or provider.models[0]
        
        response = await self.client.post(
            f"{provider.base_url}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "temperature": temp,
                "num_predict": max_tok,
                "stream": False
            },
            timeout=provider.timeout
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            "response": data.get("response", ""),
            "provider": "ollama",
            "model": model,
            "usage": {
                "prompt_tokens": data.get("prompt_eval_count", 0),
                "completion_tokens": data.get("eval_count", 0),
            }
        }
    
    async def _infer_nvidia(self, provider: AIProvider, prompt: str, model: Optional[str], temp: float, max_tok: int) -> Dict:
        """NVIDIA NIM inference (OpenAI-compatible)"""
        model = model or provider.models[0]
        
        response = await self.client.post(
            f"{provider.base_url}/chat/completions",
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temp,
                "max_tokens": max_tok,
            },
            headers={"Authorization": f"Bearer {provider.api_key}"},
            timeout=provider.timeout
        )
        response.raise_for_status()
        data = response.json()
        
        choice = data["choices"][0]
        return {
            "response": choice["message"]["content"],
            "provider": "nvidia-nim",
            "model": model,
            "usage": data.get("usage", {})
        }
    
    async def _infer_openrouter(self, provider: AIProvider, prompt: str, model: Optional[str], temp: float, max_tok: int) -> Dict:
        """OpenRouter inference (multi-model gateway)"""
        model = model or provider.models[0]
        
        response = await self.client.post(
            f"{provider.base_url}/chat/completions",
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temp,
                "max_tokens": max_tok,
            },
            headers={
                "Authorization": f"Bearer {provider.api_key}",
                "HTTP-Referer": "https://lifeos1.ceogps.com"
            },
            timeout=provider.timeout
        )
        response.raise_for_status()
        data = response.json()
        
        choice = data["choices"][0]
        return {
            "response": choice["message"]["content"],
            "provider": "openrouter",
            "model": model,
            "usage": data.get("usage", {})
        }
    
    async def _infer_groq(self, provider: AIProvider, prompt: str, model: Optional[str], temp: float, max_tok: int) -> Dict:
        """Groq (ultra-fast Llama inference)"""
        model = model or provider.models[0]
        
        response = await self.client.post(
            f"{provider.base_url}/chat/completions",
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temp,
                "max_tokens": max_tok,
            },
            headers={"Authorization": f"Bearer {provider.api_key}"},
            timeout=provider.timeout
        )
        response.raise_for_status()
        data = response.json()
        
        choice = data["choices"][0]
        return {
            "response": choice["message"]["content"],
            "provider": "groq",
            "model": model,
            "usage": data.get("usage", {})
        }

# Global instance
ai_chain = None

def get_ai_chain() -> AIFallbackChain:
    global ai_chain
    if ai_chain is None:
        ai_chain = AIFallbackChain()
    return ai_chain
