# AI Fallback Chain Setup Guide

## Overview

LifeOS AI Fallback provides automatic failover across your AI infrastructure:

1. **Ollama** (Local) - Priority 1 - No latency, free
2. **NVIDIA NIM** - Priority 2 - Local GPU inference  
3. **OpenRouter** - Priority 3 - Multi-model gateway
4. **Groq** (Hermes) - Priority 4 - Ultra-fast API

## Quick Start

### Prerequisites

- Docker & Docker Compose
- API keys: `NVIDIA_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY` (optional)
- Environment variables in `.env`

### 1. Start the full stack

```bash
docker-compose up -d
```

This starts:
- **Ollama** on port 11434
- **AI Fallback Server** on port 8000
- **LifeOS Frontend** on port 3000

### 2. Pull models to Ollama (optional)

```bash
# SSH into Ollama container
docker exec -it lifeos-ollama bash

# Pull a model
ollama pull llama2:13b
ollama pull mistral:latest
ollama pull neural-chat:latest

# List models
ollama list
```

### 3. Test the API

```bash
# List providers
curl http://localhost:8000/providers

# Single inference
curl -X POST http://localhost:8000/infer \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the capital of France?",
    "temperature": 0.7,
    "max_tokens": 200
  }'
```

### 4. Use the Python client

```bash
# List providers
python ai_client.py --list

# Send a prompt
python ai_client.py "Explain quantum computing" --temp 0.5 --tokens 500

# Request specific model
python ai_client.py "Hello" --model gpt-4
```

## Environment Variables

Add to `.env`:

```
# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434

# NVIDIA NIM
NVIDIA_API_KEY=your_nvidia_key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_key

# Groq (Hermes)
GROQ_API_KEY=your_groq_key
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│         Client Application                      │
│         (Next.js Frontend, CLI, etc)            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │  FastAPI Server│
        │  Port 8000     │
        │  /infer        │
        │  /providers    │
        │  /health       │
        └────────────────┘
                 │
      ┌──────────┴──────────┬──────────┬──────────┐
      │                     │          │          │
      ▼                     ▼          ▼          ▼
   Ollama              NVIDIA NIM   OpenRouter  Groq
   (Local)             (Local GPU)  (Gateway)   (API)
   11434               NIM API      api.openr   api.groq
                                    outer.ai    .com
```

## Fallback Logic

When you call `/infer`:

1. **Try Ollama** (fastest, free, local)
   - If Ollama is down or times out after 60s
   
2. **Try NVIDIA NIM** (GPU-accelerated)
   - Requires API key
   - If NIM is down or times out after 45s
   
3. **Try OpenRouter** (100+ models)
   - Cost-effective multi-model gateway
   - If OpenRouter is down or times out after 30s
   
4. **Try Groq** (ultra-fast Llama inference)
   - Requires API key
   - If Groq fails, return error

## Performance Benchmarks

| Provider | Latency | Cost | Best For |
|----------|---------|------|----------|
| Ollama | <100ms | Free | Real-time chat, local |
| NVIDIA NIM | 100-500ms | Free (self-hosted) | Complex reasoning |
| OpenRouter | 500ms-2s | $$ per token | Variety, reliability |
| Groq | 1-5s | $$ per token | Speed + quality |

## Monitoring

Check health:
```bash
curl http://localhost:8000/health
```

View logs:
```bash
docker compose logs -f ai-fallback
docker compose logs -f ollama
```

## Advanced Usage

### Custom Model Selection

```python
import asyncio
from ai_fallback import get_ai_chain

async def main():
    chain = get_ai_chain()
    result = await chain.infer(
        prompt="Your prompt",
        model="mistral:latest",  # Use specific model
        temperature=0.5,
        max_tokens=1000
    )
    print(result)

asyncio.run(main())
```

### Batch Inference

```bash
# Process multiple prompts with fallback
for prompt in "What is AI?" "Explain ML" "Tell me about LLMs"; do
  python ai_client.py "$prompt"
done
```

### Integration with LifeOS

In your React components:

```typescript
const response = await fetch('http://localhost:8000/infer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: userInput,
    temperature: 0.7,
    max_tokens: 500
  })
});

const result = await response.json();
console.log(`${result.provider}: ${result.response}`);
```

## Troubleshooting

### "All AI providers exhausted"
- Check `.env` for valid API keys
- Verify network connectivity
- Run `docker compose logs -f ai-fallback` to see errors

### Ollama not responding
- Ensure Ollama container is running: `docker ps | grep ollama`
- Check Ollama logs: `docker compose logs ollama`
- Pull a model: `docker exec lifeos-ollama ollama pull mistral`

### NVIDIA NIM connection issues
- Verify API key is valid
- Check `NVIDIA_BASE_URL` environment variable
- Ensure firewall allows outbound HTTPS

### Slow responses
- Ollama responses are fastest (local)
- If Ollama is slow, check model size
- Consider switching to faster model: `ollama pull neural-chat`

## Production Deployment

For production, use environment-specific configs:

```yaml
# docker-compose.prod.yml
services:
  ai-fallback:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"
```

Deploy:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Cost Optimization

1. **Use Ollama first** - it's free and fastest
2. **Configure auto-scaling** - scale based on queue depth
3. **Model selection** - use smaller models for simple tasks
4. **Batch requests** - group prompts for efficiency
5. **Cache responses** - avoid re-running identical prompts

## Support

For issues:
1. Check logs: `docker compose logs -f`
2. Test health: `curl http://localhost:8000/health`
3. List providers: `python ai_client.py --list`
4. Run diagnostics: `docker compose exec ai-fallback python -m pytest`
