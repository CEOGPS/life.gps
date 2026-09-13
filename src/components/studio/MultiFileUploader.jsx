const db = globalThis.__B44_DB__ || {
  auth: { isAuthenticated: async () => false, me: async () => null },
  entities: new Proxy(
    {},
    {
      get: () => ({
        filter: async () => [],
        get: async () => null,
        create: async () => ({}),
        update: async () => ({}),
        delete: async () => ({}),
      }),
    },
  ),
  integrations: { Core: { UploadFile: async () => ({ file_url: "" }) } },
};

import React, { useCallback, useState } from "react";
import { Upload, X, FileImage, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function MultiFileUploader({
  accept = "image/*",
  label = "Upload images",
  onUpload,
  maxFiles = 8,
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFilesSelect = useCallback(
    async (e) => {
      const selected = Array.from(e.target.files);
      if (selected.length === 0) return;

      setUploading(true);

      const uploadResults = [];
      for (const file of selected) {
        const reader = new FileReader();
        const previewPromise = new Promise((resolve) => {
          reader.onload = (ev) =>
            resolve({ name: file.name, preview: ev.target.result });
          reader.readAsDataURL(file);
        });

        const { file_url } = await db.integrations.Core.UploadFile({ file });
        const previewData = await previewPromise;
        uploadResults.push({ ...previewData, url: file_url });
      }

      const updated = [...files, ...uploadResults].slice(0, maxFiles);
      setFiles(updated);
      onUpload(updated.map((f) => f.url));
      setUploading(false);
    },
    [files, maxFiles, onUpload],
  );

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onUpload(updated.length > 0 ? updated.map((f) => f.url) : null);
  };

  const clearAll = () => {
    setFiles([]);
    onUpload(null);
  };

  return (
    <div className="space-y-3">
      {files.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {files.map((file, i) => (
              <div
                key={i}
                className="relative group rounded-xl overflow-hidden border border-border/50 bg-secondary/30 aspect-square"
              >
                <img
                  src={file.preview}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-start justify-end p-1">
                  <button
                    onClick={() => removeFile(i)}
                    className="w-6 h-6 rounded-full bg-black/60 hover:bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
              </div>
            ))}
            {files.length < maxFiles && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-border/50 hover:border-primary/50 bg-secondary/20 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept={accept}
                  onChange={handleFilesSelect}
                  className="hidden"
                  multiple
                />
                <Plus className="w-5 h-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Add more
                </span>
              </label>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {files.length}/{maxFiles} images uploaded
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs h-7 text-muted-foreground"
            >
              Clear all
            </Button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-border/70 hover:border-primary/50 bg-secondary/30 cursor-pointer transition-colors duration-300">
          <input
            type="file"
            accept={accept}
            onChange={handleFilesSelect}
            className="hidden"
            multiple
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">
                Uploading...
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <FileImage
                    key={i}
                    className="w-6 h-6 text-muted-foreground"
                    style={{ opacity: 0.4 + i * 0.25 }}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{label}</span>
              <span className="text-xs text-muted-foreground/60">
                Supports multiple files ({maxFiles} max)
              </span>
            </div>
          )}
        </label>
      )}
    </div>
  );
}
