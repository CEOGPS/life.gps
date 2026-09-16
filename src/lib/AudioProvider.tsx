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

interface YoutubeState {
  videoId: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  startTime: number;
}

interface AudioContextValue {
  // Music State
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTrack: Track | null;
  musicIsPlaying: boolean;
  musicProgress: number;
  musicVolume: number;
  musicDuration: number;
  setCurrentTrack: (track: Track | null) => void;
  setMusicIsPlaying: (playing: boolean) => void;
  setMusicProgress: (progress: number) => void;
  setMusicVolume: (volume: number) => void;
  setMusicDuration: (duration: number) => void;
  playTrack: (track: Track) => void;
  toggleMusicPlay: () => void;
  nextTrack: (tracks: Track[], currentTrackId: string | null, playlists: any[], activePl: string | null) => void;
  prevTrack: (tracks: Track[], currentTrackId: string | null, playlists: any[], activePl: string | null) => void;
  seekMusic: (progress: number) => void;

  // YouTube State
  ytVideoId: string | null;
  ytIsPlaying: boolean;
  ytIsMuted: boolean;
  ytVolume: number;
  setYtVideoId: (id: string | null) => void;
  setYtIsPlaying: (playing: boolean) => void;
  setYtIsMuted: (muted: boolean) => void;
  setYtVolume: (vol: number) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  // --- Music State ---
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [musicIsPlaying, setMusicIsPlaying] = useState(false);
  const [musicProgress, setMusicProgress] = useState(0);
  const [musicDuration, setMusicDuration] = useState(0);
  const [musicVolume, setMusicVolume] = useState(1);

  // --- YouTube State ---
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);
  const [ytIsPlaying, setYtIsPlaying] = useState(false);
  const [ytIsMuted, setYtIsMuted] = useState(false);
  const [ytVolume, setYtVolume] = useState(100);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
  }, []);

  // Audio progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const tick = () => {
      setMusicProgress(audio.currentTime / (audio.duration || 1));
      setMusicDuration(audio.duration || 0);
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
    audio.volume = musicVolume;
    if (musicIsPlaying && currentTrack?.url) {
      if (audio.src !== currentTrack.url) {
        audio.src = currentTrack.url;
      }
      audio.play().catch(console.error);
    } else if (!musicIsPlaying) {
      audio.pause();
    }
  }, [musicIsPlaying, currentTrack?.url, musicVolume]);

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setMusicIsPlaying(true);
  }, []);

  const toggleMusicPlay = useCallback(() => {
    setMusicIsPlaying(prev => !prev);
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

  const seekMusic = useCallback((progress: number) => {
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
        musicIsPlaying,
        musicProgress,
        musicVolume,
        musicDuration,
        setCurrentTrack,
        setMusicIsPlaying,
        setMusicProgress,
        setMusicVolume,
        setMusicDuration,
        playTrack,
        toggleMusicPlay,
        nextTrack,
        prevTrack,
        seekMusic,
        ytVideoId,
        ytIsPlaying,
        ytIsMuted,
        ytVolume,
        setYtVideoId,
        setYtIsPlaying,
        setYtIsMuted,
        setYtVolume,
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
