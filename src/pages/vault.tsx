import {
  Lock,
  Eye,
  EyeOff,
  Key,
  ShieldCheck,
  FileText,
  Image as ImageIcon,
  Search,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

type VaultCategory = "credentials" | "documents" | "photos";

const CATEGORIES: { id: VaultCategory; label: string; icon: React.ReactNode }[] =
  [
    {
      id: "credentials",
      label: "API Keys & Passwords",
      icon: <Key size={14} />,
    },
    { id: "documents", label: "Private Documents", icon: <FileText size={14} /> },
    { id: "photos", label: "Private Photos", icon: <ImageIcon size={14} /> },
  ];

export default function VaultPanel() {
  const [locked, setLocked] = useState(true);
  const [category, setCategory] = useState<VaultCategory>("credentials");
  const [showSecrets, setShowSecrets] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <PanelLayout
      title="Privacy Vault"
      subtitle="Password safe, API keys, private documents and photos — eyes only"
      icon={<ShieldCheck size={18} />}
      actions={
        <button
          onClick={() => setLocked(!locked)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display transition-all
            ${locked ? "glass-crimson text-primary hover:glow-crimson-sm" : "glass text-emerald-400 hover:bg-white/5"}`}
        >
          {locked ? <Lock size={12} /> : <Eye size={12} />}
          {locked ? "UNLOCK VAULT" : "LOCK VAULT"}
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {locked ? (
          <div
            className="glass rounded-xl border p-12 flex flex-col items-center justify-center"
            style={{ borderColor: "oklch(0.55 0.22 20 / 20%)" }}
          >
            <div className="w-16 h-16 rounded-full glass-crimson flex items-center justify-center glow-crimson mb-4">
              <Lock size={28} className="text-primary/80" />
            </div>
            <div className="text-sm text-white/50 mb-1">
              Privacy Vault Locked
            </div>
            <div
              className="text-xs mb-4"
              style={{ color: "oklch(0.75 0.15 175 / 60%)" }}
            >
              Maximum security for APIs, passwords, and private files. Eyes only.
            </div>
            <button
              onClick={() => setLocked(false)}
              className="px-5 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson transition-all"
            >
              UNLOCK VAULT
            </button>
          </div>
        ) : (
          <>
            {/* Category tabs */}
            <div className="flex gap-1">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-display tracking-wider transition-colors
                    ${category === c.id ? "glass-crimson text-primary" : "glass text-white/35 hover:text-white/70"}`}
                >
                  <span>{c.icon}</span>
                  {c.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Toolbar */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1 max-w-xs">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/25"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vault..."
                  className="w-full h-8 pl-8 text-xs rounded-lg text-white/80 placeholder:text-white/25 focus:outline-none"
                  style={{
                    background: "oklch(1 0 0 / 4%)",
                    border: "1px solid oklch(0.55 0.22 20 / 15%)",
                  }}
                />
              </div>
              {category === "credentials" && (
                <button
                  onClick={() => setShowSecrets(!showSecrets)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all"
                >
                  {showSecrets ? <EyeOff size={12} /> : <Eye size={12} />}
                  {showSecrets ? "HIDE" : "SHOW"}
                </button>
              )}
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all">
                <Upload size={12} /> UPLOAD
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
                <Plus size={12} /> ADD
              </button>
            </div>

            {/* Content per category */}
            {category === "credentials" && (
              <div className="flex flex-col gap-2">
                {[
                  { label: "API Key", value: "sk-...Cloudflare", secret: true },
                  { label: "Email Password", value: "••••••••••", secret: true },
                  { label: "Database Credential", value: "postgres://…", secret: true },
                ]
                  .filter((s) =>
                    s.label.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((s) => (
                    <div
                      key={s.label}
                      className="glass rounded-xl px-4 py-3 border border-white/8 flex items-center gap-3"
                    >
                      <Key size={14} className="text-primary/70 shrink-0" />
                      <div className="text-xs text-white/70 flex-1 truncate">
                        {s.label}
                      </div>
                      <div className="text-[11px] text-white/30 font-mono truncate">
                        {showSecrets ? s.value : "••••••••••"}
                      </div>
                      <button className="text-white/25 hover:text-primary transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                {(
                  ["API Key", "Email Password", "Database Credential"].filter(
                    (l) => l.toLowerCase().includes(search.toLowerCase()),
                  ).length === 0 && (
                    <div className="glass rounded-xl border border-white/8 p-6 flex flex-col items-center justify-center min-h-[160px]">
                      <Key size={24} className="text-white/10 mb-2" />
                      <div className="text-xs text-white/30">
                        No matching credentials
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {category === "documents" && (
              <div className="flex flex-col gap-2">
                {(
                  [
                    { name: "W-2 Tax Form", type: "PDF" },
                    { name: "Insurance Policy", type: "PDF" },
                  ].filter((d) =>
                    d.name.toLowerCase().includes(search.toLowerCase()),
                  ).map((d) => (
                    <div
                      key={d.name}
                      className="glass rounded-xl px-4 py-3 border border-white/8 flex items-center gap-3"
                    >
                      <FileText size={14} className="text-primary/70 shrink-0" />
                      <div className="text-xs text-white/70 flex-1 truncate">
                        {d.name}
                      </div>
                      <div className="text-[10px] text-white/25">{d.type}</div>
                    </div>
                  ))
                )}
                {(
                  ["W-2 Tax Form", "Insurance Policy"].filter((n) =>
                    n.toLowerCase().includes(search.toLowerCase()),
                  ).length === 0 && (
                    <div className="glass rounded-xl border border-white/8 p-6 flex flex-col items-center justify-center min-h-[160px]">
                      <FileText size={24} className="text-white/10 mb-2" />
                      <div className="text-xs text-white/30">
                        No matching documents
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {category === "photos" && (
              <div className="glass rounded-xl border border-white/8 p-6 flex flex-col items-center justify-center min-h-[200px]">
                <ImageIcon size={28} className="text-white/10 mb-3" />
                <div className="text-xs text-white/30">
                  Private photos will appear here
                </div>
                <div
                  className="text-[9px] mt-1"
                  style={{ color: "oklch(0.75 0.15 175 / 50%)" }}
                >
                  Upload and store photos you don't want anyone else to see
                </div>
              </div>
            )}
          </>
        )}

        <div className="h-8" />
      </div>
    </PanelLayout>
  );
}
