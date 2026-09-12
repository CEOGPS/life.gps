import { useState } from "react";
import { Globe2, Search, Filter, MapPin, TrendingUp, Loader2, ExternalLink } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { lifeosApi } from "@/lib/api.ts";

const SOURCES = [
  { name: "Facebook Groups", icon: "🔵", site: "facebook.com" },
  { name: "Nextdoor", icon: "🟢", site: "nextdoor.com" },
  { name: "Instagram", icon: "📸", site: "instagram.com" },
  { name: "Craigslist", icon: "🔴", site: "craigslist.org" },
  { name: "Reddit", icon: "🟠", site: "reddit.com" },
  { name: "Twitter/X", icon: "🐦", site: "twitter.com" },
];

type Result = { title: string; url: string; snippet: string };

export default function CommunityPanel() {
  const [selected, setSelected] = useState<Set<string>>(new Set(["Reddit", "Nextdoor"]));
  const [location, setLocation] = useState("");
  const [filter, setFilter] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const toggleSource = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const startScan = async () => {
    if (!selected.size) return;
    setScanning(true);
    setResults([]);
    try {
      const sites = SOURCES.filter((s) => selected.has(s.name)).map((s) => s.site);
      const query = `${sites.map((s) => `site:${s}`).join(" OR ")} leads ${location || "near me"}`;
      const data = await lifeosApi.post("/api/browse/search", { query, limit: 10 });
      setResults(data.results || []);
    } catch (e) {
      console.error("[Community] scan failed:", e);
    } finally {
      setScanning(false);
    }
  };

  const visible = results.filter((r) => r.title.toLowerCase().includes(filter.toLowerCase()) || r.snippet.toLowerCase().includes(filter.toLowerCase()));

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
              <div
                key={s.name}
                onClick={() => toggleSource(s.name)}
                className="flex items-center gap-2 py-1.5 hover:bg-white/5 rounded px-1 cursor-pointer"
              >
                <span>{s.icon}</span>
                <span className="text-xs text-white/50 flex-1">{s.name}</span>
                <div className={`w-1.5 h-1.5 rounded-full transition-colors ${selected.has(s.name) ? "bg-primary" : "bg-white/15"}`} />
              </div>
            ))}
          </div>
          <div className="glass rounded-xl border border-white/8 p-3">
            <div className="text-[9px] text-white/20 font-display tracking-widest mb-2">LOCATION</div>
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="text-primary/50" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your city..."
                className="flex-1 text-[11px] bg-transparent text-white/50 focus:outline-none placeholder:text-white/20"
              />
            </div>
          </div>
          <button
            onClick={startScan}
            disabled={scanning || !selected.size}
            className="py-2 rounded-lg glass-crimson text-primary text-xs font-display tracking-wider hover:glow-crimson-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {scanning ? <Loader2 size={12} className="animate-spin" /> : null}
            {scanning ? "SCANNING..." : "START SCAN"}
          </button>
        </div>
        <div className="flex-1 glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-white/5 flex items-center gap-2">
            <Search size={12} className="text-white/20" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter results..."
              className="flex-1 text-xs bg-transparent text-white/50 focus:outline-none placeholder:text-white/20"
            />
            <Filter size={12} className="text-white/20 cursor-pointer hover:text-white/50" />
          </div>
          {visible.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp size={24} className="mx-auto text-white/10 mb-3" />
                <div className="text-sm text-white/20">No scan results yet</div>
                <div className="text-xs text-white/12 mt-1">Configure sources and start a scan to find leads</div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {visible.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-3 rounded-lg bg-white/4 border border-white/6 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5 text-xs text-white/70 font-medium">
                    {r.title}
                    <ExternalLink size={10} className="text-white/30" />
                  </div>
                  <div className="text-[11px] text-white/35 mt-1">{r.snippet}</div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}
