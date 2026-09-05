import { useState } from "react";
import { PlayCircle, Play, Search, MonitorPlay } from "lucide-react";

export default function YoutubePlayer() {
  const [query, setQuery] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [embedId, setEmbedId] = useState("");
  const [searchList, setSearchList] = useState<string | null>(null);
  // 0 = URL paste, 1 = search
  const [mode, setMode] = useState<0 | 1>(0);

  const extractId = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    return match?.[1] ?? null;
  };

  const load = () => {
    if (mode === 1) {
      const q = query.trim();
      if (!q) return;
      // Use YouTube's official iframe search playlist embed — no API key needed.
      setSearchList(q);
      setEmbedId("");
    } else {
      const id = extractId(videoUrl);
      setEmbedId(id);
      setSearchList(null);
    }
  };

  const embedSrc = searchList
    ? `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(searchList)}&index=0`
    : embedId
      ? `https://www.youtube.com/embed/${embedId}?autoplay=0&rel=0`
      : null;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Mode toggle + controls */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-1">
          {[
            { id: 0, icon: <MonitorPlay size={10} />, label: "URL" },
            { id: 1, icon: <Search size={10} />, label: "Search" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as 0 | 1)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-display tracking-wider transition-colors ${
                mode === m.id
                  ? "glass-crimson text-primary"
                  : "text-white/25 hover:text-white/60"
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {mode === 1 ? (
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search YouTube... (e.g. lofi beats)"
              className="flex-1 h-7 px-2 text-xs bg-white/4 border border-white/6 rounded text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
            />
            <button
              onClick={load}
              className="w-7 h-7 flex items-center justify-center rounded glass-crimson text-primary"
              title="Search"
            >
              <Search size={12} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Paste YouTube URL..."
              className="flex-1 h-7 px-2 text-xs bg-white/4 border border-white/6 rounded text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
            />
            <button
              onClick={load}
              className="w-7 h-7 flex items-center justify-center rounded glass-crimson text-primary"
            >
              <Play size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Player area */}
      <div className="flex-1 rounded-lg overflow-hidden bg-black/60 border border-white/6 flex items-center justify-center min-h-[120px]">
        {embedSrc ? (
          <iframe
            key={embedSrc}
            src={embedSrc}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="text-center px-3">
            <PlayCircle size={28} className="mx-auto text-primary/30 mb-2" />
            <div className="text-[11px] text-white/20">
              {mode === 1
                ? "Search YouTube to play videos right here"
                : "Paste a YouTube URL to play"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
