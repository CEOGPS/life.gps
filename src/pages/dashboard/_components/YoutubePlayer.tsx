import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { PlayCircle, Search, X, Monitor, Volume2, VolumeX } from "lucide-react";

interface YouTubeContextValue {
  embedSrc: string;
  setEmbedSrc: (src: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  currentVideoId: string | null;
  setCurrentVideoId: (id: string | null) => void;
}

const YouTubeContext = createContext<YouTubeContextValue | null>(null);

export function YouTubeProvider({ children }: { children: ReactNode }) {
  const [embedSrc, setEmbedSrc] = useState<string>("https://www.youtube.com/embed?listType=user_uploads&list=ceogps&autoplay=0&rel=0&modestbranding=1");
  const [isLoading, setIsLoading] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>("ceogps");

  return (
    <YouTubeContext.Provider value={{ embedSrc, setEmbedSrc, isLoading, setIsLoading, currentVideoId, setCurrentVideoId }}>
      {children}
    </YouTubeContext.Provider>
  );
}

export function useYouTube() {
  const ctx = useContext(YouTubeContext);
  if (!ctx) throw new Error("useYouTube must be used within YouTubeProvider");
  return ctx;
}

export default function YoutubePlayer() {
  const { embedSrc, setEmbedSrc, isLoading, setIsLoading, currentVideoId, setCurrentVideoId } = useYouTube();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{id: string, title: string, thumbnail: string, channel: string}>>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isPiP, setIsPiP] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    // Set default to CEO GPS channel uploads playlist
    setEmbedSrc("https://www.youtube.com/embed?listType=user_uploads&list=ceogps&autoplay=0&rel=0&modestbranding=1");
    setCurrentVideoId("ceogps");
    setIsLoading(false);
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      // Using YouTube's search suggestions
      const suggestResponse = await fetch(`https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`);
      const suggestData = await suggestResponse.json();
      const suggestions = suggestData[1] || [];
      
      // Create mock results from suggestions
      const results = suggestions.slice(0, 8).map((suggestion: string, i: number) => ({
        id: `search-${i}-${Date.now()}`,
        title: suggestion,
        thumbnail: `https://i.ytimg.com/vi/${suggestion.split(" ")[0]}/mqdefault.jpg`,
        channel: "YouTube"
      }));
      
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    }
  };

  const handleVideoSelect = (videoId: string) => {
    if (videoId === "ceogps") {
      // Channel playlist
      setEmbedSrc("https://www.youtube.com/embed?listType=user_uploads&list=ceogps&autoplay=0&rel=0&modestbranding=1");
      setCurrentVideoId("ceogps");
    } else {
      // Individual video
      setEmbedSrc(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`);
      setCurrentVideoId(videoId);
    }
    setShowSearch(false);
    setSearchQuery("");
  };

  const handlePiP = async () => {
    if (!iframeRef.current) return;
    
    try {
      if (!isPiP) {
        // Request Picture-in-Picture
        await (iframeRef.current as HTMLIFrameElement & { requestPictureInPicture?: () => Promise<void> }).requestPictureInPicture?.();
        setIsPiP(true);
      } else {
        // Exit Picture-in-Picture
        await (document as Document & { exitPictureInPicture?: () => Promise<void> }).exitPictureInPicture?.();
        setIsPiP(false);
      }
    } catch (error) {
      console.error("PiP failed:", error);
    }
  };

  const toggleMute = () => {
    setMuted(m => !m);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Channel header with search */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 px-2 py-1 bg-white/4 border border-white/6 rounded">
          <span style={{fontSize: '20px'}}>▶️</span>
          <span className="text-xs font-display text-white/70 tracking-wider flex-1 truncate">YouTube Channel</span>
          <span className="ml-auto text-[10px] text-white/25">@channel</span>
        </div>

        {/* Search bar */}
        <div className="flex gap-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" size={12} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") handleSearch(e.currentTarget.value);
              }}
              placeholder="Search YouTube..."
              className="w-full h-7 pl-8 pr-8 text-xs bg-white/4 border border-white/6 rounded text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button
            onClick={() => { setShowSearch(!showSearch); if (!showSearch) handleSearch(searchQuery); }}
            className="w-7 h-7 flex items-center justify-center rounded glass-crimson text-primary hover:glow-crimson-sm transition-all"
            title="Search"
          >
            <Search size={12} />
          </button>
        </div>

        {/* Search results dropdown */}
        {showSearch && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            {searchResults.map((result, i) => (
              <button
                key={result.id}
                onClick={() => handleVideoSelect(result.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/5 transition-colors"
              >
                <img
                  src={result.thumbnail}
                  alt=""
                  className="w-12 h-7 rounded object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[10px] text-white/80 truncate">{result.title}</div>
                  <div className="text-[9px] text-white/40">{result.channel}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Player area */}
        <div className="flex-1 rounded-lg overflow-hidden bg-black/60 border border-white/6 flex items-center justify-center min-h-[300px] relative">
          {embedSrc ? (
            <iframe
              ref={iframeRef}
              key={embedSrc}
              src={embedSrc}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
            />
          ) : (
            <div className="text-center px-3">
              <div style={{fontSize: '24px'}}>▶️</div>
              <div className="text-[11px] text-white/20">Loading YouTube channel...</div>
            </div>
          )}

          {/* PiP & Controls overlay */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            <button
              onClick={() => setMuted(m => !m)}
              className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
            </button>
            <button
              onClick={() => {
                if (!iframeRef.current) return;
                if (!isPiP) {
                  (iframeRef.current as HTMLIFrameElement & { requestPictureInPicture?: () => Promise<void> }).requestPictureInPicture?.().then(() => setIsPiP(true)).catch(console.error);
                } else {
                  (document as Document & { exitPictureInPicture?: () => Promise<void> }).exitPictureInPicture?.().then(() => setIsPiP(false)).catch(console.error);
                }
              }}
              className={`p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors ${isPiP ? "text-primary" : "text-white/70"}`}
              title={isPiP ? "Exit Picture-in-Picture" : "Picture-in-Picture"}
              disabled={!iframeRef.current}
            >
              <Monitor size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper with persistent context
export function YoutubePlayerWithPersistence() {
  return (
    <YouTubeProvider>
      <YoutubePlayer />
    </YouTubeProvider>
  );
}