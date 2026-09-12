import { useState } from "react";
import { Search, Globe, ArrowRight } from "lucide-react";

export default function BrowserArea() {
  const [query, setQuery] = useState("");

  const search = () => {
    if (!query.trim()) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Search bar */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Globe size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Search the web or enter URL..."
            className="w-full h-8 pl-8 pr-3 text-xs bg-white/4 border border-white/6 rounded-lg text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
        <button onClick={search} className="w-8 h-8 flex items-center justify-center rounded-lg glass-crimson text-primary hover:glow-crimson-sm transition-all">
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Browsing area */}
      <div className="flex-1 rounded-lg bg-black/40 border border-white/5 flex items-center justify-center min-h-[100px]">
        <div className="text-center">
          <Globe size={24} className="mx-auto text-white/8 mb-2" />
          <div className="text-[11px] text-white/15">Search results will appear here</div>
          <div className="text-[10px] text-white/10 mt-0.5">OmniSearch connects 100+ sources</div>
        </div>
      </div>

      {/* Quick searches */}
      <div className="flex gap-1.5 flex-wrap border-t border-white/5 pt-2">
        {["News", "Stocks", "Weather", "Maps", "Images", "Videos"].map((q) => (
          <button key={q} onClick={() => { setQuery(q); window.open(`https://www.google.com/search?q=${q}`, "_blank"); }}
            className="text-[9px] px-2 py-0.5 rounded-full border border-white/8 text-white/25 hover:border-primary/30 hover:text-primary/50 transition-colors">
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
