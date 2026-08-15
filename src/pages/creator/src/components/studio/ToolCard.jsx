import React from "react";
import { motion } from "framer-motion";

export default function ToolCard({
  icon: Icon,
  title,
  description,
  gradient,
  onClick,
  delay = 0,
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 text-left transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
    >
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient}`}
      />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors duration-300">
          <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-300" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground group-hover:text-white transition-colors duration-300 mb-1">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground group-hover:text-white/70 transition-colors duration-300 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.button>
  );
}
