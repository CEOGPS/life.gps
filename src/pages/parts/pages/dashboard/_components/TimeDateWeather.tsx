import { useEffect, useState } from "react";
import { Cloud, CloudRain, Sun, Wind } from "lucide-react";

export default function TimeDateWeather() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const hours = time.getHours().toString().padStart(2, "0");
  const mins = time.getMinutes().toString().padStart(2, "0");
  const secs = time.getSeconds().toString().padStart(2, "0");
  const dayName = days[time.getDay()];
  const dateStr = `${months[time.getMonth()]} ${time.getDate()}, ${time.getFullYear()}`;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Time */}
      <div className="text-center">
        <div className="font-display text-4xl text-white/90 tracking-widest text-glow">
          {hours}:{mins}
          <span className="text-xl text-primary/80 ml-1">{secs}</span>
        </div>
        <div className="text-xs text-white/30 tracking-[0.2em] font-display mt-1">{dayName}</div>
        <div className="text-sm text-white/50 tracking-wider mt-0.5">{dateStr}</div>
      </div>

      {/* Weather placeholder */}
      <div className="glass-crimson rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <Sun size={20} className="text-primary/80" />
          <div>
            <div className="text-2xl text-white/80 font-display">--°</div>
            <div className="text-[10px] text-white/30 tracking-wider">Connect weather API</div>
          </div>
        </div>
        <div className="flex justify-around mt-3 border-t border-white/5 pt-2">
          {["Humidity", "Wind", "UV"].map((label) => (
            <div key={label} className="text-center">
              <div className="text-[10px] text-white/20">{label}</div>
              <div className="text-xs text-white/40">--</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
