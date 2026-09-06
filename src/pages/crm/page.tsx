import { useState, useEffect, useMemo } from "react";
import {
  Briefcase,
  Search,
  Plus,
  Upload,
  Filter,
  Tag,
  Mail,
  Phone,
  Sparkles,
  Globe,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Link2,
  Building2,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const LS_KEY = "lifeos_crm_leads_v2";

const STATUSES = ["Lead", "Prospect", "Client", "Inactive"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_COLORS: Record<Status, string> = {
  Lead: "text-primary border-primary/30",
  Prospect: "text-yellow-400 border-yellow-400/30",
  Client: "text-emerald-400 border-emerald-400/30",
  Inactive: "text-white/30 border-white/15",
};

export type Lead = {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  status: Status;
  lastContacted: string;
  nextFollowUp: string;
  enriched: boolean;
  linkedin: string;
  twitter: string;
  website: string;
  industry: string;
  revenueRange: string;
  employeeCount: string;
  location: string;
  owner: string;
  source: string;
  dealValue: string;
  notes: string;
  createdAt: string;
};

const EMPTY: Lead = {
  id: "",
  name: "",
  company: "",
  title: "",
  email: "",
  phone: "",
  status: "Lead",
  lastContacted: "",
  nextFollowUp: "",
  enriched: false,
  linkedin: "",
  twitter: "",
  website: "",
  industry: "",
  revenueRange: "",
  employeeCount: "",
  location: "",
  owner: "",
  source: "",
  dealValue: "",
  notes: "",
  createdAt: "",
};

const LABEL_COLOR = "oklch(0.75 0.15 175)";
const TITLE_STYLE = {
  color: "oklch(0.62 0.22 20)",
  textShadow: "0 0 10px oklch(0.55 0.22 20 / 60%)",
};

function loadLocal(): Lead[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(list: Lead[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("saveLocal failed", e);
  }
}

function DetailField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div
        className="text-[9px] font-display tracking-wider flex items-center gap-1"
        style={{ color: LABEL_COLOR }}
      >
        {icon && <span>{icon}</span>}
        {label}
      </div>
      <div className="text-[11px] text-white/60 truncate">{value || "—"}</div>
    </div>
  );
}

function LeadDetail({
  lead,
  onEdit,
  onDelete,
}: {
  lead: Lead | null;
  onEdit: (l: Lead) => void;
  onDelete: (id: string) => void;
}) {
  if (!lead) {
    return (
      <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full glass-crimson flex items-center justify-center mx-auto mb-4 glow-crimson">
            <Briefcase size={22} className="text-primary/60" />
          </div>
          <div className="text-sm text-white/30 mb-1">Select a lead to view profile</div>
          <div className="text-xs text-white/15">
            Owner, status, deal value, enrichment data & more
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full glass-crimson flex items-center justify-center shrink-0 glow-crimson">
            <Briefcase size={22} className="text-primary/70" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-display text-white/80 truncate" style={TITLE_STYLE}>
              {lead.name}
            </div>
            <div className="text-xs text-white/40 mt-0.5 truncate">
              {lead.title} @ {lead.company}
            </div>
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-display border ${STATUS_COLORS[lead.status]}`}>
            {lead.status.toUpperCase()}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(lead)}
              className="p-2 rounded-lg glass text-white/40 hover:text-primary transition-all border border-white/8"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(lead.id)}
              className="p-2 rounded-lg glass text-white/40 hover:text-red-400 transition-all border border-white/8"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-white/40 text-xs font-display hover:text-white/70 transition-all border border-white/8">
            <Mail size={11} /> EMAIL
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-white/40 text-xs font-display hover:text-white/70 transition-all border border-white/8">
            <Phone size={11} /> CALL
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-white/40 text-xs font-display hover:text-white/70 transition-all border border-white/8">
            <Tag size={11} /> TAG
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
            <Sparkles size={11} /> ENRICH
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-3">
            <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
              CONTACT INFO
            </div>
            <DetailField label="EMAIL" value={lead.email} icon={<Mail size={9} />} />
            <DetailField label="PHONE" value={lead.phone} icon={<Phone size={9} />} />
            <DetailField label="LOCATION" value={lead.location} icon={<MapPin size={9} />} />
            <DetailField label="OWNER" value={lead.owner} icon={<Users size={9} />} />
            <DetailField label="SOURCE" value={lead.source} icon={<Filter size={9} />} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
              DEAL & TRACKING
            </div>
            <DetailField label="DEAL VALUE" value={lead.dealValue} icon={<DollarSign size={9} />} />
            <DetailField label="LAST CONTACTED" value={lead.lastContacted} icon={<Clock size={9} />} />
            <DetailField label="NEXT FOLLOW-UP" value={lead.nextFollowUp} icon={<Calendar size={9} />} />
          </div>

          <div className="col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
                ENRICHMENT DATA
              </div>
              <span
                className={`text-[8px] px-1.5 py-0.5 rounded-full font-display border ${
                  lead.enriched
                    ? "text-emerald-400 border-emerald-400/30"
                    : "text-white/25 border-white/15"
                }`}
              >
                {lead.enriched ? "ENRICHED" : "NOT ENRICHED"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <DetailField label="LINKEDIN" value={lead.linkedin} icon={<Link2 size={9} />} />
              <DetailField label="TWITTER" value={lead.twitter} icon={<Link2 size={9} />} />
              <DetailField label="WEBSITE" value={lead.website} icon={<Globe size={9} />} />
              <DetailField label="INDUSTRY" value={lead.industry} icon={<Building2 size={9} />} />
              <DetailField label="REVENUE RANGE" value={lead.revenueRange} icon={<DollarSign size={9} />} />
              <DetailField label="EMPLOYEE COUNT" value={lead.employeeCount} icon={<Users size={9} />} />
            </div>
          </div>
        </div>

        {lead.notes && (
          <div className="mt-5 flex flex-col gap-2">
            <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
              NOTES
            </div>
            <div className="text-xs text-white/50 leading-relaxed glass rounded-lg p-3 border border-white/8">
              {lead.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CrmPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [form, setForm] = useState<Lead>({ ...EMPTY });

  useEffect(() => {
    const data = loadLocal();
    setLeads(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) saveLocal(leads);
  }, [leads, isLoading]);

  const filtered = useMemo(
    () =>
      leads.filter(
        (c) =>
          (statusFilter === "All" || c.status === statusFilter) &&
          (c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.company.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()))
      ),
    [leads, search, statusFilter]
  );

  function openAdd() {
    setEditing(null);
    setForm({
      ...EMPTY,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      status: "Lead",
    });
    setShowForm(true);
  }

  function openEdit(l: Lead) {
    setEditing(l);
    setForm({ ...l });
    setShowForm(true);
  }

  function saveLead() {
    if (!form.name.trim()) return;
    if (editing) {
      setLeads((prev) => prev.map((c) => (c.id === editing.id ? form : c)));
      setSelected(form);
    } else {
      setLeads((prev) => [form, ...prev]);
      setSelected(form);
    }
    setShowForm(false);
  }

  function deleteLead(id: string) {
    if (!confirm("Delete this lead?")) return;
    setLeads((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  return (
    <PanelLayout
      title="CRM"
      subtitle="Business contacts, lead pipeline & tracking"
      icon={<Briefcase size={18} />}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all">
            <Upload size={12} /> IMPORT
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all border border-white/8">
            <Sparkles size={12} /> ENRICH
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
          >
            <Plus size={12} /> ADD LEAD
          </button>
        </div>
      }
    >
      <div className="h-full flex gap-4">
        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-full h-8 pl-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(["All", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[9px] px-2.5 py-1 rounded-full border font-display tracking-wider transition-colors hover:bg-white/5 ${
                  statusFilter === s
                    ? STATUS_COLORS[s === "All" ? "Lead" : s]
                    : "text-white/25 border-white/10"
                }`}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="glass rounded-xl border border-white/8 p-2 overflow-y-auto flex-1">
            <div className="text-[9px] text-white/20 font-display tracking-widest px-2 mb-2">
              {filtered.length} LEADS
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-white/20 text-xs">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Briefcase size={22} className="mx-auto text-white/10 mb-2" />
                  <div className="text-xs text-white/20">No leads yet</div>
                  <button onClick={openAdd} className="mt-3 text-[10px] text-primary hover:underline">
                    + Add first lead
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`w-full text-left px-2 py-2 rounded-lg transition-colors ${
                      selected?.id === c.id
                        ? "glass-crimson border border-primary/20"
                        : "hover:bg-white/3 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full glass-crimson flex items-center justify-center shrink-0">
                        <Briefcase size={12} className="text-primary/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/70 truncate">{c.name}</div>
                        <div className="text-[10px] text-white/30 truncate">{c.company}</div>
                      </div>
                      <span
                        className={`text-[8px] px-1.5 py-0.5 rounded-full border shrink-0 ${STATUS_COLORS[c.status]}`}
                      >
                        {c.status.slice(0, 4).toUpperCase()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <LeadDetail lead={selected} onEdit={openEdit} onDelete={deleteLead} />
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: "oklch(0 0 0 / 80%)" }}
          onClick={() => setShowForm(false)}
        >
          <div
            className="glass rounded-2xl border w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
            style={{ borderColor: "oklch(0.55 0.22 20 / 25%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0.55 0.22 20 / 15%)" }}>
              <span className="font-display text-sm tracking-wider" style={TITLE_STYLE}>
                {editing ? "EDIT LEAD" : "ADD LEAD"}
              </span>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-primary">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              <div>
                <label className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
                  NAME *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full mt-1 h-8 px-3 text-xs rounded-lg text-white/85 bg-white/4 border border-white/8 focus:outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <label className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
                  COMPANY
                </label>
                <input
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  className="w-full mt-1 h-8 px-3 text-xs rounded-lg text-white/85 bg-white/4 border border-white/8 focus:outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <label className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
                  EMAIL
                </label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full mt-1 h-8 px-3 text-xs rounded-lg text-white/85 bg-white/4 border border-white/8 focus:outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <label className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
                  STATUS
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Status }))}
                  className="w-full mt-1 h-8 px-3 text-xs rounded-lg text-white/85 bg-white/4 border border-white/8 focus:outline-none focus:border-primary/40"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
                  DEAL VALUE
                </label>
                <input
                  value={form.dealValue}
                  onChange={(e) => setForm((f) => ({ ...f, dealValue: e.target.value }))}
                  placeholder="$0"
                  className="w-full mt-1 h-8 px-3 text-xs rounded-lg text-white/85 bg-white/4 border border-white/8 focus:outline-none focus:border-primary/40"
                />
              </div>
              <div>
                <label className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
                  NOTES
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 text-xs rounded-lg text-white/85 bg-white/4 border border-white/8 focus:outline-none focus:border-primary/40"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: "oklch(0.55 0.22 20 / 15%)" }}>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg glass text-white/50 text-xs font-display"
              >
                CANCEL
              </button>
              <button
                onClick={saveLead}
                className="px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}