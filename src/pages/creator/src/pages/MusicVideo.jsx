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

import { ArrowLeft, Music } from "lucide-react";
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

export default function MusicVideo() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    recentCreations,
    isLoading: memLoading,
    buildMemoryContext,
  } = useCreativeMemory();

  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [duration, setDuration] = useState("8");
  const [useMemory, setUseMemory] = useState(true);
  const [output, setOutput] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const memoryContext = useMemory ? buildMemoryContext() : "";
      let fullPrompt = memoryContext ? `${memoryContext}\n\n` : "";

      // If audio uploaded, transcribe for context
      if (audioUrl) {
        const transcript = await db.integrations.Core.TranscribeAudio({
          audio_url: audioUrl,
        });

        const songAnalysis = await db.integrations.Core.InvokeLLM({
          prompt: `Analyze these song lyrics and suggest a music video visual concept in 2-3 sentences. Describe mood, colors, scenes, and visual style. Lyrics: "${transcript}"`,
        });

        fullPrompt += `Create a cinematic music video scene. Song analysis: ${songAnalysis}\n\nVisual direction from user: ${prompt}`;
      } else {
        fullPrompt += `Create a cinematic music video scene: ${prompt}`;
      }

      const { url } = await db.integrations.Core.GenerateVideo({
        prompt: fullPrompt,
        duration: parseInt(duration),
      });

      const styleNotes = await db.integrations.Core.InvokeLLM({
        prompt: `Extract a brief visual style summary (max 30 words) from this music video prompt: "${prompt}"`,
      });

      await db.entities.Creation.create({
        title: title || `Music Video: ${prompt.slice(0, 40)}`,
        type: "music_video",
        prompt,
        input_file_url: audioUrl || "",
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
            <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
              <Music className="w-5 h-5 text-chart-4" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">Music Video</h1>
              <p className="text-sm text-muted-foreground">
                Upload a song, generate matching visuals
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
            <Label>Song File (optional)</Label>
            <FileUploader
              accept="audio/*,.mp3,.wav,.ogg,.m4a"
              label="Upload a song to visualize"
              onUpload={setAudioUrl}
              previewType="audio"
            />
            <p className="text-xs text-muted-foreground">
              We'll transcribe lyrics to influence the visual style.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Name this music video..."
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Clip Duration</Label>
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
            <Label>Visual Direction</Label>
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={() => generateMutation.mutate()}
              isGenerating={generateMutation.isPending}
              buttonLabel="Generate Music Video"
              placeholder="Neon-lit city at night, a silhouette walking through rain, cinematic slow-motion, moody purple lighting..."
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
          <LiquidLoader label="Composing your music video..." />
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
