import {
  Scale,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Plus,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const LEGAL_TOOLS = [
  {
    icon: <Scale size={14} />,
    label: "Legal Advice",
    desc: "AI-powered legal guidance",
  },
  {
    icon: <AlertTriangle size={14} />,
    label: "Rights Alerts",
    desc: "Warrant & record checks",
  },
  {
    icon: <FileText size={14} />,
    label: "Documents",
    desc: "Contracts, waivers, NDAs",
  },
  {
    icon: <ShieldCheck size={14} />,
    label: "Privacy Check",
    desc: "Data exposure scanner",
  },
];

export default function LegalPanel() {
  return (
    <PanelLayout
      title="Legal"
      subtitle="Legal tools, AI guidance, and document management"
      icon={<Scale size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Plus size={12} /> NEW DOCUMENT
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Legal tools grid */}
        <div className="grid grid-cols-2 gap-3">
          {LEGAL_TOOLS.map((t) => (
            <div
              key={t.label}
              className="glass rounded-xl p-4 border border-white/8 hover:border-primary/20 cursor-pointer transition-all group"
            >
              <span className="text-primary/70 mb-2.5 block">{t.icon}</span>
              <div className="text-xs text-white/80 font-medium mb-1">
                {t.label}
              </div>
              <div
                className="text-[9px]"
                style={{ color: "oklch(0.75 0.15 175)" }}
              >
                {t.desc}
              </div>
            </div>
          ))}
        </div>

        {/* AI Legal chat */}
        <div className="glass rounded-xl border border-white/8 p-4 flex-1">
          <div
            className="text-[10px] font-display tracking-wider mb-3"
            style={{ color: "oklch(0.62 0.22 20)" }}
          >
            AI LEGAL ADVISOR
          </div>
          <div className="min-h-[160px] flex items-center justify-center mb-3">
            <div className="text-center">
              <Scale size={28} className="mx-auto text-white/10 mb-2" />
              <div className="text-xs text-white/25">
                Ask any legal question
              </div>
              <div
                className="text-[9px] mt-1"
                style={{ color: "oklch(0.75 0.15 175 / 50%)" }}
              >
                Wire to AI backend for legal guidance
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              placeholder="Ask a legal question..."
              className="flex-1 h-8 px-3 text-xs rounded-lg text-white/80 placeholder:text-white/25 focus:outline-none"
              style={{
                background: "oklch(1 0 0 / 4%)",
                border: "1px solid oklch(0.55 0.22 20 / 15%)",
              }}
            />
            <button className="px-3 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
              ASK
            </button>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </PanelLayout>
  );
}
