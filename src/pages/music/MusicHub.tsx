import { useEffect, useRef, useState, useMemo, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Music2,
  Upload,
  Plus,
  ListMusic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Volume2,
  VolumeX,
  Radio,
  Search,
  Trash2,
  X,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout";
import { db } from "@/lib/veritonDb";
import { usePersistentState } from "@/lib/usePersistentState";

// ── Types ────────────────────────────────────────────────────────────────────
type SourceTab = "library" | "veriton" | "playlists" | "streams";

interface Track {
  id: string;
  title: string;
  genre?: string;
  mood?: string;
  coverArtUrl?: string;
  audioFileUrl?: string;
  playlistIds?: string[];
  created_at?: string;
}

interface Playlist {
  id: string;
  name: string;
  trackIds?: string[];
  created_at?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const STREAM_SOURCES = [
  { name: "Spotify", searchUrl: "https://open.spotify.com/search/", desc: "open.spotify.com" },
  { name: "Pandora", searchUrl: "https://www.pandora.com/search/", desc: "pandora.com" },
  { name: "SoundCloud", searchUrl: "https://soundcloud.com/search?q=", desc: "soundcloud.com" },
  { name: "Apple Music", searchUrl: "https://music.apple.com/us/search?term=", desc: "music.apple.com" },
  { name: "Amazon Music", searchUrl: "https://music.amazon.com/search/", desc: "music.amazon.com" },
] as const;

const OUTPUT_LABEL: Record<SourceTab, string> = {
  library: "MY MUSIC",
  veriton: "VERITON LIBRARY",
  playlists: "PLAYLISTS",
  streams: "STREAMING",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function WandIcon({ size = 14 }: { size?: number }) {
  return <span style={{ fontSize: size, lineHeight: 1 }}>✦</span>;
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function MusicPanel() {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [tab, setTab] = useState<SourceTab>("library");
  const [uploaded, setUploaded] = usePersistentState<Track[]>("music_hub_uploads", []);
  const [veritonTracks, setVeritonTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [shuffled, setShuffled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [search, setSearch] = useState("");
  const [newPlaylist, setNewPlaylist] = useState("");
  const [addingPlaylist, setAddingPlaylist] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // ── Data ───────────────────────────────────────────────────────────────────
  const refreshLibrary = () => {
    db.entities.Playlist.list<Playlist>("-created_date", 100).then(setPlaylists).catch(() => {});
    db.entities.Track.list<Track>("-created_date", 100).then(setVeritonTracks).catch(() => {});
  };

  useEffect(() => {
    refreshLibrary();
  }, []);

  const allTracks = useMemo(() => {
    if (tab === "veriton") return veritonTracks;
    if (tab === "playlists") {
      if (!selectedPlaylistId) return [];
      const pl = playlists.find((p) => p.id === selectedPlaylistId);
      if (!pl?.trackIds?.length) return [];
      const all = [...uploaded, ...veritonTracks];
      return pl.trackIds
        .map((id) => all.find((t) => t.id === id))
        .filter(Boolean) as Track[];
    }
    if (tab === "streams") return [];
    return [...uploaded, ...veritonTracks];
  }, [tab, uploaded, veritonTracks, playlists, selectedPlaylistId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allTracks;
    const q = search.toLowerCase();
    return allTracks.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.genre?.toLowerCase().includes(q) ||
        t.mood?.toLowerCase().includes(q)
    );
  }, [allTracks, search]);

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file } as { file: File });
      const track: Track = {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, "") || "Untitled",
        genre: "Uploaded",
        audioFileUrl: file_url || URL.createObjectURL(file),
      };
      setUploaded([track, ...uploaded]);
    } catch (err) {
      const track: Track = {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, "") || "Untitled",
        genre: "Uploaded",
        audioFileUrl: URL.createObjectURL(file),
      };
      setUploaded([track, ...uploaded]);
      console.warn("[music-hub] upload fallback to local object URL", err);
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  // ── Playlist actions ───────────────────────────────────────────────────────
  const createPlaylist = async () => {
    const name = newPlaylist.trim();
    if (!name) {
      setAddingPlaylist(false);
      return;
    }
    try {
      await db.entities.Playlist.create({ name, trackIds: [] });
    } catch {
      const p: Playlist = { id: `pl-${Date.now()}`, name, trackIds: [] };
      setPlaylists((prev) => [p, ...prev]);
    }
    setNewPlaylist("");
    setAddingPlaylist(false);
    refreshLibrary();
  };

  const deletePlaylist = async (id: string) => {
    try {
      await db.entities.Playlist.delete(id);
    } catch {
      // ignore
    }
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    if (selectedPlaylistId === id) setSelectedPlaylistId(null);
  };

  const addToPlaylist = async (playlist: Playlist, track: Track) => {
    const ids = Array.isArray(playlist.trackIds) ? playlist.trackIds : [];
    if (ids.includes(track.id)) return;
    const next = [...ids, track.id];
    try {
      await db.entities.Playlist.update(playlist.id, { trackIds: next });
    } catch {
      setPlaylists((prev) =>
        prev.map((p) => (p.id === playlist.id ? { ...p, trackIds: next } : p))
      );
    }
    refreshLibrary();
  };

  // ── Player core ────────────────────────────────────────────────────────────
  const track = index !== null ? allTracks[index] : null;

  useEffect(() => {
    if (!audioRef.current || !track?.audioFileUrl) return;
    audioRef.current.src = track.audioFileUrl;
    audioRef.current.volume = volume;
    audioRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [track?.id]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  const playAt = (i: number) => setIndex(i);

  const togglePlay = () => {
    if (!track) return;
    if (playing) audioRef.current?.pause();
    else audioRef.current?.play().catch(() => {});
    setPlaying((p) => !p);
  };

  const pickNext = () => {
    if (!allTracks.length || index === null) return;
    setIndex(
      shuffled
        ? Math.floor(Math.random() * allTracks.length)
        : (index + 1) % allTracks.length
    );
  };

  const pickPrev = () => {
    if (!allTracks.length || index === null) return;
    setIndex((index - 1 + allTracks.length) % allTracks.length);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    audioRef.current.currentTime = pct * duration;
    setProgress(pct * duration);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <PanelLayout
      title="Music Hub"
      subtitle="Upload · Playlists · Stream · Veriton"
      icon={<Music2 size={18} />}
      actions={
        <div className="flex gap-2">
          <input
            ref={uploadRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => uploadRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all border border-white/8 disabled:opacity-50"
          >
            <Upload size={12} />
            {uploading ? "UPLOADING..." : "UPLOAD"}
          </button>
          <button
            onClick={() => navigate("/veriton")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all"
          >
            <WandIcon size={12} /> OPEN VERITON
          </button>
          <button
            onClick={() => setAddingPlaylist(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
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

      <div className="h-full flex gap-4 overflow-hidden">
        {/* ── Left Sidebar ── */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          {/* Sources */}
          <div className="glass rounded-xl p-3 border border-white/8 flex flex-col gap-1">
            <div className="text-[9px] text-teal font-display tracking-widest mb-1 uppercase">
              Sources
            </div>
            {(
              [
                { id: "library" as SourceTab, label: "My Music", icon: <Music2 size={13} /> },
                { id: "veriton" as SourceTab, label: "Veriton Library", icon: <WandIcon size={13} /> },
                { id: "playlists" as SourceTab, label: "Playlists", icon: <ListMusic size={13} /> },
                { id: "streams" as SourceTab, label: "Streaming", icon: <Radio size={13} /> },
              ]
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setTab(s.id);
                  if (s.id !== "playlists") setSelectedPlaylistId(null);
                }}
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  tab === s.id
                    ? "glass-crimson text-primary"
                    : "text-white/45 hover:text-white/75 hover:bg-white/5"
                }`}
              >
                <span className={tab === s.id ? "text-primary" : "text-white/30"}>
                  {s.icon}
                </span>
                <span className="tracking-wide">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Playlists */}
          <div className="glass rounded-xl p-3 border border-white/8 flex-1 overflow-y-auto">
            <div className="text-[9px] text-teal font-display tracking-widest mb-2 uppercase">
              Your Playlists
            </div>
            <div className="flex flex-col gap-1">
              {playlists.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-2 py-2 rounded-lg group transition-colors cursor-pointer ${
                    selectedPlaylistId === p.id && tab === "playlists"
                      ? "glass-crimson"
                      : "hover:bg-white/5"
                  }`}
                  onClick={() => {
                    setTab("playlists");
                    setSelectedPlaylistId(p.id);
                  }}
                >
                  <div className="w-7 h-7 rounded glass-crimson flex items-center justify-center shrink-0">
                    <ListMusic size={11} className="text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-white/60 truncate">{p.name}</div>
                    <div className="text-[9px] text-white/25">
                      {p.trackIds?.length || 0} tracks
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePlaylist(p.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {addingPlaylist ? (
                <input
                  autoFocus
                  value={newPlaylist}
                  onChange={(e) => setNewPlaylist(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
                  onBlur={createPlaylist}
                  placeholder="Playlist name..."
                  className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-primary/25 text-[11px] text-white/70 placeholder-white/20 outline-none mt-1 focus:border-primary/50"
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

        {/* ── Main Area ── */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-hidden">
          {/* Now Playing */}
          <div className="glass rounded-xl p-4 border border-white/8">
            <div className="flex items-center gap-4">
              {track?.coverArtUrl ? (
                <img
                  src={track.coverArtUrl}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover shrink-0 border border-white/10"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg glass-crimson flex items-center justify-center shrink-0 glow-crimson-sm">
                  <Music2 size={24} className="text-primary/70" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-white/80 font-medium text-sm truncate">
                  {track?.title || "No track playing"}
                </div>
                <div className="text-white/35 text-xs truncate">
                  {track ? track.genre || "Music Hub" : "Pick a track to play"}
                </div>

                {/* Progress bar */}
                <div
                  ref={progressRef}
                  onClick={seek}
                  className="mt-2.5 h-1.5 rounded-full bg-white/8 cursor-pointer group"
                >
                  <div
                    className="h-full bg-primary rounded-full relative transition-all"
                    style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="flex justify-between text-[9px] text-white/25 mt-1">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-5 mt-4">
              <button
                onClick={() => setShuffled((s) => !s)}
                className={shuffled ? "text-primary" : "text-white/25 hover:text-white/50 transition-colors"}
              >
                <Shuffle size={15} />
              </button>

              <button
                onClick={pickPrev}
                disabled={!allTracks.length}
                className="text-white/35 hover:text-white/70 transition-colors disabled:opacity-30"
              >
                <SkipBack size={18} />
              </button>

              <button
                onClick={togglePlay}
                disabled={!track}
                className="w-11 h-11 rounded-full glass-crimson flex items-center justify-center text-primary hover:glow-crimson-sm transition-all disabled:opacity-40"
              >
                {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
              </button>

              <button
                onClick={pickNext}
                disabled={!allTracks.length}
                className="text-white/35 hover:text-white/70 transition-colors disabled:opacity-30"
              >
                <SkipForward size={18} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="text-white/25 hover:text-white/50 transition-colors"
                >
                  {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    if (v > 0) setMuted(false);
                  }}
                  className="w-20 h-1 accent-primary cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 glass rounded-xl border border-white/8 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
              <span className="text-[10px] text-teal font-display tracking-wider uppercase">
                {OUTPUT_LABEL[tab]}
              </span>
              {tab !== "streams" && (
                <div className="ml-auto relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="h-7 pl-8 pr-3 text-[11px] bg-white/5 border border-white/8 rounded-lg text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40 w-44"
                  />
                </div>
              )}
            </div>

            {tab === "streams" ? (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {STREAM_SOURCES.map((s) => (
                  <a
                    key={s.name}
                    href={`${s.searchUrl}${encodeURIComponent(search || "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-3 py-3 rounded-lg glass border border-white/8 hover:border-primary/30 transition-all group"
                  >
                    <div className="w-9 h-9 rounded-lg glass-crimson flex items-center justify-center shrink-0">
                      <Radio size={16} className="text-primary/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/70 font-medium">{s.name}</div>
                      <div className="text-[10px] text-white/30 truncate">{s.desc}</div>
                    </div>
                    <span className="text-[9px] text-primary/60 font-display tracking-wider">
                      OPEN →
                    </span>
                  </a>
                ))}
                <p className="text-[10px] text-white/25 px-1 mt-2 leading-relaxed">
                  Streaming opens your selected service in a new tab so you can play with your existing accounts.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {filtered.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <Music2 size={32} className="mx-auto text-white/10 mb-3" />
                      <div className="text-sm text-white/25">Nothing here yet</div>
                      <div className="text-xs text-white/15 mt-1">
                        {tab === "library"
                          ? "Upload music to build your library"
                          : tab === "veriton"
                            ? "Create songs in VeritonOS1"
                            : "Select or create a playlist"}
                      </div>
                    </div>
                  </div>
                ) : (
                  filtered.map((t, i) => (
                    <div
                      key={t.id}
                      onClick={() => playAt(i)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
                        track?.id === t.id
                          ? "bg-primary/10 border border-primary/25"
                          : "hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      {t.coverArtUrl ? (
                        <img src={t.coverArtUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                      ) : (
                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                          track?.id === t.id ? "glass-crimson" : "bg-white/5"
                        }`}>
                          <Play size={12} className={track?.id === t.id ? "text-primary" : "text-white/25"} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/75 truncate">{t.title}</div>
                        <div className="text-[9px] text-white/30">{t.genre || "—"}</div>
                      </div>

                      {tab !== "playlists" && playlists.length > 0 && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <select
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const pl = playlists.find((p) => p.id === e.target.value);
                              if (pl) addToPlaylist(pl, t);
                              e.target.value = "";
                            }}
                            className="text-[10px] bg-white/5 border border-white/10 rounded px-1.5 py-1 text-white/50 outline-none"
                            defaultValue=""
                          >
                            <option value="" disabled>Add to…</option>
                            {playlists.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}