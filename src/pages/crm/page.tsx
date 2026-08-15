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
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const STATUSES = ["Lead", "Prospect", "Client", "Inactive"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_COLORS: Record<Status, string> = {
  Lead: "text-primary border-primary/30",
  Prospect: "text-yellow-400 border-yellow-400/30",
  Client: "text-emerald-400 border-emerald-400/30",
  Inactive: "text-white/30 border-white/15",
};

type Contact = {
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
};

const LABEL_COLOR = "oklch(0.75 0.15 175)";
const TITLE_STYLE = {
  color: "oklch(0.62 0.22 20)",
  textShadow: "0 0 10px oklch(0.55 0.22 20 / 60%)",
};

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

function ContactDetailPanel({ contact }: { contact: Contact | null }) {
  if (!contact) {
    return (
      <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full glass-crimson flex items-center justify-center mx-auto mb-4 glow-crimson">
            <Briefcase size={22} className="text-primary/60" />
          </div>
          <div className="text-sm text-white/30 mb-1">
            Select a lead to view profile
          </div>
          <div className="text-xs text-white/15">
            Owner, status, deal value, enrichment data & more
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full glass-crimson flex items-center justify-center shrink-0 glow-crimson">
            <Briefcase size={22} className="text-primary/70" />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-base font-display text-white/80 truncate"
              style={TITLE_STYLE}
            >
              {contact.name}
            </div>
            <div className="text-xs text-white/40 mt-0.5 truncate">
              {contact.title} @ {contact.company}
            </div>
          </div>
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-display border ${STATUS_COLORS[contact.status]}`}
          >
            {contact.status.toUpperCase()}
          </span>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {[
            { icon: <Mail size={11} />, label: "EMAIL" },
            { icon: <Phone size={11} />, label: "CALL" },
            { icon: <Tag size={11} />, label: "TAG" },
          ].map((btn) => (
            <button
              key={btn.label}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-white/40 text-xs font-display hover:text-white/70 transition-all border border-white/8"
            >
              {btn.icon} {btn.label}
            </button>
          ))}
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
            <Sparkles size={11} /> ENRICH
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-5">
          {/* Contact info */}
          <div className="flex flex-col gap-3">
            <div
              className="text-[9px] font-display tracking-wider"
              style={{ color: LABEL_COLOR }}
            >
              CONTACT INFO
            </div>
            <DetailField
              label="EMAIL"
              value={contact.email}
              icon={<Mail size={9} />}
            />
            <DetailField
              label="PHONE"
              value={contact.phone}
              icon={<Phone size={9} />}
            />
            <DetailField
              label="LOCATION"
              value={contact.location}
              icon={<MapPin size={9} />}
            />
            <DetailField label="OWNER" value={contact.owner} icon={<Users size={9} />} />
            <DetailField
              label="SOURCE"
              value={contact.source}
              icon={<Filter size={9} />}
            />
          </div>

          {/* Deal / tracking */}
          <div className="flex flex-col gap-3">
            <div
              className="text-[9px] font-display tracking-wider"
              style={{ color: LABEL_COLOR }}
            >
              DEAL & TRACKING
            </div>
            <DetailField
              label="DEAL VALUE"
              value={contact.dealValue}
              icon={<DollarSign size={9} />}
            />
            <DetailField
              label="LAST CONTACTED"
              value={contact.lastContacted}
              icon={<Clock size={9} />}
            />
            <DetailField
              label="NEXT FOLLOW-UP"
              value={contact.nextFollowUp}
              icon={<Calendar size={9} />}
            />
          </div>

          {/* Enrichment */}
          <div className="col-span-2 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div
                className="text-[9px] font-display tracking-wider"
                style={{ color: LABEL_COLOR }}
              >
                ENRICHMENT DATA
              </div>
              <span
                className={`text-[8px] px-1.5 py-0.5 rounded-full font-display border ${
                  contact.enriched
                    ? "text-emerald-400 border-emerald-400/30"
                    : "text-white/25 border-white/15"
                }`}
              >
                {contact.enriched ? "ENRICHED" : "NOT ENRICHED"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <DetailField
                label="LINKEDIN"
                value={contact.linkedin}
                icon={<Link2 size={9} />}
              />
              <DetailField
                label="TWITTER"
                value={contact.twitter}
                icon={<Link2 size={9} />}
              />
              <DetailField
                label="WEBSITE"
                value={contact.website}
                icon={<Globe size={9} />}
              />
              <DetailField
                label="INDUSTRY"
                value={contact.industry}
                icon={<Building2 size={9} />}
              />
              <DetailField
                label="REVENUE RANGE"
                value={contact.revenueRange}
                icon={<DollarSign size={9} />}
              />
              <DetailField
                label="EMPLOYEE COUNT"
                value={contact.employeeCount}
                icon={<Users size={9} />}
              />
            </div>
          </div>
        </div>

        {contact.notes && (
          <div className="mt-5 flex flex-col gap-2">
            <div
              className="text-[9px] font-display tracking-wider"
              style={{ color: LABEL_COLOR }}
            >
              NOTES
            </div>
            <div className="text-xs text-white/50 leading-relaxed glass rounded-lg p-3 border border-white/8">
              {contact.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CrmPanel() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [contacts] = useState<Contact[]>([]);

  const filtered = contacts.filter(
    (c) =>
      (statusFilter === "All" || c.status === statusFilter) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <PanelLayout
      title="CRM"
      subtitle="Business contacts, lead pipeline & tracking"
      icon={<Briefcase size={18} />}
      actions={
        <div className="flex gap-2">
          <Filter size={12} />
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all">
            <Upload size={12} /> IMPORT
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all border border-white/8">
            <Sparkles size={12} /> ENRICH
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
            <Plus size={12} /> ADD LEAD
          </button>
        </div>
      }
    >
      <div className="h-full flex gap-4">
        {/* List panel */}
        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20"
            />
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
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Briefcase size={22} className="mx-auto text-white/10 mb-2" />
                  <div className="text-xs text-white/20">No leads yet</div>
                  <div className="text-[10px] text-white/12 mt-1">
                    Import or add manually
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContact(c)}
                    className={`w-full text-left px-2 py-2 rounded-lg transition-colors ${
                      selectedContact?.id === c.id
                        ? "glass-crimson border border-primary/20"
                        : "hover:bg-white/3 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full glass-crimson flex items-center justify-center shrink-0">
                        <Briefcase size={12} className="text-primary/60" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/70 truncate">
                          {c.name}
                        </div>
                        <div className="text-[10px] text-white/30 truncate">
                          {c.company}
                        </div>
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

        {/* Detail view */}
        <ContactDetailPanel contact={selectedContact} />
      </div>
    </PanelLayout>
  );
}
