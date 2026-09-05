"""
Example client for AI Fallback Chain
Usage:
  python ai_client.py "Your prompt here"
  python ai_client.py "What is the capital of France?" --model gpt-4
"""
import asyncio
import httpx
import sys
import argparse
import json

FALLBACK_SERVER = "http://localhost:8000"

async def infer(prompt: str, model: str = None, temperature: float = 0.7, max_tokens: int = 500):
    """Call the fallback chain API"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{FALLBACK_SERVER}/infer",
                json={
                    "prompt": prompt,
                    "model": model,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=60
            )
            response.raise_for_status()
            result = response.json()
            
            print("\n" + "="*60)
            print(f"Provider: {result['provider']}")
            print(f"Model: {result['model']}")
            print(f"Temperature: {temperature}")
            print("="*60)
            print(f"\nResponse:\n{result['response']}")
            print("\nUsage:")
            print(f"  Input tokens: {result['usage'].get('prompt_tokens', 'N/A')}")
            print(f"  Output tokens: {result['usage'].get('completion_tokens', 'N/A')}")
            print("="*60 + "\n")
            
        except httpx.ConnectError:
            print("❌ Cannot connect to fallback server")
            print(f"   Make sure it's running: docker-compose up -d")
            sys.exit(1)
        except Exception as e:
            print(f"❌ Error: {e}")
            sys.exit(1)

async def list_providers():
    """List available providers"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{FALLBACK_SERVER}/providers")
            response.raise_for_status()
            data = response.json()
            
            print("\nAvailable AI Providers:")
            print("="*60)
            for p in data['providers']:
                print(f"\n{p['priority']}. {p['name'].upper()}")
                print(f"   Status: {p['status']}")
                print(f"   Models: {', '.join(p['models'][:3])}")
                if len(p['models']) > 3:
                    print(f"           + {len(p['models'])-3} more")
            print("="*60 + "\n")
            
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="AI Fallback Chain Client",
        epilog="Priority order: Ollama → NVIDIA NIM → OpenRouter → Groq"
    )
    parser.add_argument("prompt", nargs="?", help="Prompt to send")
    parser.add_argument("--model", help="Specific model to request")
    parser.add_argument("--temp", type=float, default=0.7, help="Temperature (0-1)")
    parser.add_argument("--tokens", type=int, default=500, help="Max output tokens")
    parser.add_argument("--list", action="store_true", help="List available providers")
    
    args = parser.parse_args()
    
    if args.list:
        asyncio.run(list_providers())
    elif args.prompt:
        asyncio.run(infer(args.prompt, model=args.model, temperature=args.temp, max_tokens=args.tokens))
    else:
        parser.print_help()
