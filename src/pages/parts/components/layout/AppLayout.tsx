import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.tsx";
import Topbar from "./Topbar.tsx";
import BannerArea from "./BannerArea.tsx";
import ErebusDock from "@/components/ErebusDock.tsx";
import DotGridBackground from "@/components/DotGridBackground.tsx";

export default function AppLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: "#000000" }}>
      <DotGridBackground />
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <Topbar />
        <BannerArea />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <ErebusDock />
    </div>
  );
}
