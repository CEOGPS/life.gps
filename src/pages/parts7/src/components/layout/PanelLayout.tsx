import { motion } from "motion/react";
import type { ReactNode } from "react";

type PanelLayoutProps = {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PanelLayout({ title, subtitle, icon, actions, children }: PanelLayoutProps) {
  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Panel header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 shrink-0"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.55 0.22 20 / 15%)", border: "1px solid oklch(0.55 0.22 20 / 30%)", boxShadow: "0 0 12px oklch(0.55 0.22 20 / 30%)" }}
        >
          <span className="text-primary">{icon}</span>
        </div>
        <div>
          <h1
            className="font-display text-sm tracking-[0.14em]"
            style={{ color: "oklch(0.65 0.22 20)", textShadow: "0 0 12px oklch(0.55 0.22 20 / 70%)" }}
          >
            {title}
          </h1>
          {subtitle && <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.75 0.15 175)" }}>{subtitle}</p>}
        </div>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </motion.div>

      {/* Content — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
