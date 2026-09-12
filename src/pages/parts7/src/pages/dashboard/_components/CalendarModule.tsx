import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarModule() {
  const today = new Date();
  const [current, setCurrent] = useState(today);

  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const prev = () => setCurrent(new Date(year, month - 1, 1));
  const next = () => setCurrent(new Date(year, month + 1, 1));

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button onClick={prev} className="p-1 text-white/30 hover:text-white/70 transition-colors"><ChevronLeft size={13} /></button>
        <span className="text-[11px] text-white/60 font-display tracking-wider">{MONTHS[month]} {year}</span>
        <button onClick={next} className="p-1 text-white/30 hover:text-white/70 transition-colors"><ChevronRight size={13} /></button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <div key={d} className="text-[9px] text-white/20 font-display py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 flex-1">
        {cells.map((day, i) => {
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div
              key={i}
              className={`aspect-square flex items-center justify-center rounded text-[10px] cursor-pointer transition-colors
                ${day ? "hover:bg-white/5 text-white/50" : ""}
                ${isToday ? "glass-crimson text-primary font-bold glow-crimson-sm" : ""}`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <button className="flex items-center justify-center gap-1 text-[10px] text-white/20 hover:text-primary/60 transition-colors border-t border-white/5 pt-1.5 font-display tracking-wider">
        <Plus size={10} /> ADD EVENT
      </button>
    </div>
  );
}
