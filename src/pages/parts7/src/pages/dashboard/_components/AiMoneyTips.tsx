import { Sparkles, RefreshCw } from "lucide-react";

export default function AiMoneyTips() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass rounded-lg p-3 border border-white/5">
            <div className="flex items-start gap-2">
              <Sparkles size={12} className="text-primary/60 mt-0.5 shrink-0" />
              <div className="text-[11px] text-white/25 italic">
                Connect AI to generate personalized money tips based on your financial data...
              </div>
            </div>
          </div>
        ))}
      </div>
      <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-white/8 text-[10px] text-white/20 hover:border-primary/30 hover:text-primary/50 transition-colors font-display tracking-wider">
        <RefreshCw size={11} /> REFRESH TIPS
      </button>
    </div>
  );
}
