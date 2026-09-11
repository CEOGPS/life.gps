import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Scale, FileText, Shield, Gavel, PenTool, Eye, EyeOff, Download, Upload, Search, Filter, Settings, ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Info, Clock, Calendar, User, Users, Building, Globe, Mail, Phone, MapPin, CreditCard, Banknote, Receipt, Briefcase, Handshake, Lock, Unlock, Key, Hash, Fingerprint, Smartphone, Monitor, Cpu, HardDrive, Wifi, Bluetooth, Usb, Database, Server, Cloud, Network, Router, Wifi as SwitchIcon, Shield as FirewallIcon, Bug, Code, Terminal, GitBranch, GitMerge, GitCommit, GitPullRequest, GitCompare, Grid, List, Copy, X, Plus, Trash2 } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const LEGAL_CATEGORIES = [
  { id: "contracts", label: "Contracts", icon: FileText, color: "oklch(0.65 0.22 265)", count: 0 },
  { id: "compliance", label: "Compliance", icon: Shield, color: "oklch(0.7 0.18 70)", count: 0 },
  { id: "ip", label: "Intellectual Property", icon: Gavel, color: "oklch(0.75 0.15 175)", count: 0 },
  { id: "corporate", label: "Corporate Docs", icon: Building, color: "oklch(0.68 0.2 310)", count: 0 },
  { id: "employment", label: "Employment", icon: Users, color: "oklch(0.7 0.18 200)", count: 0 },
  { id: "privacy", label: "Privacy & Data", icon: Lock, color: "oklch(0.65 0.22 200)", count: 0 },
  { id: "financial", label: "Financial", icon: Banknote, color: "oklch(0.75 0.15 70)", count: 0 },
  { id: "disputes", label: "Disputes", icon: AlertCircle, color: "oklch(0.65 0.22 15)", count: 0 },
];

const SAMPLE_DOCUMENTS = [
  { 
    id: "1", 
    category: "contracts", 
    title: "Master Services Agreement", 
    parties: "CEO GPS Inc. × Acme Corp",
    status: "active",
    signed: "2026-01-15",
    expires: "2027-01-15",
    value: "$120,000/yr",
    tags: ["MSA", "Enterprise", "Auto-renew"],
    content: "This Master Services Agreement ('Agreement') is entered into as of January 15, 2026..."
  },
  { 
    id: "2", 
    category: "contracts", 
    title: "NDA - Mutual", 
    parties: "CEO GPS Inc. × BetaStart LLC",
    status: "active",
    signed: "2026-03-22",
    expires: "2028-03-22",
    value: "N/A",
    tags: ["NDA", "Mutual", "2-year"],
    content: "This Mutual Non-Disclosure Agreement ('Agreement') is entered into as of March 22, 2026..."
  },
  { 
    id: "3", 
    category: "compliance", 
    title: "SOC 2 Type II Report", 
    parties: "CEO GPS Inc. × AuditCo",
    status: "current",
    signed: "2026-06-01",
    expires: "2027-06-01",
    value: "N/A",
    tags: ["SOC2", "Type II", "Annual"],
    content: "System and Organization Controls 2 Type II Examination Report..."
  },
  { 
    id: "4", 
    category: "compliance", 
    title: "GDPR Data Processing Addendum", 
    parties: "CEO GPS Inc. × EU Customers",
    status: "active",
    signed: "2026-01-01",
    expires: "Perpetual",
    value: "N/A",
    tags: ["GDPR", "DPA", "Standard Contractual Clauses"],
    content: "This Data Processing Addendum forms part of the Agreement between..."
  },
  { 
    id: "5", 
    category: "ip", 
    title: "Trademark Registration - CEO GPS", 
    parties: "CEO GPS Inc. × USPTO",
    status: "registered",
    signed: "2025-11-15",
    expires: "2035-11-15",
    value: "N/A",
    tags: ["Trademark", "US", "Class 9, 42"],
    content: "Registration No. 987654321 - CEO GPS mark for software services..."
  },
  { 
    id: "6", 
    category: "ip", 
    title: "Patent Application - AI Dashboard", 
    parties: "CEO GPS Inc. × USPTO",
    status: "pending",
    signed: "2026-04-10",
    expires: "2026-10-10",
    value: "N/A",
    tags: ["Patent", "Provisional", "AI/ML"],
    content: "Provisional Patent Application No. 63/456,789 - Intelligent Dashboard System..."
  },
  { 
    id: "7", 
    category: "corporate", 
    title: "Certificate of Incorporation", 
    parties: "CEO GPS Inc. × Delaware",
    status: "active",
    signed: "2024-01-15",
    expires: "Perpetual",
    value: "N/A",
    tags: ["Delaware", "C-Corp", "10M shares"],
    content: "Certificate of Incorporation of CEO GPS Inc., a Delaware corporation..."
  },
  { 
    id: "8", 
    category: "corporate", 
    title: "Operating Agreement", 
    parties: "CEO GPS Inc. × Members",
    status: "active",
    signed: "2024-01-20",
    expires: "Perpetual",
    value: "N/A",
    tags: ["LLC", "Multi-member", "Voting rights"],
    content: "Operating Agreement of CEO GPS Inc. effective January 20, 2024..."
  },
  { 
    id: "9", 
    category: "employment", 
    title: "Executive Employment Agreement", 
    parties: "CEO GPS Inc. × Chris Green",
    status: "active",
    signed: "2024-02-01",
    expires: "2027-02-01",
    value: "$180,000 + equity",
    tags: ["Executive", "Equity", "4-year vest"],
    content: "Executive Employment Agreement between CEO GPS Inc. and Chris Green..."
  },
  { 
    id: "10", 
    category: "privacy", 
    title: "Privacy Policy v2.3", 
    parties: "CEO GPS Inc. × Users",
    status: "current",
    signed: "2026-07-01",
    expires: "Next review",
    value: "N/A",
    tags: ["Privacy", "CCPA", "GDPR", "Public"],
    content: "This Privacy Policy describes how CEO GPS Inc. collects, uses, and protects..."
  },
];

const STATUS_STYLES = {
  active: { bg: "oklch(0.7 0.18 70)", text: "text-green-400", label: "ACTIVE" },
  current: { bg: "oklch(0.7 0.18 70)", text: "text-green-400", label: "CURRENT" },
  registered: { bg: "oklch(0.75 0.15 175)", text: "text-yellow-400", label: "REGISTERED" },
  pending: { bg: "oklch(0.7 0.18 70)", text: "text-yellow-400", label: "PENDING" },
  expired: { bg: "oklch(0.65 0.22 15)", text: "text-red-400", label: "EXPIRED" },
  draft: { bg: "oklch(0.65 0.22 265)", text: "text-blue-400", label: "DRAFT" },
  archived: { bg: "oklch(0.5 0.1 265)", text: "text-white/40", label: "ARCHIVED" },
};

function renderCategoryIcon(cat: typeof LEGAL_CATEGORIES[0] | undefined) {
  if (!cat) return null;
  return <cat.icon size={16} className="text-white" />;
}

function renderStatusBadge(status: string) {
  const style = STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.draft;
  return <span className={`px-2 py-0.5 rounded text-[9px] font-display ${style.text}`} style={{ backgroundColor: style.bg + "20" }}>{style.label}</span>;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  alert(`${label} copied to clipboard`);
}

export default function LegalPanel() {
  const [activeTab, setActiveTab] = useState<"all" | "contracts" | "compliance" | "ip" | "corporate" | "employment" | "privacy" | "financial" | "disputes" | "settings">("all");
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem("legal_documents");
    return saved ? JSON.parse(saved) : SAMPLE_DOCUMENTS;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingDoc, setEditingDoc] = useState<typeof documents[0] | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ category: "contracts", title: "", parties: "", status: "draft", signed: "", expires: "", value: "", tags: "", content: "" });
  const [selectedDoc, setSelectedDoc] = useState<typeof documents[0] | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    localStorage.setItem("legal_documents", JSON.stringify(documents));
  }, [documents]);

  const filteredDocs = documents.filter(doc => {
    if (activeTab !== "all" && doc.category !== activeTab) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      doc.title.toLowerCase().includes(query) ||
      doc.parties.toLowerCase().includes(query) ||
      doc.tags.some((t: string) => t.toLowerCase().includes(query))
    );
  });

  const getCategoryInfo = (catId: string) => LEGAL_CATEGORIES.find(c => c.id === catId);

  const getStatusStyle = (status: string) => STATUS_STYLES[status as keyof typeof STATUS_STYLES] || STATUS_STYLES.draft;

  const handleAddDoc = () => {
    const doc = {
      id: Date.now().toString(),
      ...newDoc,
      tags: newDoc.tags.split(",").map(t => t.trim()).filter(Boolean),
      signed: newDoc.signed || new Date().toISOString().split("T")[0],
    };
    setDocuments(prev => [...prev, doc]);
    setNewDoc({ category: "contracts", title: "", parties: "", status: "draft", signed: "", expires: "", value: "", tags: "", content: "" });
    setShowAddModal(false);
  };

  const deleteDoc = (id: string) => {
    if (confirm("Delete this document permanently?")) {
      setDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  const duplicateDoc = (doc: typeof documents[0]) => {
    const newDoc = { ...doc, id: Date.now().toString(), title: doc.title + " (Copy)", status: "draft" as const };
    setDocuments(prev => [...prev, newDoc]);
  };

  const renderSettingsTab = () => (
    <div className="space-y-4 p-2">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl border border-white/8 p-4"
      >
        <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Legal Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/70 mb-2 block">Default Jurisdiction</label>
            <select className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 focus:outline-none focus:border-primary/40">
              <option value="DE">Delaware, US</option>
              <option value="CA">California, US</option>
              <option value="NY">New York, US</option>
              <option value="UK">United Kingdom</option>
              <option value="EU">European Union</option>
            </select>
          </div>
          <div className="border-t border-white/5 pt-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm text-white/70">Auto-track expiration dates</div>
                <div className="text-[10px] text-white/40">Alert 30/60/90 days before expiry</div>
              </div>
              <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
            </label>
          </div>
          <div className="border-t border-white/5 pt-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm text-white/70">E-signature integration</div>
                <div className="text-[10px] text-white/40">DocuSign / HelloSign / Adobe Sign</div>
              </div>
              <input type="checkbox" className="w-4 h-4 accent-primary" />
            </label>
          </div>
          <div className="border-t border-white/5 pt-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm text-white/70">Version control</div>
                <div className="text-[10px] text-white/40">Track document revisions automatically</div>
              </div>
              <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
            </label>
          </div>
          <div className="border-t border-white/5 pt-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-sm text-white/70">OCR for scanned docs</div>
                <div className="text-[10px] text-white/40">Extract text from PDFs/images</div>
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
        <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Integrations</h3>
        <div className="space-y-3">
          {[
            { name: "DocuSign", desc: "E-signature workflows", connected: true },
            { name: "HelloSign", desc: "Document signing", connected: false },
            { name: "Adobe Sign", desc: "Enterprise e-signatures", connected: false },
            { name: "Ironclad", desc: "CLM platform", connected: false },
            { name: "ContractWorks", desc: "Contract management", connected: false },
          ].map((int, i) => (
            <label key={int.name} className="flex items-center justify-between cursor-pointer p-3 glass rounded-lg border border-white/5 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: int.connected ? "oklch(0.7 0.18 70)" : "rgba(255,255,255,0.05)" }}>
                  <CheckCircle size={14} className={int.connected ? "text-white" : "text-transparent"} />
                </div>
                <div>
                  <div className="text-sm text-white/80">{int.name}</div>
                  <div className="text-[10px] text-white/40">{int.desc}</div>
                </div>
              </div>
              <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked={int.connected} />
            </label>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl border border-white/8 p-4"
      >
        <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "MSA Template", "NDA Template", "SOW Template", "DP Template",
            "Employment Agreement", "Contractor Agreement", "Terms of Service", "Privacy Policy"
          ].map((tmpl, i) => (
            <button key={tmpl} className="w-full flex items-center gap-3 p-3 glass rounded-lg border border-white/5 hover:border-primary/20 transition-all text-start">
              <FileText size={16} className="text-white/50" />
              <span className="text-sm text-white/70">{tmpl}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[60vh] flex items-center justify-center"
    >
      <div className="glass rounded-xl border border-white/8 p-8 text-center max-w-md">
        <div className="w-16 h-16 rounded-full glass-crimson flex items-center justify-center mx-auto mb-4 glow-crimson">
          <FileText size={28} className="text-primary" />
        </div>
        <h3 className="font-display text-lg text-white/80 tracking-wider mb-2">
          {activeTab === "all" ? "No Documents" : `No ${LEGAL_CATEGORIES.find(c => c.id === activeTab)?.label} Documents`}
        </h3>
        <p className="text-sm text-white/40 mb-6">
          {activeTab === "all" 
            ? "Add your first contract, compliance doc, or legal record"
            : `Create a new ${LEGAL_CATEGORIES.find(c => c.id === activeTab)?.label.toLowerCase()} document`}
        </p>
        <button
          onClick={() => { setNewDoc({ ...newDoc, category: activeTab !== "all" ? activeTab : "contracts" }); setShowAddModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all mx-auto"
        >
          <Plus size={12} /> ADD FIRST DOCUMENT
        </button>
      </div>
    </motion.div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {filteredDocs.map((doc, i) => {
        const cat = getCategoryInfo(doc.category);
        const statusStyle = getStatusStyle(doc.status);
        return (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className={`relative glass rounded-xl border border-white/8 p-4 transition-all hover:border-primary/20 ${doc.status === "active" || doc.status === "current" ? "border-primary/20 bg-primary/5" : ""}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat?.color }}>
                  {renderCategoryIcon(cat)}
                </div>
                <div>
                  <div className="font-medium text-sm text-white/80 truncate max-w-[200px]">{doc.title}</div>
                  <div className="text-[10px] text-white/30 font-display tracking-wider" style={{ color: cat?.color }}>
                    {cat?.label.toUpperCase()}
                  </div>
                </div>
              </div>
              {renderStatusBadge(doc.status)}
            </div>

            <div className="space-y-2 mb-3 text-sm text-white/60">
              <div className="flex items-center gap-1.5">
                <Users size={12} className="text-white/40" />
                <span className="truncate">{doc.parties}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={12} className="text-white/40" />
                <span>Signed: {doc.signed}</span>
                {doc.expires !== "Perpetual" && doc.expires !== "Next review" && (
                  <>
                    <span className="text-white/30">→</span>
                    <span>Expires: {doc.expires}</span>
                  </>
                )}
              </div>
              {doc.value !== "N/A" && (
                <div className="flex items-center gap-1.5">
                  <Banknote size={12} className="text-white/40" />
                  <span className="font-medium" style={{ color: "oklch(0.7 0.18 70)" }}>{doc.value}</span>
                </div>
              )}
              {doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {doc.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 rounded text-[9px] font-display text-white/50 bg-white/5">{tag}</span>
                  ))}
                  {doc.tags.length > 3 && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-display text-white/40 bg-white/5">+{doc.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/5">
              <div className="flex items-center gap-1">
                <button onClick={() => { setSelectedDoc(doc); setShowViewer(true); }} className="w-8 h-8 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all" title="View">
                  <Eye size={12} />
                </button>
                <button onClick={() => duplicateDoc(doc)} className="w-8 h-8 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all" title="Duplicate">
                  <Copy size={12} />
                </button>
                <button onClick={() => setEditingDoc(doc)} className="w-8 h-8 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all" title="Edit">
                  <PenTool size={12} />
                </button>
                <button onClick={() => deleteDoc(doc.id)} className="w-8 h-8 rounded flex items-center justify-center text-white/40 hover:text-red-400 transition-all" title="Delete">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredDocs.map((doc, i) => {
        const cat = getCategoryInfo(doc.category);
        const statusStyle = getStatusStyle(doc.status);
        return (
          <motion.div
            key={doc.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`glass rounded-lg p-3 border border-white/5 flex items-center gap-4 transition-all hover:border-primary/20 ${doc.status === "active" || doc.status === "current" ? "border-primary/20 bg-primary/5" : ""}`}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: cat?.color }}>
              {renderCategoryIcon(cat)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-white/80 truncate">{doc.title}</span>
                {renderStatusBadge(doc.status)}
              </div>
              <div className="flex items-center gap-4 text-[10px] text-white/40">
                <span>{cat?.label}</span>
                <span>{doc.parties}</span>
                <span>Signed: {doc.signed}</span>
                {doc.value !== "N/A" && <span style={{ color: "oklch(0.7 0.18 70)" }}>{doc.value}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => { setSelectedDoc(doc); setShowViewer(true); }} className="w-8 h-8 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all" title="View">
                <Eye size={12} />
              </button>
              <button onClick={() => duplicateDoc(doc)} className="w-8 h-8 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all" title="Duplicate">
                <Copy size={12} />
              </button>
              <button onClick={() => setEditingDoc(doc)} className="w-8 h-8 rounded flex items-center justify-center text-white/40 hover:text-primary transition-all" title="Edit">
                <PenTool size={12} />
              </button>
              <button onClick={() => deleteDoc(doc.id)} className="w-8 h-8 rounded flex items-center justify-center text-white/40 hover:text-red-400 transition-all" title="Delete">
                <Trash2 size={12} />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );

  const renderDocumentsTab = () => (
    <div className="p-2">
      {filteredDocs.length === 0 ? renderEmptyState() : (viewMode === "grid" ? renderGridView() : renderListView())}
    </div>
  );

  return (
    <PanelLayout
      title="Legal"
      subtitle="Contracts, compliance, IP & corporate documents"
      icon={<Scale size={18} />}
      actions={
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg glass border border-white/8 flex items-center justify-center text-white/50 hover:text-primary transition-all" onClick={() => setViewMode(v => v === "grid" ? "list" : "grid")} title={viewMode === "grid" ? "List view" : "Grid view"}>
            {viewMode === "grid" ? <List size={14} /> : <Grid size={14} />}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all" onClick={() => { setNewDoc({ ...newDoc, category: activeTab !== "all" ? activeTab : "contracts" }); setShowAddModal(true); }}>
            <Plus size={12} /> NEW DOC
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
              {documents.length}
            </span>
          </button>
          {LEGAL_CATEGORIES.map((cat) => (
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
                {documents.filter(d => d.category === cat.id).length}
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
              placeholder="Search documents..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "settings" ? renderSettingsTab() : renderDocumentsTab()}
        </div>

        {/* Add Document Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowAddModal(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative glass rounded-xl border border-white/8 w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-display text-sm text-white/80 tracking-wider">Add New Document</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 transition-all">
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Category</label>
                    <select
                      value={newDoc.category}
                      onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                      className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 focus:outline-none focus:border-primary/40"
                    >
                      {LEGAL_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Title *</label>
                    <input
                      type="text"
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      placeholder="e.g., Master Services Agreement, NDA, Employment Contract"
                      className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Parties</label>
                    <input
                      type="text"
                      value={newDoc.parties}
                      onChange={(e) => setNewDoc({ ...newDoc, parties: e.target.value })}
                      placeholder="Company A × Company B"
                      className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">Status</label>
                      <select
                        value={newDoc.status}
                        onChange={(e) => setNewDoc({ ...newDoc, status: e.target.value })}
                        className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 focus:outline-none focus:border-primary/40"
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">Value</label>
                      <input
                        type="text"
                        value={newDoc.value}
                        onChange={(e) => setNewDoc({ ...newDoc, value: e.target.value })}
                        placeholder="$120,000/yr or N/A"
                        className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">Signed Date</label>
                      <input
                        type="date"
                        value={newDoc.signed}
                        onChange={(e) => setNewDoc({ ...newDoc, signed: e.target.value })}
                        className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 focus:outline-none focus:border-primary/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-white/70 mb-1 block">Expires Date</label>
                      <input
                        type="date"
                        value={newDoc.expires}
                        onChange={(e) => setNewDoc({ ...newDoc, expires: e.target.value })}
                        className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 focus:outline-none focus:border-primary/40"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={newDoc.tags}
                      onChange={(e) => setNewDoc({ ...newDoc, tags: e.target.value })}
                      placeholder="MSA, Enterprise, Auto-renew"
                      className="w-full h-10 px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white/70 mb-1 block">Content</label>
                    <textarea
                      value={newDoc.content}
                      onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                      placeholder="Full document text..."
                      rows={6}
                      className="w-full px-3 text-sm bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40 resize-none"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-white/5 flex justify-end gap-2">
                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg glass border border-white/5 text-sm text-white/70 hover:border-primary/20 hover:text-white transition-all">CANCEL</button>
                <button onClick={handleAddDoc} disabled={!newDoc.title || !newDoc.parties} className="px-4 py-2 rounded-lg glass-crimson text-primary text-sm font-display hover:glow-crimson-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">SAVE DOCUMENT</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Document Viewer Modal */}
        {showViewer && selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setShowViewer(false); setSelectedDoc(null); }}>
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative glass rounded-xl border border-white/8 w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: getCategoryInfo(selectedDoc.category)?.color }}>
                    {(() => {
                      const Icon = getCategoryInfo(selectedDoc.category)?.icon;
                      return Icon ? <Icon size={14} className="text-white" /> : null;
                    })()}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-white/80">{selectedDoc.title}</div>
                    <div className="text-[10px] text-white/40">{getCategoryInfo(selectedDoc.category)?.label}</div>
                  </div>
                </div>
                <button onClick={() => { setShowViewer(false); setSelectedDoc(null); }} className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 transition-all">
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[70vh]">
                <div className="space-y-3 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-white/40">Parties:</span> <span className="text-white/70">{selectedDoc.parties}</span></div>
                    <div><span className="text-white/40">Status:</span> <span className={`${getStatusStyle(selectedDoc.status).text} font-medium`}>{getStatusStyle(selectedDoc.status).label}</span></div>
                    <div><span className="text-white/40">Signed:</span> <span className="text-white/70">{selectedDoc.signed}</span></div>
                    <div><span className="text-white/40">Expires:</span> <span className="text-white/70">{selectedDoc.expires}</span></div>
                    <div className="md:col-span-2"><span className="text-white/40">Value:</span> <span className="text-white/70">{selectedDoc.value}</span></div>
                    <div className="md:col-span-2"><span className="text-white/40">Tags:</span> <span className="text-white/70">{selectedDoc.tags.join(", ")}</span></div>
                  </div>
                  <div className="glass-crimson/30 rounded-lg p-4 border border-primary/20">
                    <h4 className="font-display text-sm text-primary/70 tracking-wider mb-2">Document Content</h4>
                    <pre className="text-sm text-white/70 whitespace-pre-wrap font-mono max-h-[50vh] overflow-y-auto">{selectedDoc.content}</pre>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-white/5 flex justify-end gap-2">
                <button onClick={() => copyToClipboard(selectedDoc.content, "Document")} className="px-4 py-2 rounded-lg glass border border-white/5 text-sm text-white/70 hover:border-primary/20 hover:text-white transition-all">
                  <Copy size={12} className="mr-1" /> COPY TEXT
                </button>
                <button onClick={() => { /* download */ }} className="px-4 py-2 rounded-lg glass border border-white/5 text-sm text-white/70 hover:border-primary/20 hover:text-white transition-all">
                  <Download size={12} className="mr-1" /> DOWNLOAD
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Document Modal */}
        {editingDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setEditingDoc(null)}>
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative glass rounded-xl border border-white/8 w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-display text-sm text-white/80 tracking-wider">Edit Document</h3>
                <button onClick={() => setEditingDoc(null)} className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 transition-all">
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