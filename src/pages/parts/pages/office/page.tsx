import { FileSpreadsheet, Plus, FileText, Table2, Presentation, Folder, Search, Download, Upload, FolderOpen } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const DOC_TYPES = [
  { icon: <FileText size={16} />, label: "Document", desc: "Rich text editor" },
  { icon: <Table2 size={16} />, label: "Spreadsheet", desc: "Excel-like tables" },
  { icon: <Presentation size={16} />, label: "Presentation", desc: "Slides & decks" },
  { icon: <FileSpreadsheet size={16} />, label: "CSV / Data", desc: "Import & analyze" },
];

const TABS = ["All Files", "Documents", "Spreadsheets", "Templates", "Shared"];

export default function OfficePanel() {
  const [tab, setTab] = useState(0);
  const [newDocOpen, setNewDocOpen] = useState(false);

  return (
    <PanelLayout
      title="Office"
      subtitle="Create, store, and manage documents and spreadsheets"
      icon={<FileSpreadsheet size={18} />}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all">
            <Upload size={12} /> IMPORT
          </button>
          <button
            onClick={() => setNewDocOpen(!newDocOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
          >
            <Plus size={12} /> NEW FILE
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* New document picker */}
        {newDocOpen && (
          <div className="glass rounded-xl border p-4" style={{ borderColor: "oklch(0.55 0.22 20 / 25%)" }}>
            <div className="text-[10px] font-display tracking-wider mb-3" style={{ color: "oklch(0.75 0.15 175)" }}>CREATE NEW FILE</div>
            <div className="grid grid-cols-4 gap-3">
              {DOC_TYPES.map((d) => (
                <button key={d.label} onClick={() => setNewDocOpen(false)}
                  className="glass rounded-xl p-4 border border-white/8 hover:border-primary/25 hover:glow-crimson-sm transition-all cursor-pointer text-left">
                  <span className="text-primary/70 mb-2 block">{d.icon}</span>
                  <div className="text-xs text-white/80 font-medium">{d.label}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: "oklch(0.75 0.15 175)" }}>{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto shrink-0">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`px-3 py-1.5 rounded-lg text-[11px] font-display whitespace-nowrap transition-colors
              ${tab === i ? "glass-crimson text-primary" : "glass text-white/40 hover:text-white/70"}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input placeholder="Search files..." className="w-full h-8 pl-8 text-xs rounded-lg text-white/80 placeholder:text-white/25 focus:outline-none transition-all"
            style={{ background: "oklch(1 0 0 / 4%)", border: "1px solid oklch(0.55 0.22 20 / 15%)" }} />
        </div>

        {/* File grid */}
        <div className="glass rounded-xl border border-white/8 p-6 flex flex-col items-center justify-center min-h-[300px]">
          <FolderOpen size={36} className="text-white/10 mb-3" />
          <div className="text-sm text-white/30 mb-1">No files yet</div>
          <div className="text-xs mb-4" style={{ color: "oklch(0.75 0.15 175 / 60%)" }}>Create a new document, spreadsheet, or import existing files</div>
          <button onClick={() => setNewDocOpen(true)} className="px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
            + CREATE YOUR FIRST FILE
          </button>
        </div>

        {/* Recent templates */}
        <div className="glass rounded-xl border border-white/8 p-4">
          <div className="text-[9px] font-display tracking-widest mb-3" style={{ color: "oklch(0.75 0.15 175)" }}>STARTER TEMPLATES</div>
          <div className="grid grid-cols-3 gap-3">
            {["Invoice Template", "Budget Tracker", "Client Proposal", "Meeting Notes", "Content Calendar", "KPI Dashboard"].map((t) => (
              <button key={t} className="glass rounded-lg p-2.5 border border-white/6 hover:border-primary/20 text-left cursor-pointer transition-colors group">
                <Folder size={12} className="text-primary/50 mb-1.5" />
                <div className="text-[10px] text-white/60 group-hover:text-white/90">{t}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="h-8" />
      </div>
    </PanelLayout>
  );
}
