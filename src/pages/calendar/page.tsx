import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Trash2,
  Ticket,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState.ts";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  attendees?: number;
};

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function CalendarPanel() {
  const today = new Date();
  const [cur, setCur] = useState(today);
  const [events, setEvents] = usePersistentState<CalendarEvent[]>(
    "calendar_events",
    [],
  );
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ title: "", time: "", location: "" });
  const year = cur.getFullYear();
  const month = cur.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const addEvent = () => {
    if (!draft.title.trim()) return;
    setEvents((p) => [
      {
        id: `ev-${Date.now()}`,
        title: draft.title.trim(),
        date: iso(today),
        time: draft.time || "All day",
        location: draft.location,
      },
      ...p,
    ]);
    setDraft({ title: "", time: "", location: "" });
    setAdding(false);
  };

  const upcoming = [...events]
    .filter((e) => e.date >= iso(today))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <PanelLayout
      title="Calendar"
      subtitle="Scheduling and events"
      icon={<CalendarDays size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Plus size={12} /> NEW EVENT
        </button>
      }
    >
      <div className="h-full flex gap-4">
        {/* Calendar */}
        <div className="flex-1 glass rounded-xl border border-white/8 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCur(new Date(year, month - 1, 1))}
              className="p-1 text-white/30 hover:text-white/70"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm text-white/60 font-display tracking-wider">
              {MONTHS[month]} {year}
            </span>
            <button
              onClick={() => setCur(new Date(year, month + 1, 1))}
              className="p-1 text-white/30 hover:text-white/70"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div
                key={d}
                className="text-[9px] text-white/20 font-display py-1"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 flex-1">
            {cells.map((day, i) => {
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const hasEvent = day
                ? events.some((e) => e.date === iso(new Date(year, month, day)))
                : false;
              return (
                <div
                  key={i}
                  className={`relative flex items-center justify-center rounded-lg text-xs cursor-pointer transition-colors aspect-square
                  ${day ? "hover:bg-white/5 text-white/40" : ""}
                  ${isToday ? "glass-crimson text-primary font-bold glow-crimson-sm" : ""}`}
                >
                  {day}
                  {hasEvent && !isToday && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/70" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events panel (formerly the Events module) */}
        <div className="w-72 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl border border-white/8 p-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-white/30 font-display tracking-wider">
                EVENTS ({upcoming.length})
              </span>
              <button
                onClick={() => setAdding((a) => !a)}
                className="flex items-center gap-1 px-2 py-1 rounded glass-crimson text-primary text-[10px] font-display hover:glow-crimson-sm transition-all"
              >
                <Plus size={10} /> NEW
              </button>
            </div>

            {adding && (
              <div className="space-y-1.5 mb-3">
                <input
                  autoFocus
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && addEvent()}
                  placeholder="Event title..."
                  className="w-full h-7 px-2 text-[11px] bg-white/4 border border-white/6 rounded text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                />
                <div className="flex gap-1.5">
                  <input
                    value={draft.time}
                    onChange={(e) => setDraft((d) => ({ ...d, time: e.target.value }))}
                    placeholder="Time"
                    className="flex-1 h-6 px-2 text-[10px] bg-white/4 border border-white/6 rounded text-white/60 placeholder:text-white/20 focus:outline-none"
                  />
                  <input
                    value={draft.location}
                    onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
                    placeholder="Location"
                    className="flex-1 h-6 px-2 text-[10px] bg-white/4 border border-white/6 rounded text-white/60 placeholder:text-white/20 focus:outline-none"
                  />
                </div>
                <button
                  onClick={addEvent}
                  className="w-full h-6 text-[10px] rounded glass-crimson text-primary font-display"
                >
                  ADD EVENT
                </button>
              </div>
            )}

            {upcoming.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Ticket size={22} className="mx-auto text-white/10 mb-2" />
                  <div className="text-xs text-white/20">No events yet</div>
                  <div className="text-[10px] text-white/12 mt-1">
                    Add events to plan your schedule
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {upcoming.map((e) => (
                  <div
                    key={e.id}
                    className="glass rounded-lg border border-white/6 p-2.5 group"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-white/75 font-medium leading-tight">
                          {e.title}
                        </div>
                        <div className="text-[9px] text-white/25 mt-0.5">
                          {e.date} · {e.time}
                        </div>
                        {e.location && (
                          <div className="flex items-center gap-1 text-[9px] text-white/30 mt-0.5">
                            <MapPin size={8} /> {e.location}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setEvents((p) => p.filter((x) => x.id !== e.id))
                        }
                        className="opacity-0 group-hover:opacity-100 text-white/15 hover:text-destructive transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="glass rounded-xl border border-white/8 p-3 space-y-2">
            <div className="text-[9px] text-white/20 font-display tracking-widest">
              QUICK SCHEDULE
            </div>
            {[
              <Clock size={11} />,
              <MapPin size={11} />,
              <Users size={11} />,
            ].map((icon, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded bg-white/2 border border-white/5"
              >
                <span className="text-white/20">{icon}</span>
                <span className="text-[10px] text-white/25">
                  {["Time & Duration", "Location", "Attendees"][i]}
                </span>
              </div>
            ))}
            <button className="w-full py-1.5 rounded glass-crimson text-primary text-[10px] font-display mt-1">
              SCHEDULE
            </button>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
