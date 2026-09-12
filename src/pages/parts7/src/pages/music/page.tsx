import { Music2, Upload, Plus, ListMusic, PlayCircle, Shuffle, SkipBack, Play, SkipForward, Volume2 } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { motion } from "motion/react";

const SOURCES = ["Library", "Spotify", "Soundcloud", "Pandora", "Suno"];
const PLAYLISTS = [
  { name: "Morning Grind", tracks: 0 },
  { name: "Late Night", tracks: 0 },
  { name: "Focus Mode", tracks: 0 },
];

export default function MusicPanel() {
  return (
    <PanelLayout
      title="Music Hub"
      subtitle="Your personal audio universe"
      icon={<Music2 size={18} />}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display tracking-wider hover:glow-crimson-sm transition-all">
            <Upload size={12} /> UPLOAD
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display tracking-wider hover:text-white/80 transition-all">
            <Plus size={12} /> PLAYLIST
          </button>
        </div>
      }
    >
      <div className="h-full flex gap-4">
        {/* Left — Source tabs + Playlists */}
        <div className="w-56 shrink-0 flex flex-col gap-3">
          {/* Source switcher */}
          <div className="glass rounded-xl p-3 border border-white/8">
            <div className="text-[9px] text-white/25 font-display tracking-widest mb-2">SOURCES</div>
            <div className="space-y-1">
              {SOURCES.map((s) => (
                <div key={s} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                  <span className="text-xs text-white/50 group-hover:text-white/70">{s}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/15" />
                </div>
              ))}
            </div>
          </div>

          {/* Playlists */}
          <div className="glass rounded-xl p-3 border border-white/8 flex-1 overflow-y-auto">
            <div className="text-[9px] text-white/25 font-display tracking-widest mb-2">PLAYLISTS</div>
            <div className="space-y-1">
              {PLAYLISTS.map((p) => (
                <div key={p.name} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                  <div className="w-7 h-7 rounded glass-crimson flex items-center justify-center shrink-0">
                    <ListMusic size={11} className="text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-white/60 truncate">{p.name}</div>
                    <div className="text-[9px] text-white/25">{p.tracks} tracks</div>
                  </div>
                </div>
              ))}
              <button className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg border border-dashed border-white/8 text-[10px] text-white/20 hover:border-primary/30 hover:text-primary/50 transition-colors font-display mt-1">
                <Plus size={10} /> NEW PLAYLIST
              </button>
            </div>
          </div>
        </div>

        {/* Right — Main content area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Now Playing */}
          <div className="glass rounded-xl p-4 border border-white/8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg glass-crimson flex items-center justify-center glow-crimson">
                <Music2 size={24} className="text-primary/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white/70 font-medium text-sm truncate">No track playing</div>
                <div className="text-white/30 text-xs truncate">Select a track or connect a source</div>
                <div className="mt-2 h-1 rounded-full bg-white/8">
                  <div className="h-full w-0 bg-primary rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button className="text-white/20 hover:text-white/50 transition-colors"><Shuffle size={14} /></button>
              <button className="text-white/30 hover:text-white/60 transition-colors"><SkipBack size={18} /></button>
              <button className="w-10 h-10 rounded-full glass-crimson flex items-center justify-center text-primary hover:glow-crimson transition-all">
                <Play size={18} />
              </button>
              <button className="text-white/30 hover:text-white/60 transition-colors"><SkipForward size={18} /></button>
              <button className="text-white/20 hover:text-white/50 transition-colors"><Volume2 size={14} /></button>
            </div>
          </div>

          {/* Track library */}
          <div className="flex-1 glass rounded-xl border border-white/8 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
              <span className="text-[10px] text-white/30 font-display tracking-wider">LIBRARY</span>
              <div className="ml-auto">
                <input placeholder="Search tracks..." className="h-6 px-2 text-[10px] bg-white/4 border border-white/6 rounded text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40 w-40" />
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <PlayCircle size={28} className="mx-auto text-white/10 mb-3" />
                <div className="text-sm text-white/20">No tracks uploaded yet</div>
                <div className="text-xs text-white/12 mt-1">Upload music or connect a streaming service</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
