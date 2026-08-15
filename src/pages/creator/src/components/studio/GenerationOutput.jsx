import React from "react";
import { motion } from "framer-motion";
import { Download, RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GenerationOutput({
  outputUrl,
  outputType,
  onRegenerate,
  isRegenerating,
}) {
  const [copied, setCopied] = React.useState(false);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = outputUrl;
    a.download = `creation.${outputType === "video" ? "mp4" : "png"}`;
    a.target = "_blank";
    a.click();
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(outputUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-4"
    >
      <div className="rounded-2xl overflow-hidden border border-border/50 bg-black/20">
        {outputType === "image" ? (
          <img
            src={outputUrl}
            alt="Generated"
            className="w-full max-h-[500px] object-contain"
          />
        ) : (
          <video src={outputUrl} controls className="w-full max-h-[500px]" />
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCopyUrl}
          className="gap-2"
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copied" : "Copy URL"}
        </Button>
        {onRegenerate && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRegenerating ? "animate-spin" : ""}`}
            />
            Regenerate
          </Button>
        )}
      </div>
    </motion.div>
  );
}
