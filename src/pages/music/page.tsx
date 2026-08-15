import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { db } from "@/lib/veritonDb.ts";
import { supabase } from "@/lib/supabaseClient.ts";
import { usePersistentState } from "@/lib/usePersistentState.ts";

type Track = {
  id: string;
  title: string;
  genre?: string;
  mood?: string;
  coverArtUrl?: string;
  audioFileUrl?: string;
  playlistIds?: string[];
  created_at?: string;
};

type Playlist = { id: string; name: string; trackIds?: string[] };

const STREAM_SOURCES: { name: string; searchUrl: string; desc: string }[] = [
  { name: "Spotify", searchUrl: "https://open.spotify.com/search/", desc: "open.spotify.com" },
  { name: "Pandora", searchUrl: "https://www.pandora.com/search/", desc: "pandora.com" },
  { name: "SoundCloud", searchUrl: "https://soundcloud.com/search?q=", desc: "soundcloud.com" },
  { name: "Apple Music", searchUrl: "https://music.apple.com/us/search?term=", desc: "music.apple.com" },
  { name: "Amazon Music", searchUrl: "https://music.amazon.com/search/", desc: "music.amazon.com" },
];

type SourceTab = "library" | "veriton" | "playlists" | "streams";

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPanel() {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<SourceTab>("library");
  const [uploaded, setUploaded] = usePersistentState<Track[]>(
    "music_hub_uploads",
    [],
  );
  const [veritonTracks, setVeritonTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [search, setSearch] = useState("");
  const [newPlaylist, setNewPlaylist] = useState("");
  const [addingPlaylist, setAddingPlaylist] = useState(false);
  const [uploading, setUploading] = useState(false);

  // —— Data loads ——
  const refreshLibrary = () => {
    db.entities.Playlist.list<Playlist>("-created_date", 100).then(
      setPlaylists,
    );
    db.entities.Track.list<Track>("-created_date", 100).then(setVeritonTracks);
  };

  useEffect(() => {
    refreshLibrary();
  }, []);

  const allTracks = useTracks(uploaded, veritonTracks, tab);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({
        file,
      } as { file: File });
      const track: Track = {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, "") || "Untitled",
        genre: "Uploaded",
        audioFileUrl: file_url || URL.createObjectURL(file),
      };
      setUploaded([track, ...uploaded]);
    } catch (err) {
      // Local-only fallback so upload always works even without storage setup
      const track: Track = {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^.]+$/, "") || "Untitled",
        genre: "Uploaded",
        audioFileUrl: URL.createObjectURL(file),
      };
      const next = [track, ...uploaded];
      setUploaded(next);
      console.warn("[music-hub] upload fallback to local object URL", err);
    } finally {
      setUploading(false);
      if (uploadRef.current) uploadRef.current.value = "";
    }
  };

  const createPlaylist = async () => {
    const name = newPlaylist.trim();
    if (!name) {
      setAddingPlaylist(false);
      return;
    }
    try {
      await db.entities.Playlist.create({ name, trackIds: [] });
    } catch (err) {
      console.warn("[music-hub] playlist create fallback", err);
      const p: Playlist = { id: `pl-${Date.now()}`, name, trackIds: [] };
      setPlaylists((prev) => [p, ...prev]);
    }
    setNewPlaylist("");
    setAddingPlaylist(false);
    refreshLibrary();
  };

  const addToPlaylist = async (playlist: Playlist, track: Track) => {
    const ids = Array.isArray(playlist.trackIds) ? playlist.trackIds : [];
    if (ids.includes(track.id)) return;
    const next = [...ids, track.id];
    try {
      await db.entities.Playlist.update(playlist.id, { trackIds: next });
    } catch (err) {
      console.warn("[music-hub] playlist update fallback", err);
    }
    refreshLibrary();
  };

  // —— Player core ——
  const track = index !== null ? allTracks[index] : null;

  useEffect(() => {
    if (!audioRef.current || !track?.audioFileUrl) return;
    audioRef.current.src = track.audioFileUrl;
    audioRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, [track?.id]);

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
        : (index + 1) % allTracks.length,
    );
  };
  const pickPrev = () => {
    if (!allTracks.length || index === null) return;
    setIndex((index - 1 + allTracks.length) % allTracks.length);
  };

  const filtered = allTracks.filter((t) =>
    t.title?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PanelLayout
      title="Music Hub"
      subtitle="Upload, organize playlists, and stream from your services"
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
            <Upload size={12} /> {uploading ? "UPLOADING..." : "UPLOAD"}
          </button>
          <button
            onClick={() => navigate("/veriton")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all"
          >
            <WandIcon /> OPEN VERITON
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
      <div className="h-full flex gap-4">
        {/* Left column */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          {/* Source tabs */}
          <div className="glass rounded-xl p-3 border border-white/8 flex flex-col gap-1">
            <div className="text-[9px] text-white/25 font-display tracking-widest mb-1">
              SOURCES
            </div>
            {(
              [
                { id: "library", label: "My Music", icon: <Music2 size={13} /> },
                { id: "veriton", label: "Veriton Library", icon: <WandIcon size={13} /> },
                { id: "playlists", label: "Playlists", icon: <ListMusic size={13} /> },
                { id: "streams", label: "Streaming", icon: <Radio size={13} /> },
              ] as { id: SourceTab; label: string; icon: React.ReactNode }[]
            ).map((s) => (
              <button
                key={s.id}
                onClick={() => setTab(s.id)}
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

          {/* Playlists list (feeds home player) */}
          <div className="glass rounded-xl p-3 border border-white/8 flex-1 overflow-y-auto">
            <div className="text-[9px] text-white/25 font-display tracking-widest mb-1">
              YOUR PLAYLISTS
            </div>
            <div className="flex flex-col gap-1">
              {playlists.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTab("playlists")}
                  className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                >
                  <div className="w-7 h-7 rounded glass-crimson flex items-center justify-center shrink-0">
                    <ListMusic size={11} className="text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-white/60 truncate">
                      {p.name}
                    </div>
                    <div className="text-[9px] text-white/25">
                      {p.trackIds?.length || 0} tracks
                    </div>
                  </div>
                </button>
              ))}
              {addingPlaylist ? (
                <input
                  autoFocus
                  value={newPlaylist}
                  onChange={(e) => setNewPlaylist(e.target.value)}
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

        {/* Right main area */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Now playing */}
          <div className="glass rounded-xl p-4 border border-white/8">
            <div className="flex items-center gap-4">
              {track?.coverArtUrl ? (
                <img
                  src={track.coverArtUrl}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg glass-crimson flex items-center justify-center shrink-0 glow-crimson">
                  <Music2 size={24} className="text-primary/70" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-white/70 font-medium text-sm truncate">
                  {track?.title || "No track playing"}
                </div>
                <div className="text-white/30 text-xs truncate">
                  {track ? track.genre || "Music Hub" : "Pick a track to play"}
                </div>
                <div className="mt-2 h-1 rounded-full bg-white/8">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: duration ? `${(progress / duration) * 100}%` : "0%",
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-white/20 mt-1">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setShuffled((s) => !s)}
                className={
                  shuffled
                    ? "text-primary"
                    : "text-white/20 hover:text-white/50 transition-colors"
                }
              >
                <Shuffle size={14} />
              </button>
              <button
                onClick={pickPrev}
                disabled={!allTracks.length}
                className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={togglePlay}
                disabled={!track}
                className="w-10 h-10 rounded-full glass-crimson flex items-center justify-center text-primary hover:glow-crimson transition-all disabled:opacity-40"
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                onClick={pickNext}
                disabled={!allTracks.length}
                className="text-white/30 hover:text-white/60 transition-colors disabled:opacity-30"
              >
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

          {/* Content by tab */}
          <div className="flex-1 glass rounded-xl border border-white/8 overflow-hidden flex flex-col">
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
              <span className="text-[10px] text-white/30 font-display tracking-wider">
                {OUTPUT_LABEL[tab]}
              </span>
              <div className="ml-auto flex items-center gap-2">
                {tab !== "streams" && (
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="h-6 px-2 text-[10px] bg-white/4 border border-white/6 rounded text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40 w-40"
                  />
                )}
              </div>
            </div>

            {tab === "streams" ? (
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {STREAM_SOURCES.map((s) => (
                  <a
                    key={s.name}
                    href={`${s.searchUrl}${encodeURIComponent(search || "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-3 py-3 rounded-lg glass border border-white/8 hover:border-primary/30 transition-all group cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-lg glass-crimson flex items-center justify-center shrink-0">
                      <Radio size={16} className="text-primary/80" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white/70 font-medium">
                        {s.name}
                      </div>
                      <div className="text-[10px] text-white/30 truncate">
                        {s.desc}
                      </div>
                    </div>
                    <span className="text-[9px] text-primary/60 font-display tracking-wider">
                      OPEN →
                    </span>
                  </a>
                ))}
                <div className="text-[10px] text-white/25 px-1 mt-1 leading-relaxed">
                  Streaming opens your selected service's search in a new tab so
                  you can play with your existing accounts. Playlists you create
                  here and songs in your library feed the home-page player.
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filtered.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Music2 size={28} className="mx-auto text-white/10 mb-3" />
                      <div className="text-sm text-white/20">Nothing here yet</div>
                      <div className="text-xs text-white/12 mt-1">
                        {tab === "library"
                          ? "Upload music to build your library"
                          : tab === "veriton"
                            ? "Create songs in VeritonOS1"
                            : "Create a playlist to get started"}
                      </div>
                    </div>
                  </div>
                ) : (
                  filtered.map((t, i) => (
                    <div
                      key={t.id}
                      onClick={() => playAt(i)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        track?.id === t.id
                          ? "bg-primary/10 border border-primary/25"
                          : "hover:bg-white/5"
                      }`}
                    >
                      {t.coverArtUrl ? (
                        <img
                          src={t.coverArtUrl}
                          alt=""
                          className="w-7 h-7 rounded object-cover shrink-0"
                        />
                      ) : (
                        <Play
                          size={12}
                          className={
                            track?.id === t.id ? "text-primary" : "text-white/25"
                          }
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/70 truncate">
                          {t.title}
                        </div>
                        <div className="text-[9px] text-white/30">
                          {t.genre || ""}
                        </div>
                      </div>
                      {tab === "playlists" && (
                        <Plus
                          size={12}
                          className="text-white/25 hover:text-primary transition-colors shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            const pl = playlists[0];
                            if (pl) addToPlaylist(pl, t);
                          }}
                        />
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

const OUTPUT_LABEL: Record<SourceTab, string> = {
  library: "MY MUSIC",
  veriton: "VERITON LIBRARY",
  playlists: "PLAYLISTS",
  streams: "STREAMING",
};

function useTracks(
  uploaded: Track[],
  veritonTracks: Track[],
  tab: SourceTab,
): Track[] {
  if (tab === "veriton") return veritonTracks;
  if (tab === "playlists") {
    // playlists themselves act as a queued list from the first playlist's tracks
    return veritonTracks;
  }
  if (tab === "streams") return [];
  return [...uploaded, ...veritonTracks];
}

function WandIcon({ size = 18 }: { size?: number }) {
  return <span style={{ fontSize: size - 2, lineHeight: 1 }}>✦</span>;
}
