import { useRef, useState } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { usePersistentState } from "@/lib/usePersistentState.ts";

export default function BannerArea() {
  const [bannerSrc, setBannerSrc] = usePersistentState<string | null>(
    "banner_src",
    null,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    // Downscale + compress so the persisted data URL stays well within
    // localStorage limits, then persist so it survives reloads.
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1920;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setBannerSrc(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  };

  return (
    <div
      className={`relative h-28 shrink-0 overflow-hidden border-b border-white/5 transition-all duration-300 cursor-pointer group
        ${dragging ? "border-primary/60 bg-primary/5" : ""}
      `}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      title="Click or drag to upload banner"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      {bannerSrc ? (
        <>
          <img
            src={bannerSrc}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Upload size={16} className="text-white/70" />
            <span className="text-xs text-white/70 font-display tracking-wider">
              CHANGE BANNER
            </span>
          </div>
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent" />
        </>
      ) : (
        <div className="w-full h-full grid-bg flex items-center justify-center gap-3 group-hover:bg-white/2 transition-colors">
          {/* Crimson gradient stripe */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <ImageIcon size={18} className="text-white/15" />
          <span className="text-xs text-white/20 font-display tracking-[0.2em]">
            UPLOAD BANNER IMAGE
          </span>
          <Upload size={14} className="text-white/15" />
        </div>
      )}
    </div>
  );
}
