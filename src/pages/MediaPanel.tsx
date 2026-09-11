import { useState, useRef } from "react";
import { Image as ImageIcon, Plus, Upload, Folder, Search, Film, FileText, Grid3x3, List, Trash2, Eye, Download, FolderPlus, MoreVertical, X } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout";

const ALBUMS = [
  { id: "all", name: "All Media", icon: ImageIcon, color: "#4ab3f4" },
  { id: "images", name: "Images", icon: ImageIcon, color: "#00d9b3" },
  { id: "videos", name: "Videos", icon: Film, color: "#b366ff" },
  { id: "documents", name: "Documents", icon: FileText, color: "#ff8c42" },
  { id: "sheets", name: "Sheets & Docs", icon: FileText, color: "#ff4f5e" },
  { id: "smart", name: "Smart Albums", icon: Folder, color: "#ffd700" },
];

const INITIAL_MEDIA = [
  { id: "m1", name: "Project Mockup.png", type: "image", url: "https://picsum.photos/seed/mockup/400/300", size: "245 KB", album: "images", tags: ["design", "project"], date: "2024-01-15" },
  { id: "m2", name: "Dashboard Preview.mp4", type: "video", url: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4", size: "1.2 MB", album: "videos", tags: ["demo", "dashboard"], date: "2024-01-14" },
  { id: "m3", name: "Q1 Report.pdf", type: "document", url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.png", size: "890 KB", album: "documents", tags: ["report", "q1"], date: "2024-01-13" },
  { id: "m4", name: "Budget.xlsx", type: "document", url: "https://cdn-icons-png.flaticon.com/512/2982/2982683.png", size: "156 KB", album: "sheets", tags: ["finance", "budget"], date: "2024-01-12" },
  { id: "m5", name: "Logo Design.svg", type: "image", url: "https://picsum.photos/seed/logo/400/300", size: "67 KB", album: "images", tags: ["design", "branding"], date: "2024-01-11" },
  { id: "m6", name: "Team Meeting.mp4", type: "video", url: "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4", size: "45 MB", album: "videos", tags: ["meeting", "team"], date: "2024-01-10" },
];

export default function MediaPanel() {
  const [view, setView] = useState("grid");
  const [activeAlbum, setActiveAlbum] = useState("all");
  const [media, setMedia] = useState(INITIAL_MEDIA);
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const fileRef = useRef(null);

  const filteredMedia = media.filter(m => {
    const matchesAlbum = activeAlbum === "all" || m.album === activeAlbum;
    const matchesSearch = search === "" || m.name.toLowerCase().includes(search.toLowerCase()) || (m.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesAlbum && matchesSearch;
  });

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    setUploadFiles(prev => [...prev, ...files]);
    setShowUpload(true);
  }

  function handleUpload() {
    uploadFiles.forEach(f => {
      const url = URL.createObjectURL(f);
      const type = f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "document";
      const album = type === "image" ? "images" : type === "video" ? "videos" : "documents";
      const newMedia = {
        id: `m${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: f.name,
        type,
        url,
        size: `${(f.size / 1024).toFixed(0)} KB`,
        album,
        tags: [],
        date: new Date().toISOString().split("T")[0],
      };
      setMedia(prev => [newMedia, ...prev]);
    });
    setUploadFiles([]);
    setShowUpload(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function deleteMedia(id) {
    if (!confirm("Delete this file?")) return;
    setMedia(prev => prev.filter(m => m.id !== id));
    if (selectedMedia?.id === id) setSelectedMedia(null);
  }

  function openFile(m) {
    setSelectedMedia(m);
  }

  function getIcon(type) {
      if (type === "image") return <ImageIcon size={14} />;
      if (type === "video") return <Film size={14} />;
      return <FileText size={14} />;
    }

  function getColor(type) {
    if (type === "image") return "#00d9b3";
    if (type === "video") return "#b366ff";
    return "#ff8c42";
  }

  return (
    <PanelLayout
      title="Media"
      subtitle="Store, organize, and manage all your files"
      icon={<ImageIcon size={18} />}
      actions={
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" multiple onChange={handleFileSelect} style={{ display: "none" }} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" />
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/60 hover:text-white transition-colors text-xs"><Upload size={12} /> UPLOAD</button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"><Plus size={12} /> NEW ALBUM</button>
        </div>
      }
    >
      <div className="h-full flex gap-4 overflow-hidden">
        {/* Sidebar - Albums */}
        <div className="w-56 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl border border-white/10 p-3 flex-1 overflow-y-auto">
            <div className="text-[9px] font-display tracking-widest text-teal uppercase mb-3 px-1">ALBUMS</div>
            {ALBUMS.map((a) => (
              <button
                key={a.id}
                onClick={() => setActiveAlbum(a.id)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors text-left ${activeAlbum === a.id ? "glass-crimson text-primary" : "text-white/50 hover:bg-white/5 hover:text-white/80"}`}
              >
                <a.icon size={14} style={{ color: a.color }} />
                <span className="text-xs font-medium">{a.name}</span>
                <span className="ml-auto text-[10px] text-white/30">{media.filter(m => a.id === "all" || m.album === a.id).length}</span>
              </button>
            ))}
            <button className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xs font-display"><FolderPlus size={14} /> Create Album</button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search media..." className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            </div>
            <div className="flex gap-1">
              <button onClick={() => setView("grid")} className={`p-2 rounded-lg ${view === "grid" ? "glass-crimson text-primary" : "glass text-white/40 hover:text-white hover:bg-white/5"}`}><Grid3x3 size={14} /></button>
              <button onClick={() => setView("list")} className={`p-2 rounded-lg ${view === "list" ? "glass-crimson text-primary" : "glass text-white/40 hover:text-white hover:bg-white/5"}`}><List size={14} /></button>
            </div>
          </div>

          {/* Media Grid/List */}
          <div className="flex-1 glass rounded-2xl border border-white/10 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {filteredMedia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-20">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <ImageIcon size={24} className="text-white/15" />
                    <Film size={24} className="text-white/10" />
                    <FileText size={24} className="text-white/8" />
                  </div>
                  <div className="text-sm text-white/30 mb-1">No media in this album</div>
                  <div className="text-[10px] text-white/20 mb-4">Upload images, videos, docs — smart albums auto-organize</div>
                  <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-4 py-2 glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"><Upload size={11} /> UPLOAD FILES</button>
                </div>
              ) : view === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredMedia.map(m => (
                    <div key={m.id} onClick={() => openFile(m)} className="glass rounded-xl border border-white/10 overflow-hidden cursor-pointer hover:border-primary/30 transition-colors group">
                      <div className="aspect-video relative overflow-hidden" style={{ background: `linear-gradient(135deg,${getColor(m.type)}22,${getColor(m.type)}44)` }}>
                        {m.type === "image" && m.url.startsWith("http") && <img src={m.url} alt={m.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                        {m.type === "image" && !m.url.startsWith("http") && <div className="w-full h-full flex items-center justify-center text-4xl"><ImageIcon size={32} className="text-white/40" /></div>}
                        {m.type === "video" && <div className="w-full h-full flex items-center justify-center"><Film size={32} className="text-white/40" /></div>}
                        {m.type === "document" && <div className="w-full h-full flex items-center justify-center"><FileText size={32} className="text-white/40" /></div>}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={e => { e.stopPropagation(); openFile(m); }} className="p-1.5 rounded bg-black/70 text-white/80 hover:text-white"><Eye size={12} /></button>
                          <button onClick={e => { e.stopPropagation(); window.open(m.url, "_blank"); }} className="p-1.5 rounded bg-black/70 text-white/80 hover:text-white"><Download size={12} /></button>
                          <button onClick={e => { e.stopPropagation(); deleteMedia(m.id); }} className="p-1.5 rounded bg-black/70 text-white/80 hover:text-red-400"><Trash2 size={12} /></button>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="px-2 py-0.5 text-[9px] bg-black/70 text-white/80 rounded capitalize">{m.type}</span>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="text-xs font-medium truncate text-white">{m.name}</div>
                        <div className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">{m.size} · {m.tags?.slice(0, 2).map(t => <span key={t} className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] text-white/50">{t}</span>)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="grid grid-cols-[40px_1fr_80px_100px_100px_40px] gap-2 px-3 py-2 text-[10px] font-display tracking-wider text-teal uppercase text-white/30 border-b border-white/10 sticky top-0 bg-black/50 z-10">
                    <div></div>
                    <div>FILE NAME</div>
                    <div className="text-center">TYPE</div>
                    <div className="text-center">SIZE</div>
                    <div className="text-center">DATE</div>
                    <div></div>
                  </div>
                  {filteredMedia.map(m => (
                    <div key={m.id} onClick={() => openFile(m)} className={`grid grid-cols-[40px_1fr_80px_100px_100px_40px] gap-2 px-3 py-2 items-center border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${selectedMedia?.id === m.id ? "bg-primary/10" : ""}`}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg,${getColor(m.type)}22,${getColor(m.type)}44)` }}>
                                              {getIcon(m.type)}
                                            </div>
                      <div className="truncate text-sm text-white">{m.name}</div>
                      <div className="text-center text-[10px] text-white/50 capitalize">{m.type}</div>
                      <div className="text-center text-[10px] text-white/50">{m.size}</div>
                      <div className="text-center text-[10px] text-white/50">{m.date}</div>
                      <div className="flex justify-end"><MoreVertical size={14} className="text-white/30" /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && uploadFiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass-crimson border border-primary/30 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-lg text-primary">Upload {uploadFiles.length} file{uploadFiles.length > 1 ? "s" : ""}</h3>
              <button onClick={() => { setShowUpload(false); setUploadFiles([]); }} className="text-white/40 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {uploadFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-3 p-2 glass rounded-xl border border-white/10">
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: f.type.startsWith("image/") ? "linear-gradient(135deg,#00d9b3,#4ab3f4)" : f.type.startsWith("video/") ? "linear-gradient(135deg,#b366ff,#ff4f5e)" : "linear-gradient(135deg,#ff8c42,#ff4f5e)" }}>
                    {f.type.startsWith("image/") ? <ImageIcon size={14} className="text-white/90" /> : f.type.startsWith("video/") ? <Film size={14} className="text-white/90" /> : <FileText size={14} className="text-white/90" />}
                  </div>
                  <div className="flex-1 min-w-0"><div className="text-xs font-medium truncate text-white">{f.name}</div><div className="text-[10px] text-white/40">{(f.size / 1024 / 1024).toFixed(2)} MB · {f.type}</div></div>
                  <button onClick={() => setUploadFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1 text-white/40 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => { setShowUpload(false); setUploadFiles([]); }} className="px-4 py-2 text-sm border border-white/10 rounded-xl text-white/60 hover:border-primary/30 hover:text-primary">Cancel</button>
              <button onClick={handleUpload} className="flex items-center gap-1.5 px-4 py-2 glass-crimson text-primary rounded-xl text-sm font-display uppercase tracking-wider"><Upload size={14} /> Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setSelectedMedia(null)}>
          <div className="glass-crimson border border-primary/30 rounded-2xl p-4 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display text-lg text-white">{selectedMedia.name}</h3>
              <button onClick={() => setSelectedMedia(null)} className="text-white/40 hover:text-white"><X size={24} /></button>
            </div>
            <div className="aspect-video rounded-xl overflow-hidden mb-4" style={{ background: `linear-gradient(135deg,${getColor(selectedMedia.type)}22,${getColor(selectedMedia.type)}44)` }}>
              {selectedMedia.type === "image" && <img src={selectedMedia.url} alt={selectedMedia.name} className="w-full h-full object-contain" />}
              {selectedMedia.type === "video" && <video src={selectedMedia.url} controls className="w-full h-full" />}
              {selectedMedia.type === "document" && <div className="w-full h-full flex items-center justify-center"><FileText size={48} className="text-white/40" /></div>}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="glass rounded-xl p-3 border border-white/10"><div className="text-[10px] text-white/40 font-display tracking-wider uppercase">Type</div><div className="text-white capitalize">{selectedMedia.type}</div></div>
              <div className="glass rounded-xl p-3 border border-white/10"><div className="text-[10px] text-white/40 font-display tracking-wider uppercase">Size</div><div className="text-white">{selectedMedia.size}</div></div>
              <div className="glass rounded-xl p-3 border border-white/10"><div className="text-[10px] text-white/40 font-display tracking-wider uppercase">Album</div><div className="text-white">{ALBUMS.find(a => a.id === selectedMedia.album)?.name || "—"}</div></div>
              <div className="glass rounded-xl p-3 border border-white/10"><div className="text-[10px] text-white/40 font-display tracking-wider uppercase">Date</div><div className="text-white">{selectedMedia.date}</div></div>
            </div>
            {selectedMedia.tags?.length && (
              <div className="mt-4">
                <div className="text-[10px] text-white/40 font-display tracking-wider uppercase mb-2">Tags</div>
                <div className="flex flex-wrap gap-1">{selectedMedia.tags.map(t => <span key={t} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-full text-[10px] text-white/60">{t}</span>)}</div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-white/10">
              <button onClick={() => window.open(selectedMedia.url, "_blank")} className="flex items-center gap-1.5 px-4 py-2 glass text-white/80 hover:text-white transition-colors text-sm"><Download size={14} /> Open</button>
              <button onClick={() => { const a = document.createElement("a"); a.href = selectedMedia.url; a.download = selectedMedia.name; a.click(); }} className="flex items-center gap-1.5 px-4 py-2 glass-crimson text-primary text-sm font-display hover:glow-crimson-sm"><Download size={14} /> Download</button>
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}