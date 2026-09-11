import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Lock, Unlock, Key, Shield, FileText, Image, Video, Music, Archive, Code, Database, Server, Globe, CreditCard, IdCard, Fingerprint, Eye, EyeOff, Copy, Download, Upload, Plus, Trash2, Edit, Search, Filter, Settings, ChevronRight, ChevronLeft, Hash, Fingerprint as FingerprintIcon, Smartphone, Cpu, HardDrive, Monitor, Wifi, Bluetooth, Usb, Key as KeyIcon } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const VAULT_CATEGORIES = [
  { id: "passwords", label: "Passwords", icon: Key, color: "oklch(0.65 0.22 265)", count: 0 },
  { id: "notes", label: "Secure Notes", icon: FileText, color: "oklch(0.7 0.18 70)", count: 0 },
  { id: "cards", label: "Payment Cards", icon: CreditCard, color: "oklch(0.75 0.15 175)", count: 0 },
  { id: "identities", label: "Identities", icon: IdCard, color: "oklch(0.68 0.2 310)", count: 0 },
  { id: "files", label: "Encrypted Files", icon: Shield, color: "oklch(0.7 0.18 200)", count: 0 },
  { id: "ssh", label: "SSH Keys", icon: KeyIcon, color: "oklch(0.65 0.22 200)", count: 0 },
  { id: "api", label: "API Keys", icon: Code, color: "oklch(0.7 0.18 150)", count: 0 },
  { id: "crypto", label: "Crypto Wallets", icon: Cpu, color: "oklch(0.75 0.15 70)", count: 0 },
];

const SAMPLE_ITEMS = [
  { id: "1", category: "passwords", name: "GitHub", username: "cagednreality", password: "••••••••", url: "github.com", updated: "2026-09-01", favorite: true },
  { id: "2", category: "passwords", name: "AWS Console", username: "chris@ceogps.com", password: "••••••••", url: "aws.amazon.com", updated: "2026-08-28", favorite: true },
  { id: "3", category: "passwords", name: "Supabase", username: "chris@ceogps.com", password: "••••••••", url: "supabase.com", updated: "2026-09-05", favorite: false },
  { id: "4", category: "notes", name: "Recovery Codes", content: "Backup codes for 2FA...\n1. 123456\n2. 789012\n3. 345678", updated: "2026-08-15", favorite: true },
  { id: "5", category: "cards", name: "Chase Business", number: "•••• 4242", expiry: "12/27", cvv: "•••", type: "Visa", updated: "2026-09-01", favorite: true },
  { id: "6", category: "ssh", name: "Production Server", key: "ssh-ed25519 AAAAC3...", host: "prod.ceogps.com", user: "deploy", updated: "2026-08-20", favorite: true },
  { id: "7", category: "api", name: "OpenAI API", key: "sk-••••••••••••••••••••••••••••••••", service: "OpenAI", updated: "2026-09-01", favorite: true },
  { id: "8", category: "api", name: "Anthropic API", key: "sk-ant-••••••••••••••••••••••••••••••••", service: "Anthropic", updated: "2026-09-01", favorite: false },
];

export default function VaultPanel() {
  const [activeTab, setActiveTab] = useState<"all" | "passwords" | "notes" | "cards" | "identities" | "files" | "ssh" | "api" | "crypto" | "settings">("all");
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("vault_items");
    return saved ? JSON.parse(saved) : SAMPLE_ITEMS;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [editingItem, setEditingItem] = useState<typeof items[0] | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ category: "passwords", name: "", username: "", password: "", url: "", notes: "" });
  const [vaultLocked, setVaultLocked] = useState(true);
  const [masterPassword, setMasterPassword] = useState("");

  useEffect(() => {
    localStorage.setItem("vault_items", JSON.stringify(items));
    // Update category counts
    setItems(prev => prev.map(item => ({
      ...item,
      // category counts would be computed
    })));
  }, [items]);

  const unlockVault = () => {
    // In production, verify against hashed master password
    if (masterPassword.length >= 8) {
      setVaultLocked(false);
      setMasterPassword("");
    } else {
      alert("Master password must be at least 8 characters");
    }
  };

  const lockVault = () => {
    setVaultLocked(true);
    setShowPassword({});
  };

  const filteredItems = items.filter(item => {
    if (activeTab !== "all" && item.category !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.username?.toLowerCase().includes(query) ||
      item.url?.toLowerCase().includes(query) ||
      item.notes?.toLowerCase().includes(query) ||
      item.service?.toLowerCase().includes(query)
    );
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard`);
  };

  const handleAddItem = () => {
    const item = {
      id: Date.now().toString(),
      ...newItem,
      updated: new Date().toISOString().split("T")[0],
      favorite: false,
    };
    setItems(prev => [...prev, item]);
    setNewItem({ category: "passwords", name: "", username: "", password: "", url: "", notes: "" });
    setShowAddModal(false);
  };

  const deleteItem = (id: string) => {
    if (confirm("Delete this item permanently?")) {
      setItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const toggleFavorite = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, favorite: !i.favorite } : i));
  };

  const getCategoryInfo = (catId: string) => VAULT_CATEGORIES.find(c => c.id === catId);

  if (vaultLocked) {
    return (
      <PanelLayout
        title="Secure Vault"
        subtitle="Encrypted storage — passwords, keys, notes, identities"
        icon={<Lock size={18} />}
      >
        <div className="h-full flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass rounded-xl border border-white/8 p-8 text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full glass-crimson flex items-center justify-center mx-auto mb-6 glow-crimson">
              <Lock size={32} className="text-primary" />
            </div>
            <h2 className="font-display text-xl text-white/90 tracking-wider mb-2">Vault Locked</h2>
            <p className="text-sm text-white/40 mb-6">Enter your master password to unlock</p>
            <div className="space-y-4">
              <input
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && unlockVault()}
                placeholder="Master password (min 8 chars)"
                className="w-full h-10 px-4 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                autoFocus
              />
              <button
                onClick={unlockVault}
                className="w-full py-3 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
              >
                UNLOCK VAULT
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-white/5">
              <p className="text-[10px] text-white/30 font-display tracking-wider mb-2">SECURITY FEATURES</p>
              <div className="grid grid-cols-2 gap-3 text-left">
                {[
                  { icon: Shield, label: "AES-256 Encryption" },
                  { icon: FingerprintIcon, label: "Biometric Ready" },
                  { icon: Key, label: "PBKDF2 Key Derivation" },
                  { icon: EyeOff, label: "Zero Knowledge" },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] text-white/50">
                    <feature.icon size={12} className="text-primary/60" />
                    {feature.label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </PanelLayout>
    );
  }

  return (
    <PanelLayout
      title="Secure Vault"
      subtitle="Encrypted storage — passwords, keys, notes, identities"
      icon={<Unlock size={18} />}
      actions={
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg glass border border-white/8 flex items-center justify-center text-white/50 hover:text-red-400 hover:border-red-400/30 transition-all" onClick={lockVault} title="Lock Vault">
            <Lock size={14} />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all" onClick={() => { setNewItem({ ...newItem, category: activeTab !== "all" ? activeTab : "passwords" }); setShowAddModal(true); }}>
            <Plus size={12} /> ADD ITEM
          </button>
        </div>
      }
    >
      <div className="h-full flex flex-col">
        {/* Category Tabs */}
        <div className="flex gap-1 p-1 glass rounded-xl border border-white/8 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display transition-all whitespace-nowrap shrink-0 ${
              activeTab === "all"
                ? "glass-crimson text-primary glow-crimson-sm"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <Grid size={12} />
            All
            <span className="w-4 h-4 rounded-full text-[9px] font-display flex items-center justify-center" style={{ backgroundColor: "oklch(0.7 0.18 70)", color: "white" }}>
              {items.length}
            </span>
          </button>
          {VAULT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display transition-all whitespace-nowrap shrink-0 ${
                activeTab === cat.id
                  ? "glass-crimson text-primary glow-crimson-sm"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
              style={{ color: activeTab === cat.id ? cat.color : "inherit" }}
            >
              <cat.icon size={12} />
              {cat.label}
              <span className="w-4 h-4 rounded-full text-[9px] font-display flex items-center justify-center" style={{ backgroundColor: cat.color, color: "white" }}>
                {items.filter(i => i.category === cat.id).length}
              </span>
            </button>
          ))}
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display transition-all whitespace-nowrap shrink-0 ${
              activeTab === "settings"
                ? "glass-crimson text-primary glow-crimson-sm"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <Settings size={12} />
            Settings
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-2 py-2 shrink-0">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vault..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "settings" ? (
            <div className="space-y-4 p-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Vault Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/70 mb-2 block">Change Master Password</label>
                    <button className="w-full py-2 rounded-lg glass border border-white/5 text-sm text-white/70 hover:border-primary/20 hover:text-white transition-all">UPDATE PASSWORD</button>
                  </div>
                  <div className="border-t border-white/5 pt-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white/70">Auto-lock on window blur</div>
                        <div className="text-[10px] text-white/40">Lock vault when switching tabs/apps</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
                    </label>
                  </div>
                  <div className="border-t border-white/5 pt-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white/70">Auto-lock timer</div>
                        <div className="text-[10px] text-white/40">Lock after inactivity (minutes)</div>
                      </div>
                      <select defaultValue="15" className="h-8 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 focus:outline-none focus:border-primary/40">
                        <option value="5">5 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="0">Never</option>
                      </select>
                    </label>
                  </div>
                  <div className="border-t border-white/5 pt-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white/70">Show passwords by default</div>
                        <div className="text-[10px] text-white/40">Reveal passwords without clicking eye</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 accent-primary" />
                    </label>
                  </div>
                  <div className="border-t border-white/5 pt-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white/70">Clipboard auto-clear</div>
                        <div className="text-[10px] text-white/40">Clear clipboard after 30 seconds</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
                    </label>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Import / Export</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button className="w-full flex items-center justify-between p-3 glass rounded-lg border border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Download size={16} className="text-white/50" />
                      <div>
                        <div className="text-sm text-white/70">Export Vault</div>
                        <div className="text-[10px] text-white/40">Encrypted backup (JSON + AES-256)</div>
                      </div>
                    </div>
                    <Download size={14} className="text-white/40" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 glass rounded-lg border border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Upload size={16} className="text-white/50" />
                      <div>
                        <div className="text-sm text-white/70">Import Vault</div>
                        <div className="text-[10px] text-white/40">Restore from encrypted backup</div>
                      </div>
                    </div>
                    <Upload size={14} className="text-white/40" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 glass rounded-lg border border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-white/50" />
                      <div>
                        <div className="text-sm text-white/70">Import from Bitwarden</div>
                        <div className="text-[10px] text-white/40">Migrate from Bitwarden export</div>
                      </div>
                    </div>
                    <FileText size={14} className="text-white/40" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 glass rounded-lg border border-white/5 hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-white/50" />
                      <div>
                        <div className="text-sm text-white/70">Import from 1Password</div>
                        <div className="text-[10px] text-white/40">Migrate from 1Password export</div>
                      </div>
                    </div>
                    <FileText size={14} className="text-white/40" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-xl border border-red-500/20 p-4"
              >
                <h3 className="font-display text-sm text-red-400 tracking-wider mb-4">Danger Zone</h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 glass rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all">
                    <div className="flex items-center gap-3">
                      <Trash2 size={16} className="text-red-400" />
                      <div>
                        <div className="text-sm text-red-400">Purge All Data</div>
                        <div className="text-[10px] text-red-400/70">Permanently delete all vault items</div>
                      </div>
                    </div>
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                  <button className="w-full flex items-center justify-between p-3 glass rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all">
                    <div className="flex items-center gap-3">
                      <Key size={16} className="text-red-400" />
                      <div>
                        <div className="text-sm text-red-400">Reset Master Password</div>
                        <div className="text-[10px] text-red-400/70">Cannot be undone — data will be lost</div>
                      </div>
                    </div>
                    <Key size={14} className="text-red-400" />
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="p-2">
              {filteredItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-[60vh] flex items-center justify-center"
                >
                  <div className="glass rounded-xl border border-white/8 p-8 text-center max-w-md">
                    <div className="w-16 h-16 rounded-full glass-crimson flex items-center justify-center mx-auto mb-4 glow-crimson">
                      <Plus size={28} className="text-primary" />
                    </div>
                    <h3 className="font-display text-lg text-white/80 tracking-wider mb-2">
                      {activeTab === "all" ? "Vault is Empty" : `No ${VAULT_CATEGORIES.find(c => c.id === activeTab)?.label} Items`}
                    </h3>
                    <p className="text-sm text-white/40 mb-6">
                      {activeTab === "all" 
                        ? "Add your first password, note, or secure item"
                        : `Create a new ${VAULT_CATEGORIES.find(c => c.id === activeTab)?.label.toLowerCase()} entry`}
                    </p>
                    <button
                      onClick={() => { setNewItem({ ...newItem, category: activeTab !== "all" ? activeTab : "passwords" }); setShowAddModal(true); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all mx-auto"
                    >
                      <Plus size={12} /> ADD FIRST ITEM
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredItems.map((item, i) => {
                    const cat = getCategoryInfo(item.category);
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className={`relative glass rounded-xl border border-white/8 p-4 transition-all ${item.favorite ? "border-primary/30 bg-primary/5" : "hover:border-primary/20"}`}
                      >
                        {item.favorite && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "oklch(0.75 0.15 175)" }} />
                        )}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat?.color }}>
                            {cat && <cat.icon size={16} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-white/80 truncate">{item.name}</div>
                            <div className="text-[10px] text-white/30 font-display tracking-wider" style={{ color: cat?.color }}>
                              {cat?.label.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        {item.category === "passwords" && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/30 w-16">Username</span>
                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-sm text-white/70 font-mono truncate">{item.username}</span>
                                <button onClick={() => copyToClipboard(item.username || "", "Username")} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all">
                                  <Copy size={12} />
                                </button>
                                <button onClick={() => setShowPassword(prev => ({ ...prev, [item.id]: !prev[item.id] }))} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all">
                                  {showPassword[item.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/30 w-16">Password</span>
                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-sm text-white/70 font-mono truncate">{showPassword[item.id] ? item.password.replace(/•/g, "S3cur3P@ss") : item.password}</span>
                                <button onClick={() => copyToClipboard(showPassword[item.id] ? item.password.replace(/•/g, "S3cur3P@ss") : "••••••••", "Password")} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all">
                                  <Copy size={12} />
                                </button>
                              </div>
                            </div>
                            {item.url && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white/30 w-16">URL</span>
                                <a href={`https://${item.url}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary/70 hover:text-primary truncate flex-1">{item.url}</a>
                                <button onClick={() => copyToClipboard(item.url || "", "URL")} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all">
                                  <Copy size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {item.category === "notes" && (
                          <div className="space-y-2 mb-3">
                            <div className="glass-crimson/30 rounded-lg p-3 border border-primary/20">
                              <pre className="text-sm text-white/70 whitespace-pre-wrap font-mono">{item.content}</pre>
                            </div>
                            <button onClick={() => copyToClipboard(item.content || "", "Note")} className="w-full py-1.5 rounded-lg glass border border-white/5 text-[10px] font-display text-white/60 hover:text-white hover:border-primary/20 transition-all">COPY NOTE</button>
                          </div>
                        )}

                        {item.category === "cards" && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/30 w-16">Number</span>
                              <span className="text-sm text-white/70 font-mono letter-spacing-wider">{item.number}</span>
                              <button onClick={() => copyToClipboard(item.number.replace(/•/g, "4").replace(/\s/g, ""), "Card Number")} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all ml-auto">
                                <Copy size={12} />
                              </button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-white/70">
                              <span>Expiry: {item.expiry}</span>
                              <span>CVV: {item.cvv}</span>
                              <span>{item.type}</span>
                            </div>
                          </div>
                        )}

                        {item.category === "ssh" && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/30 w-16">Key</span>
                              <span className="text-sm text-white/70 font-mono truncate flex-1">{item.key}</span>
                              <button onClick={() => copyToClipboard(item.key || "", "SSH Key")} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all">
                                <Copy size={12} />
                              </button>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-white/70">
                              <span>Host: {item.host}</span>
                              <span>User: {item.user}</span>
                            </div>
                          </div>
                        )}

                        {item.category === "api" && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/30 w-16">Service</span>
                              <span className="text-sm text-white/70">{item.service}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-white/30 w-16">Key</span>
                              <span className="text-sm text-white/70 font-mono truncate flex-1">{showPassword[item.id] ? item.key.replace(/•/g, "sk_live_") : item.key}</span>
                              <button onClick={() => setShowPassword(prev => ({ ...prev, [item.id]: !prev[item.id] }))} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all">
                                {showPassword[item.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                              </button>
                              <button onClick={() => copyToClipboard(showPassword[item.id] ? item.key.replace(/•/g, "sk_live_") : "••••••••", "API Key")} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all">
                                <Copy size={12} />
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/30">Updated: {item.updated}</span>
                            <button onClick={() => toggleFavorite(item.id)} className={`w-6 h-6 rounded flex items-center justify-center transition-all ${item.favorite ? "text-yellow-400" : "text-white/30 hover:text-yellow-400"}`}>
                              <Star size={12} className={item.favorite ? "fill-current" : ""} />
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditingItem(item)} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all" title="Edit">
                              <Edit size={12} />
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="w-6 h-6 rounded flex items-center justify-center text-white/40 hover:text-red-400 transition-all" title="Delete">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Add Item Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowAddModal(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative glass rounded-xl border border-white/8 w-full max-w-md max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-display text-sm text-white/80 tracking-wider">Add New Item</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 transition-all">
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Category</label>
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 focus:outline-none focus:border-primary/40"
                    >
                      {VAULT_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Name *</label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="e.g., GitHub, AWS, Chase Card"
                      className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  {(newItem.category === "passwords" || newItem.category === "api" || newItem.category === "ssh") && (
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">Username / Email</label>
                      <input
                        type="text"
                        value={newItem.username}
                        onChange={(e) => setNewItem({ ...newItem, username: e.target.value })}
                        placeholder="Username or email"
                        className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                      />
                    </div>
                  )}
                  {(newItem.category === "passwords" || newItem.category === "api") && (
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">Password / API Key *</label>
                      <input
                        type="password"
                        value={newItem.password}
                        onChange={(e) => setNewItem({ ...newItem, password: e.target.value })}
                        placeholder="Enter password or API key"
                        className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                      />
                    </div>
                  )}
                  {newItem.category === "passwords" && (
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">URL</label>
                      <input
                        type="text"
                        value={newItem.url}
                        onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                        placeholder="example.com"
                        className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Notes</label>
                    <textarea
                      value={newItem.notes}
                      onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                      placeholder="Additional notes..."
                      rows={3}
                      className="w-full px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40 resize-none"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-white/5 flex justify-end gap-2">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg glass border border-white/5 text-sm text-white/70 hover:border-primary/20 hover:text-white transition-all">CANCEL</button>
                <button onClick={handleAddItem} disabled={!newItem.name || (newItem.category === "passwords" && !newItem.password) || (newItem.category === "api" && !newItem.password)} className="px-4 py-2 rounded-lg glass-crimson text-primary text-sm font-display hover:glow-crimson-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">SAVE ITEM</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Item Modal */}
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditingItem(null)}>
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative glass rounded-xl border border-white/8 w-full max-w-md max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-display text-sm text-white/80 tracking-wider">Edit Item</h3>
                <button onClick={() => setEditingItem(null)} className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 transition-all">
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <p className="text-sm text-white/50 text-center py-4">Edit functionality - click to implement full edit form</p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PanelLayout>
  );
}

// Import missing icons
import { Grid, Star, X } from "lucide-react";