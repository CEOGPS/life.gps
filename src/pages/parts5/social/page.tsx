import { useState } from "react";
import {
  Share2, Plus, BarChart3, Users, Heart, Eye, Rss,
  Image, Video, Calendar, Clock,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const TEAL = "oklch(0.75 0.15 175)";

const PLATFORMS = [
  { name: "Instagram", icon: "📸", followers: "--", color: "text-pink-400" },
  { name: "Facebook", icon: "🔵", followers: "--", color: "text-blue-400" },
  { name: "TikTok", icon: "🎵", followers: "--", color: "text-cyan-400" },
  { name: "Twitter/X", icon: "🐦", followers: "--", color: "text-sky-400" },
  { name: "LinkedIn", icon: "💼", followers: "--", color: "text-blue-400" },
  { name: "YouTube", icon: "▶️", followers: "--", color: "text-red-400" },
  { name: "Reddit", icon: "🟠", followers: "--", color: "text-orange-400" },
  { name: "Snapchat", icon: "👻", followers: "--", color: "text-yellow-400" },
  { name: "Pinterest", icon: "📌", followers: "--", color: "text-rose-400" },
  { name: "Discord", icon: "🎮", followers: "--", color: "text-indigo-400" },
  { name: "Threads", icon: "🧵", followers: "--", color: "text-gray-300" },
];

const FEED_TABS = ["All", "Feed", "Stories", "Analytics", "Schedule"];

export default function SocialPanel() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule">("now");
  const [activeFeedTab, setActiveFeedTab] = useState(0);
  const [postBody, setPostBody] = useState("");

  const togglePlatform = (name: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  return (
    <PanelLayout
      title="SocialLinkOS1"
      subtitle="All social accounts in one unified dashboard"
      icon={<Share2 size={18} />}
    >
      <div className="h-full flex gap-4 overflow-y-auto">
        {/* Analytics sidebar */}
        <div className="w-48 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl border border-white/8 p-3">
            <div className="text-[9px] font-display tracking-widest mb-2" style={{ color: TEAL }}>PLATFORMS</div>
            {PLATFORMS.map((p) => (
              <div key={p.name} className="flex items-center gap-2 py-1 hover:bg-white/5 rounded px-1 cursor-pointer group">
                <span className="text-sm">{p.icon}</span>
                <span className={`text-[11px] flex-1 ${p.color}`}>{p.name}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white/15 group-hover:bg-primary/30 transition-colors" />
              </div>
            ))}
          </div>

          <div className="glass rounded-xl border border-white/8 p-3 space-y-2">
            <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>OVERVIEW</div>
            {[
              { icon: <Users size={10} />, label: "Total Followers", val: "--" },
              { icon: <Eye size={10} />, label: "Reach", val: "--" },
              { icon: <Heart size={10} />, label: "Engagement", val: "--%"},
              { icon: <BarChart3 size={10} />, label: "Impressions", val: "--" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className="text-white/30">{s.icon}</span>
                <span className="text-[10px] text-white/40 flex-1">{s.label}</span>
                <span className="text-[10px] text-white/80 font-display">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Post creation module — always visible */}
          <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-3 shrink-0">
            <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>CREATE POST</div>

            <textarea
              value={postBody}
              onChange={(e) => setPostBody(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full h-20 p-3 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40 resize-none"
            />

            {/* Media buttons */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 glass rounded-lg text-white/55 text-[10px] font-display hover:text-white/80 transition-all">
                <Image size={11} /> IMAGE
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 glass rounded-lg text-white/55 text-[10px] font-display hover:text-white/80 transition-all">
                <Video size={11} /> VIDEO
              </button>
            </div>

            {/* Platform selector */}
            <div>
              <div className="text-[9px] text-white/35 font-display tracking-wider mb-2">POST TO:</div>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => togglePlatform(p.name)}
                    className={`text-[9px] px-2 py-0.5 rounded-full border transition-colors font-display
                      ${selectedPlatforms.includes(p.name)
                        ? "border-primary/50 glass-crimson text-primary"
                        : "border-white/10 text-white/35 hover:border-primary/30 hover:text-white/60"
                      }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule picker + POST button */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setScheduleMode("now")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-display transition-all
                  ${scheduleMode === "now" ? "glass-crimson text-primary" : "glass text-white/40 hover:text-white/70"}`}
              >
                <Clock size={10} /> POST NOW
              </button>
              <button
                onClick={() => setScheduleMode("schedule")}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-display transition-all
                  ${scheduleMode === "schedule" ? "glass-crimson text-primary" : "glass text-white/40 hover:text-white/70"}`}
              >
                <Calendar size={10} /> SCHEDULE
              </button>
              {scheduleMode === "schedule" && (
                <input
                  type="datetime-local"
                  className="h-7 px-2 text-[10px] bg-white/4 border border-white/8 rounded-lg text-white/70 focus:outline-none focus:border-primary/40"
                />
              )}
              <button className="ml-auto px-4 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
                <Plus size={11} className="inline mr-1" />POST
              </button>
            </div>
          </div>

          {/* Feed tabs */}
          <div className="flex gap-1 shrink-0">
            {FEED_TABS.map((t, i) => (
              <button
                key={t}
                onClick={() => setActiveFeedTab(i)}
                className={`px-3 py-1 rounded text-[11px] font-display tracking-wider transition-colors
                  ${activeFeedTab === i ? "glass-crimson text-primary" : "text-white/35 hover:text-white/60"}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center min-h-[180px]">
            <div className="text-center">
              <Rss size={28} className="mx-auto text-white/8 mb-3" />
              <div className="text-sm text-white/55">Unified feed loads here</div>
              <div className="text-xs text-white/30 mt-1">Connect social accounts to see all posts in one feed</div>
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
