import {
  Briefcase, Search, Plus, Upload, Filter, Tag, Mail, Phone,
  Sparkles, Globe, Users, MapPin, DollarSign,
  Calendar, Clock, Link2,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const STATUSES = ["Lead", "Prospect", "Client", "Inactive"] as const;
type Status = typeof STATUSES[number];

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
  emails: string[];
  phones: string[];
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
  technologies: string[];
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
      <div className="text-[9px] font-display tracking-wider flex items-center gap-1" style={{ color: LABEL_COLOR }}>
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
      <div className="w-72 shrink-0 glass rounded-xl border border-white/8 flex flex-col">
        <div className="p-3 border-b border-white/5">
          <span className="text-[10px] text-white/30 font-display tracking-wider">CONTACT DETAIL</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Briefcase size={22} className="mx-auto text-white/10 mb-2" />
            <div className="text-xs text-white/20">Select a contact</div>
            <div className="text-[10px] text-white/12 mt-1">
              Owner, POC, Status, Last Contacted,<br />enrichment data & more
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 shrink-0 glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-white/5">
        <span className="text-[10px] text-white/30 font-display tracking-wider">CONTACT DETAIL</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
        {/* Identity */}
        <div className="flex flex-col gap-2">
          <div className="text-sm font-display text-white/80" style={TITLE_STYLE}>
            {contact.name}
          </div>
          <div className="text-[11px] text-white/45">{contact.title} @ {contact.company}</div>
          <div className="flex flex-col gap-1">
            {contact.emails.map((e) => (
              <div key={e} className="flex items-center gap-1.5 text-[10px] text-white/50">
                <Mail size={9} className="text-white/25 shrink-0" /> {e}
              </div>
            ))}
            {contact.phones.map((p) => (
              <div key={p} className="flex items-center gap-1.5 text-[10px] text-white/50">
                <Phone size={9} className="text-white/25 shrink-0" /> {p}
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 flex-wrap">
          {[
            { icon: <Mail size={9} />, label: "EMAIL" },
            { icon: <Phone size={9} />, label: "CALL" },
            { icon: <Tag size={9} />, label: "TAG" },
          ].map((btn) => (
            <button
              key={btn.label}
              className="flex items-center gap-1 glass px-2 py-1 rounded text-[9px] text-white/40 hover:text-white/70 font-display transition-colors border border-white/8"
            >
              {btn.icon} {btn.label}
            </button>
          ))}
          <button className="flex items-center gap-1 glass-crimson px-2 py-1 rounded text-[9px] text-primary hover:glow-crimson-sm font-display transition-all border border-primary/20">
            <Sparkles size={9} /> ENRICH
          </button>
        </div>

        {/* Timeline */}
        <div className="flex flex-col gap-2">
          <DetailField label="LAST CONTACTED" value={contact.lastContacted} icon={<Clock size={9} />} />
          <DetailField label="NEXT FOLLOW-UP" value={contact.nextFollowUp} icon={<Calendar size={9} />} />
        </div>

        {/* Enrichment section */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
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

          {!contact.enriched && (
            <div className="glass rounded-lg p-2.5 border border-white/8 text-[10px] text-white/35 leading-relaxed">
              Connect ZoomInfo, Hunter.io, or Clay for auto-enrichment
            </div>
          )}

          <div className="flex flex-col gap-2">
            <DetailField label="LINKEDIN" value={contact.linkedin} icon={<Link2 size={9} />} />
            <DetailField label="TWITTER" value={contact.twitter} icon={<Link2 size={9} />} />
            <DetailField label="WEBSITE" value={contact.website} icon={<Globe size={9} />} />
            <DetailField label="INDUSTRY" value={contact.industry} icon={<Briefcase size={9} />} />
            <DetailField label="REVENUE RANGE" value={contact.revenueRange} icon={<DollarSign size={9} />} />
            <DetailField label="EMPLOYEE COUNT" value={contact.employeeCount} icon={<Users size={9} />} />
            <DetailField label="LOCATION" value={contact.location} icon={<MapPin size={9} />} />
          </div>

          {contact.technologies.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
                TECHNOLOGIES
              </div>
              <div className="flex flex-wrap gap-1">
                {contact.technologies.map((t) => (
                  <span key={t} className="text-[9px] px-1.5 py-0.5 glass rounded-full text-white/40 border border-white/8">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CrmPanel() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contacts] = useState<Contact[]>([]);

  const contactsByStatus = (status: Status) =>
    contacts.filter((c) => c.status === status);

  return (
    <PanelLayout
      title="CRM"
      subtitle="Business contacts & lead pipeline"
      icon={<Briefcase size={18} />}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all">
            <Filter size={12} /> FILTER
          </button>
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
        {/* Pipeline view */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Search + status filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                placeholder="Search CRM..."
                className="w-full h-8 pl-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="flex gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  className={`text-[9px] px-2.5 py-1 rounded-full border font-display tracking-wider transition-colors hover:bg-white/5 ${STATUS_COLORS[s]}`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Board columns */}
          <div className="flex-1 grid grid-cols-4 gap-3 overflow-hidden">
            {STATUSES.map((status) => {
              const cols = contactsByStatus(status);
              return (
                <div key={status} className="glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-white/5 flex items-center justify-between">
                    <span className={`text-[10px] font-display tracking-wider ${STATUS_COLORS[status]}`}>
                      {status.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-white/20 glass px-1.5 py-0.5 rounded-full">
                      {cols.length}
                    </span>
                  </div>
                  <div className="flex-1 p-2 overflow-y-auto flex flex-col gap-1.5">
                    {cols.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedContact(c)}
                        className={`w-full text-left p-2 rounded-lg glass border transition-colors ${
                          selectedContact?.id === c.id
                            ? "border-primary/30 bg-primary/5"
                            : "border-white/8 hover:border-white/15"
                        }`}
                      >
                        <div className="text-[11px] text-white/70 font-medium">{c.name}</div>
                        <div className="text-[10px] text-white/35">{c.company}</div>
                        {c.enriched && (
                          <div className="flex items-center gap-0.5 mt-1">
                            <Sparkles size={8} className="text-primary/60" />
                            <span className="text-[8px] text-primary/50">Enriched</span>
                          </div>
                        )}
                      </button>
                    ))}
                    <button className="w-full py-3 border border-dashed border-white/8 rounded-lg text-[10px] text-white/15 hover:border-primary/25 hover:text-primary/40 transition-colors font-display">
                      + ADD {status.toUpperCase()}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        <ContactDetailPanel contact={selectedContact} />
      </div>
    </PanelLayout>
  );
}
