import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";
import { resolvePlayableUrl } from "./audioStore";

type Track = {
  id: string;
  title: string;
  genre?: string;
  coverArtUrl?: string;
  audioFileUrl?: string;
  artist?: string;
  artwork?: string;
  duration?: number;
};

type Playlist = { id: string; name: string; trackIds?: string[] };

interface MusicContextType {
  // State
  tracks: Track[];
  playlists: Playlist[];
  activePlaylist: string | null;
  showPlaylists: boolean;
  index: number | null;
  playing: boolean;
  muted: boolean;
  shuffled: boolean;
  progress: number;
  duration: number;
  
  // Actions
  setTracks: (tracks: Track[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  setActivePlaylist: (name: string | null) => void;
  setShowPlaylists: (show: boolean) => void;
  setIndex: (index: number | null) => void;
  setPlaying: (playing: boolean) => void;
  setMuted: (muted: boolean) => void;
  setShuffled: (shuffled: boolean) => void;
  setProgress: (progress: number) => void;
  setDuration: (duration: number) => void;
  playAt: (index: number) => void;
  togglePlay: () => void;
  pickNext: () => void;
  pickPrev: () => void;
  applyPlaylist: (pl: Playlist) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Persistent state across navigation
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<string | null>(null);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [index, setIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata";
    }
    return () => {
      // Don't cleanup audio on unmount - keep it alive for continuous playback
    };
  }, []);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setProgress(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => pickNext();

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Re-hydrate uploaded tracks whose object URL died after a reload/login.
  // Blob URLs are session-scoped; IndexedDB bytes are durable. Restore a fresh
  // object URL from the stored bytes on first mount so the song plays again.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    (async () => {
      const withDurableUrls = await Promise.all(
        tracks.map(async (t) => {
          const liveUrl = await resolvePlayableUrl(t);
          if (liveUrl && liveUrl !== t.audioFileUrl) {
            return { ...t, audioFileUrl: liveUrl };
          }
          return t;
        }),
      );
      setTracks(withDurableUrls);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // React to track changes
  const currentTrack = index !== null ? tracks[index] : null;

  useEffect(() => {
    if (!audioRef.current || !currentTrack?.audioFileUrl) return;
    audioRef.current.src = currentTrack.audioFileUrl;
    if (playing) {
      audioRef.current.play().catch(() => setPlaying(false));
    }
  }, [currentTrack?.audioFileUrl, playing]);

  const playAt = useCallback((i: number) => {
    if (i >= 0 && i < tracks.length) {
      setIndex(i);
      setPlaying(true);
    }
  }, [tracks.length]);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    if (playing) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(() => {});
    }
    setPlaying((p) => !p);
  }, [currentTrack, playing]);

  const pickNext = useCallback(() => {
    if (!tracks.length || index === null) return;
    const nextIndex = shuffled
      ? Math.floor(Math.random() * tracks.length)
      : (index + 1) % tracks.length;
    setIndex(nextIndex);
  }, [tracks.length, index, shuffled]);

  const pickPrev = useCallback(() => {
    if (!tracks.length || index === null) return;
    setIndex((index - 1 + tracks.length) % tracks.length);
  }, [tracks.length, index]);

  const applyPlaylist = useCallback((pl: Playlist) => {
    const order = new Map(pl.trackIds?.map((id, i) => [id, i]) || []);
    const queued = tracks
      .filter((t) => order.has(t.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    if (queued.length > 0) {
      setTracks((prev) => {
        const others = prev.filter((t) => !order.has(t.id));
        return [...queued, ...others].filter((t) => t.audioFileUrl);
      });
      setIndex(0);
      setPlaying(true);
    }
    setActivePlaylist(pl.name);
    setShowPlaylists(false);
  }, [tracks]);

  const value: MusicContextType = {
    tracks,
    playlists,
    activePlaylist,
    showPlaylists,
    index,
    playing,
    muted,
    shuffled,
    progress,
    duration,
    setTracks,
    setPlaylists,
    setActivePlaylist,
    setShowPlaylists,
    setIndex,
    setPlaying,
    setMuted,
    setShuffled,
    setProgress,
    setDuration,
    playAt,
    togglePlay,
    pickNext,
    pickPrev,
    applyPlaylist,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}