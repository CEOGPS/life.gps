import { Globe2, Search, Filter, MapPin, TrendingUp } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const SOURCES = [
  { name: "Facebook Groups", icon: "🔵" },
  { name: "Nextdoor", icon: "🟢" },
  { name: "Instagram", icon: "📸" },
  { name: "Craigslist", icon: "🔴" },
  { name: "Reddit", icon: "🟠" },
  { name: "Twitter/X", icon: "🐦" },
];

export default function CommunityPanel() {
  return (
    <PanelLayout
      title="Community"
      subtitle="Scan local groups for leads and opportunities"
      icon={<Globe2 size={18} />}
    >
      <div className="h-full flex gap-4">
        <div className="w-52 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl border border-white/8 p-3">
            <div className="text-[9px] text-white/20 font-display tracking-widest mb-2">SCAN SOURCES</div>
            {SOURCES.map((s) => (
              <div key={s.name} className="flex items-center gap-2 py-1.5 hover:bg-white/5 rounded px-1 cursor-pointer">
                <span>{s.icon}</span>
                <span className="text-xs text-white/50 flex-1">{s.name}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
              </div>
            ))}
          </div>
          <div className="glass rounded-xl border border-white/8 p-3">
            <div className="text-[9px] text-white/20 font-display tracking-widest mb-2">LOCATION</div>
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-primary/50" />
              <input placeholder="Enter your city..." className="flex-1 text-[11px] bg-transparent text-white/50 focus:outline-none placeholder:text-white/20" />
            </div>
          </div>
          <button className="py-2 rounded-lg glass-crimson text-primary text-xs font-display tracking-wider hover:glow-crimson-sm transition-all">
            START SCAN
          </button>
        </div>
        <div className="flex-1 glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/5 flex items-center gap-2">
            <Search size={12} className="text-white/20" />
            <input placeholder="Filter results..." className="flex-1 text-xs bg-transparent text-white/50 focus:outline-none placeholder:text-white/20" />
            <Filter size={12} className="text-white/20 cursor-pointer hover:text-white/50" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp size={24} className="mx-auto text-white/10 mb-3" />
              <div className="text-sm text-white/20">No scan results yet</div>
              <div className="text-xs text-white/12 mt-1">Configure sources and start a scan to find leads</div>
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
