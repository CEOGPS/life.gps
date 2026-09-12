import { useState } from "react";
import { Plus, Check, Trash2, Circle } from "lucide-react";

type Task = { id: string; text: string; done: boolean; priority: "low" | "mid" | "high" };

const PRIORITY_COLOR = { low: "text-white/30", mid: "text-yellow-500/70", high: "text-primary" };

export default function TasksModule() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("mid");

  const add = () => {
    if (!input.trim()) return;
    setTasks((t) => [...t, { id: Date.now().toString(), text: input.trim(), done: false, priority }]);
    setInput("");
  };

  const toggle = (id: string) => setTasks((t) => t.map((x) => x.id === id ? { ...x, done: !x.done } : x));
  const del = (id: string) => setTasks((t) => t.filter((x) => x.id !== id));

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Input row */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add task..."
          className="flex-1 h-7 px-2 text-xs bg-white/4 border border-white/6 rounded text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as Task["priority"])}
          className="h-7 px-1.5 text-[10px] bg-white/4 border border-white/6 rounded text-white/50 focus:outline-none focus:border-primary/40 appearance-none"
        >
          <option value="low">Low</option>
          <option value="mid">Mid</option>
          <option value="high">High</option>
        </select>
        <button onClick={add} className="w-7 h-7 flex items-center justify-center rounded glass-crimson text-primary hover:glow-crimson-sm transition-all">
          <Plus size={13} />
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto space-y-1.5">
        {tasks.length === 0 && (
          <div className="text-[11px] text-white/15 text-center pt-6">No tasks yet</div>
        )}
        {tasks.map((t) => (
          <div key={t.id} className={`flex items-center gap-2 p-2 rounded transition-colors group
            ${t.done ? "opacity-40" : "hover:bg-white/4"}`}
          >
            <button onClick={() => toggle(t.id)} className={`shrink-0 ${PRIORITY_COLOR[t.priority]}`}>
              {t.done ? <Check size={13} /> : <Circle size={13} />}
            </button>
            <span className={`text-xs flex-1 ${t.done ? "line-through text-white/30" : "text-white/70"}`}>
              {t.text}
            </span>
            <button onClick={() => del(t.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-destructive transition-all">
              <Trash2 size={10} />
            </button>
          </div>
        ))}
      </div>

      {tasks.length > 0 && (
        <div className="text-[10px] text-white/20 border-t border-white/5 pt-2">
          {tasks.filter((t) => t.done).length}/{tasks.length} completed
        </div>
      )}
    </div>
  );
}
