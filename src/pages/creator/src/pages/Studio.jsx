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

import React, { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

import { motion, AnimatePresence } from "framer-motion";
import {
  Image,
  Video,
  Music,
  Sparkles,
  Film,
  FolderOpen,
  Folder,
  Brain,
  Fingerprint,
  ArrowUp,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useCreativeMemory } from "@/hooks/useCreativeMemory";
import ChatBubble from "@/components/studio/ChatBubble";
import TemplateChips from "@/components/studio/TemplateChips";
import LiquidLoader from "@/components/studio/LiquidLoader";
import GenerationOutput from "@/components/studio/GenerationOutput";
import FileUploader from "@/components/studio/FileUploader";
import MultiFileUploader from "@/components/studio/MultiFileUploader";
import { Label } from "@/components/ui/label";

const tools = [
  {
    id: "text_to_image",
    icon: Image,
    label: "Image",
    prompt: "Generate an image of ",
  },
  {
    id: "image_edit",
    icon: Sparkles,
    label: "Edit",
    prompt: "Edit this image: ",
  },
  {
    id: "image_to_video",
    icon: Video,
    label: "Video",
    prompt: "Create a video of ",
  },
  {
    id: "music_video",
    icon: Music,
    label: "Music Video",
    prompt: "Create a music video: ",
  },
  {
    id: "storyboard_to_video",
    icon: Film,
    label: "Storyboard",
    prompt: "Create a storyboard video: ",
  },
];

const typeLabels = {
  text_to_image: "Text to Image",
  image_edit: "Image Edit",
  image_to_video: "Image to Video",
  music_video: "Music Video",
  storyboard_to_video: "Storyboard to Video",
};

const IDENTITY_LOCK_PROMPT = `\n\nIDENTITY LOCK — ACTIVE: You MUST preserve the exact identity of all subjects. Keep identical facial features, face shape, skin tone, eye color, hair, body type, clothing, and distinctive visual traits. Do NOT alter, age, swap, or reimagine any person's appearance. The output must be recognizably the same person/subject with only the requested transformation applied. Treat the reference image as a strict identity anchor — every detail of the face and key visual traits must remain unchanged.`;

export default function Studio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProject, setSelectedProject] = useState(
    searchParams.get("project") || null,
  );
  const {
    recentCreations,
    isLoading: memLoading,
    buildMemoryContext,
    getRecentImageUrls,
  } = useCreativeMemory(selectedProject);
  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => db.entities.Project.list("-created_date", 100),
    initialData: [],
  });

  const [mode, setMode] = useState("text_to_image");
  const [prompt, setPrompt] = useState("");
  const [useMemory, setUseMemory] = useState(true);
  const [identityLock, setIdentityLock] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showUpload, setShowUpload] = useState(false);
  const [messages, setMessages] = useState([]);
  const [output, setOutput] = useState(null);
  const [outputType, setOutputType] = useState("image");

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, output]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const memoryContext = useMemory ? buildMemoryContext() : "";
      const recentImages = useMemory ? getRecentImageUrls() : [];
      const finalPrompt = prompt;
      let resultUrl = "";
      let resultType = "image";
      let styleNotes = "";
      let title = finalPrompt.slice(0, 50);

      switch (mode) {
        case "text_to_image": {
          let fullPrompt = memoryContext
            ? `${memoryContext}\n\nNow generate:\n${finalPrompt}`
            : finalPrompt;
          const { url } = await db.integrations.Core.GenerateImage({
            prompt: fullPrompt,
            existing_image_urls:
              recentImages.length > 0 ? recentImages : undefined,
          });
          resultUrl = url;
          resultType = "image";
          const notes = await db.integrations.Core.InvokeLLM({
            prompt: `Extract style summary (max 20 words) from: "${finalPrompt}"`,
          });
          styleNotes = notes;
          break;
        }
        case "image_edit": {
          const refs = [...uploadedFiles, ...recentImages];
          let fullPrompt = memoryContext ? `${memoryContext}\n\n` : "";
          fullPrompt +=
            uploadedFiles.length > 0
              ? `Edit the uploaded image(s) with: ${finalPrompt}`
              : finalPrompt;
          if (identityLock && uploadedFiles.length > 0)
            fullPrompt += IDENTITY_LOCK_PROMPT;
          const { url } = await db.integrations.Core.GenerateImage({
            prompt: fullPrompt,
            existing_image_urls: refs.length > 0 ? refs : undefined,
          });
          resultUrl = url;
          resultType = "image";
          const notes = await db.integrations.Core.InvokeLLM({
            prompt: `Extract style summary from: "${finalPrompt}"`,
          });
          styleNotes = notes;
          break;
        }
        case "image_to_video": {
          let fullPrompt = memoryContext ? `${memoryContext}\n\n` : "";
          let fileUrls = [];

          if (uploadedFiles.length > 0) {
            fileUrls = uploadedFiles;
            const imageDesc = await db.integrations.Core.InvokeLLM({
              prompt:
                "Describe this image in vivid detail — subject, colors, lighting, mood, composition.",
              file_urls: uploadedFiles.slice(0, 1),
            });
            fullPrompt += `Based on this reference image: ${imageDesc}\n\n`;
            fullPrompt += `Create a video that faithfully preserves the exact appearance, face, features, colors, and composition of the reference image. Details: ${finalPrompt}\n\n`;
            fullPrompt += `CRITICAL: Keep the same person/character — same face, same features, same clothing — do NOT change their appearance. Only animate the existing scene.`;
            if (identityLock) fullPrompt += IDENTITY_LOCK_PROMPT;
          } else {
            fullPrompt += finalPrompt;
          }

          const { url } = await db.integrations.Core.GenerateVideo({
            prompt: fullPrompt,
            duration: 6,
          });
          resultUrl = url;
          resultType = "video";
          const notes = await db.integrations.Core.InvokeLLM({
            prompt: `Extract style summary from: "${finalPrompt}"`,
          });
          styleNotes = notes;
          break;
        }
        case "music_video": {
          let fullPrompt = memoryContext ? `${memoryContext}\n\n` : "";
          if (uploadedFiles.length > 0) {
            const transcript = await db.integrations.Core.TranscribeAudio({
              audio_url: uploadedFiles[0],
            });
            const analysis = await db.integrations.Core.InvokeLLM({
              prompt: `Analyze these lyrics and suggest a music video concept in 2-3 sentences: "${transcript}"`,
            });
            fullPrompt += `Music video concept: ${analysis}\n\nVisual direction: ${finalPrompt}`;
          } else {
            fullPrompt += finalPrompt;
          }
          const { url } = await db.integrations.Core.GenerateVideo({
            prompt: fullPrompt,
            duration: 8,
          });
          resultUrl = url;
          resultType = "video";
          const notes = await db.integrations.Core.InvokeLLM({
            prompt: `Extract style summary from: "${finalPrompt}"`,
          });
          styleNotes = notes;
          break;
        }
        case "storyboard_to_video": {
          let fullPrompt = memoryContext ? `${memoryContext}\n\n` : "";
          let descriptions = [];
          if (uploadedFiles.length > 0) {
            descriptions = await Promise.all(
              uploadedFiles.map((url, i) =>
                db.integrations.Core.InvokeLLM({
                  prompt: `Frame ${i + 1}: Describe exact visual details — subject, faces, colors, composition, mood. Be precise about appearances.`,
                  file_urls: [url],
                }),
              ),
            );
            fullPrompt += `Reference frames:\n${descriptions.map((d, i) => `Frame ${i + 1}: ${d}`).join("\n")}\n\n`;
            fullPrompt += `CRITICAL: Preserve the exact appearance, faces, and features from the reference frames. Same people, same look. Detail: ${finalPrompt}`;
            if (identityLock) fullPrompt += IDENTITY_LOCK_PROMPT;
          } else {
            fullPrompt += finalPrompt;
          }
          const { url } = await db.integrations.Core.GenerateVideo({
            prompt: fullPrompt,
            duration: 6,
          });
          resultUrl = url;
          resultType = "video";
          const notes = await db.integrations.Core.InvokeLLM({
            prompt: `Extract style summary from: "${finalPrompt}"`,
          });
          styleNotes = notes;
          break;
        }
      }

      // Save to memory
      await db.entities.Creation.create({
        title,
        type: mode,
        prompt: finalPrompt,
        input_file_url: uploadedFiles[0] || "",
        input_file_urls:
          uploadedFiles.length > 1 ? JSON.stringify(uploadedFiles) : "",
        output_url: resultUrl,
        output_type: resultType,
        style_notes: styleNotes,
        memory_context: memoryContext.slice(0, 500),
        project_id: selectedProject || "",
      });

      queryClient.invalidateQueries({ queryKey: ["creations-memory"] });
      return { url: resultUrl, type: resultType };
    },
    onSuccess: (data) => {
      setOutput(data.url);
      setOutputType(data.type);
      setShowUpload(false);
      setUploadedFiles([]);
    },
  });

  const handleSend = () => {
    if (!prompt.trim() || generateMutation.isPending) return;

    setMessages((prev) => [...prev, { role: "user", content: prompt, mode }]);
    setOutput(null);
    generateMutation.mutate();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    setPrompt((prev) =>
      prev ? `${prev} — ${template.prompt}` : template.prompt,
    );
  };

  const switchTool = (toolId) => {
    setMode(toolId);
    setPrompt("");
    setOutput(null);
    setUploadedFiles([]);
    setShowUpload(false);
    setMessages([]);
  };

  const needsUpload =
    mode === "image_edit" ||
    mode === "image_to_video" ||
    mode === "music_video" ||
    mode === "storyboard_to_video";
  const isMultiUpload = mode === "storyboard_to_video";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading text-base font-bold tracking-tight">
              {typeLabels[mode]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/projects")}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <Folder className="w-3.5 h-3.5" /> Projects
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/gallery")}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Gallery
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/tools")}
              className="text-xs text-muted-foreground"
            >
              All Tools
            </Button>
          </div>
        </div>
      </header>

      {/* Memory bar */}
      <div className="border-b border-border/20 bg-secondary/10">
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-3">
          <Brain
            className={`w-3.5 h-3.5 ${useMemory ? "text-primary" : "text-muted-foreground"}`}
          />
          <span className="text-xs text-muted-foreground flex-1">
            Creative Memory — {recentCreations.length} recent creation
            {recentCreations.length !== 1 ? "s" : ""} influencing style
          </span>
          <Select
            value={selectedProject || "none"}
            onValueChange={(v) => {
              setSelectedProject(v === "none" ? null : v);
              if (v === "none") setSearchParams({});
              else setSearchParams({ project: v });
            }}
          >
            <SelectTrigger className="h-7 w-auto text-xs gap-1.5 border-border/40 bg-secondary/40">
              <Folder className="w-3 h-3" />
              <SelectValue placeholder="No project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(mode === "image_edit" ||
            mode === "image_to_video" ||
            mode === "storyboard_to_video") && (
            <button
              onClick={() => setIdentityLock(!identityLock)}
              className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium border transition-colors ${
                identityLock
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "bg-secondary/40 text-muted-foreground border-border/40 hover:text-foreground"
              }`}
              title="Identity Lock — preserve facial features and key visual traits during transformation"
            >
              <Fingerprint className="w-3 h-3" />
              Identity Lock
            </button>
          )}
          <Switch
            checked={useMemory}
            onCheckedChange={setUseMemory}
            className="data-[state=checked]:bg-primary scale-75"
          />
        </div>
        {recentCreations.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
            {recentCreations.slice(0, 5).map((c, i) => (
              <div
                key={c.id}
                className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-border/30 bg-secondary/40"
              >
                {c.output_type === "image" ? (
                  <img
                    src={c.output_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Video className="w-full h-full p-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto py-6 space-y-5">
          {messages.length === 0 && !generateMutation.isPending && (
            <div className="text-center py-12 space-y-1">
              <h2 className="font-heading text-lg font-semibold">
                {typeLabels[mode]}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "text_to_image" &&
                  "Describe the image you want to create"}
                {mode === "image_edit" &&
                  "Upload an image and describe the edit"}
                {mode === "image_to_video" &&
                  "Upload an image and describe the motion"}
                {mode === "music_video" &&
                  "Upload a song and describe the visuals"}
                {mode === "storyboard_to_video" &&
                  "Upload reference frames and describe the video"}
              </p>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                message={msg.content}
                isUser={msg.role === "user"}
              />
            ))}
          </AnimatePresence>

          {generateMutation.isPending && (
            <LiquidLoader label="Creating your vision..." />
          )}

          {output && !generateMutation.isPending && (
            <ChatBubble message="">
              <GenerationOutput
                outputUrl={output}
                outputType={outputType}
                onRegenerate={() => generateMutation.mutate()}
                isRegenerating={generateMutation.isPending}
              />
            </ChatBubble>
          )}

          <div ref={scrollRef} />
        </div>
      </div>

      {/* Upload section */}
      {needsUpload && (
        <div className="max-w-3xl mx-auto px-4 pb-2">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={`text-xs transition-colors mb-1.5 ${uploadedFiles.length > 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {showUpload
              ? "Hide upload"
              : uploadedFiles.length > 0
                ? `${uploadedFiles.length} file(s) attached`
                : "+ Attach files"}
          </button>
          {showUpload && (
            <div className="pb-2">
              {isMultiUpload ? (
                <MultiFileUploader
                  accept="image/*"
                  label="Upload reference images"
                  onUpload={setUploadedFiles}
                  maxFiles={8}
                />
              ) : (
                <FileUploader
                  accept={
                    mode === "music_video"
                      ? "audio/*,.mp3,.wav,.ogg,.m4a"
                      : "image/*"
                  }
                  label={
                    mode === "music_video" ? "Upload a song" : "Upload an image"
                  }
                  onUpload={(url) =>
                    url ? setUploadedFiles([url]) : setUploadedFiles([])
                  }
                  previewType={mode === "music_video" ? "audio" : "image"}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Templates - right above input */}
      <div className="max-w-3xl mx-auto px-4 pb-1">
        <TemplateChips
          onSelect={handleTemplateSelect}
          selected={selectedTemplate}
        />
      </div>

      {/* Input area + quick actions */}
      <div className="border-t border-border/30 bg-card/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end bg-secondary/40 rounded-2xl border border-border/30 px-3 py-2 focus-within:border-primary/40 transition-colors">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "text_to_image"
                  ? "Describe your image..."
                  : mode === "image_edit"
                    ? "Describe the edit..."
                    : mode === "image_to_video"
                      ? "Describe the motion and camera movement..."
                      : mode === "music_video"
                        ? "Describe the music video visuals..."
                        : "Describe the video sequence..."
              }
              rows={1}
              className="border-0 bg-transparent resize-none min-h-[40px] max-h-[120px] text-sm focus-visible:ring-0 focus-visible:ring-offset-0 px-1 py-2"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!prompt.trim() || generateMutation.isPending}
              className="rounded-xl w-9 h-9 bg-primary hover:bg-primary/90 flex-shrink-0"
            >
              <ArrowUp className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick-action mode buttons */}
          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => switchTool(tool.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 border ${
                  mode === tool.id
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50 border-border/30"
                }`}
              >
                <tool.icon className="w-3.5 h-3.5" />
                {tool.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
