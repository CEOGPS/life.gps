import { BarChart3, TrendingUp, Package } from "lucide-react";

export default function RoiAnalysis() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="grid grid-cols-3 gap-2">
        {["Revenue", "Cost", "ROI"].map((label) => (
          <div key={label} className="glass rounded-lg p-2.5 text-center border border-white/5">
            <div className="text-[9px] text-white/25 font-display tracking-wider mb-1">{label}</div>
            <div className="text-sm text-white/60 font-display">--</div>
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 rounded-lg bg-white/2 border border-white/5 flex flex-col items-center justify-center gap-2 min-h-[80px]">
        <BarChart3 size={22} className="text-white/10" />
        <div className="text-[10px] text-white/20 text-center">
          Connect product data to generate ROI charts
        </div>
      </div>

      {/* Products placeholder */}
      <div className="border-t border-white/5 pt-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Package size={11} className="text-white/25" />
          <span className="text-[10px] text-white/30">Top Products</span>
        </div>
        <div className="space-y-1.5">
          {["Product A", "Product B", "Product C"].map((p) => (
            <div key={p} className="flex items-center gap-2">
              <div className="text-[10px] text-white/30 w-16 truncate">{p}</div>
              <div className="flex-1 h-1.5 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-primary/30" style={{ width: "0%" }} />
              </div>
              <div className="text-[10px] text-white/20 w-8 text-right">--</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
