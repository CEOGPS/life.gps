import { Lightbulb, RefreshCw } from "lucide-react";

export default function LifeHacks() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-2 p-2.5 glass rounded-lg border border-white/5">
            <Lightbulb size={12} className="text-yellow-400/40 mt-0.5 shrink-0" />
            <span className="text-[11px] text-white/25 italic">Daily life hack #{i} loads here after AI is connected...</span>
          </div>
        ))}
      </div>
      <button className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-white/8 text-[10px] text-white/20 hover:border-yellow-400/20 hover:text-yellow-400/40 transition-colors font-display tracking-wider">
        <RefreshCw size={11} /> NEW HACKS
      </button>
    </div>
  );
}
