import { Scale, Lock, ShieldCheck, FileText, Key, AlertTriangle, Plus, Eye, EyeOff, Search, Upload } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const TABS = ["Legal", "Personal Vault", "Privacy Vault"];

const LEGAL_TOOLS = [
  { icon: <Scale size={14} />, label: "Legal Advice", desc: "AI-powered legal guidance" },
  { icon: <AlertTriangle size={14} />, label: "Rights Alerts", desc: "Warrant & record checks" },
  { icon: <FileText size={14} />, label: "Documents", desc: "Contracts, waivers, NDAs" },
  { icon: <ShieldCheck size={14} />, label: "Privacy Check", desc: "Data exposure scanner" },
];

export default function LegalVaultPanel() {
  const [tab, setTab] = useState(0);
  const [vaultLocked, setVaultLocked] = useState(true);
  const [showItems, setShowItems] = useState(false);

  return (
    <PanelLayout
      title="Legal & Vault"
      subtitle="Legal tools, secure document vault, and privacy controls"
      icon={<Scale size={18} />}
      actions={
        tab > 0 ? (
          <button
            onClick={() => setVaultLocked(!vaultLocked)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display transition-all
              ${vaultLocked ? "glass-crimson text-primary hover:glow-crimson-sm" : "glass text-emerald-400 hover:bg-white/5"}`}
          >
            {vaultLocked ? <Lock size={12} /> : <Eye size={12} />}
            {vaultLocked ? "UNLOCK VAULT" : "LOCK VAULT"}
          </button>
        ) : (
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
            <Plus size={12} /> NEW DOCUMENT
          </button>
        )
      }
    >
      <div className="flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} className={`px-4 py-1.5 rounded-lg text-[11px] font-display tracking-wider transition-colors
              ${tab === i ? "glass-crimson text-primary" : "glass text-white/35 hover:text-white/70"}`}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {tab === 0 && (
          <div className="flex flex-col gap-4">
            {/* Legal tools grid */}
            <div className="grid grid-cols-2 gap-3">
              {LEGAL_TOOLS.map((t) => (
                <div key={t.label} className="glass rounded-xl p-4 border border-white/8 hover:border-primary/20 cursor-pointer transition-all group">
                  <span className="text-primary/70 mb-2.5 block">{t.icon}</span>
                  <div className="text-xs text-white/80 font-medium mb-1">{t.label}</div>
                  <div className="text-[9px]" style={{ color: "oklch(0.75 0.15 175)" }}>{t.desc}</div>
                </div>
              ))}
            </div>

            {/* AI Legal chat */}
            <div className="glass rounded-xl border border-white/8 p-4 flex-1">
              <div className="text-[10px] font-display tracking-wider mb-3" style={{ color: "oklch(0.62 0.22 20)" }}>AI LEGAL ADVISOR</div>
              <div className="min-h-[160px] flex items-center justify-center mb-3">
                <div className="text-center">
                  <Scale size={28} className="mx-auto text-white/10 mb-2" />
                  <div className="text-xs text-white/25">Ask any legal question</div>
                  <div className="text-[9px] mt-1" style={{ color: "oklch(0.75 0.15 175 / 50%)" }}>Wire to AI backend for legal guidance</div>
                </div>
              </div>
              <div className="flex gap-2">
                <input placeholder="Ask a legal question..." className="flex-1 h-8 px-3 text-xs rounded-lg text-white/80 placeholder:text-white/25 focus:outline-none"
                  style={{ background: "oklch(1 0 0 / 4%)", border: "1px solid oklch(0.55 0.22 20 / 15%)" }} />
                <button className="px-3 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">ASK</button>
              </div>
            </div>
          </div>
        )}

        {tab === 1 && (
          <div className="flex flex-col gap-4">
            {vaultLocked ? (
              <div className="glass rounded-xl border p-12 flex flex-col items-center justify-center" style={{ borderColor: "oklch(0.55 0.22 20 / 20%)" }}>
                <div className="w-16 h-16 rounded-full glass-crimson flex items-center justify-center glow-crimson mb-4">
                  <Lock size={28} className="text-primary/80" />
                </div>
                <div className="text-sm text-white/50 mb-1">Personal Vault Locked</div>
                <div className="text-xs mb-4" style={{ color: "oklch(0.75 0.15 175 / 60%)" }}>Unlock to access personal documents, media, and sensitive data</div>
                <button onClick={() => setVaultLocked(false)} className="px-5 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson transition-all">
                  UNLOCK VAULT
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1 max-w-xs">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25" />
                    <input placeholder="Search vault..." className="w-full h-8 pl-8 text-xs rounded-lg text-white/80 placeholder:text-white/25 focus:outline-none"
                      style={{ background: "oklch(1 0 0 / 4%)", border: "1px solid oklch(0.55 0.22 20 / 15%)" }} />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all">
                    <Upload size={12} /> UPLOAD
                  </button>
                </div>
                <div className="glass rounded-xl border border-white/8 p-6 flex flex-col items-center justify-center min-h-[200px]">
                  <FileText size={28} className="text-white/10 mb-3" />
                  <div className="text-xs text-white/30">Vault is empty</div>
                  <div className="text-[9px] mt-1" style={{ color: "oklch(0.75 0.15 175 / 50%)" }}>Upload or create encrypted personal files</div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 2 && (
          <div className="flex flex-col gap-4">
            {vaultLocked ? (
              <div className="glass rounded-xl border p-12 flex flex-col items-center justify-center" style={{ borderColor: "oklch(0.55 0.22 20 / 20%)" }}>
                <div className="w-16 h-16 rounded-full glass-crimson flex items-center justify-center glow-crimson mb-4">
                  <ShieldCheck size={28} className="text-primary/80" />
                </div>
                <div className="text-sm text-white/50 mb-1">Privacy Vault Locked</div>
                <div className="text-xs mb-4" style={{ color: "oklch(0.75 0.15 175 / 60%)" }}>Maximum security storage. Eyes only.</div>
                <button onClick={() => setVaultLocked(false)} className="px-5 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson transition-all">
                  UNLOCK VAULT
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Key size={14} />, label: "Password Manager", desc: "Store credentials securely" },
                  { icon: <ShieldCheck size={14} />, label: "Data Exposure Scan", desc: "Check if your data is leaked" },
                  { icon: <EyeOff size={14} />, label: "Private Files", desc: "Encrypted file storage" },
                  { icon: <AlertTriangle size={14} />, label: "Security Alerts", desc: "Real-time breach notifications" },
                ].map((i) => (
                  <div key={i.label} className="glass rounded-xl p-4 border border-white/8 hover:border-primary/20 cursor-pointer transition-all">
                    <span className="text-primary/70 mb-2 block">{i.icon}</span>
                    <div className="text-xs text-white/80 font-medium mb-1">{i.label}</div>
                    <div className="text-[9px]" style={{ color: "oklch(0.75 0.15 175)" }}>{i.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-8" />
      </div>
    </PanelLayout>
  );
}
