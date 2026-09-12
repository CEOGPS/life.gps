import { Activity, Plus, Heart, Dumbbell, Moon, Apple, TrendingUp, Target } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const METRICS = [
  { icon: <Heart size={16} />, label: "Heart Rate", val: "--", unit: "bpm", color: "text-red-400" },
  { icon: <Activity size={16} />, label: "Steps", val: "--", unit: "today", color: "text-emerald-400" },
  { icon: <Moon size={16} />, label: "Sleep", val: "--", unit: "hrs", color: "text-blue-400" },
  { icon: <Apple size={16} />, label: "Calories", val: "--", unit: "kcal", color: "text-orange-400" },
];

export default function HealthPanel() {
  return (
    <PanelLayout
      title="Health"
      subtitle="Monitoring, workouts, and wellness goals"
      icon={<Activity size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Plus size={12} /> LOG ENTRY
        </button>
      }
    >
      <div className="h-full flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          {METRICS.map((m) => (
            <div key={m.label} className="glass rounded-xl p-4 border border-white/8 text-center">
              <div className={`flex justify-center mb-2 ${m.color}`}>{m.icon}</div>
              <div className={`text-xl font-display ${m.color}`}>{m.val}</div>
              <div className="text-[9px] text-white/25 mt-0.5">{m.unit}</div>
              <div className="text-[10px] text-white/40 mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-3 gap-4">
          <div className="glass rounded-xl border border-white/8 p-4 flex flex-col">
            <div className="text-[10px] text-white/30 font-display tracking-wider mb-3 flex items-center gap-1.5">
              <Dumbbell size={12} /> WORKOUTS
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Dumbbell size={20} className="mx-auto text-white/10 mb-2" />
                <div className="text-xs text-white/20">No workouts logged</div>
                <button className="mt-2 text-[10px] text-primary/60 font-display">+ ADD WORKOUT</button>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl border border-white/8 p-4 flex flex-col">
            <div className="text-[10px] text-white/30 font-display tracking-wider mb-3 flex items-center gap-1.5">
              <Target size={12} /> GOALS
            </div>
            <div className="space-y-2">
              {["Weight Goal", "Steps Goal", "Sleep Goal", "Water Intake"].map((g) => (
                <div key={g} className="flex items-center gap-2">
                  <div className="text-[10px] text-white/30 w-24 truncate">{g}</div>
                  <div className="flex-1 h-1.5 rounded-full bg-white/8"><div className="h-full w-0 rounded-full bg-primary/50" /></div>
                  <div className="text-[10px] text-white/20">0%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-xl border border-white/8 p-4 flex flex-col">
            <div className="text-[10px] text-white/30 font-display tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} /> TRENDS
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp size={20} className="mx-auto text-white/10 mb-2" />
                <div className="text-[11px] text-white/20">Connect health device to see trends</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
