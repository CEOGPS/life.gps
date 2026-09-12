import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music2, Upload, Plus, ListMusic, PlayCircle, Shuffle, SkipBack, Play, Pause, SkipForward, Volume2, VolumeX } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { db } from "@/lib/veritonDb.ts";

type Track = { id: string; title: string; genre?: string; audioFileUrl?: string };
type Playlist = { id: string; name: string; trackIds?: string[] };

const SOURCES = ["Library", "Spotify", "Soundcloud", "Pandora", "Suno"];

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPanel() {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [search, setSearch] = useState("");
  const [addingPlaylist, setAddingPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState("");

  const refresh = () => {
    db.entities.Track.list("-created_date", 100).then((t: Track[]) => setTracks(t));
    db.entities.Playlist.list("-created_date", 50).then((p: Playlist[]) => setPlaylists(p));
  };

  useEffect(refresh, []);

  const filtered = tracks.filter((t) => t.title?.toLowerCase().includes(search.toLowerCase()));
  const track = index !== null ? tracks[index] : null;

  useEffect(() => {
    if (!audioRef.current || !track?.audioFileUrl) return;
    audioRef.current.src = track.audioFileUrl;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [track?.id]);

  const playTrack = (i: number) => setIndex(tracks.indexOf(filtered[i]));

  const togglePlay = () => {
    if (!track) return;
    if (playing) audioRef.current?.pause();
    else audioRef.current?.play().catch(() => {});
    setPlaying((p) => !p);
  };

  const pickNext = () => {
    if (!tracks.length || index === null) return;
    setIndex(shuffled ? Math.floor(Math.random() * tracks.length) : (index + 1) % tracks.length);
  };
  const pickPrev = () => {
    if (!tracks.length || index === null) return;
    setIndex((index - 1 + tracks.length) % tracks.length);
  };

  const createPlaylist = async () => {
    if (!playlistName.trim()) {
      setAddingPlaylist(false);
      return;
    }
    await db.entities.Playlist.create({ name: playlistName.trim(), trackIds: [] });
    setPlaylistName("");
    setAddingPlaylist(false);
    refresh();
  };

  return (
    <PanelLayout
      title="Music Hub"
      subtitle="Your personal audio universe"
      icon={<Music2 size={18} />}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/veriton/create")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display tracking-wider hover:glow-crimson-sm transition-all"
          >
            <Upload size={12} /> UPLOAD
          </button>
          <button
            onClick={() => setAddingPlaylist(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display tracking-wider hover:text-white/80 transition-all"
          >
            <Plus size={12} /> PLAYLIST
          </button>
        </div>
      }
    >
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={pickNext}
      />
      <div className="h-full flex gap-4">
        {/* Left — Source tabs + Playlists */}
        <div className="w-56 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl p-3 border border-white/8">
            <div className="text-[9px] text-white/25 font-display tracking-widest mb-2">SOURCES</div>
            <div className="space-y-1">
              {SOURCES.map((s) => (
                <div
                  key={s}
                  onClick={() => s === "Suno" && navigate("/veriton/create")}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                >
                  <span className="text-xs text-white/50 group-hover:text-white/70">{s}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${s === "Library" ? "bg-primary" : "bg-white/15"}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-xl p-3 border border-white/8 flex-1 overflow-y-auto">
            <div className="text-[9px] text-white/25 font-display tracking-widest mb-2">PLAYLISTS</div>
            <div className="space-y-1">
              {playlists.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate("/veriton/playlists")}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                >
                  <div className="w-7 h-7 rounded glass-crimson flex items-center justify-center shrink-0">
                    <ListMusic size={11} className="text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-white/60 truncate">{p.name}</div>
                    <div className="text-[9px] text-white/25">{p.trackIds?.length || 0} tracks</div>
                  </div>
                </div>
              ))}
              {addingPlaylist ? (
                <input
                  autoFocus
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
                  onBlur={createPlaylist}
                  placeholder="Playlist name..."
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-primary/25 text-[11px] text-white/70 placeholder-white/20 outline-none mt-1"
                />
              ) : (
                <button
                  onClick={() => setAddingPlaylist(true)}
                  className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg border border-dashed border-white/8 text-[10px] text-white/20 hover:border-primary/30 hover:text-primary/50 transition-colors font-display mt-1"
                >
                  <Plus size={10} /> NEW PLAYLIST
                </button>
              )}
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
                <div className="text-white/70 font-medium text-sm truncate">{track?.title || "No track playing"}</div>
                <div className="text-white/30 text-xs truncate">{track ? track.genre || "VeritonOS1" : "Select a track from the library"}</div>
                <div className="mt-2 h-1 rounded-full bg-white/8">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }} />
                </div>
                <div className="flex justify-between text-[9px] text-white/20 mt-1">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button onClick={() => setShuffled((s) => !s)} className={shuffled ? "text-primary" : "text-white/20 hover:text-white/50 transition-colors"}>
                <Shuffle size={14} />
              </button>
              <button onClick={pickPrev} disabled={!tracks.length} className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-30">
                <SkipBack size={18} />
              </button>
              <button
                onClick={togglePlay}
                disabled={!track}
                className="w-10 h-10 rounded-full glass-crimson flex items-center justify-center text-primary hover:glow-crimson transition-all disabled:opacity-40"
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button onClick={pickNext} disabled={!tracks.length} className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-30">
                <SkipForward size={18} />
              </button>
              <button
                onClick={() => {
                  setMuted((m) => !m);
                  if (audioRef.current) audioRef.current.muted = !muted;
                }}
                className="text-white/20 hover:text-white/50 transition-colors"
              >
                {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          </div>

          {/* Track library */}
          <div className="flex-1 glass rounded-xl border border-white/8 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
              <span className="text-[10px] text-white/30 font-display tracking-wider">LIBRARY</span>
              <div className="ml-auto">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tracks..."
                  className="h-6 px-2 text-[10px] bg-white/4 border border-white/6 rounded text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40 w-40"
                />
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <PlayCircle size={28} className="mx-auto text-white/10 mb-3" />
                  <div className="text-sm text-white/20">No tracks uploaded yet</div>
                  <div className="text-xs text-white/12 mt-1">Create music in VeritonOS1 to populate your library</div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filtered.map((t, i) => (
                  <div
                    key={t.id}
                    onClick={() => playTrack(i)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      track?.id === t.id ? "bg-primary/10 border border-primary/25" : "hover:bg-white/5"
                    }`}
                  >
                    <PlayCircle size={14} className={track?.id === t.id ? "text-primary" : "text-white/20"} />
                    <span className="text-xs text-white/70 flex-1 truncate">{t.title}</span>
                    <span className="text-[10px] text-white/25">{t.genre}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
