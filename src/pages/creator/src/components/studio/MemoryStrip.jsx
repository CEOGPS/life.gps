import React from "react";
import { motion } from "framer-motion";
import { Clock, Image, Video, Sparkles } from "lucide-react";
import { format } from "date-fns";

const typeIcons = {
  text_to_image: Image,
  image_edit: Sparkles,
  image_to_video: Video,
  music_video: Video,
};

const typeLabels = {
  text_to_image: "Text → Image",
  image_edit: "Image Edit",
  image_to_video: "Image → Video",
  music_video: "Music Video",
};

export default function MemoryStrip({ creations = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="w-20 h-20 rounded-xl bg-secondary animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    );
  }

  if (creations.length === 0) {
    return (
      <div className="flex items-center gap-3 py-4 px-5 rounded-xl bg-secondary/50 border border-border/50">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Your creative memory is empty. Start creating to build style
          consistency.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {creations.map((creation, i) => {
        const Icon = typeIcons[creation.type] || Image;
        return (
          <motion.div
            key={creation.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="relative flex-shrink-0 group"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-border/50 bg-secondary cursor-pointer transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10">
              {creation.output_type === "image" && creation.output_url ? (
                <img
                  src={creation.output_url}
                  alt={creation.title || "Creation"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary/90 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">
                {i + 1}
              </span>
            </div>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 flex flex-col items-center justify-center p-1">
              <span className="text-[9px] text-white/90 font-medium text-center leading-tight">
                {typeLabels[creation.type]}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
