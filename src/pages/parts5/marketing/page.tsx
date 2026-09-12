import { Megaphone, Search, TrendingUp, BarChart3, Target, Link, FileText, Map } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const TABS = ["SEO", "Content", "Lead Gen", "Keywords", "Listings", "Campaigns"];

export default function MarketingPanel() {
  const [tab, setTab] = useState(0);

  return (
    <PanelLayout
      title="Marketing"
      subtitle="SEO, content, leads, and campaigns"
      icon={<Megaphone size={18} />}
    >
      <div className="h-full flex flex-col gap-4">
        <div className="flex gap-1">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`px-3 py-1.5 rounded-lg text-[11px] font-display tracking-wider transition-colors
              ${tab === i ? "glass-crimson text-primary" : "glass text-white/30 hover:text-white/60"}`}>{t}</button>
          ))}
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-3 gap-4">
          {/* Tool cards */}
          {[
            { icon: <Search size={18} />, title: "Keyword Tracker", desc: "Track keyword rankings across Google" },
            { icon: <TrendingUp size={18} />, title: "Ranking Tracker", desc: "Monitor position changes over time" },
            { icon: <Map size={18} />, title: "Business Listing Manager", desc: "Sync info across 100+ directories" },
            { icon: <Target size={18} />, title: "Lead Generation", desc: "Boberdoo, Jangl + AI scraping" },
            { icon: <Link size={18} />, title: "Link Builder", desc: "Track backlinks and build authority" },
            { icon: <FileText size={18} />, title: "Content Planner", desc: "AI-assisted content calendar" },
          ].map((tool) => (
            <div key={tool.title} className="glass rounded-xl p-4 border border-white/8 hover:border-primary/25 cursor-pointer group transition-all">
              <div className="w-10 h-10 rounded-lg glass-crimson flex items-center justify-center mb-3 group-hover:glow-crimson-sm">
                <span className="text-primary/70">{tool.icon}</span>
              </div>
              <div className="text-xs text-white/70 font-medium mb-1">{tool.title}</div>
              <div className="text-[10px] text-white/30 leading-relaxed">{tool.desc}</div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          {["Organic Traffic", "Domain Rating", "Backlinks", "Keywords Tracked"].map((m) => (
            <div key={m} className="glass rounded-xl p-3 border border-white/8 text-center">
              <div className="text-[9px] text-white/20 font-display tracking-wider">{m}</div>
              <div className="text-lg text-white/50 font-display mt-1">--</div>
            </div>
          ))}
        </div>
      </div>
    </PanelLayout>
  );
}
