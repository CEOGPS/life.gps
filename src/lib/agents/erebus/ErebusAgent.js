// ============================================================
// ErebusAgent.js — Frontend agentic loop orchestrator
// Tries localhost:8000 first; falls back to cloud Worker
// Streams steps via SSE when backend is online
// ============================================================

import { BACKEND } from "./ErebusCore.js";
import { parseAndRunErebusTools } from "./ErebusTools.js";

// ── SSE streaming from Python backend ────────────────────────────────────────

export async function runAgenticTask(
  task,
  context = "",
  onStep,
  onDone,
  onError,
) {
  try {
    const resp = await fetch(BACKEND + "/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, context }),
      signal: AbortSignal.timeout(120000),
    });

    if (!resp.ok) throw new Error(`Backend ${resp.status}`);

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop(); // keep incomplete chunk

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        const raw = line.slice(5).trim();
        if (raw === "[DONE]") {
          onDone?.({ answer: "", steps: 0 });
          return;
        }
        try {
          const event = JSON.parse(raw);
          if (event.type === "step") onStep?.(event);
          if (event.type === "done") {
            onDone?.(event);
            return;
          }
          if (event.type === "error") {
            onError?.(event.message);
            return;
          }
        } catch {
          /* malformed SSE chunk — skip */
        }
      }
    }
  } catch (e) {
    onError?.(e.message);
  }
}

// ── Non-streaming task (single response) ─────────────────────────────────────

export async function runTaskSync(task, context = "") {
  try {
    const r = await fetch(BACKEND + "/task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task, context }),
      signal: AbortSignal.timeout(60000),
    });
    if (r.ok) return await r.json();
    throw new Error(`Backend ${r.status}`);
  } catch {
    // Backend offline — fall back to Worker single-turn
    return null;
  }
}

// ── Single-step reasoning with tool parsing ───────────────────────────────────
// Used when backend is offline (cloud Worker path)

export async function runSingleTurn(core, msg) {
  const { response, model } = await core.reason(msg);
  const { text, toolResults } = await parseAndRunErebusTools(response);
  core.remember("user", msg);
  core.remember("assistant", text);
  core.extractAndLearn(response);
  return { text, toolResults, model };
}

// ── Sync LifeOS data to backend ───────────────────────────────────────────────

export async function syncToBackend(core) {
  if (!core.backendOnline) return;
  await core.syncLifeOSData();
}
