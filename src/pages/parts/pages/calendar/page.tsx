import { CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function CalendarPanel() {
  const today = new Date();
  const [cur, setCur] = useState(today);
  const year = cur.getFullYear();
  const month = cur.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

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
            <button onClick={() => setCur(new Date(year, month - 1, 1))} className="p-1 text-white/30 hover:text-white/70"><ChevronLeft size={15} /></button>
            <span className="text-sm text-white/60 font-display tracking-wider">{MONTHS[month]} {year}</span>
            <button onClick={() => setCur(new Date(year, month + 1, 1))} className="p-1 text-white/30 hover:text-white/70"><ChevronRight size={15} /></button>
          </div>
          <div className="grid grid-cols-7 text-center">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="text-[9px] text-white/20 font-display py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 flex-1">
            {cells.map((day, i) => {
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <div key={i} className={`flex items-center justify-center rounded-lg text-xs cursor-pointer transition-colors aspect-square
                  ${day ? "hover:bg-white/5 text-white/40" : ""}
                  ${isToday ? "glass-crimson text-primary font-bold glow-crimson-sm" : ""}`}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl border border-white/8 p-3 flex-1 flex flex-col">
            <div className="text-[10px] text-white/30 font-display tracking-wider mb-3">UPCOMING</div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CalendarDays size={22} className="mx-auto text-white/10 mb-2" />
                <div className="text-xs text-white/20">No upcoming events</div>
                <div className="text-[10px] text-white/12 mt-1">Connect Calendly or add manually</div>
              </div>
            </div>
          </div>
          <div className="glass rounded-xl border border-white/8 p-3 space-y-2">
            <div className="text-[9px] text-white/20 font-display tracking-widest">QUICK SCHEDULE</div>
            {[<Clock size={11} />, <MapPin size={11} />, <Users size={11} />].map((icon, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded bg-white/2 border border-white/5">
                <span className="text-white/20">{icon}</span>
                <span className="text-[10px] text-white/25">{["Time & Duration", "Location", "Attendees"][i]}</span>
              </div>
            ))}
            <button className="w-full py-1.5 rounded glass-crimson text-primary text-[10px] font-display mt-1">SCHEDULE</button>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
