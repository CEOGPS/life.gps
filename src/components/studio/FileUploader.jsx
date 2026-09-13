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
import { Upload, X, FileImage, Music } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function FileUploader({
  accept = "image/*",
  label = "Upload file",
  onUpload,
  previewType = "image",
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      setFileName(file.name);

      if (previewType === "image" && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => setPreview(ev.target.result);
        reader.readAsDataURL(file);
      }

      const { file_url } = await db.integrations.Core.UploadFile({ file });
      onUpload(file_url);
      setUploading(false);
    },
    [onUpload, previewType],
  );

  const clear = () => {
    setPreview(null);
    setFileName("");
    onUpload(null);
  };

  const Icon = previewType === "audio" ? Music : FileImage;

  return (
    <div className="space-y-3">
      {!preview && !fileName ? (
        <label className="flex flex-col items-center justify-center w-full h-40 rounded-xl border-2 border-dashed border-border/70 hover:border-primary/50 bg-secondary/30 cursor-pointer transition-colors duration-300">
          <input
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
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
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          )}
        </label>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-border/50 bg-secondary/30">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-40 object-contain"
            />
          ) : (
            <div className="w-full h-24 flex items-center justify-center gap-3 px-4">
              <Icon className="w-8 h-8 text-primary" />
              <span className="text-sm text-foreground truncate">
                {fileName}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={clear}
            className="absolute top-2 right-2 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
