import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Image,
  Sparkles,
  Video,
  Music,
  FolderOpen,
  Brain,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCreativeMemory } from "@/hooks/useCreativeMemory";
import ToolCard from "@/components/studio/ToolCard";
import MemoryStrip from "@/components/studio/MemoryStrip";

const tools = [
  {
    id: "studio",
    icon: Sparkles,
    title: "AI Studio (Chat)",
    description:
      "Chat-based studio — create images, videos, and music visuals with templates and creative memory.",
    gradient: "from-purple-600/20 to-fuchsia-800/20",
    path: "/studio",
  },
  {
    id: "text-to-image",
    icon: Image,
    title: "Text to Image",
    description: "Generate stunning images from text descriptions with AI.",
    gradient: "from-purple-600/20 to-violet-800/20",
    path: "/text-to-image",
  },
  {
    id: "image-edit",
    icon: Sparkles,
    title: "Image Edit",
    description: "Upload an image and transform it, or create new variations.",
    gradient: "from-fuchsia-600/20 to-pink-800/20",
    path: "/image-edit",
  },
  {
    id: "image-to-video",
    icon: Video,
    title: "Image to Video",
    description: "Bring still images to life with cinematic motion.",
    gradient: "from-blue-600/20 to-cyan-800/20",
    path: "/image-to-video",
  },
  {
    id: "music-video",
    icon: Music,
    title: "Music Video",
    description: "Upload a song and generate matching visual scenes.",
    gradient: "from-rose-600/20 to-orange-800/20",
    path: "/music-video",
  },
  {
    id: "storyboard-to-video",
    icon: Film,
    title: "Storyboard to Video",
    description: "Upload a series of images as reference frames for a video.",
    gradient: "from-amber-600/20 to-yellow-800/20",
    path: "/storyboard-to-video",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { recentCreations, isLoading } = useCreativeMemory();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight">
              Studio
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5 mr-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Chat Studio
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/gallery")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Gallery</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-14 space-y-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
            Create with
            <span className="bg-gradient-to-r from-primary via-accent to-chart-4 bg-clip-text text-transparent">
              {" "}
              AI Memory
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
            Generate images, videos, and music visuals — powered by creative
            memory that keeps your style consistent across creations.
          </p>
        </motion.div>

        {/* Memory Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              Creative Memory — Last {recentCreations.length} creation
              {recentCreations.length !== 1 ? "s" : ""}
            </Label>
          </div>
          <MemoryStrip creations={recentCreations} isLoading={isLoading} />
        </motion.div>

        {/* Tools Grid */}
        <div className="space-y-4">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Tools
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, i) => (
              <ToolCard
                key={tool.id}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
                gradient={tool.gradient}
                onClick={() => navigate(tool.path)}
                delay={0.15 + i * 0.05}
              />
            ))}
          </div>
        </div>

        {/* Quick Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-border/30 bg-secondary/20 p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Brain className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm mb-1">
                How Creative Memory Works
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every creation is stored in your memory. When you generate
                something new, the AI references your last 5 creations to
                maintain consistent colors, style, and mood — so extending clips
                or editing images stays visually coherent.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
