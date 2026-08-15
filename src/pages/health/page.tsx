import { useState } from "react";
import {
  Activity,
  Plus,
  Heart,
  Dumbbell,
  Moon,
  Apple,
  TrendingUp,
  Target,
  X,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { usePersistentState } from "@/lib/usePersistentState.ts";

type MetricLog = {
  heartRate?: number;
  steps?: number;
  sleep?: number;
  calories?: number;
  loggedAt: string;
};
type Workout = { id: string; name: string; loggedAt: string };
type Goals = { weight: number; steps: number; sleep: number; water: number };

const GOAL_TARGETS: Record<keyof Goals, number> = {
  weight: 100,
  steps: 10000,
  sleep: 8,
  water: 100,
};

export default function HealthPanel() {
  const [logs, setLogs] = usePersistentState<MetricLog[]>("health_logs", []);
  const [workouts, setWorkouts] = usePersistentState<Workout[]>(
    "health_workouts",
    [],
  );
  const [goals, setGoals] = usePersistentState<Goals>("health_goals", {
    weight: 0,
    steps: 0,
    sleep: 0,
    water: 0,
  });
  const [logging, setLogging] = useState(false);
  const [addingWorkout, setAddingWorkout] = useState(false);
  const [form, setForm] = useState({
    heartRate: "",
    steps: "",
    sleep: "",
    calories: "",
  });
  const [workoutName, setWorkoutName] = useState("");

  const latest = logs[0];

  const METRICS = [
    {
      key: "heartRate",
      icon: <Heart size={16} />,
      label: "Heart Rate",
      val: latest?.heartRate ?? "--",
      unit: "bpm",
      color: "text-red-400",
    },
    {
      key: "steps",
      icon: <Activity size={16} />,
      label: "Steps",
      val: latest?.steps ?? "--",
      unit: "today",
      color: "text-emerald-400",
    },
    {
      key: "sleep",
      icon: <Moon size={16} />,
      label: "Sleep",
      val: latest?.sleep ?? "--",
      unit: "hrs",
      color: "text-blue-400",
    },
    {
      key: "calories",
      icon: <Apple size={16} />,
      label: "Calories",
      val: latest?.calories ?? "--",
      unit: "kcal",
      color: "text-orange-400",
    },
  ];

  const submitLog = () => {
    const entry: MetricLog = {
      loggedAt: new Date().toISOString(),
      heartRate: form.heartRate ? Number(form.heartRate) : undefined,
      steps: form.steps ? Number(form.steps) : undefined,
      sleep: form.sleep ? Number(form.sleep) : undefined,
      calories: form.calories ? Number(form.calories) : undefined,
    };
    setLogs([entry, ...logs]);
    setGoals({
      weight: goals.weight,
      steps: entry.steps ?? goals.steps,
      sleep: entry.sleep ?? goals.sleep,
      water: goals.water,
    });
    setForm({ heartRate: "", steps: "", sleep: "", calories: "" });
    setLogging(false);
  };

  const addWorkout = () => {
    if (!workoutName.trim()) {
      setAddingWorkout(false);
      return;
    }
    setWorkouts([
      {
        id: crypto.randomUUID(),
        name: workoutName.trim(),
        loggedAt: new Date().toISOString(),
      },
      ...workouts,
    ]);
    setWorkoutName("");
    setAddingWorkout(false);
  };

  const removeWorkout = (id: string) =>
    setWorkouts(workouts.filter((w) => w.id !== id));

  const goalPct = (key: keyof Goals) =>
    Math.min(100, Math.round(((goals[key] || 0) / GOAL_TARGETS[key]) * 100));

  return (
    <PanelLayout
      title="Health"
      subtitle="Monitoring, workouts, and wellness goals"
      icon={<Activity size={18} />}
      actions={
        <button
          onClick={() => setLogging(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
        >
          <Plus size={12} /> LOG ENTRY
        </button>
      }
    >
      <div className="h-full flex flex-col gap-4">
        {logging && (
          <div className="glass rounded-xl border border-primary/25 p-4 grid grid-cols-5 gap-3 items-end">
            {(["heartRate", "steps", "sleep", "calories"] as const).map((k) => (
              <div key={k} className="flex flex-col gap-1">
                <label className="text-[9px] text-white/30 uppercase">
                  {k}
                </label>
                <input
                  value={form[k]}
                  onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  type="number"
                  className="px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white/70 outline-none"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button
                onClick={submitLog}
                className="text-xs text-primary px-3 py-1.5 rounded bg-primary/10 border border-primary/25"
              >
                Save
              </button>
              <button
                onClick={() => setLogging(false)}
                className="text-xs text-white/40 px-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          {METRICS.map((m) => (
            <div
              key={m.label}
              className="glass rounded-xl p-4 border border-white/8 text-center"
            >
              <div className={`flex justify-center mb-2 ${m.color}`}>
                {m.icon}
              </div>
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
            {workouts.length === 0 && !addingWorkout ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Dumbbell size={20} className="mx-auto text-white/10 mb-2" />
                  <div className="text-xs text-white/20">
                    No workouts logged
                  </div>
                  <button
                    onClick={() => setAddingWorkout(true)}
                    className="mt-2 text-[10px] text-primary/60 font-display"
                  >
                    + ADD WORKOUT
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {workouts.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between px-2 py-1.5 rounded bg-white/4 border border-white/6"
                  >
                    <span className="text-[11px] text-white/60">{w.name}</span>
                    <button
                      onClick={() => removeWorkout(w.id)}
                      className="text-white/20 hover:text-white/50"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
                {addingWorkout ? (
                  <input
                    autoFocus
                    value={workoutName}
                    onChange={(e) => setWorkoutName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addWorkout()}
                    onBlur={addWorkout}
                    placeholder="Workout name..."
                    className="w-full px-2 py-1.5 rounded bg-white/5 border border-primary/25 text-[11px] text-white/70 outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setAddingWorkout(true)}
                    className="text-[10px] text-primary/60 font-display"
                  >
                    + ADD WORKOUT
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="glass rounded-xl border border-white/8 p-4 flex flex-col">
            <div className="text-[10px] text-white/30 font-display tracking-wider mb-3 flex items-center gap-1.5">
              <Target size={12} /> GOALS
            </div>
            <div className="space-y-2">
              {(
                [
                  ["Weight Goal", "weight"],
                  ["Steps Goal", "steps"],
                  ["Sleep Goal", "sleep"],
                  ["Water Intake", "water"],
                ] as [string, keyof Goals][]
              ).map(([label, key]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="text-[10px] text-white/30 w-24 truncate">
                    {label}
                  </div>
                  <div className="flex-1 h-1.5 rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-primary/50 transition-all"
                      style={{ width: `${goalPct(key)}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-white/20">
                    {goalPct(key)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-xl border border-white/8 p-4 flex flex-col">
            <div className="text-[10px] text-white/30 font-display tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} /> TRENDS
            </div>
            <div className="flex-1 flex items-center justify-center">
              {logs.length < 2 ? (
                <div className="text-center">
                  <TrendingUp
                    size={20}
                    className="mx-auto text-white/10 mb-2"
                  />
                  <div className="text-[11px] text-white/20">
                    Log a few entries to see trends
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-white/40 text-center">
                  {logs.length} entries logged
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
