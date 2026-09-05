import { ChevronLeft, ChevronRight, Plus, CalendarClock, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState.ts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
};

export default function CalendarModule() {
  const today = new Date();
  const [current, setCurrent] = useState(today);
  const [events, setEvents] = usePersistentState<CalendarEvent[]>("calendar_events", []);
  const [showAdd, setShowAdd] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [newEventType, setNewEventType] = useState("home");

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

  const addEvent = (title: string, time: string, type: string) => {
    if (!title.trim()) return;
    const ev: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: title.trim(),
      date: iso(today.getFullYear(), today.getMonth(), today.getDate()),
      time: time || "All day",
      type: type || "home",
      created_at: new Date().toISOString(),
    };
    setEvents([...events, ev]);
  };

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="p-1 text-white/30 hover:text-white/70 transition-colors">
          <ChevronLeft size={13} />
        </button>
        <span className="text-[11px] text-white/60 font-display tracking-wider">
          {MONTHS[month]} {year}
        </span>
        <button onClick={next} className="p-1 text-white/30 hover:text-white/70 transition-colors">
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
          const dayEvents = day ? eventsOn(day) : [];
          return (
            <div
              key={i}
              className={`relative aspect-square flex flex-col items-center justify-start rounded text-[10px] cursor-pointer transition-colors
                ${day ? "hover:bg-white/5 text-white/60" : ""}
                ${isToday ? "glass-crimson text-primary font-bold glow-crimson-sm" : ""}`}
            >
              {day && <span className="z-10 mt-1 text-white/90 font-medium">{day}</span>}
              {hasEvent && !isToday && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/70" />
              )}
              {dayEvents.slice(0, 2).map((e, idx) => (
                <div key={idx} className="absolute bottom-1 left-1 right-1 text-[8px] text-white/60 truncate bg-primary/20 px-0.5 rounded">
                  {e.time} {e.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="absolute bottom-1 left-1 right-1 text-[8px] text-primary/60 text-center">
                  +{dayEvents.length - 2} more
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Schedule Event button */}
      <button
        onClick={() => setShowAdd(true)}
        className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
      >
        <Plus size={12} /> SCHEDULE EVENT
      </button>

      {/* Today's events highlight box */}
      <div className="glass rounded-xl border border-primary/20 p-2.5 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <CalendarClock size={11} className="text-primary/80" />
            <span className="text-[9px] font-display tracking-widest text-primary/90">
              TODAY
            </span>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="text-[10px] text-primary/60 hover:text-primary/90 transition-colors"
          >
            add event
          </button>
        </div>
        {todayEvents.length === 0 ? (
          <div className="text-[10px] text-white/25 text-center py-1">
            No events today
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

        {/* Add event form */}
        {showAdd && (
          <div className="space-y-1.5 border-t border-white/5 pt-2">
            <input
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addEvent(newEventTitle, newEventTime, newEventType)}
              placeholder="Event title..."
              autoFocus
              className="w-full h-6 px-2 text-[10px] bg-white/4 border border-white/6 rounded text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
            />
            <div className="flex gap-1.5">
              <input
                value={newEventTime}
                onChange={(e) => setNewEventTime(e.target.value)}
                placeholder="Time (optional)"
                type="time"
                className="flex-1 h-6 px-2 text-[10px] bg-white/4 border border-white/6 rounded text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
              />
              <select
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value)}
                className="h-6 px-1.5 text-[10px] bg-white/4 border border-white/6 rounded text-white/50 focus:outline-none focus:border-primary/40 appearance-none"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => addEvent(newEventTitle, newEventTime, newEventType)}
                className="flex-1 h-6 text-[10px] rounded glass-crimson text-primary font-display tracking-wider"
              >
                ADD
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 h-6 text-[10px] rounded bg-white/4 text-white/30 font-display"
              >
                CANCEL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}