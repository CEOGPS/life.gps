import { Music2, Play, SkipBack, SkipForward, Volume2, Shuffle } from "lucide-react";

export default function MusicPlayer() {
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Album art placeholder */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg glass-crimson flex items-center justify-center shrink-0 glow-crimson-sm">
          <Music2 size={18} className="text-primary/70" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/70 font-medium truncate">No track loaded</div>
          <div className="text-[10px] text-white/30 truncate">Connect Music Hub to play</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
          <div className="h-full w-0 rounded-full bg-primary" />
        </div>
        <div className="flex justify-between text-[9px] text-white/20">
          <span>0:00</span>
          <span>0:00</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-2">
        <button className="text-white/20 hover:text-white/50 transition-colors"><Shuffle size={13} /></button>
        <button className="text-white/30 hover:text-white/60 transition-colors"><SkipBack size={16} /></button>
        <button className="w-9 h-9 rounded-full glass-crimson flex items-center justify-center text-primary hover:glow-crimson-sm transition-all">
          <Play size={16} />
        </button>
        <button className="text-white/30 hover:text-white/60 transition-colors"><SkipForward size={16} /></button>
        <button className="text-white/20 hover:text-white/50 transition-colors"><Volume2 size={13} /></button>
      </div>

      {/* Sources */}
      <div className="flex gap-1.5 flex-wrap border-t border-white/5 pt-2">
        {["Library", "Spotify", "Soundcloud", "Suno"].map((s) => (
          <span key={s} className="text-[9px] px-2 py-0.5 rounded-full border border-white/8 text-white/25 cursor-pointer hover:border-primary/30 hover:text-primary/50 transition-colors">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
