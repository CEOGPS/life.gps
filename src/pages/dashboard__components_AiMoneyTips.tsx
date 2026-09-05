import { useState } from "react";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { lifeosApi } from "@/lib/api.ts";
import { usePersistentState } from "@/lib/usePersistentState.ts";
import { getItem } from "@/lib/storage.ts";

export default function AiMoneyTips() {
  const [tips, setTips] = usePersistentState<string[]>(
    "dashboard_money_tips",
    [],
  );
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const bills = (await getItem<unknown[]>("budget_bills")) || [];
      const { text } = await lifeosApi.post("/api/llm/invoke", {
        prompt: `Give 3 short, actionable money tips (each under 20 words) for a business owner. ${
          bills.length
            ? `They currently track ${bills.length} recurring bills.`
            : "No bill data yet."
        } Return ONLY a JSON array of 3 strings, no markdown.`,
        max_tokens: 300,
      });
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) setTips(parsed);
    } catch (e) {
      console.error("[AiMoneyTips] refresh failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const display = tips.length
    ? tips
    : ["Click Refresh Tips to generate personalized money tips..."];

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {display.map((tip, i) => (
          <div key={i} className="glass rounded-lg p-3 border border-white/5">
            <div className="flex items-start gap-2">
              <Sparkles size={12} className="text-primary/60 mt-0.5 shrink-0" />
              <div
                className={`text-[11px] ${tips.length ? "text-white/70" : "text-white/25 italic"}`}
              >
                {tip}
              </div>
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={refresh}
        disabled={loading}
        className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-white/8 text-[10px] text-white/50 hover:border-primary/30 hover:text-primary/50 transition-colors font-display tracking-wider disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={11} className="animate-spin" />
        ) : (
          <RefreshCw size={11} />
        )}{" "}
        REFRESH TIPS
      </button>
    </div>
  );
}
