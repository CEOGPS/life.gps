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

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ArrowLeft, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreativeMemory } from "@/hooks/useCreativeMemory";
import PromptInput from "@/components/studio/PromptInput";
import MemoryToggle from "@/components/studio/MemoryToggle";
import GenerationOutput from "@/components/studio/GenerationOutput";
import MultiFileUploader from "@/components/studio/MultiFileUploader";
import MemoryStrip from "@/components/studio/MemoryStrip";
import LiquidLoader from "@/components/studio/LiquidLoader";

export default function StoryboardToVideo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    recentCreations,
    isLoading: memLoading,
    buildMemoryContext,
  } = useCreativeMemory();

  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrls, setImageUrls] = useState([]);
  const [duration, setDuration] = useState("6");
  const [useMemory, setUseMemory] = useState(true);
  const [output, setOutput] = useState(null);
  const [imageAnalysis, setImageAnalysis] = useState("");

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      if (imageUrls.length === 0) return "";

      const descriptions = await Promise.all(
        imageUrls.map((url, i) =>
          db.integrations.Core.InvokeLLM({
            prompt: `Frame ${i + 1}: Describe every visual element in extreme detail — face features (eyes, nose, mouth shape, skin tone, expression), hair style/color, clothing, body type, lighting direction, background, color palette, mood. Be precise about all appearances that MUST be preserved.`,
            file_urls: [url],
          }),
        ),
      );

      const overview = await db.integrations.Core.InvokeLLM({
        prompt: `I have a storyboard of ${imageUrls.length} frames. Here are the descriptions:\n\n${descriptions.map((d, i) => `Frame ${i + 1}: ${d}`).join("\n\n")}\n\nWrite a 3-4 sentence visual summary describing the overall story arc, visual style, color palette, and mood that should carry through the video.`,
      });

      setImageAnalysis(overview);
      return overview;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const memoryContext = useMemory ? buildMemoryContext() : "";
      let overview = imageAnalysis;

      if (!overview && imageUrls.length > 0) {
        overview = await analyzeMutation.mutateAsync();
      }

      let fullPrompt = memoryContext ? `${memoryContext}\n\n` : "";
      fullPrompt += `CRITICAL: The video MUST faithfully preserve ALL appearances from the reference frames — same faces, same features, same clothing, same colors, same environments.\n\n`;

      if (overview) {
        fullPrompt += `Storyboard visual summary: ${overview}\n\n`;
      }

      if (prompt) {
        fullPrompt += `Additional direction: ${prompt}\n\n`;
      }

      fullPrompt += `Create a smooth cinematic sequence. Do NOT change any person's appearance. Preserve every visual detail exactly.`;

      const { url } = await db.integrations.Core.GenerateVideo({
        prompt: fullPrompt,
        duration: parseInt(duration),
      });

      const styleNotes = await db.integrations.Core.InvokeLLM({
        prompt: `Extract a brief visual style summary (max 30 words) from this video prompt: "${prompt || overview}"`,
      });

      await db.entities.Creation.create({
        title:
          title || `Storyboard: ${prompt.slice(0, 40) || "Multi-Image Video"}`,
        type: "storyboard_to_video",
        prompt,
        input_file_urls: JSON.stringify(imageUrls),
        output_url: url,
        output_type: "video",
        style_notes: styleNotes,
        memory_context: memoryContext.slice(0, 500),
      });

      queryClient.invalidateQueries({ queryKey: ["creations-memory"] });
      return url;
    },
    onSuccess: (url) => setOutput(url),
  });

  const handleGenerate = () => {
    if (imageUrls.length > 0 && !imageAnalysis) {
      analyzeMutation.mutate();
      // The generateMutation will be triggered after analysis
    }
    generateMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-chart-5/10 flex items-center justify-center">
              <Film className="w-5 h-5 text-chart-5" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">
                Storyboard to Video
              </h1>
              <p className="text-sm text-muted-foreground">
                Upload a series of images as reference frames
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Creative Memory
          </Label>
          <MemoryStrip creations={recentCreations} isLoading={memLoading} />
        </div>

        <div className="space-y-5 p-6 rounded-2xl bg-card border border-border/50">
          <div className="space-y-2">
            <Label>Reference Images</Label>
            <MultiFileUploader
              accept="image/*"
              label="Upload storyboard frames or reference images"
              onUpload={setImageUrls}
              maxFiles={8}
            />
            <p className="text-xs text-muted-foreground">
              Upload a sequence of images as visual references — like a
              storyboard. Each acts as a keyframe for the video.
            </p>
          </div>

          {imageAnalysis && (
            <div className="p-4 rounded-xl bg-secondary/30 border border-border/30">
              <Label className="text-xs text-muted-foreground mb-1 block">
                AI Analysis of Your Frames
              </Label>
              <p className="text-sm text-foreground leading-relaxed">
                {imageAnalysis}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name this video..."
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 seconds</SelectItem>
                  <SelectItem value="6">6 seconds</SelectItem>
                  <SelectItem value="8">8 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Video Description</Label>
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={handleGenerate}
              isGenerating={
                generateMutation.isPending || analyzeMutation.isPending
              }
              buttonLabel="Generate Video"
              placeholder="A smooth cinematic sequence flowing through the reference frames, with gentle camera movement and atmospheric transitions..."
            />
          </div>
        </div>

        <div className="px-6 pb-2">
          <MemoryToggle
            enabled={useMemory}
            onChange={setUseMemory}
            memoryCount={recentCreations.length}
          />
        </div>

        {(generateMutation.isPending || analyzeMutation.isPending) &&
          !output && (
            <LiquidLoader
              label={
                analyzeMutation.isPending
                  ? "Analyzing your reference frames..."
                  : "Bringing your storyboard to life..."
              }
            />
          )}

        {output && (
          <GenerationOutput
            outputUrl={output}
            outputType="video"
            onRegenerate={handleGenerate}
            isRegenerating={generateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
