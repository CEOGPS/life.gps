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

import { ArrowLeft, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreativeMemory } from "@/hooks/useCreativeMemory";
import PromptInput from "@/components/studio/PromptInput";
import MemoryToggle from "@/components/studio/MemoryToggle";
import GenerationOutput from "@/components/studio/GenerationOutput";
import MemoryStrip from "@/components/studio/MemoryStrip";

export default function TextToImage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    recentCreations,
    isLoading: memLoading,
    buildMemoryContext,
    getRecentImageUrls,
  } = useCreativeMemory();

  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [useMemory, setUseMemory] = useState(true);
  const [output, setOutput] = useState(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const memoryContext = useMemory ? buildMemoryContext() : "";
      const recentImages = useMemory ? getRecentImageUrls() : [];

      const fullPrompt = memoryContext
        ? `${memoryContext}\n\nNow generate this:\n${prompt}`
        : prompt;

      const { url } = await db.integrations.Core.GenerateImage({
        prompt: fullPrompt,
        existing_image_urls: recentImages.length > 0 ? recentImages : undefined,
      });

      // Extract style notes
      const styleNotes = await db.integrations.Core.InvokeLLM({
        prompt: `Analyze this image generation prompt and extract a brief style summary (max 30 words) covering: color palette, art style, mood, composition. Prompt: "${prompt}"`,
      });

      await db.entities.Creation.create({
        title: title || prompt.slice(0, 50),
        type: "text_to_image",
        prompt,
        output_url: url,
        output_type: "image",
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
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Image className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">Text to Image</h1>
              <p className="text-sm text-muted-foreground">
                Create images from your imagination
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
            <Label>Title (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name this creation..."
              className="bg-secondary/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label>Prompt</Label>
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={() => generateMutation.mutate()}
              isGenerating={generateMutation.isPending}
              placeholder="A surreal underwater city with bioluminescent architecture, cinematic lighting, ultra detailed..."
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

        {output && (
          <GenerationOutput
            outputUrl={output}
            outputType="image"
            onRegenerate={() => generateMutation.mutate()}
            isRegenerating={generateMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
