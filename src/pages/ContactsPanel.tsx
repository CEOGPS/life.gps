import { useState, useEffect, useRef, useMemo } from "react";
import { Users, Search, Plus, Upload, Download, Star, Mail, Phone, MapPin, Sparkles, Globe, Link2, Briefcase, DollarSign, X, Save, Loader2, Trash2, FileText, Calendar, Zap, Image, Camera, Bot } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout";
import { dbFetch } from "@/lib/supabase";
import { useUserEmail } from "@/lib/useUserEmail";

const LS_KEY = "lifeos_contacts";

interface Contact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  email2: string;
  email3: string;
  email4: string;
  email5: string;
  email6: string;
  email7: string;
  email8: string;
  email9: string;
  email10: string;
  email11: string;
  email12: string;
  phone: string;
  phone2: string;
  phone3: string;
  phone4: string;
  phone5: string;
  phone6: string;
  phone7: string;
  phone8: string;
  phone9: string;
  phone10: string;
  phone11: string;
  phone12: string;
  company: string;
  jobTitle: string;
  title: string;
  group: string;
  birthday: string;
  website: string;
  website2: string;
  website3: string;
  website4: string;
  website5: string;
  website6: string;
  website7: string;
  website8: string;
  website9: string;
  website10: string;
  website11: string;
  address: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  note: string;
  tags: string[];
  color: string;
  photo: string;
  // Social media: 10 spots per platform
  facebook1: string;
  facebook2: string;
  facebook3: string;
  facebook4: string;
  facebook5: string;
  facebook6: string;
  facebook7: string;
  facebook8: string;
  facebook9: string;
  facebook10: string;
  twitter1: string;
  twitter2: string;
  twitter3: string;
  twitter4: string;
  twitter5: string;
  twitter6: string;
  twitter7: string;
  twitter8: string;
  twitter9: string;
  twitter10: string;
  instagram1: string;
  instagram2: string;
  instagram3: string;
  instagram4: string;
  instagram5: string;
  instagram6: string;
  instagram7: string;
  instagram8: string;
  instagram9: string;
  instagram10: string;
  tiktok1: string;
  tiktok2: string;
  tiktok3: string;
  tiktok4: string;
  tiktok5: string;
  tiktok6: string;
  tiktok7: string;
  tiktok8: string;
  tiktok9: string;
  tiktok10: string;
  snapchat1: string;
  snapchat2: string;
  snapchat3: string;
  snapchat4: string;
  snapchat5: string;
  snapchat6: string;
  snapchat7: string;
  snapchat8: string;
  snapchat9: string;
  snapchat10: string;
  whatsapp1: string;
  whatsapp2: string;
  whatsapp3: string;
  whatsapp4: string;
  whatsapp5: string;
  whatsapp6: string;
  whatsapp7: string;
  whatsapp8: string;
  whatsapp9: string;
  whatsapp10: string;
  telegram1: string;
  telegram2: string;
  telegram3: string;
  telegram4: string;
  telegram5: string;
  telegram6: string;
  telegram7: string;
  telegram8: string;
  telegram9: string;
  telegram10: string;
  reddit1: string;
  reddit2: string;
  reddit3: string;
  reddit4: string;
  reddit5: string;
  reddit6: string;
  reddit7: string;
  reddit8: string;
  reddit9: string;
  reddit10: string;
  youtube1: string;
  youtube2: string;
  youtube3: string;
  youtube4: string;
  youtube5: string;
  youtube6: string;
  youtube7: string;
  youtube8: string;
  youtube9: string;
  youtube10: string;
  linkedin1: string;
  linkedin2: string;
  linkedin3: string;
  linkedin4: string;
  linkedin5: string;
  linkedin6: string;
  linkedin7: string;
  linkedin8: string;
  linkedin9: string;
  linkedin10: string;
  addresses: {
    personal: { street: string; city: string; state: string; zip: string };
    business: { street: string; city: string; state: string; zip: string };
    other: Array<{ label: string; street: string; city: string; state: string; zip: string }>;
  };
  lastContact: string;
  role?: string;
  industry?: string;
  linkedin?: string;
  position: string;
  location: string;
}

function loadLocal(): Contact[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveLocal(list: Contact[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) { console.warn("saveLocal failed", e); }
}

async function dbLoadContacts(userEmail: string): Promise<Contact[]> {
  try {
    const path = userEmail
      ? `contacts?user_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc&limit=1000`
      : "contacts?order=created_at.desc&limit=1000";
    const data = await dbFetch(path);
    return (data || loadLocal()) as Contact[];
  } catch (err) {
    console.error("dbLoadContacts error:", err);
    return loadLocal();
  }
}

async function dbAddContact(userEmail: string, contact: Partial<Contact>): Promise<Contact | null> {
  try {
    const payload = { ...contact, user_email: userEmail, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    const data = await dbFetch("contacts", { method: "POST", body: JSON.stringify(payload), prefer: "return=representation" });
    return (data?.[0] || null) as Contact | null;
  } catch (err) {
    console.error("dbAddContact error:", err);
    return null;
  }
}

async function dbUpdateContact(userEmail: string, contact: Contact): Promise<Contact | null> {
  try {
    const { id, ...fields } = contact;
    const payload = { ...fields, user_email: userEmail, updated_at: new Date().toISOString() };
    const data = await dbFetch(`contacts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(payload), prefer: "return=representation" });
    return (data?.[0] || null) as Contact | null;
  } catch (err) {
    console.error("dbUpdateContact error:", err);
    return null;
  }
}

async function dbDeleteContact(userEmail: string, id: string): Promise<void> {
  try {
    await dbFetch(`contacts?id=eq.${id}`, { method: "DELETE", prefer: "" });
  } catch (err) {
    console.error("dbDeleteContact error:", err);
  }
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COLORS = ["#4ab3f4", "#00d9b3", "#b366ff", "#ff4f5e", "#ff8c42", "#ff4f5e", "#ffd700", "#00bfff"];
const GROUPS = ["Personal", "Work", "Family", "Business", "VIP", "Other"];
const groupColor = { Personal: "#4ab3f4", Work: "#00d9b3", Family: "#ff4f5e", Business: "#ff8c42", VIP: "#ffd700", Other: "#a9a9a9" };

const SOCIAL_PLATFORMS = [
  { lbl: "📘 Facebook", key: "facebook", emoji: "📘", color: "#1877f2", url: "facebook.com", count: 10 },
  { lbl: "🐦 X (Twitter)", key: "twitter", emoji: "🐦", color: "#1da1f2", url: "x.com", count: 10 },
  { lbl: "📸 Instagram", key: "instagram", emoji: "📸", color: "#e1306c", url: "instagram.com", count: 10 },
  { lbl: "🎵 TikTok", key: "tiktok", emoji: "🎵", color: "#69c9d0", url: "tiktok.com", count: 10 },
  { lbl: "👻 Snapchat", key: "snapchat", emoji: "👻", color: "#fffc00", url: "snapchat.com", count: 10 },
  { lbl: "💚 WhatsApp", key: "whatsapp", emoji: "💚", color: "#25d366", url: "wa.me", count: 10 },
  { lbl: "✈️ Telegram", key: "telegram", emoji: "✈️", color: "#0088cc", url: "t.me", count: 10 },
  { lbl: "🟠 Reddit", key: "reddit", emoji: "🟠", color: "#ff4500", url: "reddit.com/user", count: 10 },
  { lbl: "▶️ YouTube", key: "youtube", emoji: "▶️", color: "#ff0000", url: "youtube.com/@", count: 10 },
  { lbl: "💼 LinkedIn", key: "linkedin", emoji: "💼", color: "#0a66c2", url: "linkedin.com/in", count: 10 },
];

const BLANK: Contact = {
  id: "",
  name: "", firstName: "", lastName: "",
  email: "", email2: "", email3: "", email4: "", email5: "", email6: "", email7: "", email8: "", email9: "", email10: "", email11: "", email12: "",
  phone: "", phone2: "", phone3: "", phone4: "", phone5: "", phone6: "", phone7: "", phone8: "", phone9: "", phone10: "", phone11: "", phone12: "",
  company: "", jobTitle: "", title: "",
  group: "Personal",
  birthday: "", website: "", website2: "", website3: "", website4: "", website5: "", website6: "", website7: "", website8: "", website9: "", website10: "", website11: "",
  address: "", street: "", city: "", state: "", zip: "",
  notes: "", note: "",
  tags: [],
  color: "#4ab3f4", photo: "",
  facebook1: "", facebook2: "", facebook3: "", facebook4: "", facebook5: "", facebook6: "", facebook7: "", facebook8: "", facebook9: "", facebook10: "",
  twitter1: "", twitter2: "", twitter3: "", twitter4: "", twitter5: "", twitter6: "", twitter7: "", twitter8: "", twitter9: "", twitter10: "",
  instagram1: "", instagram2: "", instagram3: "", instagram4: "", instagram5: "", instagram6: "", instagram7: "", instagram8: "", instagram9: "", instagram10: "",
  tiktok1: "", tiktok2: "", tiktok3: "", tiktok4: "", tiktok5: "", tiktok6: "", tiktok7: "", tiktok8: "", tiktok9: "", tiktok10: "",
  snapchat1: "", snapchat2: "", snapchat3: "", snapchat4: "", snapchat5: "", snapchat6: "", snapchat7: "", snapchat8: "", snapchat9: "", snapchat10: "",
  whatsapp1: "", whatsapp2: "", whatsapp3: "", whatsapp4: "", whatsapp5: "", whatsapp6: "", whatsapp7: "", whatsapp8: "", whatsapp9: "", whatsapp10: "",
  telegram1: "", telegram2: "", telegram3: "", telegram4: "", telegram5: "", telegram6: "", telegram7: "", telegram8: "", telegram9: "", telegram10: "",
  reddit1: "", reddit2: "", reddit3: "", reddit4: "", reddit5: "", reddit6: "", reddit7: "", reddit8: "", reddit9: "", reddit10: "",
  youtube1: "", youtube2: "", youtube3: "", youtube4: "", youtube5: "", youtube6: "", youtube7: "", youtube8: "", youtube9: "", youtube10: "",
  linkedin1: "", linkedin2: "", linkedin3: "", linkedin4: "", linkedin5: "", linkedin6: "", linkedin7: "", linkedin8: "", linkedin9: "", linkedin10: "",
  addresses: {
    personal: { street: "", city: "", state: "", zip: "" },
    business: { street: "", city: "", state: "", zip: "" },
    other: [],
  },
  lastContact: "",
  role: "",
  industry: "",
  linkedin: "",
  position: "",
  location: "",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatPhone(raw: string): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  const local = digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits;
  if (local.length !== 10) return digits.length ? digits : "";
  return `(${local.slice(0,3)}) ${local.slice(3,6)}-${local.slice(6)}`;
}

function formatPhoneForInput(raw: string): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return "(" + digits;
  if (digits.length <= 6) return "(" + digits.slice(0, 3) + ") " + digits.slice(3);
  return "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
}

function formatBirthdayInput(raw: string): string {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";
  let out = digits.slice(0, 2);
  if (digits.length > 2) out += "/" + digits.slice(2, 4);
  if (digits.length > 4) out += "/" + digits.slice(4);
  return out;
}

function normalizeBirthday(raw: string): string {
  if (!raw) return "";
  let s = String(raw).trim();
  if (!s || s.toUpperCase() === "#ERROR!") return "";
  const parts = s.split(/[^\d]+/).filter(Boolean);
  if (parts.length >= 3) {
    let [a, b, c] = parts;
    const na = parseInt(a, 10);
    const nc = parseInt(c, 10);
    let month, day, year;
    if (a.length === 4 || na > 12) {
      year = a.padStart(4, "0");
      month = b.padStart(2, "0");
      day = c.padStart(2, "0");
    } else {
      month = a.padStart(2, "0");
      day = b.padStart(2, "0");
      if (c.length === 4) year = c;
      else if (c.length === 2) year = (nc > 30 ? "19" : "20") + c.padStart(2, "0");
      else year = c.padStart(4, "0");
    }
    const m = Math.max(1, Math.min(12, parseInt(month, 10) || 1)).toString().padStart(2, "0");
    const d = Math.max(1, Math.min(31, parseInt(day, 10) || 1)).toString().padStart(2, "0");
    const y = (year || "2000").padStart(4, "0").slice(0, 4);
    return `${m}/${d}/${y}`;
  }
  const digits = s.replace(/\D/g, "").slice(0, 8);
  if (digits.length >= 6) {
    let mm = digits.slice(0, 2).padStart(2, "0");
    let dd = digits.slice(2, 4).padStart(2, "0");
    let yy = digits.slice(4);
    let yyyy = yy.length === 4 ? yy : (parseInt(yy, 10) > 30 ? "19" + yy : "20" + yy).slice(0, 4);
    return `${mm}/${dd}/${yyyy}`;
  }
  return s;
}

function initials(c: Contact): string {
  if (c.firstName || c.lastName) return ((c.firstName?.[0] || "") + (c.lastName?.[0] || "")).toUpperCase() || "?";
  const parts = (c.name || "").trim().split(" ").filter(Boolean);
  if (!parts.length) return "?";
  return parts.length === 1 ? parts[0][0].toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function displayName(c: Contact): string {
  if (c.firstName || c.lastName) return `${c.firstName || ""} ${c.lastName || ""}`.trim();
  return c.name || "Unnamed";
}

function avatarBg(c: Contact): string {
  if (c.color) return `linear-gradient(135deg,${c.color},#ff8c42)`;
  const pool = ["#4ab3f4", "#00d9b3", "#b366ff", "#ff4f5e", "#ff8c42"];
  return pool[(displayName(c).charCodeAt(0) || 0) % pool.length];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

function getSocialField(contact: Contact, platform: string, index: number): string {
  const key = `${platform}${index}` as keyof Contact;
  return contact[key] as string || "";
}

function setSocialField(contact: Contact, platform: string, index: number, value: string): Partial<Contact> {
  const key = `${platform}${index}`;
  return { [key]: value } as Partial<Contact>;
}

// ─── CSV IMPORT ───────────────────────────────────────────────────────────────
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let field = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQ && line[i + 1] === '"') { field += '"'; i++; } else { inQ = !inQ; } }
    else if (ch === "," && !inQ) { fields.push(field.trim()); field = ""; }
    else { field += ch; }
  }
  fields.push(field.trim());
  return fields;
}

function normalizeHeader(h: string): string { return h.toLowerCase().replace(/[^a-z0-9]/g, ""); }

const HEADER_MAP: Record<string, string> = {
  firstname: "firstName", givenname: "firstName", forename: "firstName",
  lastname: "lastName", surname: "lastName", familyname: "lastName",
  phone1value: "phone", phonenumber: "phone", phone: "phone", phone1: "phone",
  mobilephone: "phone", cellphone: "phone", mobile: "phone",
  phone2value: "phone2", phonenumber2: "phone2", homephone: "phone2", workphone: "phone2", phone2: "phone2",
  email1value: "email", emailaddress: "email", email: "email", email1: "email",
  email2value: "email2", emailaddress2: "email2", email2: "email2",
  address1street: "street", street: "street", streetaddress: "street",
  address1city: "city", city: "city",
  address1region: "state", state: "state", region: "state",
  address1postalcode: "zip", zip: "zip", postalcode: "zip", zipcode: "zip",
  address: "address",
  companyname: "company", company: "company", organization: "company",
  jobtitle: "jobTitle", title: "title", occupation: "jobTitle",
  notes: "notes", note: "notes", biography: "notes",
  website: "website", webpage: "website", url: "website",
  birthday: "birthday", tags: "tags",
  image: "photo", photo: "photo", picture: "photo", avatar: "photo", img: "photo",
};

function mapHeader(raw: string): string { const norm = normalizeHeader(raw); return HEADER_MAP[norm] || norm; }

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const low = lines[i].toLowerCase();
    if (low.includes("first") || low.includes("given") || low.includes("name")) { headerIdx = i; break; }
  }
  const headers = parseCSVLine(lines[headerIdx]).map(mapHeader);
  const rows: Record<string, string>[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      const val = (values[idx] || "").trim();
      if (!val) return;
      if (h === "phone" && row.phone) row.phone2 = row.phone2 || val;
      else if (h === "email" && row.email) row.email2 = row.email2 || val;
      else row[h] = val;
    });
    rows.push(row);
  }
  return rows;
}

// ─── QR CODE ─────────────────────────────────────────────────────────────────
function QRCode({ text, size = 120 }: { text: string; size?: number }) {
  if (!text) return null;
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=13141f&color=4ab3f4&format=png`;
  return <img src={url} width={size} height={size} alt="QR vCard" style={{ borderRadius: 8, border: "0.5px solid rgba(74,179,244,0.2)" }} />;
}

function DetailField({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[9px] font-display tracking-wider flex items-center gap-1 text-teal uppercase">
        {icon && <span className="opacity-60">{icon}</span>}
        {label}
      </div>
      <div className="text-[11px] text-white/60">{value || "—"}</div>
    </div>
  );
}

function MultiField({ label, values = [], onChange, type = "text", placeholder = "", color = "#4ab3f4" }: { label: string; values: string[]; onChange: (v: string[]) => void; type?: string; placeholder?: string; color?: string }) {
  return (
    <div>
      {values.map((v, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
          <input
            type={type}
            value={v}
            placeholder={placeholder}
            onChange={e => { const n = [...values]; n[i] = e.target.value; onChange(n); }}
            className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-colors"
          />
          <button
            onClick={() => onChange(values.filter((_, j) => j !== i))}
            className="text-red-400 hover:text-red-300 text-lg leading-none p-1"
          >×</button>
        </div>
      ))}
      <button
        onClick={() => onChange([...values, ""])}
        className="text-[10px] text-teal-400 hover:text-teal-300 bg-none border-none cursor-pointer px-0 py-1"
      >+ Add {label}</button>
    </div>
  );
}

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contact: Contact) => void;
  userEmail: string;
  initialData?: Contact;
}

function AddContactModal({ isOpen, onClose, onSubmit, userEmail, initialData }: AddContactModalProps) {
  const [form, setForm] = useState<Contact>(initialData || BLANK);
  const [submitting, setSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setForm(initialData || BLANK);
      if (initialData?.photo) setPhotoPreview(initialData.photo);
      else setPhotoPreview("");
    }
  }, [isOpen, initialData]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setPhotoPreview(base64);
    setForm(prev => ({ ...prev, photo: base64 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() && !form.firstName.trim() && !form.lastName.trim()) return;
    setSubmitting(true);
    const newContact = await dbAddContact(userEmail, form);
    setSubmitting(false);
    if (newContact) { onSubmit(newContact); onClose(); }
    else { alert("Failed to add contact. Check console for details."); }
  };

  if (!isOpen) return null;

  const phoneFields = Array.from({ length: 12 }, (_, i) => i === 0 ? "phone" : `phone${i + 1}`);
  const emailFields = Array.from({ length: 12 }, (_, i) => i === 0 ? "email" : `email${i + 1}`);
  const websiteFields = Array.from({ length: 11 }, (_, i) => i === 0 ? "website" : `website${i + 1}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-crimson border border-primary/30 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-lg text-primary">{initialData ? "Edit Contact" : "Add Contact"}</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Photo Upload */}
            <div className="col-span-2 flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "linear-gradient(135deg,#4ab3f4,#ff8c42)" }}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Contact photo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-white/50">
                    <Image size={24} />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 w-full h-full cursor-pointer">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-black/90 transition-colors">
                    <Camera size={14} />
                  </div>
                </label>
              </div>
              <div className="text-sm text-white/60">Click camera icon to upload photo</div>
            </div>

            {/* Name - First & Last separated */}
            <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} placeholder="First Name *" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" required />
            <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} placeholder="Last Name *" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" required />
            <input type="hidden" value={`${form.firstName} ${form.lastName}`.trim()} onChange={e => setForm({...form, name: e.target.value})} />

            {/* Emails - Primary with + to add more */}
            <div className="col-span-2">
              <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Email Addresses</div>
              <MultiField 
                label="Email" 
                values={[form.email, form.email2, form.email3, form.email4, form.email5, form.email6, form.email7, form.email8, form.email9, form.email10, form.email11, form.email12].filter(Boolean)} 
                onChange={(vals) => {
                  const padded = [...vals, "", "", "", "", "", "", "", "", "", "", ""].slice(0, 12);
                  setForm(prev => ({
                    ...prev,
                    email: padded[0] || "",
                    email2: padded[1] || "",
                    email3: padded[2] || "",
                    email4: padded[3] || "",
                    email5: padded[4] || "",
                    email6: padded[5] || "",
                    email7: padded[6] || "",
                    email8: padded[7] || "",
                    email9: padded[8] || "",
                    email10: padded[9] || "",
                    email11: padded[10] || "",
                    email12: padded[11] || "",
                  }));
                }} 
                type="email" 
                placeholder="Email (Primary)" 
              />
            </div>

            {/* Primary Phone with auto-format */}
            <input value={formatPhoneForInput(form.phone)} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone (Primary)" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            
            {/* Additional Phones with + button */}
            <div className="col-span-2">
              <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Additional Phones</div>
              <MultiField 
                label="Phone" 
                values={[form.phone2, form.phone3, form.phone4, form.phone5, form.phone6, form.phone7, form.phone8, form.phone9, form.phone10, form.phone11, form.phone12].filter(Boolean)} 
                onChange={(vals) => {
                  const padded = [...vals, "", "", "", "", "", "", "", "", "", ""].slice(0, 11);
                  setForm(prev => ({
                    ...prev,
                    phone2: padded[0] || "",
                    phone3: padded[1] || "",
                    phone4: padded[2] || "",
                    phone5: padded[3] || "",
                    phone6: padded[4] || "",
                    phone7: padded[5] || "",
                    phone8: padded[6] || "",
                    phone9: padded[7] || "",
                    phone10: padded[8] || "",
                    phone11: padded[9] || "",
                    phone12: padded[10] || "",
                  }));
                }} 
                type="tel" 
                placeholder="(###) ###-####" 
              />
            </div>

            <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Company" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.position} onChange={e => setForm({...form, position: e.target.value})} placeholder="Position" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} placeholder="Industry" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Location" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />

            {/* Websites - Primary + 10 additional */}
            <div className="col-span-2">
              <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Websites</div>
              {websiteFields.map((field, idx) => (
                <input
                  key={field}
                  value={form[field as keyof Contact] as string}
                  onChange={e => setForm({...form, [field]: e.target.value})}
                  placeholder={idx === 0 ? "Website (Primary)" : `Website ${idx + 1}`}
                  className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                />
              ))}
            </div>

            {/* Birthday */}
            <input value={formatBirthdayInput(form.birthday)} onChange={e => setForm({...form, birthday: e.target.value})} placeholder="Birthday (MM/DD/YYYY)" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />

            {/* Notes */}
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes" className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" rows={3} />

            {/* Addresses - Personal */}
                        <div className="col-span-2">
                          <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Personal Address</div>
                          <div className="grid grid-cols-2 gap-3">
                            <input value={form.street} onChange={(e) => setForm({...form, street: e.target.value, addresses: {...form.addresses, personal: {...form.addresses.personal, street: e.target.value}}})} placeholder="Street" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                            <input value={form.city} onChange={(e) => setForm({...form, city: e.target.value, addresses: {...form.addresses, personal: {...form.addresses.personal, city: e.target.value}}})} placeholder="City" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                            <input value={form.state} onChange={(e) => setForm({...form, state: e.target.value, addresses: {...form.addresses, personal: {...form.addresses.personal, state: e.target.value}}})} placeholder="State" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                            <input value={form.zip} onChange={(e) => setForm({...form, zip: e.target.value, addresses: {...form.addresses, personal: {...form.addresses.personal, zip: e.target.value}}})} placeholder="ZIP" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                          </div>
                        </div>

            {/* Social Media - 10 spots per platform */}
            <div className="col-span-2">
              <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Social Media Accounts (10 per platform)</div>
              <div className="space-y-3">
                {SOCIAL_PLATFORMS.map(({ key, lbl, emoji, color, url, count }) => (
                  <div key={key} className="glass rounded-xl border border-white/10 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ color }}>{emoji}</span>
                      <span className="text-xs font-medium text-white">{lbl}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: count }, (_, i) => (
                        <input
                          key={`${key}${i + 1}`}
                          value={form[`${key}${i + 1}` as keyof Contact] as string}
                          onChange={e => setForm({...form, [`${key}${i + 1}`]: e.target.value})}
                          placeholder={`@username${i + 1}`}
                          className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <select value={form.group} onChange={e => setForm({...form, group: e.target.value})} className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-primary/40">
              {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-white/10 rounded-xl text-white/60 hover:border-primary/30 hover:text-primary transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 glass-crimson text-primary rounded-xl text-sm font-display uppercase tracking-wider transition-colors disabled:opacity-50">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <> <Save size={14} /> Save</> }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [enriching, setEnriching] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const userEmail = useUserEmail();

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const data = await dbLoadContacts(userEmail);
        setContacts(data || []);
        console.log("Contacts loaded:", data?.length || 0, "userEmail:", userEmail);
      } catch (err) { console.error("Contacts init error:", err); setContacts([]); }
      finally { setIsLoading(false); }
    }
    init();
  }, [userEmail]);

  useEffect(() => {
    async function fetchInsight() {
      if (!selectedId) return;
      const contact = contacts.find(c => c.id === selectedId);
      if (!contact) return;
      setIsThinking(true);
      try { setAiInsight("Erebus agent not connected. Connect to enable AI insights."); }
      catch (e) { setAiInsight("Erebus is analyzing the network..."); }
      finally { setIsThinking(false); }
    }
    fetchInsight();
  }, [selectedId, contacts]);

  const handleAddContact = (newContact: Contact) => {
    setContacts([newContact, ...contacts]);
    setSelectedId(newContact.id);
  };

  const handleUpdateContact = (updatedContact: Contact) => {
    setContacts(contacts.map(c => c.id === updatedContact.id ? updatedContact : c));
    setSelectedId(updatedContact.id);
    setEditContact(null);
  };

  const handleDeleteContact = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await dbDeleteContact(userEmail, id);
    setContacts(contacts.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const filteredContacts = useMemo(() =>
    contacts.filter(c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase()) ||
      c.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      c.lastName?.toLowerCase().includes(search.toLowerCase())
    ), [contacts, search]);

  const selectedContact = useMemo(() => contacts.find(c => c.id === selectedId) || null, [contacts, selectedId]);

  const exportContactsJSON = () => {
    const blob = new Blob([JSON.stringify(contacts, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lifeos_contacts.json";
    a.click();
  };

  const exportContactsCSV = () => {
    const headers = ["image", "first name", "last name", "company name", "job title", "email 1", "email 2", "phone 1", "phone 2", "street address", "city", "state", "zip code", "website", "notes", "birthday"];
    const escapeCSV = (val: unknown) => { const s = String(val ?? ""); if (/[\",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`; return s; };
    const lines = [headers.join(",")];
    contacts.forEach(c => {
      const pers = c.addresses?.personal ?? { street: "", city: "", state: "", zip: "" };
      let streetAddr = pers.street || c.street || "";
      let city = pers.city || c.city || "";
      let state = pers.state || c.state || "";
      let zip = pers.zip || c.zip || "";
      if (!streetAddr && c.address) {
        const parts = c.address.split(",").map(p => p.trim()).filter(Boolean);
        streetAddr = parts[0] || c.address; city = city || parts[1] || ""; state = state || parts[2] || ""; zip = zip || parts[3] || "";
      }
      const row = [
        c.photo || "", c.firstName || "", c.lastName || "", c.company || "", c.jobTitle || c.title || "",
        c.email || "", c.email2 || "", formatPhone(c.phone), formatPhone(c.phone2), streetAddr, city, state, zip,
        c.website || "", c.notes || c.note || "", c.birthday || ""
      ].map(escapeCSV);
      lines.push(row.join(","));
    });
    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "lifeos_contacts.csv";
    a.click();
  };

  const importContacts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      const isCSV = file.name.endsWith(".csv") || file.type === "text/csv";
      let rows: Record<string, string>[] = [];
      try {
        rows = isCSV ? parseCSV(content as string) : (() => { const p = JSON.parse(content as string); return Array.isArray(p) ? p : [p]; })();
        const newContacts: Contact[] = [];
        for (const row of rows) {
          const fn = (row.firstName || "").trim();
          const ln = (row.lastName || "").trim();
          const rawName = (row.name || row.displayname || "").trim();
          const derivedFirst = fn || (rawName.includes(" ") ? rawName.split(" ")[0] : "");
          const derivedLast = ln || (rawName.includes(" ") ? rawName.split(" ").slice(1).join(" ") : "");
          const fullName = fn || ln ? `${fn} ${ln}`.trim() : rawName;
          if (!fullName) continue;
          if (contacts.some(p => p.name === fullName)) continue;
          if (newContacts.some(c => c.name === fullName)) continue;
          const street = (row.street || row.streetaddress || "").trim();
          const city = (row.city || "").trim();
          const state = (row.state || "").trim();
          const zip = (row.zip || row.zipcode || row["zip code"] || "").trim();
          const fullAddress = row.address || [street, city, state, zip].filter(Boolean).join(", ");
          let tags: string[] = [];
          if (row.tags) tags = String(row.tags).split(/[,;|]/).map(t => t.trim()).filter(Boolean);
          const birthday = normalizeBirthday(row.birthday);
          const photo = (row.photo || row.image || "").trim();
          newContacts.push({
            ...BLANK,
            id: `local_${Date.now()}_${Math.random()}`,
            name: fullName, firstName: derivedFirst, lastName: derivedLast,
            company: (row.company || "").trim(), jobTitle: (row.jobTitle || row.title || "").trim(),
            title: (row.title || "").trim(), group: "Personal",
            phone: formatPhone(row.phone), phone2: formatPhone(row.phone2),
            email: (row.email || "").trim(), email2: (row.email2 || "").trim(),
            address: fullAddress, street, city, state, zip,
            birthday, notes: (row.notes || row.note || "").trim(), note: (row.notes || row.note || "").trim(),
            tags, website: (row.website || "").trim(),
            photo: photo || "", lastContact: "Imported",
          });
        }
        if (newContacts.length > 0) { setContacts([...newContacts, ...contacts]); alert(`Imported ${newContacts.length} contacts.`); }
        else alert("No new contacts found.");
      } catch (err) { console.error("Import failed:", err); alert("Import failed. See console."); }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  };

  const enrichContact = async (contact: Contact) => {
    setEnriching(contact.id);
    try {
      const res = await fetch("/api/enrich/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: displayName(contact), 
          email: contact.email, 
          company: contact.company,
          phone: contact.phone,
          socials: SOCIAL_PLATFORMS.reduce((acc, { key }) => {
            const handles: string[] = [];
            for (let i = 1; i <= 10; i++) {
              const val = contact[`${key}${i}` as keyof Contact] as string;
              if (val) handles.push(val);
            }
            acc[key] = handles;
            return acc;
          }, {} as Record<string, string[]>)
        })
      });
      if (res.ok) {
        const d = await res.json();
        if (!d.error && d.enriched) {
          const updated = { ...contact, ...d.enriched };
          setContacts(c => c.map(x => x.id === contact.id ? updated : x));
          if (selectedContact?.id === contact.id) setEditContact(updated);
          await dbUpdateContact(userEmail, updated);
          alert("Contact enriched with AI data!");
        }
      }
    } catch (err) {
      console.error("Enrichment failed:", err);
      alert("Enrichment failed. Check console.");
    } finally {
      setEnriching(null);
    }
  };

  const qrData = selectedContact ? [
    "BEGIN:VCARD", "VERSION:3.0",
    `FN:${displayName(selectedContact)}`,
    selectedContact.phone ? `TEL:${selectedContact.phone}` : "",
    selectedContact.email ? `EMAIL:${selectedContact.email}` : "",
    (() => { const s = selectedContact; let addr = s.address || [s.street, s.city, s.state, s.zip].filter(Boolean).join(", "); if (!addr && s.addresses) { const p = s.addresses.personal ?? { street: "", city: "", state: "", zip: "" }; addr = [p.street, p.city, p.state, p.zip].filter(Boolean).join(", "); } return addr ? `ADR:;;${addr}` : ""; })(),
    "END:VCARD",
  ].filter(Boolean).join("\n") : "";

  const phoneFields = Array.from({ length: 12 }, (_, i) => i === 0 ? "phone" : `phone${i + 1}`);
  const emailFields = Array.from({ length: 12 }, (_, i) => i === 0 ? "email" : `email${i + 1}`);
  const websiteFields = Array.from({ length: 11 }, (_, i) => i === 0 ? "website" : `website${i + 1}`);

  return (
    <PanelLayout
      title="Contacts"
      subtitle="Global network and relationship management"
      icon={<Users size={18} />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={exportContactsJSON} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/60 hover:text-white transition-colors text-xs">
            <Download size={12} /> JSON
          </button>
          <button onClick={exportContactsCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/60 hover:text-white transition-colors text-xs">
            <FileText size={12} /> CSV
          </button>
          <button onClick={() => importRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/60 hover:text-white transition-colors text-xs">
            <Upload size={12} /> Import
          </button>
          <input ref={importRef} type="file" accept=".csv,.json" onChange={importContacts} style={{ display: "none" }} />
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all uppercase tracking-wider">
            <Plus size={12} /> Add Contact
          </button>
        </div>
      }
    >
      <AddContactModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddContact} userEmail={userEmail} />
      <AddContactModal isOpen={!!editContact} onClose={() => setEditContact(null)} onSubmit={handleUpdateContact} userEmail={userEmail} initialData={editContact || undefined} />

      <div className="h-full flex gap-4 overflow-hidden">
        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search network..." className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all" />
          </div>
          <div className="flex items-center gap-2 px-1">
            <select value="" onChange={e => {}} className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 focus:outline-none focus:border-primary/40">
              <option value="">All Groups</option>
              {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {isLoading ? (
              <div className="text-center py-10 text-white/20 text-xs">Loading network...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-10 text-white/20 text-xs">No contacts yet. Click "Add Contact" to start.</div>
            ) : filteredContacts.map(c => (
              <div key={c.id} onClick={() => setSelectedId(c.id)} className={`p-3 rounded-xl border transition-all cursor-pointer group ${selectedId === c.id ? "glass-crimson border-primary/40" : "glass border-white/10 hover:border-white/20"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-display text-white/60 group-hover:text-primary transition-colors">{c.firstName?.[0] || c.lastName?.[0] || c.name?.[0] || "?"}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${selectedId === c.id ? "text-primary" : "text-white/80"}`}>{displayName(c)}</div>
                    <div className="text-[10px] text-white/40 truncate">{c.email || c.company || "—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 glass rounded-2xl border border-white/10 p-6 overflow-y-auto relative">
          {selectedContact ? (
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-display text-primary shadow-lg shadow-primary/10" style={{ background: avatarBg(selectedContact) }}>
                    {selectedContact.photo ? (
                      <img src={selectedContact.photo} alt={displayName(selectedContact)} className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      initials(selectedContact)
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-display text-white tracking-wide">{displayName(selectedContact)}</h2>
                    <p className="text-xs text-white/40">{selectedContact.role || selectedContact.group || "Contact"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditContact(selectedContact)} className="p-2 glass hover:glass-crimson rounded-xl transition-colors" title="Edit"><Zap size={16} className="text-teal-400" /></button>
                  <button onClick={() => enrichContact(selectedContact)} disabled={enriching === selectedContact.id} className="p-2 glass hover:glass-crimson rounded-xl transition-colors disabled:opacity-50" title="AI Enrich"><Bot size={16} className="text-yellow-400" /></button>
                  <button onClick={() => handleDeleteContact(selectedContact.id)} className="p-2 glass hover:glass-crimson rounded-xl transition-colors" title="Delete"><Trash2 size={16} className="text-red-400" /></button>
                  <button onClick={() => setSelectedId(null)} className="text-white/20 hover:text-white transition-colors"><X size={20} /></button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1">Core Identity</div>
                  <DetailField label="Email" value={selectedContact.email} icon={<Mail size={12} />} />
                  {emailFields.slice(1).map(field => (
                    selectedContact[field as keyof Contact] && (
                      <DetailField key={field} label={field.charAt(0).toUpperCase() + field.slice(1)} value={selectedContact[field as keyof Contact] as string} icon={<Mail size={12} />} />
                    )
                  ))}
                  <DetailField label="Phone" value={formatPhone(selectedContact.phone)} icon={<Phone size={12} />} />
                  {phoneFields.slice(1).map(field => (
                    selectedContact[field as keyof Contact] && (
                      <DetailField key={field} label={field.charAt(0).toUpperCase() + field.slice(1)} value={formatPhone(selectedContact[field as keyof Contact] as string)} icon={<Phone size={12} />} />
                    )
                  ))}
                  <DetailField label="Location" value={selectedContact.location} icon={<MapPin size={12} />} />
                  {websiteFields.map(field => (
                    selectedContact[field as keyof Contact] && (
                      <DetailField key={field} label={field === "website" ? "Website" : field.charAt(0).toUpperCase() + field.slice(1)} value={selectedContact[field as keyof Contact] as string} icon={<Globe size={12} />} />
                    )
                  ))}
                  <DetailField label="Birthday" value={selectedContact.birthday} icon={<Calendar size={12} />} />
                </div>
                <div className="space-y-4">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1">Professional Profile</div>
                  <DetailField label="Company" value={selectedContact.company} icon={<Briefcase size={12} />} />
                  <DetailField label="Position" value={selectedContact.position} icon={<Users size={12} />} />
                  <DetailField label="Industry" value={selectedContact.industry} icon={<Sparkles size={12} />} />
                  <DetailField label="LinkedIn" value={selectedContact.linkedin1} icon={<Link2 size={12} />} />
                  <DetailField label="Group" value={selectedContact.group} icon={<Users size={12} />} />
                  <DetailField label="Role" value={selectedContact.role} icon={<Briefcase size={12} />} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1">Social Accounts (10 per platform)</div>
                  {SOCIAL_PLATFORMS.map(({ key, lbl, emoji, color, url, count }) => (
                    Array.from({ length: count }, (_, i) => {
                      const handle = selectedContact[`${key}${i + 1}` as keyof Contact] as string;
                      return handle && (
                        <div key={`${key}${i + 1}`} className="flex items-center gap-2">
                          <span className="text-xs text-white/40 w-24">{lbl} #{i + 1}</span>
                          <a href={`https://${url}/${handle}`} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 text-[10px] bg-white/5 border border-white/10 rounded text-white/60 hover:text-white hover:border-primary/30 transition-colors">
                            {handle}
                          </a>
                        </div>
                      );
                    })
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1">Addresses</div>
                  <div className="text-[11px] text-white/60">{selectedContact.addresses?.personal?.street || selectedContact.street}</div>
                  <div className="text-[11px] text-white/60">{selectedContact.addresses?.personal?.city || selectedContact.city}, {selectedContact.addresses?.personal?.state || selectedContact.state} {selectedContact.addresses?.personal?.zip || selectedContact.zip}</div>
                  {selectedContact.addresses.other?.map((a, i) => (
                    <div key={i} className="text-[11px] text-white/60">{a.street}, {a.city}, {a.state} {a.zip}</div>
                  ))}
                </div>
              </div>
              {selectedContact.notes && (
                <div className="glass-crimson rounded-xl p-4 border border-primary/20">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2">Notes</div>
                  <p className="text-xs text-white/60 leading-relaxed">{selectedContact.notes}</p>
                </div>
              )}
              <div className="glass-crimson rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase">Erebus Insight</div>
                  {isThinking && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </div>
                <p className="text-xs text-white/60 italic leading-relaxed">{aiInsight || "Erebus is analyzing the network..."}</p>
              </div>
              <div className="glass rounded-xl p-4 border border-white/10">
                <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2">QR vCard</div>
                <QRCode text={qrData} size={140} />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <Users size={48} className="mb-4" />
              <div className="text-sm font-display tracking-widest uppercase">Select a contact to view profile</div>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}