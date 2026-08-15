import { useEffect, useState } from "react";
import { Bot, Play, Circle, CheckCircle2, Loader2 } from "lucide-react";
import { lifeosApi } from "@/lib/api.ts";

type AgentDef = { id: string; name: string; desc: string };
type AgentStatusEntry = {
  name: string;
  lastRun: { ts: number; status: string } | null;
  totalRuns: number;
};

export default function AgentMonitor() {
  const [agents, setAgents] = useState<AgentDef[]>([]);
  const [status, setStatus] = useState<Record<string, AgentStatusEntry>>({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [agentList, statusMap] = await Promise.all([
        lifeosApi.get("/api/agents"),
        lifeosApi.get("/api/agents/status"),
      ]);
      setAgents(agentList);
      setStatus(statusMap);
    } catch (e) {
      console.error("[AgentMonitor] failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const runAgent = async (id: string) => {
    setRunning(id);
    try {
      await lifeosApi.post("/api/agents/run", { agent: id, payload: {} });
      await refresh();
    } catch (e) {
      console.error(`[AgentMonitor] run ${id} failed:`, e);
    } finally {
      setRunning(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="glass rounded-lg p-3 border border-white/5 h-16 animate-pulse"
              />
            ))
          : agents.map((agent) => {
              const s = status[agent.id];
              const isRunning = running === agent.id;
              const ok = s?.lastRun?.status === "ok";
              return (
                <div
                  key={agent.id}
                  className="glass rounded-lg p-3 border border-white/5 hover:border-primary/20 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full glass-crimson flex items-center justify-center shrink-0">
                      <Bot size={14} className="text-primary/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/80 font-medium">
                          {agent.name}
                        </span>
                        <span
                          className={`flex items-center gap-0.5 text-[10px] ${s?.lastRun ? (ok ? "text-emerald-400" : "text-red-400") : "text-white/20"}`}
                        >
                          {s?.lastRun ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <Circle size={11} />
                          )}
                          {s?.lastRun
                            ? ok
                              ? "Ran OK"
                              : "Last run failed"
                            : "Never run"}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/30">
                        {agent.desc}
                      </div>
                    </div>
                    <button
                      onClick={() => runAgent(agent.id)}
                      disabled={isRunning}
                      className="text-[9px] px-2 py-1 rounded bg-white/5 hover:bg-primary/20 text-white/50 hover:text-primary border border-white/6 disabled:opacity-50 flex items-center gap-1"
                    >
                      {isRunning ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Play size={10} />
                      )}
                      Run
                    </button>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-white/20">
                      Total runs:
                    </span>
                    <span className="text-[10px] text-white/35">
                      {s?.totalRuns ?? 0}
                    </span>
                  </div>
                </div>
              );
            })}
      </div>
    </div>
  );
}
