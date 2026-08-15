import { useState } from "react";
import { UserPlus, Filter, MoreVertical, X } from "lucide-react";
import { usePersistentState } from "@/lib/usePersistentState.ts";

type Lead = { id: string; name: string; source: string; addedAt: string };

const SOURCES = ["Facebook", "Google", "Boberdoo", "Jangl", "Manual"];

export default function LeadsModule() {
  const [leads, setLeads] = usePersistentState<Lead[]>("dashboard_leads", []);
  const [filter, setFilter] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [source, setSource] = useState("Manual");

  const visible = leads.filter((l) =>
    l.name.toLowerCase().includes(filter.toLowerCase()),
  );

  const addLead = () => {
    if (!name.trim()) return;
    setLeads([
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        source,
        addedAt: new Date().toISOString(),
      },
      ...leads,
    ]);
    setName("");
    setAdding(false);
  };

  const removeLead = (id: string) => setLeads(leads.filter((l) => l.id !== id));

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-6 px-2 rounded bg-white/4 border border-white/6 flex items-center gap-1.5">
          <Filter size={9} className="text-white/20" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter leads..."
            className="flex-1 bg-transparent text-[10px] text-white/60 placeholder-white/20 outline-none"
          />
        </div>
        <button
          onClick={() => setAdding((a) => !a)}
          className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary font-display tracking-wider"
        >
          <UserPlus size={11} /> ADD
        </button>
      </div>

      {adding && (
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLead()}
            placeholder="Lead name..."
            className="flex-1 h-6 px-2 rounded bg-white/4 border border-white/6 text-[10px] text-white/70 placeholder-white/20 outline-none"
          />
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-6 px-1 rounded bg-white/4 border border-white/6 text-[10px] text-white/60 outline-none"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s} className="bg-black">
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={addLead}
            className="text-[10px] text-primary/70 hover:text-primary"
          >
            Save
          </button>
        </div>
      )}

      {/* Leads list / empty state */}
      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full glass-crimson flex items-center justify-center mx-auto mb-3">
                <UserPlus size={16} className="text-primary/60" />
              </div>
              <div className="text-xs text-white/30">No leads yet</div>
              <div className="text-[10px] text-white/15 mt-1">
                Connect lead sources to populate
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {visible.map((l) => (
              <div
                key={l.id}
                className="flex items-center justify-between px-2 py-1.5 rounded bg-white/4 border border-white/6"
              >
                <div>
                  <div className="text-[11px] text-white/70">{l.name}</div>
                  <div className="text-[9px] text-white/25">{l.source}</div>
                </div>
                <button
                  onClick={() => removeLead(l.id)}
                  className="text-white/20 hover:text-white/50"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Source labels */}
      <div className="flex gap-1.5 flex-wrap border-t border-white/5 pt-2">
        {SOURCES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(filter === s ? "" : s)}
            className={`text-[9px] px-2 py-0.5 rounded-full border transition-colors ${
              filter === s
                ? "border-primary/40 text-primary/80"
                : "border-white/8 text-white/25 hover:text-white/50 hover:border-white/20"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
