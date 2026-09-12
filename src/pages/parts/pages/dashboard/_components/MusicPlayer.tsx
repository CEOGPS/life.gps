import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music2, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Shuffle } from "lucide-react";
import { db } from "@/lib/veritonDb.ts";

type Track = { id: string; title: string; audioFileUrl?: string; genre?: string };

const SOURCES = [
  { label: "Library", path: "/veriton/library" },
  { label: "Spotify", path: "/veriton" },
  { label: "Soundcloud", path: "/veriton" },
  { label: "Suno", path: "/veriton/create" },
];

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    db.entities.Track.list("-created_date", 50).then((t: Track[]) => setTracks(t.filter((tr) => tr.audioFileUrl)));
  }, []);

  const track = tracks[index];

  useEffect(() => {
    if (!audioRef.current || !track?.audioFileUrl) return;
    audioRef.current.src = track.audioFileUrl;
    if (playing) audioRef.current.play().catch(() => setPlaying(false));
  }, [track?.audioFileUrl]);

  const togglePlay = () => {
    if (!track) return;
    if (playing) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(() => {});
    }
    setPlaying((p) => !p);
  };

  const pickNext = () => {
    if (!tracks.length) return;
    setIndex(shuffled ? Math.floor(Math.random() * tracks.length) : (index + 1) % tracks.length);
  };
  const pickPrev = () => {
    if (!tracks.length) return;
    setIndex((index - 1 + tracks.length) % tracks.length);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={pickNext}
      />

      {/* Track info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg glass-crimson flex items-center justify-center shrink-0 glow-crimson-sm">
          <Music2 size={18} className="text-primary/70" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/70 font-medium truncate">{track?.title || "No track loaded"}</div>
          <div className="text-[10px] text-white/30 truncate">
            {track ? track.genre || "VeritonOS1" : "Create tracks in VeritonOS1 to play"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-white/20">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={() => setShuffled((s) => !s)}
          className={`transition-colors ${shuffled ? "text-primary" : "text-white/20 hover:text-white/50"}`}
        >
          <Shuffle size={13} />
        </button>
        <button onClick={pickPrev} disabled={!tracks.length} className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-30">
          <SkipBack size={16} />
        </button>
        <button
          onClick={togglePlay}
          disabled={!track}
          className="w-9 h-9 rounded-full glass-crimson flex items-center justify-center text-primary hover:glow-crimson-sm transition-all disabled:opacity-40"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button onClick={pickNext} disabled={!tracks.length} className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-30">
          <SkipForward size={16} />
        </button>
        <button
          onClick={() => {
            setMuted((m) => !m);
            if (audioRef.current) audioRef.current.muted = !muted;
          }}
          className="text-white/20 hover:text-white/50 transition-colors"
        >
          {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
        </button>
      </div>

      {/* Sources */}
      <div className="flex gap-1.5 flex-wrap border-t border-white/5 pt-2">
        {SOURCES.map((s) => (
          <span
            key={s.label}
            onClick={() => navigate(s.path)}
            className="text-[9px] px-2 py-0.5 rounded-full border border-white/8 text-white/25 cursor-pointer hover:border-primary/30 hover:text-primary/50 transition-colors"
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
