import { useState } from "react";
import {
  GitBranch,
  Swords,
  Star,
  Gamepad2,
  UserRound,
  Sparkles,
  Plus,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { usePersistentState } from "@/lib/usePersistentState.ts";

type Tab = "conflict" | "karma" | "liferpg" | "parallel";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "conflict", label: "Conflict Resolver", icon: <Swords size={13} /> },
  { id: "karma", label: "Karma Credit", icon: <Star size={13} /> },
  { id: "liferpg", label: "Life RPG", icon: <Gamepad2 size={13} /> },
  { id: "parallel", label: "Parallel Life", icon: <UserRound size={13} /> },
];

type KarmaEntry = { id: string; action: string; pts: number; at: string };
type Quest = { id: string; title: string; xp: number; done: boolean };

export default function SimulatorsPanel() {
  const [tab, setTab] = useState<Tab>("conflict");

  // —— Conflict Resolver state ——
  const [problem, setProblem] = usePersistentState("sim_conflict_problem", "");
  const [conflictResult, setConflictResult] = useState("");

  const runConflict = () => {
    if (!problem.trim()) return;
    setConflictResult(
      `Simulated outcome for "${problem.trim()}":\n\nPath A (status quo): 3–6 month plateau, recurring friction.\nPath B (direct resolve): 30–60 day de-escalation, trust rebuild.\nPath C (restructure): higher short-term cost, durable long-term fix.\n\nRecommendation: Path B now, Path C if the root cause is structural.`,
    );
  };

  // —— Karma Credit state ——
  const [karma, setKarma] = usePersistentState<KarmaEntry[]>("sim_karma", []);
  const [karmaInput, setKarmaInput] = useState("");
  const karmaTotal = karma.reduce((s, k) => s + k.pts, 0);
  const addKarma = () => {
    const action = karmaInput.trim();
    if (!action) return;
    setKarma((p) => [
      { id: `k-${Date.now()}`, action, pts: 1, at: new Date().toLocaleTimeString() },
      ...p,
    ]);
    setKarmaInput("");
  };

  // —— Life RPG state ——
  const [quests, setQuests] = usePersistentState<Quest[]>("sim_liferpg_quests", []);
  const [questInput, setQuestInput] = useState("");
  const xp = quests.filter((q) => q.done).reduce((s, q) => s + q.xp, 0);
  const addQuest = () => {
    const title = questInput.trim();
    if (!title) return;
    setQuests((p) => [{ id: `q-${Date.now()}`, title, xp: 25, done: false }, ...p]);
    setQuestInput("");
  };

  return (
    <PanelLayout
      title="Simulators"
      subtitle="Playgrounds that rehearse decisions, actions, and parallel lives"
      icon={<GitBranch size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Plus size={12} /> NEW SIM
        </button>
      }
    >
      <div className="h-full flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-display tracking-wider whitespace-nowrap transition-colors
                ${tab === t.id ? "glass-crimson text-primary" : "glass text-white/35 hover:text-white/70"}`}
            >
              {t.icon} {t.label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0">
          {tab === "conflict" && (
            <div className="flex flex-col gap-3 h-full">
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Describe a conflict or decision to simulate... e.g. partner not pulling weight on the new project"
                rows={4}
                className="w-full p-3 text-xs bg-white/4 border border-white/6 rounded-lg text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40 resize-none"
              />
              <button
                onClick={runConflict}
                className="self-start px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
              >
                RUN SIMULATION
              </button>
              {conflictResult && (
                <div className="glass rounded-xl border border-white/8 p-4 whitespace-pre-line text-xs text-white/60 leading-relaxed">
                  {conflictResult}
                </div>
              )}
            </div>
          )}

          {tab === "karma" && (
            <div className="flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between glass rounded-xl p-4 border border-primary/15">
                <div className="flex items-center gap-2">
                  <Star size={18} className="text-primary/80" />
                  <span className="text-xs text-white/40">
                    TOTAL KARMA CREDIT
                  </span>
                </div>
                <span className="text-2xl font-display text-primary">
                  {karmaTotal}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  value={karmaInput}
                  onChange={(e) => setKarmaInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addKarma()}
                  placeholder="Log a positive action..."
                  className="flex-1 h-8 px-3 text-xs bg-white/4 border border-white/6 rounded-lg text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                />
                <button
                  onClick={addKarma}
                  className="px-3 rounded-lg glass-crimson text-primary text-xs font-display"
                >
                  ADD
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {karma.length === 0 && (
                  <div className="text-[11px] text-white/20 text-center pt-8">
                    No karma logged yet
                  </div>
                )}
                {karma.map((k) => (
                  <div
                    key={k.id}
                    className="flex items-center gap-2 px-3 py-2 glass rounded-lg border border-white/5"
                  >
                    <Star size={11} className="text-primary/60 shrink-0" />
                    <span className="text-xs text-white/70 flex-1 truncate">
                      {k.action}
                    </span>
                    <span className="text-[9px] text-white/25">{k.at}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "liferpg" && (
            <div className="flex flex-col gap-3 h-full">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "LEVEL", val: String(Math.max(1, Math.floor(xp / 100) + 1)) },
                  { label: "TOTAL XP", val: String(xp) },
                  { label: "QUESTS", val: String(quests.length) },
                ].map((s) => (
                  <div key={s.label} className="glass rounded-lg p-3 text-center border border-white/6">
                    <div className="text-[9px] text-white/30 font-display tracking-widest">
                      {s.label}
                    </div>
                    <div className="text-xl font-display text-white/80">{s.val}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={questInput}
                  onChange={(e) => setQuestInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addQuest()}
                  placeholder="New quest..."
                  className="flex-1 h-8 px-3 text-xs bg-white/4 border border-white/6 rounded-lg text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                />
                <button
                  onClick={addQuest}
                  className="px-3 rounded-lg glass-crimson text-primary text-xs font-display"
                >
                  ADD
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {quests.length === 0 && (
                  <div className="text-[11px] text-white/20 text-center pt-8">
                    No quests yet
                  </div>
                )}
                {quests.map((q) => (
                  <div
                    key={q.id}
                    onClick={() =>
                      setQuests((p) =>
                        p.map((x) => (x.id === q.id ? { ...x, done: !x.done } : x)),
                      )
                    }
                    className={`flex items-center gap-2 px-3 py-2 glass rounded-lg border border-white/5 cursor-pointer ${q.done ? "opacity-50" : ""}`}
                  >
                    <span className={`text-xs flex-1 ${q.done ? "line-through text-white/40" : "text-white/75"}`}>
                      {q.title}
                    </span>
                    <span className="text-[9px] text-primary/60">+{q.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "parallel" && (
            <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
              <div className="text-center">
                <UserRound size={26} className="mx-auto text-white/10 mb-3" />
                <div className="text-sm text-white/30">
                  Parallel Life Conductor
                </div>
                <div className="text-xs text-white/15 mt-1">
                  Simulate "what if I had chosen path X" across careers and lives
                </div>
                <Sparkles size={16} className="mx-auto text-primary/40 mt-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}
