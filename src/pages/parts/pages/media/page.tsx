import { Image as ImageIcon, Plus, Upload, Folder, Search, Film, FileText, Grid3x3, List } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const ALBUMS = ["All Media", "Images", "Videos", "Documents", "Sheets & Docs", "Smart Albums"];

export default function MediaPanel() {
  const [view, setView] = useState<"grid" | "list">("grid");
  return (
    <PanelLayout title="Media" subtitle="Store, organize, and manage all your files" icon={<ImageIcon size={18} />}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all"><Upload size={12} /> UPLOAD</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"><Plus size={12} /> NEW ALBUM</button>
        </div>
      }
    >
      <div className="h-full flex gap-4">
        <div className="w-44 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl border border-white/8 p-2 flex-1">
            <div className="text-[9px] text-white/20 font-display tracking-widest px-2 mb-2">ALBUMS</div>
            {ALBUMS.map((a, i) => (
              <div key={a} className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${i === 0 ? "glass-crimson text-primary" : "text-white/40 hover:bg-white/5 hover:text-white/70"}`}>
                <Folder size={12} />
                <span className="text-xs">{a}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input placeholder="Search media..." className="w-full h-8 pl-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            </div>
            <div className="flex gap-1">
              <button onClick={() => setView("grid")} className={`p-1.5 rounded ${view === "grid" ? "glass-crimson text-primary" : "text-white/30 hover:text-white/60"}`}><Grid3x3 size={13} /></button>
              <button onClick={() => setView("list")} className={`p-1.5 rounded ${view === "list" ? "glass-crimson text-primary" : "text-white/30 hover:text-white/60"}`}><List size={13} /></button>
            </div>
          </div>
          <div className="flex-1 glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <ImageIcon size={20} className="text-white/15" />
                  <Film size={20} className="text-white/10" />
                  <FileText size={20} className="text-white/8" />
                </div>
                <div className="text-sm text-white/20">No media uploaded yet</div>
                <div className="text-[10px] text-white/12 mt-1">Upload images, videos, docs — smart albums auto-organize</div>
                <button className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
                  <Upload size={11} /> UPLOAD FILES
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
