import { BookOpen, Plus, Search, Calendar, Tag, Smile, Frown, Meh, TrendingUp } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.jsx";
import { useState } from "react";

export default function JournalPanel() {
  const [mood, setMood] = useState(null);
  const [entry, setEntry] = useState("");

  const MOODS = [
    { key: "great", icon: <Smile size={18} />, label: "Great", color: "text-emerald-400" },
    { key: "good", icon: <Smile size={18} />, label: "Good", color: "text-blue-400" },
    { key: "neutral", icon: <Meh size={18} />, label: "Meh", color: "text-yellow-400" },
    { key: "bad", icon: <Frown size={18} />, label: "Rough", color: "text-primary" },
  ];

  return (
    <PanelLayout
      title="Journal"
      subtitle="Daily reflections and AI-correlated insights"
      icon={<BookOpen size={18} />}
    >
      <div className="h-full flex gap-4">
        <div className="w-52 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl border border-white/8 p-3 flex-1 overflow-y-auto">
            <div className="text-[9px] text-white/20 font-display tracking-widest mb-2">PAST ENTRIES</div>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Calendar size={20} className="mx-auto text-white/10 mb-2" />
                <div className="text-xs text-white/20">No entries yet</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Today's entry */}
          <div className="glass rounded-xl border border-white/8 p-4 flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-white/30 font-display tracking-wider">
                TODAY — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div className="flex gap-1.5">
                {MOODS.map((m) => (
                  <button key={m.key} onClick={() => setMood(m.key)} title={m.label}
                    className={`p-1.5 rounded-lg transition-all ${mood === m.key ? `glass-crimson ${m.color} glow-crimson-sm` : `${m.color} opacity-30 hover:opacity-70`}`}
                  >
                    {m.icon}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="How was your day? What's on your mind? AI will use this to provide personalized insights..."
              className="flex-1 p-3 text-sm bg-white/3 border border-white/6 rounded-xl text-white/60 placeholder:text-white/15 focus:outline-none focus:border-primary/40 resize-none leading-relaxed"
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                {["Personal", "Health", "Work", "Finance"].map((t) => (
                  <button key={t} className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border border-white/8 text-white/25 hover:border-primary/30 hover:text-primary/50 transition-colors font-display">
                    <Tag size={8} /> {t}
                  </button>
                ))}
              </div>
              <button className="ml-auto px-4 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display tracking-wider hover:glow-crimson-sm transition-all">
                SAVE ENTRY
              </button>
            </div>
          </div>

          {/* AI correlation */}
          <div className="glass rounded-xl border border-white/8 p-3 flex items-center gap-3">
            <TrendingUp size={14} className="text-primary/50 shrink-0" />
            <div>
              <div className="text-xs text-white/40">AI Correlation</div>
              <div className="text-[10px] text-white/20 mt-0.5">Journal data will be cross-referenced with your financial, health, and productivity data to surface insights.</div>
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}