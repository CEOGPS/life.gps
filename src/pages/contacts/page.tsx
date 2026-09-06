import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Upload,
  Download,
  Star,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Globe,
  Link2,
  Briefcase,
  DollarSign,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const LS_KEY = "lifeos_contacts_v2";

export type Contact = {
  id: string;
  name: string;
  phone: string;
  phone2: string;
  email: string;
  email2: string;
  address: string;
  birthday: string;
  notes: string;
  enriched: boolean;
  linkedin: string;
  twitter: string;
  instagram: string;
  facebook: string;
  company: string;
  title: string;
  industry: string;
  revenueRange: string;
  website: string;
  anniversary: string;
  relationship: string;
  createdAt: string;
};

const EMPTY: Contact = {
  id: "",
  name: "",
  phone: "",
  phone2: "",
  email: "",
  email2: "",
  address: "",
  birthday: "",
  notes: "",
  enriched: false,
  linkedin: "",
  twitter: "",
  instagram: "",
  facebook: "",
  company: "",
  title: "",
  industry: "",
  revenueRange: "",
  website: "",
  anniversary: "",
  relationship: "",
  createdAt: "",
};

const LABEL_COLOR = "oklch(0.75 0.15 175)";
const TITLE_STYLE = {
  color: "oklch(0.62 0.22 20)",
  textShadow: "0 0 10px oklch(0.55 0.22 20 / 60%)",
};

function loadLocal(): Contact[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveLocal(list: Contact[]) {
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
      <div className="text-[11px] text-white/60">{value || "—"}</div>
    </div>
  );
}

function ContactDetail({
  contact,
  onEdit,
  onDelete,
}: {
  contact: Contact | null;
  onEdit: (c: Contact) => void;
  onDelete: (id: string) => void;
}) {
  if (!contact) {
    return (
      <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="w-20 h-20 rounded-full glass-crimson flex items-center justify-center mx-auto mb-4 glow-crimson">
            <Users size={28} className="text-primary/60" />
          </div>
          <div className="text-sm text-white/30 mb-1">Select a contact to view profile</div>
          <div className="text-xs text-white/15">
            Fields: Name, Phone, Email, Address, Socials, Birthday, Notes & enrichment
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
            <Users size={22} className="text-primary/70" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-display text-white/80 truncate" style={TITLE_STYLE}>
              {contact.name}
            </div>
            <div className="text-xs text-white/40 mt-0.5 truncate">
              {contact.title && contact.company
                ? `${contact.title} @ ${contact.company}`
                : contact.company || contact.title || ""}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(contact)}
              className="p-2 rounded-lg glass text-white/40 hover:text-primary transition-all border border-white/8"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(contact.id)}
              className="p-2 rounded-lg glass text-white/40 hover:text-red-400 transition-all border border-white/8"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

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
          <div className="flex flex-col gap-3">
            <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
              CONTACT INFO
            </div>
            <DetailField label="PHONE" value={contact.phone} icon={<Phone size={9} />} />
            <DetailField label="PHONE 2" value={contact.phone2} icon={<Phone size={9} />} />
            <DetailField label="EMAIL" value={contact.email} icon={<Mail size={9} />} />
            <DetailField label="EMAIL 2" value={contact.email2} icon={<Mail size={9} />} />
            <DetailField label="ADDRESS" value={contact.address} icon={<MapPin size={9} />} />
            <DetailField label="BIRTHDAY" value={contact.birthday} icon={<Star size={9} />} />
            <DetailField label="ANNIVERSARY" value={contact.anniversary} icon={<Star size={9} />} />
            <DetailField label="RELATIONSHIP" value={contact.relationship} icon={<Users size={9} />} />
          </div>

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

            <DetailField label="LINKEDIN" value={contact.linkedin} icon={<Link2 size={9} />} />
            <DetailField label="TWITTER" value={contact.twitter} icon={<Link2 size={9} />} />
            <DetailField label="INSTAGRAM" value={contact.instagram} icon={<Link2 size={9} />} />
            <DetailField label="FACEBOOK" value={contact.facebook} icon={<Link2 size={9} />} />
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
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<Contact>({ ...EMPTY });

  useEffect(() => {
    const data = loadLocal();
    setContacts(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) saveLocal(contacts);
  }, [contacts, isLoading]);

  const filtered = useMemo(
    () =>
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()) ||
          c.company.toLowerCase().includes(search.toLowerCase())
      ),
    [contacts, search]
  );

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    setShowForm(true);
  }

  function openEdit(c: Contact) {
    setEditing(c);
    setForm({ ...c });
    setShowForm(true);
  }

  function saveContact() {
    if (!form.name.trim()) return;
    if (editing) {
      setContacts((prev) => prev.map((c) => (c.id === editing.id ? form : c)));
      setSelected(form);
    } else {
      setContacts((prev) => [form, ...prev]);
      setSelected(form);
    }
    setShowForm(false);
  }

  function deleteContact(id: string) {
    if (!confirm("Delete this contact?")) return;
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (selected?.id === id) setSelected(null);
  }

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
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
          >
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
              {filtered.length} CONTACTS
            </div>
            {isLoading ? (
              <div className="text-center py-8 text-white/20 text-xs">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Users size={22} className="mx-auto text-white/10 mb-2" />
                  <div className="text-xs text-white/20">No contacts yet</div>
                  <button
                    onClick={openAdd}
                    className="mt-3 text-[10px] text-primary hover:underline"
                  >
                    + Add first contact
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

        <ContactDetail contact={selected} onEdit={openEdit} onDelete={deleteContact} />
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
                {editing ? "EDIT CONTACT" : "ADD CONTACT"}
              </span>
              <button onClick={() => setShowForm(false)} className="text-white/30 hover:text-primary">
                <X size={16} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-3">
              {(
                [
                  ["name", "Name *"],
                  ["email", "Email"],
                  ["phone", "Phone"],
                  ["company", "Company"],
                  ["title", "Title"],
                  ["address", "Address"],
                  ["linkedin", "LinkedIn"],
                  ["website", "Website"],
                  ["notes", "Notes"],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
                    {label}
                  </label>
                  {key === "notes" ? (
                    <textarea
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      rows={3}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-lg text-white/85 bg-white/4 border border-white/8 focus:outline-none focus:border-primary/40"
                    />
                  ) : (
                    <input
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full mt-1 h-8 px-3 text-xs rounded-lg text-white/85 bg-white/4 border border-white/8 focus:outline-none focus:border-primary/40"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: "oklch(0.55 0.22 20 / 15%)" }}>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg glass text-white/50 text-xs font-display"
              >
                CANCEL
              </button>
              <button
                onClick={saveContact}
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