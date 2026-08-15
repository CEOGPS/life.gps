import React from "react";
import { motion } from "framer-motion";

const templates = [
  {
    id: "cinematic",
    label: "Cinematic",
    icon: "🎬",
    prompt:
      "Cinematic wide shot, dramatic lighting, film grain, 35mm lens, shallow depth of field",
  },
  {
    id: "anime",
    label: "Anime",
    icon: "🎨",
    prompt:
      "Anime art style, vibrant colors, cel-shaded, clean linework, Japanese animation aesthetic",
  },
  {
    id: "realistic",
    label: "Photoreal",
    icon: "📸",
    prompt:
      "Photorealistic, ultra-detailed, natural lighting, 8K resolution, hyper-realistic textures",
  },
  {
    id: "watercolor",
    label: "Watercolor",
    icon: "🖌️",
    prompt:
      "Soft watercolor painting, flowing brush strokes, pastel tones, dreamy atmosphere on textured paper",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    icon: "🌃",
    prompt:
      "Cyberpunk aesthetic, neon lights, rain-soaked streets, high contrast, blue and magenta color palette",
  },
  {
    id: "3d_render",
    label: "3D Render",
    icon: "💎",
    prompt:
      "3D rendered, octane render, unreal engine, cinematic volumetric lighting, ray tracing",
  },
  {
    id: "vintage",
    label: "Vintage",
    icon: "📷",
    prompt:
      "Vintage film look, 1970s Kodachrome, warm tones, slight grain, soft focus, nostalgic mood",
  },
  {
    id: "fantasy",
    label: "Fantasy",
    icon: "🏰",
    prompt:
      "Fantasy art, magical atmosphere, epic scale, glowing elements, ethereal lighting, detailed environment",
  },
];

export default function TemplateChips({ onSelect, selected }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {templates.map((t) => (
        <motion.button
          key={t.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(t)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
            selected === t.id
              ? "bg-primary/20 text-primary border border-primary/40"
              : "bg-secondary/60 text-muted-foreground border border-border/30 hover:border-border/60 hover:text-foreground"
          }`}
        >
          <span className="text-sm">{t.icon}</span>
          {t.label}
        </motion.button>
      ))}
    </div>
  );
}
