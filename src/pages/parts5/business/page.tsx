import { BarChart3, Globe, Star, TrendingUp, Users, Eye, MessageSquare, Search, RefreshCw, Plus, ExternalLink, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const TABS = ["Overview", "Websites", "Reviews", "Analytics", "Leads", "Listings"];

const REVIEW_PLATFORMS = [
  { name: "Google Reviews", rating: "--", count: 0, color: "text-blue-400" },
  { name: "Yelp", rating: "--", count: 0, color: "text-red-400" },
  { name: "Facebook", rating: "--", count: 0, color: "text-blue-500" },
  { name: "YP.com", rating: "--", count: 0, color: "text-yellow-400" },
  { name: "BBB", rating: "--", count: 0, color: "text-emerald-400" },
  { name: "Brilliant Directories", rating: "--", count: 0, color: "text-purple-400" },
];

const METRICS = [
  { label: "Total Leads", val: "--", icon: <Users size={14} />, color: "text-teal" },
  { label: "Site Visitors", val: "--", icon: <Eye size={14} />, color: "text-blue-400" },
  { label: "Avg Rating", val: "--", icon: <Star size={14} />, color: "text-yellow-400" },
  { label: "Review Requests", val: "--", icon: <MessageSquare size={14} />, color: "text-primary" },
];

export default function BusinessCommandPanel() {
  const [tab, setTab] = useState(0);

  return (
    <PanelLayout
      title="Business Command"
      subtitle="Website management, reviews, analytics, leads & listings"
      icon={<BarChart3 size={18} />}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all">
            <RefreshCw size={12} /> SYNC
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
            <Plus size={12} /> ADD WEBSITE
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Tab nav */}
        <div className="flex gap-1 overflow-x-auto shrink-0">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`px-3 py-1.5 rounded-lg text-[11px] font-display whitespace-nowrap transition-colors
              ${tab === i ? "glass-crimson text-primary" : "glass text-white/40 hover:text-white/70"}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-3">
          {METRICS.map((m) => (
            <div key={m.label} className="glass rounded-xl p-3 border border-white/8">
              <div className="flex items-center gap-2 mb-2">
                <span className={m.color}>{m.icon}</span>
                <span className="text-[9px] font-display tracking-wider text-white/35">{m.label.toUpperCase()}</span>
              </div>
              <div className={`text-2xl font-display ${m.color}`}>{m.val}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Reviews panel */}
          <div className="glass rounded-xl border border-white/8 overflow-hidden">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-display tracking-wider" style={{ color: "oklch(0.62 0.22 20)" }}>REVIEW MANAGEMENT</span>
              <button className="text-[9px] text-white/25 hover:text-primary/60 font-display">REQUEST REVIEW</button>
            </div>
            <div className="p-3 space-y-2">
              {REVIEW_PLATFORMS.map((p) => (
                <div key={p.name} className="flex items-center gap-2 py-1.5 hover:bg-white/4 rounded-lg px-2 cursor-pointer transition-colors">
                  <Star size={11} className="text-yellow-400/50" />
                  <span className={`text-xs flex-1 ${p.color}`}>{p.name}</span>
                  <span className="text-[10px] font-display text-white/40">{p.rating}</span>
                  <span className="text-[9px] text-white/20">({p.count})</span>
                  <ExternalLink size={9} className="text-white/15" />
                </div>
              ))}
            </div>
          </div>

          {/* Websites */}
          <div className="glass rounded-xl border border-white/8 overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <span className="text-[10px] font-display tracking-wider" style={{ color: "oklch(0.62 0.22 20)" }}>CONNECTED WEBSITES</span>
            </div>
            <div className="p-4 flex flex-col items-center justify-center min-h-[180px]">
              <Globe size={28} className="text-white/10 mb-3" />
              <div className="text-xs text-white/30 mb-1">No websites connected</div>
              <div className="text-[10px] mb-3" style={{ color: "oklch(0.75 0.15 175 / 60%)" }}>Connect WordPress, GoDaddy, Brilliant Directories, etc.</div>
              <button className="px-3 py-1.5 rounded-lg glass-crimson text-primary text-[10px] font-display hover:glow-crimson-sm transition-all">+ ADD WEBSITE</button>
            </div>
          </div>
        </div>

        {/* Business listings */}
        <div className="glass rounded-xl border border-white/8 overflow-hidden">
          <div className="p-3 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-display tracking-wider" style={{ color: "oklch(0.62 0.22 20)" }}>BUSINESS LISTINGS</span>
            <span className="text-[9px] text-white/25">Manage your presence across 50+ directories</span>
          </div>
          <div className="p-3 grid grid-cols-6 gap-2">
            {["Google Business", "Yelp", "YP.com", "Alignable", "ShowMeLocal", "Nextdoor", "Facebook", "LinkedIn", "Bing Places", "Apple Maps", "Yahoo Local", "Angi"].map((l) => (
              <div key={l} className="glass rounded-lg p-2 border border-white/6 hover:border-primary/20 cursor-pointer transition-colors text-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20 mx-auto mb-1.5" />
                <div className="text-[8px] text-white/40 leading-tight">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </PanelLayout>
  );
}
