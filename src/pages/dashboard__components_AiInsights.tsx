import { useState } from "react";
import { Brain, RefreshCw, Loader2 } from "lucide-react";
import { lifeosApi } from "@/lib/api.ts";
import { usePersistentState } from "@/lib/usePersistentState.ts";

export default function AiInsights() {
  const [insights, setInsights] = usePersistentState<string[]>(
    "dashboard_ai_insights",
    [],
  );
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { text } = await lifeosApi.post("/api/llm/invoke", {
        prompt:
          "Give 2 short, punchy cross-domain business insights (each under 20 words) for a busy Atlanta plumbing/electrical business owner who also runs a marketing agency and builds software. Return ONLY a JSON array of 2 strings, no markdown.",
        max_tokens: 300,
      });
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) setInsights(parsed);
    } catch (e) {
      console.error("[AiInsights] analyze failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {insights.length === 0
          ? [1, 2].map((i) => (
              <div key={i} className="glass-crimson rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Brain
                    size={12}
                    className="text-primary/60 mt-0.5 shrink-0"
                  />
                  <div className="text-[11px] text-white/25 italic leading-relaxed">
                    Click Analyze to surface cross-domain insights...
                  </div>
                </div>
              </div>
            ))
          : insights.map((insight, i) => (
              <div key={i} className="glass-crimson rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Brain
                    size={12}
                    className="text-primary/60 mt-0.5 shrink-0"
                  />
                  <div className="text-[11px] text-white/70 leading-relaxed">
                    {insight}
                  </div>
                </div>
              </div>
            ))}
      </div>
      <button
        onClick={analyze}
        disabled={loading}
        className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-primary/15 text-[10px] text-white/50 hover:border-primary/35 hover:text-primary/60 transition-colors font-display tracking-wider disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <RefreshCw size={11} />
        )}{" "}
        ANALYZE
      </button>
    </div>
  );
}
