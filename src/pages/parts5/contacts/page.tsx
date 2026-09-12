import {
  Users, Search, Plus, Upload, Download, Star, Mail, Phone, MapPin,
  Sparkles, Globe, Link2, Briefcase, DollarSign,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const LABEL_COLOR = "oklch(0.75 0.15 175)";
const TITLE_STYLE = {
  color: "oklch(0.62 0.22 20)",
  textShadow: "0 0 10px oklch(0.55 0.22 20 / 60%)",
};

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  birthday: string;
  notes: string;
  enriched: boolean;
  linkedin: string;
  twitter: string;
  company: string;
  title: string;
  industry: string;
  revenueRange: string;
  website: string;
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
      <div className="text-[11px] text-white/60">{value || "—"}</div>
    </div>
  );
}

function ContactDetail({ contact }: { contact: Contact | null }) {
  if (!contact) {
    return (
      <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 rounded-full glass-crimson flex items-center justify-center mx-auto mb-4 glow-crimson">
            <Users size={28} className="text-primary/60" />
          </div>
          <div className="text-sm text-white/30 mb-1">Select a contact to view profile</div>
          <div className="text-xs text-white/15">Fields: Name, Phone, Email, Address,</div>
          <div className="text-xs text-white/15">Socials, Birthday, Notes & enrichment</div>

          <div className="mt-6 grid grid-cols-2 gap-2 text-left">
            {[
              { icon: <Phone size={10} />, label: "Phone" },
              { icon: <Mail size={10} />, label: "Email" },
              { icon: <MapPin size={10} />, label: "Address" },
              { icon: <Star size={10} />, label: "Birthday" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-1.5 p-2 glass rounded border border-white/5">
                <span className="text-white/20">{f.icon}</span>
                <span className="text-[10px] text-white/25">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 glass rounded-xl border border-white/8 flex flex-col overflow-hidden">
      {/* Profile header */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full glass-crimson flex items-center justify-center shrink-0 glow-crimson">
            <Users size={22} className="text-primary/70" />
          </div>
          <div>
            <div className="text-base font-display text-white/80" style={TITLE_STYLE}>
              {contact.name}
            </div>
            <div className="text-xs text-white/40 mt-0.5">
              {contact.title && contact.company
                ? `${contact.title} @ ${contact.company}`
                : contact.company || contact.title || ""}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-white/40 text-xs font-display hover:text-white/70 transition-all border border-white/8">
            <Upload size={11} /> IMPORT
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass text-white/40 text-xs font-display hover:text-white/70 transition-all border border-white/8">
            <Download size={11} /> EXPORT
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
            <Sparkles size={11} /> ENRICH
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-2 gap-5">
          {/* Contact info */}
          <div className="flex flex-col gap-3">
            <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
              CONTACT INFO
            </div>
            <DetailField label="PHONE" value={contact.phone} icon={<Phone size={9} />} />
            <DetailField label="EMAIL" value={contact.email} icon={<Mail size={9} />} />
            <DetailField label="ADDRESS" value={contact.address} icon={<MapPin size={9} />} />
            <DetailField label="BIRTHDAY" value={contact.birthday} icon={<Star size={9} />} />
          </div>

          {/* Enrichment */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
                ENRICHMENT
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
              <button className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all w-full">
                <Sparkles size={11} /> ENRICH NOW
              </button>
            )}

            <DetailField label="LINKEDIN" value={contact.linkedin} icon={<Link2 size={9} />} />
            <DetailField label="TWITTER" value={contact.twitter} icon={<Link2 size={9} />} />
            <DetailField label="COMPANY" value={contact.company} icon={<Briefcase size={9} />} />
            <DetailField label="TITLE" value={contact.title} icon={<Users size={9} />} />
            <DetailField label="INDUSTRY" value={contact.industry} icon={<Briefcase size={9} />} />
            <DetailField label="REVENUE" value={contact.revenueRange} icon={<DollarSign size={9} />} />
            <DetailField label="WEBSITE" value={contact.website} icon={<Globe size={9} />} />
          </div>
        </div>

        {contact.notes && (
          <div className="mt-5 flex flex-col gap-2">
            <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
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

export default function ContactsPanel() {
  const [contacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PanelLayout
      title="Contacts"
      subtitle="Personal address book"
      icon={<Users size={18} />}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all">
            <Upload size={12} /> IMPORT
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all">
            <Download size={12} /> EXPORT
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/50 text-xs font-display hover:text-white/80 transition-all border border-white/8">
            <Sparkles size={12} /> ENRICH
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
            <Plus size={12} /> ADD
          </button>
        </div>
      }
    >
      <div className="h-full flex gap-4">
        {/* Sidebar */}
        <div className="w-64 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full h-8 pl-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
            />
          </div>
          <div className="glass rounded-xl border border-white/8 p-2 overflow-y-auto flex-1">
            <div className="text-[9px] text-white/20 font-display tracking-widest px-2 mb-2">
              ALL CONTACTS
            </div>
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Users size={22} className="mx-auto text-white/10 mb-2" />
                  <div className="text-xs text-white/20">No contacts yet</div>
                  <div className="text-[10px] text-white/12 mt-1">Import or add manually</div>
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
                        <Users size={12} className="text-primary/60" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-white/70 truncate">{c.name}</div>
                        <div className="text-[10px] text-white/30 truncate">{c.email}</div>
                      </div>
                      {c.enriched && (
                        <Sparkles size={9} className="text-primary/50 shrink-0 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail view */}
        <ContactDetail contact={selected} />
      </div>
    </PanelLayout>
  );
}
