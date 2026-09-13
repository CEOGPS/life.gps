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
              <button onClick={prev} className="p-1.5 text-white-40 hover:text-white-80 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-display text-white-80 tracking-wider">
                {MONTHS[month]} {year}
              </span>
              <button onClick={next} className="p-1.5 text-white-40 hover:text-white-80 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>

      {/* Day headers */}
            <div className="grid grid-cols-7 text-center">
              {DAYS.map((d) => (
                <div key={d} className="text-xs font-medium text-white-60 font-display py-1.5">
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
                        className={`relative aspect-square flex flex-col items-center justify-start rounded cursor-pointer transition-colors
                          ${day ? "hover:bg-white/5 text-white-70" : ""}
                          ${isToday ? "glass-crimson text-primary font-bold glow-crimson-sm" : ""}`}
                      >
                        {day && <span className="z-10 mt-1 text-white-90 font-medium text-sm">{day}</span>}
                        {hasEvent && !isToday && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/70" />
                        )}
                        {dayEvents.slice(0, 2).map((e, idx) => (
                          <div key={idx} className="absolute bottom-1 left-1 right-1 text-xs text-white-60 truncate bg-primary/20 px-1 rounded">
                            {e.time} {e.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="absolute bottom-1 left-1 right-1 text-xs text-primary/60 text-center">
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
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg glass-crimson text-primary text-sm font-display font-medium hover:glow-crimson-sm transition-all"
            >
              <Plus size={13} /> SCHEDULE EVENT
            </button>

            {/* Today's events highlight box */}
            <div className="glass rounded-xl border border-primary/20 p-3 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <CalendarClock size={12} className="text-primary/80" />
                  <span className="text-xs font-display tracking-widest text-primary/90">
                    TODAY
                  </span>
                </div>
                <button
                  onClick={() => setShowAdd(true)}
                  className="text-xs text-primary/70 hover:text-primary transition-colors"
                >
                  add event
                </button>
              </div>
              {todayEvents.length === 0 ? (
                <div className="text-xs text-white-40 text-center py-1.5">
                  No events today
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {todayEvents.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-2 text-sm text-white-70"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span className="truncate">{e.title}</span>
                      {e.time && (
                        <span className="ml-auto text-xs text-white-40 shrink-0">
                          {e.time}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add event form */}
              {showAdd && (
                <div className="space-y-2 border-t border-white/5 pt-2">
                  <input
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addEvent(newEventTitle, newEventTime, newEventType)}
                    placeholder="Event title..."
                    autoFocus
                    className="w-full h-8 px-3 text-sm bg-white/4 border border-white/6 rounded text-white-90 placeholder:text-white-30 focus:outline-none focus:border-primary/40"
                  />
                  <div className="flex gap-2">
                    <input
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      placeholder="Time (optional)"
                      type="time"
                      className="flex-1 h-8 px-3 text-sm bg-white/4 border border-white/6 rounded text-white-90 placeholder:text-white-30 focus:outline-none focus:border-primary/40"
                    />
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value)}
                      className="h-8 px-2 text-sm bg-white/4 border border-white/6 rounded text-white-70 focus:outline-none focus:border-primary/40 appearance-none"
                    >
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addEvent(newEventTitle, newEventTime, newEventType)}
                      className="flex-1 h-8 text-sm rounded glass-crimson text-primary font-display font-medium tracking-wider"
                    >
                      ADD
                    </button>
                    <button
                      onClick={() => setShowAdd(false)}
                      className="flex-1 h-8 text-sm rounded bg-white/5 text-white-50 font-display font-medium"
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