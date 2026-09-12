import { FolderKanban, Plus, Calendar, CheckSquare, Clock, User, BarChart3, Circle, CheckCircle2 } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const STAGES = ["Briefing", "In Progress", "Review", "Delivered"];

export default function ProjectsPanel() {
  const [stage, setStage] = useState(0);

  return (
    <PanelLayout
      title="Projects"
      subtitle="Client marketing projects and deliverables"
      icon={<FolderKanban size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Plus size={12} /> NEW PROJECT
        </button>
      }
    >
      <div className="h-full flex gap-4">
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="grid grid-cols-4 gap-3">
            {STAGES.map((s, i) => (
              <div key={s} className="glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
                <div className={`p-3 border-b border-white/5 flex items-center justify-between
                  ${i === 0 ? "border-l-2 border-l-primary/50" : ""}`}>
                  <span className="text-[10px] font-display tracking-wider text-white/40">{s.toUpperCase()}</span>
                  <span className="text-[9px] text-white/20 glass px-1.5 py-0.5 rounded-full">0</span>
                </div>
                <div className="p-2 flex-1 min-h-[200px]">
                  <button className="w-full py-3 border border-dashed border-white/8 rounded-lg text-[10px] text-white/15 hover:border-primary/25 hover:text-primary/40 transition-colors font-display">
                    + ADD PROJECT
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="glass rounded-xl border border-white/8 p-4 flex items-center gap-4">
            <BarChart3 size={16} className="text-white/20" />
            <div className="flex-1 grid grid-cols-4 gap-4">
              {["Active Projects", "Deliverables Due", "Hours This Week", "Completed"].map((m) => (
                <div key={m} className="text-center">
                  <div className="text-[9px] text-white/20 font-display">{m}</div>
                  <div className="text-lg text-white/50 font-display mt-0.5">0</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
