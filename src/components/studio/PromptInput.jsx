import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function PromptInput({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  buttonLabel = "Generate",
  placeholder = "Describe what you want to create...",
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating) onGenerate();
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={4}
        className="bg-secondary/50 border-border/50 resize-none text-sm focus:border-primary/50 focus:ring-primary/20"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          ⌘ + Enter to generate
        </span>
        <Button
          onClick={onGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="gap-2 bg-primary hover:bg-primary/90"
        >
          {isGenerating ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {isGenerating ? "Creating..." : buttonLabel}
        </Button>
      </div>
    </div>
  );
}
