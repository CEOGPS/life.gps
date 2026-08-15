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

import { ArrowLeft, Video } from "lucide-react";
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
import FileUploader from "@/components/studio/FileUploader";
import MemoryStrip from "@/components/studio/MemoryStrip";
import LiquidLoader from "@/components/studio/LiquidLoader";

export default function ImageToVideo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    recentCreations,
    isLoading: memLoading,
    buildMemoryContext,
  } = useCreativeMemory();

  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [duration, setDuration] = useState("6");
  const [useMemory, setUseMemory] = useState(true);
  const [output, setOutput] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const memoryContext = useMemory ? buildMemoryContext() : "";

      let fullPrompt = memoryContext ? `${memoryContext}\n\n` : "";
      if (uploadedUrl) {
        const imageDesc = await db.integrations.Core.InvokeLLM({
          prompt:
            "Describe this image in extreme detail — every visual element: the subject's face, facial features, hair, skin tone, clothing, body type, lighting direction, background details, color palette, composition. Be specific about appearances that must be preserved.",
          file_urls: [uploadedUrl],
        });
        fullPrompt += `IMPORTANT: The video MUST faithfully preserve all visual details from this reference image description. Same person, same face, same features, same clothing, same colors, same composition.\n\nReference image details: ${imageDesc}\n\n`;
        fullPrompt += `CRITICAL: Do NOT change the person's appearance — same face, same hair, same clothing, same body. Only add natural motion.\n\nAdditional direction: ${prompt}`;
      } else {
        fullPrompt += prompt;
      }

      const { url } = await db.integrations.Core.GenerateVideo({
        prompt: fullPrompt,
        duration: parseInt(duration),
      });

      const styleNotes = await db.integrations.Core.InvokeLLM({
        prompt: `Extract a brief style summary (max 30 words) from this video prompt: "${prompt}"`,
      });

      await db.entities.Creation.create({
        title: title || `Video: ${prompt.slice(0, 40)}`,
        type: "image_to_video",
        prompt,
        input_file_url: uploadedUrl || "",
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
            <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-chart-3" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">Image to Video</h1>
              <p className="text-sm text-muted-foreground">
                Bring still images to life
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
            <Label>Source Image (optional)</Label>
            <FileUploader
              accept="image/*"
              label="Upload an image to animate"
              onUpload={setUploadedUrl}
              previewType="image"
            />
          </div>

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
            <Label>Motion Description</Label>
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={() => generateMutation.mutate()}
              isGenerating={generateMutation.isPending}
              buttonLabel="Generate Video"
              placeholder="Camera slowly zooms in as the character turns to face the viewer, particles floating in the air..."
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

        {generateMutation.isPending && !output && (
          <LiquidLoader label="Animating your image..." />
        )}

        {output && (
          <GenerationOutput
            outputUrl={output}
            outputType="video"
            onRegenerate={() => generateMutation.mutate()}
            isRegenerating={generateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
