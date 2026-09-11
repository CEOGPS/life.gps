import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from "react";

interface Track {
  id: string;
  name: string;
  artist: string;
  url: string;
  size?: string;
  added?: string;
  color?: string;
}

interface AudioContextValue {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  duration: number;
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  setDuration: (duration: number) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: (tracks: Track[], currentTrackId: string | null, playlists: any[], activePl: string | null) => void;
  prevTrack: (tracks: Track[], currentTrackId: string | null, playlists: any[], activePl: string | null) => void;
  seekTo: (progress: number) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return () => {
      // Don't destroy audio element on unmount - it persists across routes
    };
  }, []);

  // Audio progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = () => {
      setProgress(audio.currentTime / (audio.duration || 1));
      setDuration(audio.duration || 0);
    };
    audio.addEventListener("timeupdate", tick);
    audio.addEventListener("loadedmetadata", tick);
    return () => {
      audio.removeEventListener("timeupdate", tick);
      audio.removeEventListener("loadedmetadata", tick);
    };
  }, []);

  // Sync audio element with state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (isPlaying && currentTrack?.url) {
      if (audio.src !== currentTrack.url) {
        audio.src = currentTrack.url;
      }
      audio.play().catch(console.error);
    } else if (!isPlaying) {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.url, volume]);

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const nextTrack = useCallback((tracks: Track[], currentTrackId: string | null, playlists: any[], activePl: string | null) => {
    const pl = playlists.find(p => p.tracks.includes(currentTrackId));
    const list = pl ? pl.tracks.map(id => tracks.find(t => t.id === id)).filter(Boolean) : tracks;
    const ids = list.map(t => t.id);
    const idx = ids.indexOf(currentTrackId);
    const next = ids[(idx + 1) % ids.length];
    const track = tracks.find(t => t.id === next);
    if (track) playTrack(track);
  }, [playTrack]);

  const prevTrack = useCallback((tracks: Track[], currentTrackId: string | null, playlists: any[], activePl: string | null) => {
    const pl = playlists.find(p => p.tracks.includes(currentTrackId));
    const list = pl ? pl.tracks.map(id => tracks.find(t => t.id === id)).filter(Boolean) : tracks;
    const ids = list.map(t => t.id);
    const idx = ids.indexOf(currentTrackId);
    const prev = ids[(idx - 1 + ids.length) % ids.length];
    const track = tracks.find(t => t.id === prev);
    if (track) playTrack(track);
  }, [playTrack]);

  const seekTo = useCallback((progress: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = progress * audio.duration;
    }
  }, []);

  return (
    <AudioContext.Provider
      value={{
        audioRef,
        currentTrack,
        isPlaying,
        progress,
        volume,
        duration,
        setCurrentTrack,
        setIsPlaying,
        setProgress,
        setVolume,
        setDuration,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        seekTo,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}