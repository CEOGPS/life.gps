import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";

interface AudioContextValue {
  audioRef: React.RefObject<HTMLAudioElement>;
  currentTrack: { title: string; audioFileUrl: string } | null;
  setCurrentTrack: (track: { title: string; audioFileUrl: string } | null) => void;
  playing: boolean;
  setPlaying: (playing: boolean) => void;
  progress: number;
  setProgress: (progress: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState<{ title: string; audioFileUrl: string } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
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

  // Sync audio element with state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = muted;
    audio.volume = volume;

    if (playing && currentTrack?.audioFileUrl) {
      if (audio.src !== currentTrack.audioFileUrl) {
        audio.src = currentTrack.audioFileUrl;
      }
      audio.play().catch(console.error);
    } else if (!playing) {
      audio.pause();
    }
  }, [playing, currentTrack?.audioFileUrl, muted, volume]);

  return (
    <AudioContext.Provider
      value={{
        audioRef,
        currentTrack,
        setCurrentTrack,
        playing,
        setPlaying,
        progress,
        setProgress,
        duration,
        setDuration,
        muted,
        setMuted,
        volume,
        setVolume,
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