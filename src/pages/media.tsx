import {
  Image as ImageIcon,
  Plus,
  Upload,
  Folder,
  Search,
  Film,
  FileText,
  Grid3x3,
  List,
  Menu,
  Download,
  ExternalLink,
  Trash2,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";
import { usePersistentState } from "@/lib/usePersistentState";

type MediaItem = {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "audio" | "other";
  url: string; // object URL or data URL
  size: number; // in bytes
  album: string;
};

const DEFAULT_ALBUMS = [
  "All Media",
  "Images",
  "Videos",
  "Documents",
  "Sheets & Docs",
  "Smart Albums",
];

function getFileType(file: File): MediaItem["type"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  if (
    file.type.includes("document") ||
    file.type.includes("spreadsheet") ||
    file.name.match(/\.(doc|docx|pdf|xls|xlsx|ppt|pptx|txt|csv)$/i)
  )
    return "document";
  return "other";
}

function getMediaIcon(type: MediaItem["type"]) {
  switch (type) {
    case "image":
      return <ImageIcon size={16} className="mr-2 h-4 w-4" />;
    case "video":
      return <Film size={16} className="mr-2 h-4 w-4" />;
    case "audio":
      return (
        <svg
          width={16}
          height={16}
          className="mr-2 h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 15l8-4V7l-8 4v4z" />
          <circle cx="12" cy="9" r="3" />
        </svg>
      );
    case "document":
      return <FileText size={16} className="mr-2 h-4 w-4" />;
    default:
      return <Folder size={16} className="mr-2 h-4 w-4" />;
  }
}

export default function MediaPanel() {
  const [mediaItems, setMediaItems] = usePersistentState<MediaItem[]>(
    "media-items",
    []
  );
  const [albums, setAlbums] = usePersistentState<string[]>(
    "media-albums",
    DEFAULT_ALBUMS
  );
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState("All Media");
  const [uploading, setUploading] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");

  // Filter media items based on selected album and search term
  const filteredMedia = mediaItems
    .filter((item) => {
      if (selectedAlbum === "All Media") return true;
      if (selectedAlbum === "Images" && item.type === "image") return true;
      if (selectedAlbum === "Videos" && item.type === "video") return true;
      if (selectedAlbum === "Documents" && item.type === "document") return true;
      if (selectedAlbum === "Sheets & Docs" && item.type === "document") return true;
      if (selectedAlbum === "Smart Albums") {
        // Smart albums are dynamic; we'll show all for now
        return true;
      }
      return item.album === selectedAlbum;
    })
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newItems: MediaItem[] = [];
      for (const file of files) {
        const url = URL.createObjectURL(file);
        const item: MediaItem = {
          id: crypto.randomUUID(),
          name: file.name,
          type: getFileType(file),
          url,
          size: file.size,
          album: selectedAlbum !== "All Media" ? selectedAlbum : "All Media",
        };
        newItems.push(item);
      }
      setMediaItems((prev) => [...prev, ...newItems]);
      e.target.value = ""; // reset input
    } finally {
      setUploading(false);
    }
  };

  // Handle new album creation
  const handleNewAlbum = () => {
    const name = newAlbumName.trim();
    if (name && !albums.includes(name)) {
      setAlbums((prev) => [...prev, name]);
      setNewAlbumName("");
      // Optionally switch to the new album
      setSelectedAlbum(name);
    }
  };

  // Handle album selection
  const handleAlbumSelect = (album: string) => {
    setSelectedAlbum(album);
  };

  // Handle delete media item
  const handleDeleteMedia = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Handle download media item
  const handleDownloadMedia = (item: MediaItem) => {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.name;
    link.click();
  };

  // Handle share media item (placeholder - would need backend)
  const handleShareMedia = (item: MediaItem) => {
    alert("Sharing feature requires backend integration");
  };

  return (
    <PanelLayout
      title="Media"
      subtitle="Store, organize, and manage all your files"
      icon={<ImageIcon size={18} />}
      actions={
        <div className="flex gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all disabled:opacity-50"
            onClick={() => document.getElementById("file-upload")?.click()}
            disabled={uploading}
          >
            <Upload size={12} />
            {uploading ? "Uploading..." : "UPLOAD"}
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
            onClick={() => {
              // Open album creation dialog
              const name = prompt("Enter album name:");
              if (name) handleNewAlbum();
            }}
          >
            <Plus size={12} />
            NEW ALBUM
          </button>
        </div>
      }
    >
      <div className="h-full flex gap-4">
        {/* Sidebar: Albums */}
        <div className="w-44 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl border border-white/8 p-2 flex-1">
            <div className="text-[9px] text-white/20 font-display tracking-widest px-2 mb-2">
              ALBUMS
            </div>
            {albums.map((album, i) => (
              <div
                key={album}
                onClick={() => handleAlbumSelect(album)}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                  selectedAlbum === album
                    ? "glass-crimson text-primary"
                    : "text-white/40 hover:bg-white/5 hover:text-white/70"
                }`}
              >
                <Folder size={12} />
                <span className="text-xs">{album}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Search and View Controls */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20"
              />
              <input
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded ${view === "grid" ? "glass-crimson text-primary" : "text-white/30 hover:text-white/60"}`}
              >
                <Grid3x3 size={13} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded ${view === "list" ? "glass-crimson text-primary" : "text-white/30 hover:text-white/60"}`}
              >
                <List size={13} />
              </button>
            </div>
          </div>

          {/* Media Display */}
          <div className="flex-1 glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
            {filteredMedia.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <ImageIcon size={20} className="text-white/15" />
                    <Film size={20} className="text-white/10" />
                    <FileText size={20} className="text-white/8" />
                  </div>
                  <div className="text-sm text-white/20">
                    No media uploaded yet
                  </div>
                  <div className="text-[10px] text-white/12 mt-1">
                    Upload images, videos, docs — smart albums auto-organize
                  </div>
                  <button
                    className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
                    onClick={() => document.getElementById("file-upload")?.click()}
                  >
                    <Upload size={11} />
                    UPLOAD FILES
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
                {view === "grid" ? (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
                    {filteredMedia.map((item) => (
                      <div
                        key={item.id}
                        className="group rounded-lg border border-white/8 bg-white/5 overflow-hidden hover:bg-white/10 transition-all"
                      >
                        <div className="relative h-48 flex items-center justify-center">
                          {getMediaIcon(item.type)}
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-display line-clamp-1">{item.name}</h3>
                            <div className="flex gap-1 text-xs text-white/40">
                              <span>{item.type}</span>
                              <span>{(item.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDownloadMedia(item)}
                              className="p-1 rounded hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleShareMedia(item)}
                              className="p-1 rounded hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all"
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteMedia(item.id)}
                              className="p-1 rounded hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMedia.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-white/8 bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <div className="flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-lg bg-white/10">
                          {getMediaIcon(item.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-display">{item.name}</h3>
                            <div className="flex gap-2 text-xs text-white/40">
                              <span>{item.type}</span>
                              <span>{(item.size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>
                          <p className="text-xs text-white/30 line-clamp-2">
                            Album: {item.album}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => handleDownloadMedia(item)}
                              className="p-1 rounded hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleShareMedia(item)}
                              className="p-1 rounded hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all"
                            >
                              <ExternalLink size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteMedia(item.id)}
                              className="p-1 rounded hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}