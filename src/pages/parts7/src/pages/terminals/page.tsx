import { Terminal, Plus, X, Maximize2 } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const TERMINAL_TYPES = ["PowerShell", "Terminal", "WSL", "Ubuntu", "Python", "CMD", "Node.js", "Git Bash"];

export default function TerminalsPanel() {
  const [tabs, setTabs] = useState([0]);
  const [active, setActive] = useState(0);

  const addTab = () => {
    if (tabs.length >= TERMINAL_TYPES.length) return;
    const next = tabs.length;
    setTabs((t) => [...t, next]);
    setActive(next);
  };

  const closeTab = (i: number) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter((t) => t !== i);
    setTabs(newTabs);
    setActive(newTabs[0]);
  };

  return (
    <PanelLayout title="Terminals" subtitle="All system terminals in one place" icon={<Terminal size={18} />}>
      <div className="h-full flex flex-col gap-0 glass rounded-xl border border-white/8 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-white/5 shrink-0" style={{ background: "oklch(0.06 0 0)" }}>
          {tabs.map((t) => (
            <div key={t} onClick={() => setActive(t)}
              className={`flex items-center gap-2 px-4 py-2.5 cursor-pointer border-r border-white/5 transition-colors
                ${active === t ? "bg-black/40 text-white/70" : "text-white/30 hover:text-white/50"}`}
            >
              <Terminal size={11} className={active === t ? "text-primary" : ""} />
              <span className="text-[11px] font-display">{TERMINAL_TYPES[t]}</span>
              {tabs.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); closeTab(t); }} className="text-white/20 hover:text-white/60 ml-1">
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
          <button onClick={addTab} className="px-3 py-2.5 text-white/20 hover:text-primary transition-colors">
            <Plus size={12} />
          </button>
          <button className="ml-auto px-3 py-2.5 text-white/20 hover:text-white/50"><Maximize2 size={12} /></button>
        </div>

        {/* Terminal area */}
        <div className="flex-1 p-4 font-mono text-xs text-emerald-400/70" style={{ background: "#000" }}>
          <div className="text-white/20 mb-2">
            {TERMINAL_TYPES[active]} — Connect to wire live terminal sessions
          </div>
          <div className="text-primary/60">LifeOS Terminal v1.0</div>
          <div className="text-white/30 mt-1">Type commands here after wiring the terminal integration...</div>
          <div className="flex items-center gap-2 mt-4">
            <span className="text-primary/80">$</span>
            <div className="flex-1 h-px bg-white/20 relative">
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-4 bg-primary/60 blink" />
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
