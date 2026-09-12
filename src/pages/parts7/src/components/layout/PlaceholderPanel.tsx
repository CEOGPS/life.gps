import { motion } from "motion/react";
import { Construction } from "lucide-react";

type Props = {
  name: string;
  description?: string;
};

export default function PlaceholderPanel({ name, description }: Props) {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-12 text-center max-w-md border border-white/8"
      >
        <div className="w-16 h-16 rounded-full glass-crimson flex items-center justify-center mx-auto mb-6 glow-crimson">
          <Construction size={28} className="text-primary" />
        </div>
        <h2 className="font-display text-lg text-white/80 tracking-wider mb-2">{name}</h2>
        <p className="text-sm text-white/30 leading-relaxed">
          {description ?? "This panel is ready to be wired with integrations and live data."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary/60 blink" />
          <span className="text-[10px] text-primary/60 font-display tracking-widest">COMING ONLINE</span>
        </div>
      </motion.div>
    </div>
  );
}
