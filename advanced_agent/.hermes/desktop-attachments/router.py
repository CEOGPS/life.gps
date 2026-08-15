# ============================================================
# Erebus Model Router
# Priority: Groq (Llama) → xAI Grok → OpenAI GPT → Local fallback
# Claude is NOT used — Erebus is fully autonomous
# ============================================================

import os
import httpx
from dotenv import load_dotenv

load_dotenv()


class ModelRouter:
    def __init__(self):
        # Load keys — prioritize Groq > xAI Grok > OpenAI
        self.groq_key      = os.getenv("GROQ_API_KEY", "").strip()
        self.grok_key      = (os.getenv("GROK_API_KEY", "") or os.getenv("GROk_API_KEY", "")).strip()
        self.openai_key    = os.getenv("OPENAI_API_KEY", "").strip()
        self.perplexity_key= os.getenv("PERPLEXITY_API_KEY", "").strip()
        self.groq_model    = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

        # Determine primary model
        if self.groq_key:
            self._active = "groq"
        elif self.grok_key:
            self._active = "grok"
        elif self.openai_key:
            self._active = "openai"
        else:
            self._active = "local"

    def get_active_model(self) -> str:
        return self._active

    def available_models(self) -> list:
        available = []
        if self.groq_key:      available.append("groq/llama-3.3-70b")
        if self.grok_key:      available.append("xai/grok-3-mini")
        if self.openai_key:    available.append("openai/gpt-4o-mini")
        if self.perplexity_key:available.append("perplexity/sonar")
        if not available:      available.append("local/pattern-match")
        return available

    # ── Main routing logic ────────────────────────────────────────────────────

    async def route(self, message: str, mode: str, system: str, history: list) -> str:
        # Search mode → prefer Perplexity for live web results
        if mode == "search" and self.perplexity_key:
            return await self._call_perplexity(message, system, history)

        # Route by active default
        if self._active == "groq":
            return await self._call_groq(message, system, history)
        elif self._active == "grok":
            return await self._call_grok(message, system, history)
        elif self._active == "openai":
            return await self._call_openai(message, system, history)
        else:
            return self.local_fallback(message)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _build_messages(self, system: str, history: list, message: str) -> list:
        msgs = []
        if system:
            msgs.append({"role": "system", "content": system[:4000]})  # cap system prompt
        for h in history[-10:]:
            role = h.get("role", "user")
            content = h.get("content", "")
            if role in ("user", "assistant") and content:
                msgs.append({"role": role, "content": content})
        msgs.append({"role": "user", "content": message})
        return msgs

    # ── Model callers ─────────────────────────────────────────────────────────

    async def _call_groq(self, message: str, system: str, history: list) -> str:
        msgs = self._build_messages(system, history, message)
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.groq_key}",
                         "Content-Type": "application/json"},
                json={"model": self.groq_model, "messages": msgs, "max_tokens": 2000},
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]

    async def _call_grok(self, message: str, system: str, history: list) -> str:
        msgs = self._build_messages(system, history, message)
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.x.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.grok_key}",
                         "Content-Type": "application/json"},
                json={"model": "grok-3-mini", "messages": msgs, "max_tokens": 2000},
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]

    async def _call_openai(self, message: str, system: str, history: list) -> str:
        msgs = self._build_messages(system, history, message)
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.openai_key}",
                         "Content-Type": "application/json"},
                json={"model": "gpt-4o-mini", "messages": msgs, "max_tokens": 2000},
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]

    async def _call_perplexity(self, message: str, system: str, history: list) -> str:
        msgs = self._build_messages(system, history, message)
        async with httpx.AsyncClient(timeout=30) as client:
            r = await client.post(
                "https://api.perplexity.ai/chat/completions",
                headers={"Authorization": f"Bearer {self.perplexity_key}",
                         "Content-Type": "application/json"},
                json={
                    "model": "llama-3.1-sonar-small-128k-online",
                    "messages": msgs,
                    "max_tokens": 2000,
                },
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]

    # ── Local fallback (no API required) ──────────────────────────────────────

    def local_fallback(self, message: str) -> str:
        t = message.lower()
        if any(x in t for x in ["family", "dinner", "jamal", "elena"]):
            return "Family protection protocols active. Dinner at 6:30pm is non-negotiable. Jamal soccer 4pm, Elena dance — both locked."
        if any(x in t for x in ["lead", "crm", "follow", "sarah", "gino"]):
            return "CRM context loaded. Ready to draft outreach or log follow-up. Which lead should I prioritize?"
        if any(x in t for x in ["status", "health", "online"]):
            return "Erebus autonomous core online. Local file system active. AI model: offline — add GROQ_API_KEY to .env to activate Llama 3.3 (free)."
        if any(x in t for x in ["file", "list", "ls", "read"]):
            return "File system ready. Use FS_READ or FS_WRITE commands to interact with the virtual filesystem."
        if any(x in t for x in ["revenue", "cash", "money", "finance"]):
            return "Financial analysis queued. Connect AI model to run pattern analysis on your revenue data."
        if any(x in t for x in ["deploy", "vercel", "build", "push"]):
            return "Deploy sequence ready. Run `npm run build` then trigger Vercel deploy. Want me to execute?"
        return (
            f"Erebus received: \"{message[:120]}\"\n\n"
            "Local intelligence active — full AI reasoning requires an API key.\n"
            "Add one of these to advanced_agent/.env:\n"
            "• GROQ_API_KEY=  (free at groq.com — Llama 3.3 70b)\n"
            "• GROK_API_KEY=  (xAI Grok — already in your .env, just uncomment)\n"
            "• OPENAI_API_KEY= (GPT-4o-mini)"
        )
