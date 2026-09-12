import { FolderKanban, Plus, BarChart3, ArrowRight, X } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState.ts";

const STAGES = ["Briefing", "In Progress", "Review", "Delivered"];

type Project = { id: string; name: string; stage: number; createdAt: string };

export default function ProjectsPanel() {
  const [projects, setProjects] = usePersistentState<Project[]>("projects_board", []);
  const [addingIn, setAddingIn] = useState<number | null>(null);
  const [name, setName] = useState("");

  const addProject = (stageIdx: number) => {
    if (!name.trim()) {
      setAddingIn(null);
      return;
    }
    setProjects([...projects, { id: crypto.randomUUID(), name: name.trim(), stage: stageIdx, createdAt: new Date().toISOString() }]);
    setName("");
    setAddingIn(null);
  };

  const advance = (id: string) => {
    setProjects(projects.map((p) => (p.id === id ? { ...p, stage: Math.min(p.stage + 1, STAGES.length - 1) } : p)));
  };

  const remove = (id: string) => setProjects(projects.filter((p) => p.id !== id));

  const activeCount = projects.filter((p) => p.stage < STAGES.length - 1).length;
  const completedCount = projects.filter((p) => p.stage === STAGES.length - 1).length;
  const dueCount = projects.filter((p) => p.stage === STAGES.length - 2).length;

  return (
    <PanelLayout
      title="Projects"
      subtitle="Client marketing projects and deliverables"
      icon={<FolderKanban size={18} />}
      actions={
        <button
          onClick={() => setAddingIn(0)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
        >
          <Plus size={12} /> NEW PROJECT
        </button>
      }
    >
      <div className="h-full flex gap-4">
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="grid grid-cols-4 gap-3">
            {STAGES.map((s, i) => {
              const stageProjects = projects.filter((p) => p.stage === i);
              return (
                <div key={s} className="glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
                  <div className={`p-3 border-b border-white/5 flex items-center justify-between ${i === 0 ? "border-l-2 border-l-primary/50" : ""}`}>
                    <span className="text-[10px] font-display tracking-wider text-white/40">{s.toUpperCase()}</span>
                    <span className="text-[9px] text-white/20 glass px-1.5 py-0.5 rounded-full">{stageProjects.length}</span>
                  </div>
                  <div className="p-2 flex-1 min-h-[200px] flex flex-col gap-1.5">
                    {stageProjects.map((p) => (
                      <div key={p.id} className="glass rounded-lg p-2 border border-white/6 group">
                        <div className="flex items-start justify-between gap-1">
                          <span className="text-[11px] text-white/70">{p.name}</span>
                          <button onClick={() => remove(p.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/50 shrink-0">
                            <X size={10} />
                          </button>
                        </div>
                        {i < STAGES.length - 1 && (
                          <button
                            onClick={() => advance(p.id)}
                            className="mt-1.5 flex items-center gap-1 text-[9px] text-primary/60 hover:text-primary"
                          >
                            <ArrowRight size={9} /> Move to {STAGES[i + 1]}
                          </button>
                        )}
                      </div>
                    ))}
                    {addingIn === i ? (
                      <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addProject(i)}
                        onBlur={() => addProject(i)}
                        placeholder="Project name..."
                        className="w-full py-2 px-2 rounded-lg bg-white/5 border border-primary/25 text-[11px] text-white/70 placeholder-white/20 outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => setAddingIn(i)}
                        className="w-full py-3 border border-dashed border-white/8 rounded-lg text-[10px] text-white/15 hover:border-primary/25 hover:text-primary/40 transition-colors font-display"
                      >
                        + ADD PROJECT
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="glass rounded-xl border border-white/8 p-4 flex items-center gap-4">
            <BarChart3 size={16} className="text-white/20" />
            <div className="flex-1 grid grid-cols-4 gap-4">
              {[
                ["Active Projects", activeCount],
                ["Deliverables Due", dueCount],
                ["Hours This Week", 0],
                ["Completed", completedCount],
              ].map(([m, v]) => (
                <div key={m as string} className="text-center">
                  <div className="text-[9px] text-white/20 font-display">{m}</div>
                  <div className="text-lg text-white/50 font-display mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
