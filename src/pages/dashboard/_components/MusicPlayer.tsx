import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Music2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  ListMusic,
  Check,
} from "lucide-react";
import { useAudio } from "@/lib/AudioProvider";

type Track = {
  id: string;
  title: string;
  audioFileUrl?: string;
  genre?: string;
};

type Playlist = { id: string; name: string; trackIds?: string[] };

const SOURCES = [
  { label: "Library", path: "/veriton/library" },
  { label: "Spotify", path: "/veriton" },
  { label: "Soundcloud", path: "/veriton" },
  { label: "Music Hub", path: "/music" },
];

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const navigate = useNavigate();
  const {
    audioRef,
    currentTrack,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
    progress,
    setProgress,
    duration,
    setDuration,
    volume,
    setVolume,
    playTrack,
    togglePlay: audioTogglePlay,
    nextTrack,
    prevTrack,
    seekTo,
  } = useAudio();

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [index, setIndex] = useState(0);
  const [shuffled, setShuffled] = useState(false);

  useEffect(() => {
    // Load from localStorage for now
    const saved = localStorage.getItem("lifeos_music_tracks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTracks(parsed.filter((t: Track) => t.audioFileUrl));
      } catch {}
    }
    const savedPl = localStorage.getItem("lifeos_music_playlists");
    if (savedPl) {
      try {
        const parsed = JSON.parse(savedPl);
        setPlaylists(Array.isArray(parsed) ? parsed.filter((pl: Playlist) => Array.isArray(pl.trackIds) && pl.trackIds.length > 0) : []);
      } catch {}
    }
  }, []);

  const track = tracks[index];

  // When an active playlist is chosen, reorder tracks to that playlist's order.
  const applyPlaylist = (pl: Playlist) => {
    const order = new Map(pl.trackIds.map((id, i) => [id, i]));
    const queued = tracks
      .filter((t) => order.has(t.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    if (queued.length > 0) {
      setTracks((prev) => {
        const others = prev.filter((t) => !order.has(t.id));
        return [...queued, ...others].filter((t) => t.audioFileUrl);
      });
      setIndex(0);
    }
    setActivePlaylist(pl.name);
    setShowPlaylists(false);
  };

  // Sync local state with AudioProvider when track changes
  useEffect(() => {
    if (track?.audioFileUrl) {
      setCurrentTrack({ id: track.id, name: track.title, artist: track.genre || "VeritonOS1", url: track.audioFileUrl });
    }
  }, [track?.audioFileUrl, setCurrentTrack]);

  // Sync audio element events with AudioProvider state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setProgress(audio.currentTime / (audio.duration || 1));
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (!tracks.length) return;
      setIndex(
        shuffled
          ? Math.floor(Math.random() * tracks.length)
          : (index + 1) % tracks.length,
      );
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef, setProgress, setDuration, tracks.length, index, shuffled]);

  const handleTogglePlay = () => {
    if (!track) return;
    audioTogglePlay();
  };

  const pickNext = () => {
    if (!tracks.length) return;
    setIndex(
      shuffled
        ? Math.floor(Math.random() * tracks.length)
        : (index + 1) % tracks.length,
    );
  };

  const pickPrev = () => {
    if (!tracks.length) return;
    setIndex((index - 1 + tracks.length) % tracks.length);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Track info */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg glass-crimson flex items-center justify-center shrink-0 glow-crimson-sm">
          <Music2 size={18} className="text-primary/70" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-white/70 font-medium truncate">
            {track?.title || "No track loaded"}
          </div>
          <div className="text-[10px] text-white/30 truncate">
            {track
              ? track.genre || "VeritonOS1"
              : "Create tracks in VeritonOS1 to play"}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-1 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: duration ? `${progress * 100}%` : "0%",
            }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-white/20">
          <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={() => setShuffled((s) => !s)}
          className={`transition-colors ${
            shuffled ? "text-primary" : "text-white/20 hover:text-white/50"
          }`}
        >
          <Shuffle size={13} />
        </button>
        <button
          onClick={pickPrev}
          disabled={!tracks.length}
          className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
        >
          <SkipBack size={16} />
        </button>
        <button
          onClick={handleTogglePlay}
          disabled={!track}
          className="w-9 h-9 rounded-full glass-crimson flex items-center justify-center text-primary hover:glow-crimson-sm transition-all disabled:opacity-40"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          onClick={pickNext}
          disabled={!tracks.length}
          className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
        >
          <SkipForward size={16} />
        </button>
        <button
          onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
          className="text-white/20 hover:text-white/50 transition-colors"
        >
          {volume > 0 ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
      </div>

      {/* Sources + playlists */}
      <div className="flex flex-col gap-1.5 border-t border-white/5 pt-2">
        <div className="text-[8px] text-white/25 font-display tracking-widest">
          {activePlaylist ? `PLAYING: ${activePlaylist.toUpperCase()}` : "SOURCES"}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {SOURCES.map((s) => (
            <span
              key={s.label}
              onClick={() => navigate(s.path)}
              className="text-[9px] px-2 py-0.5 rounded-full border border-white/8 text-white/25 cursor-pointer hover:border-primary/30 hover:text-primary/50 transition-colors"
            >
              {s.label}
            </span>
          ))}
          {playlists.length > 0 && (
            <span
              onClick={() => setShowPlaylists((v) => !v)}
              className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                showPlaylists
                  ? "glass-crimson border-primary/40 text-primary"
                  : "border-white/8 text-white/25 hover:border-primary/30 hover:text-primary/50"
              }`}
            >
              <ListMusic size={9} /> PLAYLISTS
            </span>
          )}
        </div>
        {showPlaylists && playlists.length > 0 && (
          <div className="flex flex-col gap-1 max-h-28 overflow-y-auto mt-1">
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => applyPlaylist(pl)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-white/50 hover:bg-white/5 hover:text-white/80 transition-colors text-left"
              >
                {activePlaylist === pl.name && (
                  <Check size={9} className="text-primary shrink-0" />
                )}
                {pl.name}
                <span className="ml-auto text-[8px] text-white/25">
                  {pl.trackIds?.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}