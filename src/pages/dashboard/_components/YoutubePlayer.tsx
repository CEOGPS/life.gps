import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle } from "lucide-react";

interface YouTubeContextValue {
  embedSrc: string;
  setEmbedSrc: (src: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const YouTubeContext = createContext<YouTubeContextValue | null>(null);

export function YouTubeProvider({ children }: { children: ReactNode }) {
  const [embedSrc, setEmbedSrc] = useState<string>("https://www.youtube.com/embed?listType=user_uploads&list=ceogps&autoplay=0&rel=0&modestbranding=1");
  const [isLoading, setIsLoading] = useState(true);

  return (
    <YouTubeContext.Provider value={{ embedSrc, setEmbedSrc, isLoading, setIsLoading }}>
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
  const { embedSrc, setEmbedSrc, isLoading, setIsLoading } = useYouTube();

  useEffect(() => {
    // Set default to CEO GPS channel uploads playlist
    setEmbedSrc("https://www.youtube.com/embed?listType=user_uploads&list=ceogps&autoplay=0&rel=0&modestbranding=1");
    setIsLoading(false);
  }, []);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Channel header */}
      <div className="flex items-center gap-2 px-2 py-1 bg-white/4 border border-white/6 rounded">
        <span style={{fontSize: '20px'}}>▶️</span>
        <span className="text-xs font-display text-white/70 tracking-wider">YouTube Channel</span>
        <span className="ml-auto text-[10px] text-white/25">@channel</span>
      </div>

      {/* Player area */}
      <div className="flex-1 rounded-lg overflow-hidden bg-black/60 border border-white/6 flex items-center justify-center min-h-[300px]">
        {embedSrc ? (
          <iframe
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