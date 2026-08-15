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

import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreativeMemory } from "@/hooks/useCreativeMemory";
import PromptInput from "@/components/studio/PromptInput";
import MemoryToggle from "@/components/studio/MemoryToggle";
import GenerationOutput from "@/components/studio/GenerationOutput";
import FileUploader from "@/components/studio/FileUploader";
import MemoryStrip from "@/components/studio/MemoryStrip";

export default function ImageEdit() {
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
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [useMemory, setUseMemory] = useState(true);
  const [output, setOutput] = useState(null);

  const editMutation = useMutation({
    mutationFn: async () => {
      const memoryContext = useMemory ? buildMemoryContext() : "";
      const referenceImages = [];

      if (uploadedUrl) referenceImages.push(uploadedUrl);
      if (useMemory) referenceImages.push(...getRecentImageUrls());

      const fullPrompt = uploadedUrl
        ? `${memoryContext ? memoryContext + "\n\n" : ""}Edit the provided image with these instructions: ${prompt}`
        : `${memoryContext ? memoryContext + "\n\n" : ""}${prompt}`;

      const { url } = await db.integrations.Core.GenerateImage({
        prompt: fullPrompt,
        existing_image_urls:
          referenceImages.length > 0 ? referenceImages : undefined,
      });

      const styleNotes = await db.integrations.Core.InvokeLLM({
        prompt: `Analyze this image edit prompt and extract a brief style summary (max 30 words): "${prompt}"`,
      });

      await db.entities.Creation.create({
        title: title || `Edit: ${prompt.slice(0, 40)}`,
        type: "image_edit",
        prompt,
        input_file_url: uploadedUrl || "",
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
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold">Image Edit</h1>
              <p className="text-sm text-muted-foreground">
                Upload and transform, or create from text
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
              label="Upload an image to edit"
              onUpload={setUploadedUrl}
              previewType="image"
            />
          </div>

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
            <Label>Edit Instructions</Label>
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onGenerate={() => editMutation.mutate()}
              isGenerating={editMutation.isPending}
              buttonLabel="Apply Edit"
              placeholder="Make it look like a watercolor painting with warm sunset tones..."
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
            onRegenerate={() => editMutation.mutate()}
            isRegenerating={editMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
