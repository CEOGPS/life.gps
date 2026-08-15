import React from "react";
import { motion } from "framer-motion";

export default function LiquidLoader({ label = "Generating..." }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 py-16"
    >
      <div className="relative w-20 h-20">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 0, 0.5],
            borderRadius: [
              "60% 40% 30% 70% / 60% 30% 70% 40%",
              "30% 60% 70% 40% / 50% 60% 30% 60%",
              "60% 40% 30% 70% / 60% 30% 70% 40%",
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-1 rounded-full bg-accent/30"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 0, 0.5],
            borderRadius: [
              "40% 60% 70% 30% / 30% 50% 60% 70%",
              "60% 30% 40% 70% / 70% 40% 50% 30%",
              "40% 60% 70% 30% / 30% 50% 60% 70%",
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.3,
          }}
        />
        <motion.div
          className="absolute inset-2 rounded-full bg-chart-3/30"
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.6, 0.1, 0.6],
            borderRadius: [
              "50% 50% 50% 50% / 50% 50% 50% 50%",
              "35% 65% 45% 55% / 55% 45% 65% 35%",
              "50% 50% 50% 50% / 50% 50% 50% 50%",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.6,
          }}
        />
        <motion.div
          className="absolute inset-3 rounded-full bg-primary/50"
          animate={{
            scale: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-sm text-muted-foreground font-medium"
      >
        {label}
      </motion.p>
    </motion.div>
  );
}
