import { ChevronLeft, ChevronRight, Plus, CalendarClock } from "lucide-react";
import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState.ts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

// Event shape pulled from the events stored by the Calendar panel / dashboard.
type CalendarEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type?: string;
};

export default function CalendarModule() {
  const today = new Date();
  const [current, setCurrent] = useState(today);
  // Events persisted across sessions via the shared persistent-state hook.
  const [events, setEvents] = usePersistentState<CalendarEvent[]>(
    "calendar_events",
    [],
  );

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));

  const iso = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const eventsOn = (d: number) =>
    events.filter((e) => e.date === iso(year, month, d));

  const todayEvents = events.filter(
    (e) =>
      e.date === iso(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const addEvent = (title: string) => {
    if (!title.trim()) return;
    const ev: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: title.trim(),
      date: iso(today.getFullYear(), today.getMonth(), today.getDate()),
      time: "All day",
      type: "home",
    };
    setEvents([...events, ev]);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          className="p-1 text-white/30 hover:text-white/70 transition-colors"
        >
          <ChevronLeft size={13} />
        </button>
        <span className="text-[11px] text-white/60 font-display tracking-wider">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={next}
          className="p-1 text-white/30 hover:text-white/70 transition-colors"
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <div key={d} className="text-[9px] text-white/20 font-display py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 flex-1">
        {cells.map((day, i) => {
          const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();
          const hasEvent = day ? eventsOn(day).length > 0 : false;
          return (
            <div
              key={i}
              className={`relative aspect-square flex items-center justify-center rounded text-[10px] cursor-pointer transition-colors
                ${day ? "hover:bg-white/5 text-white/50" : ""}
                ${isToday ? "glass-crimson text-primary font-bold glow-crimson-sm" : ""}`}
            >
              {day}
              {hasEvent && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/70" />
              )}
            </div>
          );
        })}
      </div>

      {/* Today's events highlight box */}
      <div className="glass rounded-xl border border-primary/20 p-2.5 shrink-0">
        <div className="flex items-center gap-1.5 mb-1.5">
          <CalendarClock size={11} className="text-primary/80" />
          <span className="text-[9px] font-display tracking-widest text-primary/90">
            TODAY
          </span>
        </div>
        {todayEvents.length === 0 ? (
          <div className="text-[10px] text-white/25 text-center py-1">
            No events today —{" "}
            <button
              onClick={() => addEvent("Team sync")}
              className="text-primary/60 hover:text-primary/90 transition-colors"
            >
              add one
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {todayEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-1.5 text-[10px] text-white/60"
              >
                <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                <span className="truncate">{e.title}</span>
                {e.time && (
                  <span className="ml-auto text-[8px] text-white/30 shrink-0">
                    {e.time}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
