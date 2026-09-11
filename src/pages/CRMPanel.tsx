import { useState, useEffect, useRef } from "react";
import { Search, Plus, Download, Upload, Trash2, Mail, Phone, Zap, Star, Target, DollarSign, X, Loader2, Save, MessageSquare } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout";
import { dbFetch } from "@/lib/supabase";
import { useUserEmail } from "@/lib/useUserEmail";

const LS_KEY = "lifeos_crm";

interface CRMContact {
  id: string;
  name: string;
  company: string;
  title: string;
  jobTitle: string;
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
  extraPhones: string[];
  extraEmails: string[];
  value: string;
  stage: string;
  tag: string;
  source: string;
  address: string;
  notes: string;
  birthday: string;
  lastContact: string;
  socials: Record<string, unknown>;
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
}

function loadLocal(): CRMContact[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveLocal(list: CRMContact[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) { console.warn("saveLocal failed", e); }
}

async function dbLoadContacts(userEmail: string): Promise<CRMContact[]> {
  try {
    const path = userEmail
      ? `crm_contacts?user_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc&limit=500`
      : "crm_contacts?order=created_at.desc&limit=500";
    const data = await dbFetch(path);
    return (data || loadLocal()) as CRMContact[];
  } catch { return loadLocal(); }
}

async function dbSaveContact(userEmail: string, contact: CRMContact): Promise<CRMContact | null> {
  try {
    const { id, ...fields } = contact;
    if (id && !String(id).startsWith("local_"))
      return await dbFetch(`crm_contacts?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(fields), prefer: "return=representation" }) as Promise<CRMContact | null>;
    return await dbFetch("crm_contacts", { method: "POST", body: JSON.stringify(fields), prefer: "return=representation" }) as Promise<CRMContact | null>;
  } catch { return null; }
}

async function dbDeleteContact(userEmail: string, id: string): Promise<void> {
  try {
    if (!String(id).startsWith("local_"))
      await dbFetch(`crm_contacts?id=eq.${id}`, { method: "DELETE", prefer: "" });
  } catch {}
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const STAGES = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
const TAGS = ["Hot", "Warm", "New", "Follow-up", "VIP", "Cold"];
const tagColor = { Hot: "#ff4f5e", Warm: "#ff8c42", New: "#00d9b3", "Follow-up": "#4ab3f4", VIP: "#b366ff", Cold: "#a9a9a9" };
const stageColor = { Lead: "#a9a9a9", Qualified: "#4ab3f4", Proposal: "#ff8c42", Negotiation: "#b366ff", "Closed Won": "#00d9b3", "Closed Lost": "#ff4f5e" };

const BLANK: CRMContact = { 
  name: "", company: "", title: "", jobTitle: "", 
  email: "", email2: "", email3: "", email4: "", email5: "", email6: "", email7: "", email8: "", email9: "", email10: "", email11: "", email12: "",
  phone: "", phone2: "", phone3: "", phone4: "", phone5: "", phone6: "", phone7: "", phone8: "", phone9: "", phone10: "", phone11: "", phone12: "",
  extraPhones: [], extraEmails: [], 
  value: "", stage: "Lead", tag: "New", source: "", address: "", 
  notes: "", birthday: "", lastContact: "", socials: {}, 
  website: "", website2: "", website3: "", website4: "", website5: "", website6: "", website7: "", website8: "", website9: "", website10: "", website11: "",
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
  id: ""
};

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
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
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
    if (a.length === 4 || na > 12) { year = a.padStart(4, "0"); month = b.padStart(2, "0"); day = c.padStart(2, "0"); }
    else { month = a.padStart(2, "0"); day = b.padStart(2, "0"); if (c.length === 4) year = c; else if (c.length === 2) year = (nc > 30 ? "19" : "20") + c.padStart(2, "0"); else year = c.padStart(4, "0"); }
    const m = Math.max(1, Math.min(12, parseInt(month, 10) || 1)).toString().padStart(2, "0");
    const d = Math.max(1, Math.min(31, parseInt(day, 10) || 1)).toString().padStart(2, "0");
    const y = (year || "2000").padStart(4, "0").slice(0, 4);
    return `${m}/${d}/${y}`;
  }
  const digits = s.replace(/\D/g, "").slice(0, 8);
  if (digits.length >= 6) { let mm = digits.slice(0, 2).padStart(2, "0"); let dd = digits.slice(2, 4).padStart(2, "0"); let yy = digits.slice(4); let yyyy = yy.length === 4 ? yy : (parseInt(yy, 10) > 30 ? "19" + yy : "20" + yy).slice(0, 4); return `${mm}/${dd}/${yyyy}`; }
  return s;
}

function MultiField({ label, values = [], onChange, type = "text", placeholder = "" }: { label: string; values: string[]; onChange: (v: string[]) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      {values.map((v, i) => (
        <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
          <input type={type} value={v} placeholder={placeholder}
            onChange={e => { const n = [...values]; n[i] = e.target.value; onChange(n); }}
            className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
          />
          <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-lg leading-none p-1">×</button>
        </div>
      ))}
      <button onClick={() => onChange([...values, ""])} className="text-[10px] text-teal-400 hover:text-teal-300 bg-none border-none cursor-pointer px-0 py-1">+ Add {label}</button>
    </div>
  );
}

function EmailHistoryCard({ email, onCompose }: { email: string; onCompose: () => void }) {
  const [history, setHistory] = useState<Array<{ id: string; subject: string; snippet?: string; date: string; direction: "sent" | "received" }>>([]);
  useEffect(() => {
    if (!email) return;
    try {
      const all = JSON.parse(localStorage.getItem("lifeos_email_history") || "[]");
      const norm = email.toLowerCase().trim();
      setHistory(all.filter(h => h.from?.toLowerCase().includes(norm) || h.to?.toLowerCase().includes(norm) || h.cc?.toLowerCase().includes(norm)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20));
    } catch { setHistory([]); }
  }, [email]);

  function fmt(iso: string): string {
    if (!iso) return "";
    try { const d = new Date(iso), now = new Date(); if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); return d.toLocaleDateString([], { month: "short", day: "numeric" }); } catch { return ""; }
  }

  return (
    <div className="glass rounded-xl border border-white/10 p-4">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div className="text-[10px] font-display tracking-wider text-teal uppercase">✉ Email History</div>
        {email && <button onClick={onCompose} className="px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer bg-primary/10 border border-primary/30 text-primary">+ Send Email</button>}
      </div>
      {!email ? (
        <div className="text-[11px] text-white/30">No email address on file.</div>
      ) : history.length === 0 ? (
        <div className="text-[11px] text-white/30">No email history yet.</div>
      ) : (
        <div>
          {history.map((h, i) => (
            <div key={h.id || i} className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${h.direction === "sent" ? "bg-primary/10 text-primary" : "bg-teal/10 text-teal-400"}`}>{h.direction === "sent" ? "↑ Sent" : "↓ Rcvd"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-white truncate">{h.subject}</div>
                {h.snippet && <div className="text-[10px] text-white/40 truncate">{h.snippet}</div>}
              </div>
              <div className="text-[9px] text-white/30 flex-shrink-0">{fmt(h.date)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

export default function CRMPanel() {
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [selected, setSelected] = useState<CRMContact | null>(null);
  const [adding, setAdding] = useState(false);
  const [editForm, setEditForm] = useState<CRMContact | null>(null);
  const [newForm, setNewForm] = useState<CRMContact>(BLANK);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("All");
  const [filterTag, setFilterTag] = useState("All");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAction, setAiAction] = useState("");
  const [enriching, setEnriching] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const userEmail = useUserEmail();

  useEffect(() => {
    const local = loadLocal();
    if (local.length) { setContacts(local); setLoading(false); }
    dbLoadContacts(userEmail).then(data => { if (data?.length) { setContacts(data); saveLocal(data); } setLoading(false); }).catch(() => setLoading(false));
  }, [userEmail]);

  useEffect(() => {
    if (!loading && contacts.length > 0) saveLocal(contacts);
  }, [contacts, loading]);

  async function addContact() {
    if (!newForm.name) return;
    setSyncing(true);
    const local = { ...newForm, id: "local_" + Date.now(), lastContact: "Just now", socials: {} };
    setContacts(c => [local, ...c]);
    setNewForm(BLANK);
    setAdding(false);
    const saved = await dbSaveContact(userEmail, local);
    if (saved?.id) setContacts(c => c.map(x => x.id === local.id ? saved : x));
    setSyncing(false);
  }

  async function saveEdit() {
    if (!editForm) return;
    setSyncing(true);
    setContacts(c => c.map(x => x.id === editForm.id ? editForm : x));
    if (selected?.id === editForm.id) setSelected(editForm);
    await dbSaveContact(userEmail, editForm);
    setEditForm(null);
    setSyncing(false);
  }

  async function deleteContact(id: string) {
    setContacts(c => c.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
    await dbDeleteContact(userEmail, id);
  }

  async function deleteAll() {
    if (!confirm(`Delete all ${contacts.length} CRM contacts?`)) return;
    for (const c of contacts) await dbDeleteContact(userEmail, c.id);
    setContacts([]); setSelected(null); saveLocal([]);
  }

  function exportContacts() {
    const headers = ["name", "company", "jobTitle", "email", "phone", "extraPhones", "extraEmails", "value", "stage", "tag", "source", "address", "notes", "birthday"];
    const escapeCSV = (val: unknown) => { const s = String(val ?? ""); if (/[\",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`; return s; };
    const rows = contacts.map(c => headers.map(h => {
      let val: unknown;
      switch (h) {
        case "name": val = c.name; break;
        case "company": val = c.company; break;
        case "jobTitle": val = c.jobTitle; break;
        case "email": val = c.email; break;
        case "phone": val = c.phone; break;
        case "extraPhones": val = c.extraPhones; break;
        case "extraEmails": val = c.extraEmails; break;
        case "value": val = c.value; break;
        case "stage": val = c.stage; break;
        case "tag": val = c.tag; break;
        case "source": val = c.source; break;
        case "address": val = c.address; break;
        case "notes": val = c.notes; break;
        case "birthday": val = c.birthday; break;
        default: val = "";
      }
      if (Array.isArray(val)) val = val.join("; ");
      return escapeCSV(val);
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "crm_contacts.csv"; a.click();
  }

  function importContacts(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const isCSV = file.name.endsWith(".csv") || file.type === "text/csv";
      function parseCSVLine(line: string) { const fields = []; let field = ""; let inQ = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (inQ && line[i+1] === '"') { field += '"'; i++; } else { inQ = !inQ; } } else if (ch === "," && !inQ) { fields.push(field.trim()); field = ""; } else { field += ch; } } fields.push(field.trim()); return fields; }
      function norm(h: string) { return h.toLowerCase().replace(/[^a-z0-9]/g, ""); }
      const HMAP: Record<string, string> = { firstname:"firstName",givenname:"firstName", lastname:"lastName",surname:"lastName", phone1value:"phone",phonenumber:"phone",phone:"phone",mobile:"phone",cell:"phone", phone2value:"phone2",homephone:"phone2",workphone:"phone2", email1value:"email",emailaddress:"email",email:"email", email2value:"email2",emailaddress2:"email2", address1street:"street",street:"street",streetaddress:"street", address1city:"city",city:"city", address1region:"state",state:"state", address1postalcode:"zip",zip:"zip",postalcode:"zip", company:"company",organization:"company",companyname:"company", jobtitle:"jobTitle",title:"jobTitle",position:"jobTitle", name:"name",fullname:"name",displayname:"name", notes:"note",note:"note",birthday:"birthday",website:"website", stage:"stage",dealstage:"stage",value:"value",dealvalue:"value", tag:"tag",label:"tag",leadsource:"source",source:"source" };
      function mapH(h: string) { return HMAP[norm(h)] || norm(h); }
      function fmtPhone(raw: string) { if (!raw) return ""; const d = String(raw).replace(/[^0-9]/g, ""); const loc = d.length === 11 && d[0] === "1" ? d.slice(1) : d; if (loc.length !== 10) return d || ""; return "(" + loc.slice(0,3) + ") " + loc.slice(3,6) + "-" + loc.slice(6); }
      try {
        let rows: Record<string, string>[] = [];
        if (isCSV) {
          const lines = text.split("\n").map(l => l.replace(/\r/,"")).filter(l => l.trim());
          if (lines.length < 2) { alert("No data rows found."); return; }
          let hi = 0; while (hi < lines.length && parseCSVLine(lines[hi]).filter(Boolean).length < 2) hi++;
          const hdrs = parseCSVLine(lines[hi]).map(mapH);
          for (let i = hi + 1; i < lines.length; i++) { const vals = parseCSVLine(lines[i]); if (vals.every(v => !v.trim())) continue; const obj: Record<string, string> = {}; hdrs.forEach((h,idx) => { if (vals[idx] && vals[idx].trim()) obj[h] = vals[idx].trim(); }); rows.push(obj); }
        } else { const parsed = JSON.parse(text); rows = Array.isArray(parsed) ? parsed : [parsed]; }
        const current = JSON.parse(localStorage.getItem("lifeos_crm") || "[]");
        const names = new Set(current.map((c: CRMContact) => (c.name||"").toLowerCase()));
        const newRows: CRMContact[] = [];
        for (let ri = 0; ri < rows.length; ri++) {
          const row = rows[ri];
          const fn = (row.firstName || "").trim(); const ln = (row.lastName || "").trim();
          const nr = (row.name || row.displayname || "").trim();
          const df = fn || (nr.includes(" ") ? nr.split(" ")[0] : "");
          const dl = ln || (nr.includes(" ") ? nr.split(" ").slice(1).join(" ") : "");
          const full = fn || ln ? `${fn} ${ln}`.trim() : nr;
          if (!full) continue;
          if (names.has(full.toLowerCase())) continue;
          names.add(full.toLowerCase());
          const st = (row.street||"").trim(); const ct = (row.city||"").trim(); const sta = (row.state||"").trim(); const zp = (row.zip||"").trim();
          newRows.push({ ...BLANK, id: "local_" + Date.now() + Math.random(), name: full, company: (row.company||"").trim(), title: (row.jobTitle||row.title||"").trim(), email: (row.email||"").trim(), phone: fmtPhone(row.phone), address: row.address || [st,ct,sta,zp].filter(Boolean).join(", "), notes: (row.note||"").trim(), stage: STAGES.includes(row.stage) ? row.stage : "Lead", tag: TAGS.includes(row.tag) ? row.tag : "New", source: (row.source||"Imported").trim(), value: (row.value||"").trim(), lastContact: "Imported", socials: {} });
        }
        if (!newRows.length) { alert("No new contacts found (all may be duplicates)."); return; }
        setSyncing(true);
        const merged = [...newRows, ...current];
        setContacts(merged); saveLocal(merged);
        for (let i = 0; i < newRows.length; i++) await dbSaveContact(userEmail, newRows[i]);
        setSyncing(false);
        alert("Imported " + newRows.length + " contact" + (newRows.length !== 1 ? "s" : "") + " into CRM.");
      } catch (err) { console.error("CRM import error:", err); alert("Import failed: " + (err as Error).message); }
    };
    reader.readAsText(file); if (importRef.current) importRef.current.value = "";
  }

  async function enrichContact(contact: CRMContact) {
    setEnriching(true);
    try {
      const res = await fetch("/api/enrich/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: contact.email, name: contact.name, company: contact.company }) });
      if (res.ok) {
        const d = await res.json();
        if (!d.error) {
          const updated = { ...contact, company: d.company?.name || d.company || contact.company, jobTitle: d.title || d.position || contact.jobTitle, phone: d.phone || contact.phone, email: d.email || contact.email, notes: d.notes || contact.notes, lastContact: new Date().toLocaleDateString() };
          setContacts(c => c.map(x => x.id === contact.id ? updated : x));
          if (selected?.id === contact.id) setSelected(updated);
          await dbSaveContact(userEmail, updated);
          alert("Contact enriched successfully!");
        }
      }
    } catch { alert("Enrichment failed."); }
    setEnriching(false);
  }

  async function runCRMAI(contact: CRMContact, action: string) {
    setAiLoading(true); setAiResult(""); setAiAction(action);
    setAiResult(`AI ${action} for ${contact.name} - integration pending`);
    setAiLoading(false);
  }

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const match = [c.name, c.company, c.email, c.source, c.tag].join(" ").toLowerCase().includes(q);
    const ms = filterStage === "All" || c.stage === filterStage;
    const mt = filterTag === "All" || c.tag === filterTag;
    return match && ms && mt;
  });

  const totalValue = contacts.reduce((sum, c) => { const v = parseFloat((c.value || "0").replace(/[$,k]/gi, m => m === "k" ? "000" : "")); return sum + (isNaN(v) ? 0 : v); }, 0);

  const phoneFields = Array.from({ length: 12 }, (_, i) => i === 0 ? "phone" : `phone${i + 1}`);
  const emailFields = Array.from({ length: 12 }, (_, i) => i === 0 ? "email" : `email${i + 1}`);
  const websiteFields = Array.from({ length: 11 }, (_, i) => i === 0 ? "website" : `website${i + 1}`);

  return (
    <PanelLayout
      title="CRM"
      subtitle="Pipeline & Deal Management"
      icon={<Target size={18} />}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={exportContacts} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/60 hover:text-white transition-colors text-xs"><Download size={12} /> Export</button>
          <button onClick={() => importRef.current?.click()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/60 hover:text-white transition-colors text-xs"><Upload size={12} /> Import</button>
          <input ref={importRef} type="file" accept=".csv,.json" onChange={importContacts} style={{ display: "none" }} />
          <button onClick={deleteAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-red-400 hover:text-red-300 transition-colors text-xs"><Trash2 size={12} /> Clear All</button>
          <button onClick={() => { setAdding(true); setSelected(null); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all uppercase tracking-wider"><Plus size={12} /> Add Lead</button>
        </div>
      }
    >
      <div className="h-full flex gap-4 overflow-hidden">
        {/* LEFT PANEL */}
        <div className="w-80 shrink-0 flex flex-col gap-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[{ label: "Leads", val: contacts.length, color: "#ff8c42" }, { label: "Hot", val: contacts.filter(c => c.tag === "Hot").length, color: "#ff4f5e" }, { label: "Pipeline", val: `$${(totalValue/1000).toFixed(1)}k`, color: "#00d9b3" }].map(s => (
              <div key={s.label} className="glass rounded-xl border border-white/10 p-3 text-center">
                <div className="text-xl font-display text-white" style={{ color: s.color }}>{loading ? "..." : s.val}</div>
                <div className="text-[10px] text-white/40">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap gap-2">
            <button onClick={exportContacts} className="flex-1 min-w-[70px] px-2 py-1.5 rounded-lg glass text-teal-400 hover:text-teal-300 text-[10px] font-display">Export</button>
            <button onClick={() => importRef.current?.click()} className="flex-1 min-w-[70px] px-2 py-1.5 rounded-lg glass text-purple-400 hover:text-purple-300 text-[10px] font-display">Import</button>
            <button onClick={deleteAll} className="flex-1 min-w-[70px] px-2 py-1.5 rounded-lg glass text-red-400 hover:text-red-300 text-[10px] font-display">Clear All</button>
            <input ref={importRef} type="file" accept=".csv,.json" onChange={importContacts} style={{ display: "none" }} />
          </div>

          {/* DB Status */}
          <div className="text-[10px] text-white/30">{syncing ? "⟳ Syncing to Supabase..." : "● Supabase connected"}</div>

          {/* Search & Filters */}
          <div className="space-y-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search CRM..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <div className="flex flex-wrap gap-1">
              {["All", ...STAGES].map(s => (
                <button key={s} onClick={() => setFilterStage(s)} className={`px-2 py-0.5 rounded-full text-[10px] font-display transition-colors ${filterStage === s ? "bg-primary/20 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-white/60"}`}>{s}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {["All", ...TAGS].map(t => (
                <button key={t} onClick={() => setFilterTag(t)} className={`px-2 py-0.5 rounded-full text-[10px] font-display transition-colors ${filterTag === t ? "bg-orange/20 border-orange/30 text-orange-400" : "bg-white/5 border-white/10 text-white/60"}`}>{t}</button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {loading ? (
              <div className="text-center py-10 text-white/20 text-xs">Loading from Supabase...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-10 text-white/20 text-xs">No contacts yet. Click + Add Lead.</div>
            ) : filtered.map(c => (
              <div key={c.id} onClick={() => { setSelected(c); setAdding(false); setEditForm(null); }} className={`p-3 rounded-xl border transition-all cursor-pointer ${selected?.id === c.id ? "glass-crimson border-primary/40" : "glass border-white/10 hover:border-white/20"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-display text-black" style={{ background: `linear-gradient(135deg,${tagColor[c.tag as keyof typeof tagColor] || "#4ab3f4"},#ff8c42)` }}>{(c.name||"?").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${selected?.id === c.id ? "text-primary" : "text-white/80"}`}>{c.name}</div>
                    <div className="text-[10px] text-white/40 truncate">{c.company}{c.value ? ` · ${c.value}` : ""}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${tagColor[c.tag as keyof typeof tagColor] ? `bg-[${tagColor[c.tag as keyof typeof tagColor]}22] text-[${tagColor[c.tag as keyof typeof tagColor]}]` : "bg-primary/20 text-primary"}`}>{c.tag}</span>
                    <button onClick={e => { e.stopPropagation(); deleteContact(c.id); }} className="p-1 text-red-400/30 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 glass rounded-2xl border border-white/10 p-6 overflow-y-auto">
          {/* ADD FORM */}
          {adding && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-lg text-primary">Add Lead</h3>
                <button onClick={() => { setAdding(false); setNewForm(BLANK); }} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={e => { e.preventDefault(); addContact(); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={newForm.name} onChange={e => setNewForm({...newForm, name: e.target.value})} placeholder="Name *" className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" required />
                  
                  {/* Emails - Primary + 11 additional */}
                  <div className="col-span-2">
                    <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Email Addresses</div>
                    {emailFields.map((field, idx) => (
                      <input
                        key={field}
                        value={newForm[field as keyof CRMContact] as string}
                        onChange={e => setNewForm({...newForm, [field]: e.target.value})}
                        placeholder={idx === 0 ? "Email (Primary) *" : `Email ${idx + 1}`}
                        type="email"
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                        required={idx === 0}
                      />
                    ))}
                  </div>

                  {/* Phone - Primary + 11 additional */}
                  <div className="col-span-2">
                    <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Phone Numbers</div>
                    {phoneFields.map((field, idx) => (
                      <input
                        key={field}
                        value={formatPhoneForInput(newForm[field as keyof CRMContact] as string)}
                        onChange={e => setNewForm({...newForm, [field]: e.target.value})}
                        placeholder={idx === 0 ? "Phone (Primary)" : `Phone ${idx + 1}`}
                        type="tel"
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                      />
                    ))}
                  </div>

                  <input value={newForm.company} onChange={e => setNewForm({...newForm, company: e.target.value})} placeholder="Company" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                  <input value={newForm.title} onChange={e => setNewForm({...newForm, title: e.target.value})} placeholder="Title" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                  <input value={newForm.value} onChange={e => setNewForm({...newForm, value: e.target.value})} placeholder="Deal Value" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                  
                  <select value={newForm.stage} onChange={e => setNewForm({...newForm, stage: e.target.value})} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-primary/40">
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={newForm.tag} onChange={e => setNewForm({...newForm, tag: e.target.value})} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-primary/40">
                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={newForm.source} onChange={e => setNewForm({...newForm, source: e.target.value})} placeholder="Source" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                  
                  {/* Websites - Primary + 10 additional */}
                  <div className="col-span-2">
                    <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Websites</div>
                    {websiteFields.map((field, idx) => (
                      <input
                        key={field}
                        value={newForm[field as keyof CRMContact] as string}
                        onChange={e => setNewForm({...newForm, [field]: e.target.value})}
                        placeholder={idx === 0 ? "Website (Primary)" : `Website ${idx + 1}`}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                      />
                    ))}
                  </div>

                  <input value={formatBirthdayInput(newForm.birthday)} onChange={e => setNewForm({...newForm, birthday: e.target.value})} placeholder="Birthday (MM/DD/YYYY)" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                  <textarea value={newForm.notes} onChange={e => setNewForm({...newForm, notes: e.target.value})} placeholder="Notes" className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" rows={3} />
                  
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
                                value={newForm[`${key}${i + 1}` as keyof CRMContact] as string}
                                onChange={e => setNewForm({...newForm, [`${key}${i + 1}`]: e.target.value})}
                                placeholder={`@username${i + 1}`}
                                className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <MultiField label="Extra Phone" values={newForm.extraPhones} onChange={v => setNewForm({...newForm, extraPhones: v})} type="tel" placeholder="(###) ###-####" />
                  <MultiField label="Extra Email" values={newForm.extraEmails} onChange={v => setNewForm({...newForm, extraEmails: v})} type="email" placeholder="extra@email.com" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setAdding(false); setNewForm(BLANK); }} className="px-4 py-2 text-sm border border-white/10 rounded-xl text-white/60 hover:border-primary/30 hover:text-primary">Cancel</button>
                  <button type="submit" disabled={syncing} className="flex items-center gap-1.5 px-4 py-2 glass-crimson text-primary rounded-xl text-sm font-display uppercase tracking-wider disabled:opacity-50">{syncing ? <Loader2 size={14} className="animate-spin" /> : <> <Save size={14} /> Save</> }</button>
                </div>
              </form>
            </div>
          )}

          {/* EDIT FORM */}
          {editForm && (
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display text-lg text-primary">Edit Lead</h3>
                <button onClick={() => setEditForm(null)} className="text-white/40 hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={e => { e.preventDefault(); saveEdit(); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name *" className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" required />
                  
                  <div className="col-span-2">
                    <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Email Addresses</div>
                    {emailFields.map((field, idx) => (
                      <input
                        key={field}
                        value={editForm[field as keyof CRMContact] as string}
                        onChange={e => setEditForm({...editForm, [field]: e.target.value})}
                        placeholder={idx === 0 ? "Email (Primary) *" : `Email ${idx + 1}`}
                        type="email"
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                        required={idx === 0}
                      />
                    ))}
                  </div>

                  <div className="col-span-2">
                    <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Phone Numbers</div>
                    {phoneFields.map((field, idx) => (
                      <input
                        key={field}
                        value={formatPhoneForInput(editForm[field as keyof CRMContact] as string)}
                        onChange={e => setEditForm({...editForm, [field]: e.target.value})}
                        placeholder={idx === 0 ? "Phone (Primary)" : `Phone ${idx + 1}`}
                        type="tel"
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                      />
                    ))}
                  </div>

                  <input value={editForm.company} onChange={e => setEditForm({...editForm, company: e.target.value})} placeholder="Company" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                  <input value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} placeholder="Title" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                  <input value={editForm.value} onChange={e => setEditForm({...editForm, value: e.target.value})} placeholder="Deal Value" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                  
                  <select value={editForm.stage} onChange={e => setEditForm({...editForm, stage: e.target.value})} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-primary/40">
                    {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={editForm.tag} onChange={e => setEditForm({...editForm, tag: e.target.value})} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-primary/40">
                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={editForm.source} onChange={e => setEditForm({...editForm, source: e.target.value})} placeholder="Source" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                  
                  <div className="col-span-2">
                    <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Websites</div>
                    {websiteFields.map((field, idx) => (
                      <input
                        key={field}
                        value={editForm[field as keyof CRMContact] as string}
                        onChange={e => setEditForm({...editForm, [field]: e.target.value})}
                        placeholder={idx === 0 ? "Website (Primary)" : `Website ${idx + 1}`}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                      />
                    ))}
                  </div>

                  <input value={formatBirthdayInput(editForm.birthday)} onChange={e => setEditForm({...editForm, birthday: e.target.value})} placeholder="Birthday (MM/DD/YYYY)" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
                  <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} placeholder="Notes" className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" rows={3} />
                  
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
                                value={editForm[`${key}${i + 1}` as keyof CRMContact] as string}
                                onChange={e => setEditForm({...editForm, [`${key}${i + 1}`]: e.target.value})}
                                placeholder={`@username${i + 1}`}
                                className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <MultiField label="Extra Phone" values={editForm.extraPhones} onChange={v => setEditForm({...editForm, extraPhones: v})} type="tel" placeholder="(###) ###-####" />
                  <MultiField label="Extra Email" values={editForm.extraEmails} onChange={v => setEditForm({...editForm, extraEmails: v})} type="email" placeholder="extra@email.com" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditForm(null)} className="px-4 py-2 text-sm border border-white/10 rounded-xl text-white/60 hover:border-primary/30 hover:text-primary">Cancel</button>
                  <button type="submit" disabled={syncing} className="flex items-center gap-1.5 px-4 py-2 glass-crimson text-primary rounded-xl text-sm font-display uppercase tracking-wider disabled:opacity-50">{syncing ? <Loader2 size={14} className="animate-spin" /> : <> <Save size={14} /> Save</> }</button>
                </div>
              </form>
            </div>
          )}

          {/* DETAIL VIEW */}
          {selected && !adding && !editForm && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-display text-primary" style={{ background: `linear-gradient(135deg,${tagColor[selected.tag as keyof typeof tagColor] || "#4ab3f4"},#ff8c42)` }}>{(selected.name||"?").split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}</div>
                  <div>
                    <h2 className="text-xl font-display text-white tracking-wide">{selected.name}</h2>
                    <p className="text-xs text-white/40">{selected.title || "Lead"} at {selected.company || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setEditForm(selected)} className="p-2 glass hover:glass-crimson rounded-xl transition-colors"><Zap size={16} className="text-teal-400" /></button>
                  <button onClick={() => enrichContact(selected)} disabled={enriching} className="p-2 glass hover:glass-crimson rounded-xl transition-colors disabled:opacity-50"><Star size={16} className="text-yellow-400" /></button>
                  <button onClick={() => deleteContact(selected.id)} className="p-2 glass hover:glass-crimson rounded-xl transition-colors"><Trash2 size={16} className="text-red-400" /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass rounded-xl border border-white/10 p-4">
                  <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-3">Pipeline</div>
                  <div className="space-y-2">
                    <div><div className="flex justify-between text-[11px]"><span>Stage</span><span className="font-display" style={{ color: stageColor[selected.stage as keyof typeof stageColor] }}>{selected.stage}</span></div><div className="h-1 bg-white/10 rounded mt-1"><div className="h-full rounded" style={{ width: `${(STAGES.indexOf(selected.stage) + 1) / STAGES.length * 100}%`, background: `linear-gradient(90deg,${stageColor[selected.stage as keyof typeof stageColor]},#ff8c42)` }} /></div></div>
                    <div><div className="flex justify-between text-[11px]"><span>Tag</span><span className="font-display" style={{ color: tagColor[selected.tag as keyof typeof tagColor] }}>{selected.tag}</span></div></div>
                    <div><div className="flex justify-between text-[11px]"><span>Value</span><span className="font-display text-teal-400">{selected.value || "$0"}</span></div></div>
                    <div><div className="flex justify-between text-[11px]"><span>Source</span><span className="text-white/60">{selected.source || "—"}</span></div></div>
                    <div><div className="flex justify-between text-[11px]"><span>Last Contact</span><span className="text-white/60">{selected.lastContact || "—"}</span></div></div>
                  </div>
                </div>

                <div className="glass rounded-xl border border-white/10 p-4">
                  <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-3">Contact Info</div>
                  <div className="space-y-2 text-[11px]">
                    {emailFields.map(field => 
                      selected[field as keyof CRMContact] && (
                        <div key={field} className="flex justify-between"><span className="text-white/40">{field === "email" ? "Email" : field.charAt(0).toUpperCase() + field.slice(1)}</span><span className="text-white/60">{selected[field as keyof CRMContact] as string}</span></div>
                      )
                    )}
                    {phoneFields.map(field => 
                      selected[field as keyof CRMContact] && (
                        <div key={field} className="flex justify-between"><span className="text-white/40">{field === "phone" ? "Phone" : field.charAt(0).toUpperCase() + field.slice(1)}</span><span className="text-white/60">{formatPhone(selected[field as keyof CRMContact] as string)}</span></div>
                      )
                    )}
                    {websiteFields.map(field => 
                      selected[field as keyof CRMContact] && (
                        <div key={field} className="flex justify-between"><span className="text-white/40">{field === "website" ? "Website" : field.charAt(0).toUpperCase() + field.slice(1)}</span><span className="text-white/60">{selected[field as keyof CRMContact] as string}</span></div>
                      )
                    )}
                    <div className="flex justify-between"><span className="text-white/40">Address</span><span className="text-white/60">{selected.address || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-white/40">Birthday</span><span className="text-white/60">{selected.birthday || "—"}</span></div>
                  </div>
                </div>

                <div className="glass rounded-xl border border-white/10 p-4">
                  <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-3">Social Media (10 per platform)</div>
                  <div className="space-y-3">
                    {SOCIAL_PLATFORMS.map(({ key, lbl, emoji, color, url, count }) => (
                      <div key={key} className="glass rounded-lg border border-white/10 p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ color }}>{emoji}</span>
                          <span className="text-xs font-medium text-white">{lbl}</span>
                        </div>
                        <div className="space-y-1">
                          {Array.from({ length: count }, (_, i) => 
                            selected[`${key}${i + 1}` as keyof CRMContact] && (
                              <a key={`${key}${i + 1}`} href={`https://${url}/${selected[`${key}${i + 1}` as keyof CRMContact]}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-white/60 hover:text-white hover:border-primary/30 transition-colors">
                                <span style={{ color }}>{emoji}</span>
                                <span>{selected[`${key}${i + 1}` as keyof CRMContact] as string}</span>
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div className="glass-crimson rounded-xl border border-primary/20 p-4">
                  <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Notes</div>
                  <p className="text-xs text-white/60 leading-relaxed">{selected.notes}</p>
                </div>
              )}

              <EmailHistoryCard email={selected.email} onCompose={() => window.open(`mailto:${selected.email}`, "_blank")} />

              {aiLoading && <div className="glass rounded-xl border border-primary/30 p-4"><div className="flex items-center gap-2 text-primary"><Loader2 size={16} className="animate-spin" /> Generating {aiAction}...</div></div>}
              {aiResult && !aiLoading && (
                <div className="glass-crimson rounded-xl border border-primary/30 p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-[10px] font-display tracking-wider text-teal uppercase">AI Result: {aiAction}</div>
                    <button onClick={() => setAiResult("")} className="text-white/30 hover:text-white"><X size={16} /></button>
                  </div>
                  <pre className="text-xs text-white/70 whitespace-pre-wrap font-mono">{aiResult}</pre>
                </div>
              )}
            </div>
          )}

          {!selected && !adding && !editForm && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <Target size={48} className="mb-4" />
              <div className="text-sm font-display tracking-widest uppercase">Select a lead or click + Add Lead</div>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}