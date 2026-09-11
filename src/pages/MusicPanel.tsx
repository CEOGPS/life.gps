import { useState, useRef, useEffect, useCallback } from "react";
import { Music, Plus, Upload, Search, ChevronLeft, ChevronRight, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, MoreHorizontal, Image, Trash2, Edit2, Loader2, X } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout";
import { useAudio } from "@/lib/AudioProvider";

const LS_PLAYLISTS = "lifeos_music_playlists";
const LS_TRACKS = "lifeos_music_tracks";

function loadLS(key: string, def: any) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function saveLS(key: string, val: any) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

const DEFAULT_PLAYLISTS = [
  { id: "pl1", name: "Playlist 1", cover: null, color: "#4ab3f4", tracks: [] },
  { id: "pl2", name: "Playlist 2", cover: null, color: "#b366ff", tracks: [] },
  { id: "pl3", name: "Playlist 3", cover: null, color: "#00d9b3", tracks: [] },
  { id: "pl4", name: "Playlist 4", cover: null, color: "#ff8c42", tracks: [] },
];

interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
  size?: string;
  added?: string;
  color?: string;
}

interface Playlist {
  id: string;
  name: string;
  cover: string | null;
  color: string;
  tracks: string[];
}

export default function MusicPanel() {
  const { audioRef, currentTrack, isPlaying, progress, volume, duration, playTrack, togglePlay, nextTrack, prevTrack, setVolume, seekTo } = useAudio();
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadLS(LS_PLAYLISTS, DEFAULT_PLAYLISTS));
  const [tracks, setTracks] = useState<Track[]>(() => loadLS(LS_TRACKS, []));
  const [activePl, setActivePl] = useState<string | null>(null);
  const [tab, setTab] = useState<"library" | "playlists">("library");
  const [editPl, setEditPl] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const coverPlId = useRef<string | null>(null);

  useEffect(() => { saveLS(LS_PLAYLISTS, playlists); }, [playlists]);
  useEffect(() => { saveLS(LS_TRACKS, tracks); }, [tracks]);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      const id = `track_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const name = f.name.replace(/\.[^.]+$/, "");
      const newTrack: Track = { id, name, artist: "Unknown", url, size: `${(f.size / 1024 / 1024).toFixed(1)} MB`, added: new Date().toLocaleDateString() };
      setTracks(prev => [...prev, newTrack]);
      if (activePl) setPlaylists(prev => prev.map(p => p.id === activePl ? { ...p, tracks: [...p.tracks, id] } : p));
    });
    e.target.value = "";
  }

  function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f || !coverPlId.current) return;
    const url = URL.createObjectURL(f);
    setPlaylists(prev => prev.map(p => p.id === coverPlId.current ? { ...p, cover: url } : p));
    e.target.value = "";
  }

  function addTrackToPlaylist(plId: string, trackId: string) {
    setPlaylists(prev => prev.map(p => p.id !== plId ? p : p.tracks.includes(trackId) ? p : { ...p, tracks: [...p.tracks, trackId] }));
  }

  function removeTrackFromPlaylist(plId: string, trackId: string) {
    setPlaylists(prev => prev.map(p => p.id === plId ? { ...p, tracks: p.tracks.filter(t => t !== trackId) } : p));
  }

  function deleteTrack(id: string) {
    setTracks(prev => prev.filter(t => t.id !== id));
    setPlaylists(prev => prev.map(p => ({ ...p, tracks: p.tracks.filter(t => t !== id) })));
  }

  function renamePlaylist(id: string, name: string) {
    setPlaylists(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  }

  const activePlData = playlists.find(p => p.id === activePl);
  const filteredTracks = tracks.filter(t => search === "" || t.name.toLowerCase().includes(search.toLowerCase()) || (t.artist || "").toLowerCase().includes(search.toLowerCase()));
  const plTracks = activePlData ? activePlData.tracks.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[] : [];

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <PanelLayout
      title="Music"
      subtitle="Your music library and playlists"
      icon={<Music size={18} />}
      actions={
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="audio/*" multiple onChange={handleUpload} style={{ display: "none" }} />
          <button onClick={() => { setActivePl(null); fileRef.current?.click(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all uppercase tracking-wider"><Plus size={12} /> Add Music</button>
        </div>
      }
    >
      <div className="h-full flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex gap-1 pb-2 border-b border-white/10">
          {[
            ["library", "📚", "Library"],
            ["playlists", "🎵", "Playlists"],
          ].map(([id, icon, label]) => (
            <button key={id} onClick={() => setTab(id as "library" | "playlists")} className={`px-4 py-2 rounded-t-xl text-sm font-display transition-colors ${tab === id ? "glass-crimson text-primary border-b-2 border-primary" : "text-white/40 hover:text-white/70"}`}>{icon} {label}</button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Playlists or All Tracks */}
          <div className="w-64 shrink-0 border-r border-white/10 overflow-y-auto p-3">
            {tab === "library" ? (
              <>
                <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-3 px-2">ALL TRACKS</div>
                <div className="relative mb-3"><Search className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20" size={12} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracks..." className="w-full h-8 pl-8 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" /></div>
                {filteredTracks.length === 0 ? (
                  <div className="text-center py-8 text-white/20 text-xs">No tracks yet. Click "Add Music" to upload.</div>
                ) : (
                  <div className="space-y-1 pr-2 max-h-[calc(100%-80px)] overflow-y-auto">
                    {filteredTracks.map(t => (
                      <div key={t.id} onClick={() => playTrack(t)} className={`p-2 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${currentTrack?.id === t.id ? "glass-crimson" : "hover:bg-white/5"}`}>
                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-xs" style={{ background: `linear-gradient(135deg,${t.color || "#4ab3f4"},#ff8c42)` }}>{t.name?.[0] || "♪"}</div>
                        <div className="flex-1 min-w-0"><div className="text-xs font-medium truncate">{t.name}</div><div className="text-[10px] text-white/40 truncate">{t.artist}</div></div>
                        {currentTrack?.id === t.id && <Play className="text-primary" size={14} />}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-3 px-2">PLAYLISTS</div>
                <div className="space-y-2 mb-4">
                  {playlists.map(pl => (
                    <div key={pl.id} onClick={() => setActivePl(activePl === pl.id ? null : pl.id)} className={`p-3 rounded-xl cursor-pointer transition-all ${activePl === pl.id ? "glass-crimson border border-primary/40" : "glass border border-white/10 hover:border-white/20"}`}>
                      <div className="w-full h-20 rounded-lg mb-2 relative overflow-hidden" style={{ background: pl.cover ? `url(${pl.cover}) center/cover` : `linear-gradient(135deg,${pl.color}22,${pl.color}44)` }}>
                        {!pl.cover && <div className="w-full h-full flex items-center justify-center text-3xl"><Music size={24} className="text-white/30" /></div>}
                        <button onClick={e => { e.stopPropagation(); coverPlId.current = pl.id; coverRef.current?.click(); }} className="absolute bottom-2 right-2 p-1 rounded bg-black/70 text-white/70 hover:text-white text-xs"><Image size={10} /></button>
                      </div>
                      <div className="flex items-center justify-between">
                        {editPl === pl.id ? (
                          <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === "Enter" && (renamePlaylist(pl.id, editName), setEditPl(null))} onBlur={() => { renamePlaylist(pl.id, editName); setEditPl(null); }} autoFocus className="flex-1 px-2 py-1 bg-white/5 border border-primary/30 rounded text-xs text-white focus:outline-none" />
                        ) : (
                          <span className="text-xs font-medium truncate flex-1 pr-2">{pl.name}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <button onClick={e => { e.stopPropagation(); setEditPl(pl.id); setEditName(pl.name); }} className="p-1 text-white/40 hover:text-white"><Edit2 size={12} /></button>
                          <button onClick={e => { e.stopPropagation(); if (confirm(`Delete "${pl.name}"?`)) setPlaylists(prev => prev.filter(p => p.id !== pl.id)); }} className="p-1 text-white/40 hover:text-red-400"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <div className="text-[10px] text-white/30 mt-1">{pl.tracks.length} tracks</div>
                    </div>
                  ))}
                  <button onClick={() => { const id = `pl${Date.now()}`; setPlaylists(prev => [...prev, { id, name: `Playlist ${playlists.length + 1}`, cover: null, color: ["#4ab3f4", "#b366ff", "#00d9b3", "#ff8c42", "#ff4f5e", "#ffd700"][playlists.length % 6], tracks: [] }]); setActivePl(id); }} className="w-full p-3 rounded-xl glass border border-white/10 text-white/50 hover:text-white hover:border-primary/30 transition-colors text-xs font-display">+ New Playlist</button>
                </div>
              </>
            )}
            <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: "none" }} />
          </div>

          {/* Main View - Playlist Tracks or Library */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                {tab === "library" ? (
                  <>
                    <h3 className="font-display text-lg text-white">All Tracks</h3>
                    <p className="text-[10px] text-white/40">{filteredTracks.length} tracks</p>
                  </>
                ) : activePlData ? (
                  <>
                    <h3 className="font-display text-lg text-white">{activePlData.name}</h3>
                    <p className="text-[10px] text-white/40">{plTracks.length} tracks</p>
                  </>
                ) : (
                  <>
                    <h3 className="font-display text-lg text-white">Playlists</h3>
                    <p className="text-[10px] text-white/40">Select a playlist to view tracks</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {tab === "library" ? filteredTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-20"><Music size={48} className="mb-4" /><div className="text-sm font-display tracking-widest uppercase">No tracks found</div></div>
              ) : (
                <div className="space-y-1">
                  {filteredTracks.map(t => (
                    <div key={t.id} onClick={() => playTrack(t)} className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${currentTrack?.id === t.id ? "glass-crimson" : "glass border border-white/10 hover:border-white/20"}`}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg,${t.color || "#4ab3f4"},#ff8c42)` }}><Music size={16} className="text-white/90" /></div>
                      <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{t.name}</div><div className="text-[11px] text-white/40 truncate">{t.artist} · {t.size}</div></div>
                      <div className="flex items-center gap-2 text-white/50"><Heart size={16} /><MoreHorizontal size={16} /></div>
                    </div>
                  ))}
                </div>
              ) : activePlData ? plTracks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-20"><Music size={48} className="mb-4" /><div className="text-sm font-display tracking-widest uppercase">No tracks in this playlist</div><button onClick={() => { setActivePl(null); fileRef.current?.click(); }} className="mt-3 px-4 py-2 glass-crimson text-primary text-xs font-display hover:glow-crimson-sm"><Plus size={12} /> Add Tracks</button></div>
              ) : (
                <div className="space-y-1">
                  {plTracks.map(t => (
                    <div key={t.id} onClick={() => playTrack(t)} className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-colors ${currentTrack?.id === t.id ? "glass-crimson" : "glass border border-white/10 hover:border-white/20"}`}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg,${t.color || "#4ab3f4"},#ff8c42)` }}><Music size={16} className="text-white/90" /></div>
                      <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate">{t.name}</div><div className="text-[11px] text-white/40 truncate">{t.artist} · {t.size}</div></div>
                      <button onClick={e => { e.stopPropagation(); removeTrackFromPlaylist(activePl, t.id); }} className="p-1 text-white/40 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-20"><Music size={48} className="mb-4" /><div className="text-sm font-display tracking-widest uppercase">Select a playlist from the sidebar</div></div>
              )}
            </div>

            {/* Now Playing Bar */}
            {currentTrack && (
              <div className="glass-crimson border border-primary/30 p-3 border-t">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg,${currentTrack.color || "#4ab3f4"},#ff8c42)` }}><Music size={20} className="text-white/90" /></div>
                  <div className="flex-1 min-w-0"><div className="text-sm font-medium truncate text-white">{currentTrack.name}</div><div className="text-[11px] text-white/50 truncate">{currentTrack.artist}</div></div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => prevTrack(tracks, currentTrack.id, playlists, activePl)} className="p-1 text-white/60 hover:text-white"><SkipBack size={20} /></button>
                    <button onClick={togglePlay} className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg,#4ab3f4,#8b7fff)" }}>{isPlaying ? <Pause size={18} /> : <Play size={18} />}</button>
                    <button onClick={() => nextTrack(tracks, currentTrack.id, playlists, activePl)} className="p-1 text-white/60 hover:text-white"><SkipForward size={20} /></button>
                  </div>
                  <div className="flex items-center gap-2 w-48"><span className="text-[10px] text-white/50">{formatTime(audioRef.current?.currentTime || 0)}</span><input type="range" min={0} max={1} step={0.01} value={progress} onChange={e => seekTo(parseFloat(e.target.value))} className="flex-1 h-1.5 accent-primary" /><span className="text-[10px] text-white/50">{formatTime(audioRef.current?.duration || 0)}</span></div>
                  <div className="flex items-center gap-2"><button onClick={() => setVolume(volume > 0 ? 0 : 0.8)} className="p-1 text-white/60 hover:text-white">{volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}</button><input type="range" min={0} max={1} step={0.05} value={volume} onChange={e => setVolume(parseFloat(e.target.value))} className="w-20 h-1.5 accent-primary" /></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}