// LifeOS1 AI client — routes prompts through the Cloudflare Worker's
// multi-model router. Ported from the prior build; swapped Firebase auth
// for Supabase auth and Convex-era paths for the current Worker.
import { supabase } from "@/lib/supabaseClient.ts";

const WORKER_URL = import.meta.env.VITE_WORKER_URL || "https://oauth.ceogps.com";
const SYSTEM =
  "You are AgentZero, the AI core of LifeOS1 for Chris Green. Be direct, strategic, actionable.";

const MODEL_PREF_KEY = "lifeos1_preferred_model";

export function getPreferredModel(): string {
  try {
    return localStorage.getItem(MODEL_PREF_KEY) || "auto";
  } catch {
    return "auto";
  }
}

export function setPreferredModel(model: string): void {
  try {
    localStorage.setItem(MODEL_PREF_KEY, (model || "auto").toLowerCase());
  } catch {
    /* noop */
  }
}

let _lastModelUsed: string | null = null;
export function getLastModelUsed(): string | null {
  return _lastModelUsed;
}

interface InvokeLLMArgs {
  prompt: string | Array<{ role: string; content: string }>;
  systemPrompt?: string;
  model?: string;
}

export async function invokeLLM({ prompt, systemPrompt, model = "" }: InvokeLLMArgs): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) {
    return "[Sign in to use AI features.]";
  }

  const sys = systemPrompt || SYSTEM;
  const preferred = model || getPreferredModel();
  const messagesArg = Array.isArray(prompt) ? prompt : null;

  try {
    const response = await fetch(`${WORKER_URL}/api/llm/invoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(
        messagesArg
          ? { messages: messagesArg, system: sys, model: preferred }
          : { prompt, system: sys, model: preferred },
      ),
    });

    if (response.status === 401) {
      return "[Session expired. Please sign in again.]";
    }

    const data = await response.json().catch(() => ({}));
    _lastModelUsed = data.model_used || null;

    if (data.text) return data.text as string;
    console.warn("[LLM] All providers failed:", data.providers_tried);
    return "[AI temporarily unavailable — check the Integrations panel.]";
  } catch (err) {
    console.error("[LLM] Worker unreachable:", err instanceof Error ? err.message : err);
    return "[AI router unreachable — Worker may be down.]";
  }
}
