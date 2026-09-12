import { useState } from "react";
import { Lightbulb, RefreshCw, Loader2 } from "lucide-react";
import { lifeosApi } from "@/lib/api.ts";
import { usePersistentState } from "@/lib/usePersistentState.ts";

export default function LifeHacks() {
  const [hacks, setHacks] = usePersistentState<string[]>("dashboard_life_hacks", []);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { text } = await lifeosApi.post("/api/llm/invoke", {
        prompt:
          "Give 3 short, practical daily life hacks (each under 18 words) useful for a busy business owner balancing family, running a plumbing/electrical company, and a marketing agency. Return ONLY a JSON array of 3 strings, no markdown.",
        max_tokens: 300,
      });
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) setHacks(parsed);
    } catch (e) {
      console.error("[LifeHacks] generate failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const display = hacks.length ? hacks : ["Daily life hack loads here...", "Click New Hacks to generate...", "Powered by your Worker's AI fallback chain..."];

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {display.map((hack, i) => (
          <div key={i} className="flex items-start gap-2 p-2.5 glass rounded-lg border border-white/5">
            <Lightbulb size={12} className="text-yellow-400/40 mt-0.5 shrink-0" />
            <span className={`text-[11px] ${hacks.length ? "text-white/70" : "text-white/25 italic"}`}>{hack}</span>
          </div>
        ))}
      </div>
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-white/8 text-[10px] text-white/50 hover:border-yellow-400/20 hover:text-yellow-400/40 transition-colors font-display tracking-wider disabled:opacity-50"
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} NEW HACKS
      </button>
    </div>
  );
}
