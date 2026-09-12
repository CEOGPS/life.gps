import { Search, Sparkles, Globe, Image, FileText, MapPin, Clock, TrendingUp, X, ArrowRight } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const SEARCH_TABS = ["Web", "Images", "News", "Maps", "People", "Reverse"];
const TRENDING = ["AI tools 2026", "Local SEO tips", "Business automation", "Crypto market", "Real estate Dallas"];

export default function OmniSearchPanel() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(0);
  const [searched, setSearched] = useState(false);

  const doSearch = () => {
    if (query.trim()) setSearched(true);
  };

  return (
    <PanelLayout
      title="OmniSearch"
      subtitle="AI-enhanced search across 100+ sources"
      icon={<Search size={18} />}
    >
      <div className="flex flex-col gap-4">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <Sparkles size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doSearch()}
              placeholder="Search anything — people, companies, images, news..."
              className="w-full h-11 pl-10 pr-10 text-sm rounded-xl text-white/85 placeholder:text-white/25 focus:outline-none transition-all"
              style={{ background: "oklch(1 0 0 / 5%)", border: "1px solid oklch(0.55 0.22 20 / 25%)", boxShadow: "0 0 20px oklch(0.55 0.22 20 / 8%)" }}
              onFocus={(e) => (e.target.style.borderColor = "oklch(0.55 0.22 20 / 60%)")}
              onBlur={(e) => (e.target.style.borderColor = "oklch(0.55 0.22 20 / 25%)")}
            />
          </div>
          <button onClick={doSearch} className="px-5 rounded-xl glass-crimson text-primary text-sm font-display hover:glow-crimson transition-all">
            SEARCH
          </button>
          {query && <button onClick={() => { setQuery(""); setSearched(false); }} className="text-white/30 hover:text-white/60 p-2"><X size={16} /></button>}
        </div>

        {/* Search type tabs */}
        <div className="flex gap-1.5 overflow-x-auto">
          {SEARCH_TABS.map((t, i) => {
            const icons = [<Globe size={11} />, <Image size={11} />, <FileText size={11} />, <MapPin size={11} />, <Search size={11} />, <TrendingUp size={11} />];
            return (
              <button key={t} onClick={() => setTab(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-display whitespace-nowrap transition-colors
                  ${tab === i ? "glass-crimson text-primary" : "glass text-white/35 hover:text-white/70"}`}
              >
                {icons[i]} {t}
              </button>
            );
          })}
        </div>

        {!searched ? (
          /* Home state */
          <div className="flex flex-col gap-4">
            {/* AI features */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: <Search size={16} />, title: "Reverse Image Search", desc: "Find the source of any image" },
                { icon: <MapPin size={16} />, title: "Reverse Phone Lookup", desc: "Identify unknown callers" },
                { icon: <FileText size={16} />, title: "Email Finder", desc: "Find emails for any domain" },
              ].map((f) => (
                <div key={f.title} className="glass rounded-xl p-4 border border-white/8 hover:border-primary/20 cursor-pointer transition-all">
                  <span className="text-primary/70 mb-2 block">{f.icon}</span>
                  <div className="text-xs text-white/75 font-medium mb-1">{f.title}</div>
                  <div className="text-[9px]" style={{ color: "oklch(0.75 0.15 175)" }}>{f.desc}</div>
                </div>
              ))}
            </div>

            {/* Trending */}
            <div className="glass rounded-xl border border-white/8 p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={13} className="text-primary/60" />
                <span className="text-[10px] font-display tracking-wider" style={{ color: "oklch(0.62 0.22 20)" }}>TRENDING SEARCHES</span>
              </div>
              <div className="space-y-1.5">
                {TRENDING.map((t) => (
                  <button key={t} onClick={() => { setQuery(t); doSearch(); }}
                    className="flex items-center gap-2 w-full py-1.5 px-2 rounded-lg hover:bg-white/4 transition-colors group">
                    <Clock size={10} className="text-white/20" />
                    <span className="text-xs text-white/55 group-hover:text-white/85">{t}</span>
                    <ArrowRight size={10} className="ml-auto text-white/15 group-hover:text-primary/50" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Results state */
          <div className="glass rounded-xl border border-white/8 p-6 flex flex-col items-center justify-center min-h-[300px]">
            <Sparkles size={28} className="text-primary/40 mb-3" />
            <div className="text-sm text-white/30 mb-1">Results for "{query}"</div>
            <div className="text-xs" style={{ color: "oklch(0.75 0.15 175 / 60%)" }}>Wire search APIs (Exa, Google, Bing, DuckDuckGo) to populate results</div>
          </div>
        )}

        <div className="h-8" />
      </div>
    </PanelLayout>
  );
}
