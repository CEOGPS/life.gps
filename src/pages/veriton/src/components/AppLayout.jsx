import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import GlobalMusicPlayer from "./GlobalMusicPlayer";
import { PlayerProvider, usePlayer } from "@/lib/PlayerContext";

function PlayerWrapper() {
  const { currentTrack, onNext, onPrev, trackList } = usePlayer();
  return (
    <GlobalMusicPlayer
      currentTrack={currentTrack}
      onNext={onNext}
      onPrev={onPrev}
      tracks={trackList}
    />
  );
}

export default function AppLayout() {
  return (
    <PlayerProvider>
      <div className="min-h-screen relative">
        <Sidebar />
        <main
          className="transition-all duration-300"
          style={{
            marginLeft: 0,
            paddingRight: "1rem",
            paddingTop: "1rem",
            paddingBottom: "7rem",
          }}
        >
          <div className="pl-[240px] pr-4 pt-4 pb-28 min-h-screen">
            <Outlet />
          </div>
        </main>
        <PlayerWrapper />
      </div>
    </PlayerProvider>
  );
}
