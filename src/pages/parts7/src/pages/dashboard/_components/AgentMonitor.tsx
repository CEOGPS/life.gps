import { Bot, Plus, Circle, CheckCircle2, PauseCircle } from "lucide-react";

const STATUS_CONFIG = {
  active: { icon: <CheckCircle2 size={11} />, color: "text-emerald-400", label: "Active" },
  idle: { icon: <PauseCircle size={11} />, color: "text-yellow-500/70", label: "Idle" },
  offline: { icon: <Circle size={11} />, color: "text-white/20", label: "Offline" },
};

type AgentStatus = keyof typeof STATUS_CONFIG;

type Agent = {
  name: string;
  role: string;
  status: AgentStatus;
  model: string;
};

const AGENTS: Agent[] = [
  { name: "Erebus", role: "Primary Ops Agent", status: "active", model: "GPT-5" },
  { name: "Kranos", role: "Alternate Ops Agent", status: "idle", model: "Claude" },
];

export default function AgentMonitor() {
  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {AGENTS.map((agent) => {
          const s = STATUS_CONFIG[agent.status];
          return (
            <div key={agent.name} className="glass rounded-lg p-3 border border-white/5 hover:border-primary/20 transition-colors cursor-pointer group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full glass-crimson flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-primary/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/80 font-medium">{agent.name}</span>
                    <span className={`flex items-center gap-0.5 text-[10px] ${s.color}`}>
                      {s.icon} {s.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/30">{agent.role}</div>
                </div>
                <div className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/25 border border-white/6">
                  {agent.model}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] text-white/20">Assignment:</span>
                <span className="text-[10px] text-white/35 italic">Unassigned — connect to assign task</span>
              </div>
            </div>
          );
        })}
      </div>
      <button className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-white/10 text-[10px] text-white/25 hover:border-primary/30 hover:text-primary/60 transition-colors font-display tracking-wider">
        <Plus size={11} /> NEW AGENT
      </button>
    </div>
  );
}
