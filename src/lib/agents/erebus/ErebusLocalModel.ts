// @ts-nocheck -- converted from .js; deep agent logic, typing deferred
// ErebusLocalModel.js — Browser-embedded local AI (WebLLM via WebGPU)
// Runs quantized models entirely in the browser. No API keys, no internet.

let _engine = null;
let _status = "idle"; // idle | loading | ready | error
let _progress = 0;
let _message = "";
let _modelId = null;
const _listeners = new Set();

function _notify() {
  _listeners.forEach((fn) =>
    fn({
      status: _status,
      progress: _progress,
      message: _message,
      model: _modelId,
    }),
  );
}

export function onLocalModelStatus(fn) {
  _listeners.add(fn);
  fn({
    status: _status,
    progress: _progress,
    message: _message,
    model: _modelId,
  });
  return () => _listeners.delete(fn);
}

export function getLocalModelStatus() {
  return {
    status: _status,
    progress: _progress,
    message: _message,
    model: _modelId,
  };
}

export const LOCAL_MODELS = [
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 1B",
    size: "0.8 GB",
    speed: "fastest",
  },
  {
    id: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    label: "Llama 3.2 3B",
    size: "2.2 GB",
    speed: "fast",
  },
  {
    id: "Phi-3.5-mini-instruct-q4f16_1-MLC",
    label: "Phi-3.5 Mini",
    size: "2.2 GB",
    speed: "fast",
  },
  {
    id: "gemma-2-2b-it-q4f16_1-MLC",
    label: "Gemma 2 2B",
    size: "1.5 GB",
    speed: "fast",
  },
  {
    id: "Qwen2.5-7B-Instruct-q4f16_1-MLC",
    label: "Qwen 2.5 7B",
    size: "4.5 GB",
    speed: "medium",
  },
  {
    id: "DeepSeek-R1-Distill-Qwen-7B-q4f16_1-MLC",
    label: "DeepSeek R1 7B",
    size: "4.5 GB",
    speed: "medium",
  },
];

export async function loadLocalModel(modelId) {
  if (_status === "ready" && _modelId === modelId) return _engine;
  if (_status === "loading") return null;

  _engine = null;
  _status = "loading";
  _modelId = modelId;
  _progress = 0;
  _message = "Initializing WebGPU…";
  _notify();

  try {
    const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
    _engine = await CreateMLCEngine(modelId, {
      initProgressCallback: ({ progress, text }) => {
        _progress = Math.round((progress ?? 0) * 100);
        _message = text || "Loading…";
        _notify();
      },
    });
    _status = "ready";
    _progress = 100;
    _message = "Ready";
    _notify();
    return _engine;
  } catch (e) {
    _status = "error";
    _message = e.message || "Failed to load model";
    _notify();
    return null;
  }
}

export function unloadLocalModel() {
  _engine?.unload?.();
  _engine = null;
  _status = "idle";
  _progress = 0;
  _message = "";
  _modelId = null;
  _notify();
}

export async function localModelChat(system, messages, maxTokens = 1200) {
  if (!_engine || _status !== "ready") return null;
  try {
    const reply = await _engine.chat.completions.create({
      messages: [{ role: "system", content: system }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    return reply.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}
