import type { ReactNode } from "react";
import { motion } from "motion/react";
import { useModuleTilt } from "@/hooks/use-module-tilt.ts";

type ModuleProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
  accent?: boolean;
};

export default function Module({ title, icon, children, className = "", headerRight, accent }: ModuleProps) {
  const { ref, onMouseMove, onMouseLeave } = useModuleTilt();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`module-card flex flex-col overflow-hidden ${className}`}
      style={{ willChange: "transform" }}
    >
      {/* Module header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0
        ${accent ? "border-primary/25 bg-primary/6" : "border-white/6"}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          <span
            className="font-display text-[10px] tracking-[0.2em] uppercase"
            style={{ color: "oklch(0.62 0.22 20)", textShadow: "0 0 10px oklch(0.55 0.22 20 / 70%)" }}
          >
            {title}
          </span>
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden p-4">
        {children}
      </div>
    </motion.div>
  );
}
