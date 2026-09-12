import { Bell, Mail, MessageSquare, AlertCircle, Rss } from "lucide-react";

const SOURCES = [
  { icon: <Mail size={11} />, label: "Email" },
  { icon: <MessageSquare size={11} />, label: "SMS" },
  { icon: <Rss size={11} />, label: "Social" },
  { icon: <AlertCircle size={11} />, label: "System" },
];

export default function NotificationsModule() {
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Live indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary pulse-crimson" />
        <span className="text-[10px] text-primary/70 font-display tracking-widest">LIVE</span>
        <div className="ml-auto flex gap-1.5">
          {SOURCES.map((s) => (
            <div key={s.label} title={s.label} className="w-6 h-6 rounded flex items-center justify-center glass text-white/20 hover:text-white/60 cursor-pointer transition-colors">
              {s.icon}
            </div>
          ))}
        </div>
      </div>

      {/* Notification feed */}
      <div className="flex-1 overflow-y-auto space-y-2">
        <div className="text-center pt-8">
          <Bell size={22} className="mx-auto text-white/10 mb-3" />
          <div className="text-xs text-white/20">All clear — no notifications</div>
          <div className="text-[10px] text-white/10 mt-1">Connect sources to receive alerts</div>
        </div>
      </div>

      {/* Channel status */}
      <div className="grid grid-cols-2 gap-1.5 border-t border-white/5 pt-2">
        {SOURCES.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 p-1.5 rounded bg-white/2 border border-white/4">
            <span className="text-white/20">{s.icon}</span>
            <span className="text-[10px] text-white/30">{s.label}</span>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/15" />
          </div>
        ))}
      </div>
    </div>
  );
}
