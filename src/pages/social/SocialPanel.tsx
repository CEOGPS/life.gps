import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from "react";
import {
  Briefcase, Search, Plus, Upload, Mail, Phone,
  Sparkles, Globe, Users, MapPin, DollarSign,
  Calendar, Clock, X, Save, Loader2,
  FileText, Tag, Building2, Trash2
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout";
import { dbFetch } from "@/lib/supabase";
import { useUserEmail } from "@/lib/useUserEmail";

// ── Types ────────────────────────────────────────────────────────────────────
type LeadStatus = "Lead" | "Prospect" | "Client" | "Inactive";

interface Social {
  platform: string;
  url: string;
}

interface Listing {
  type: string;
  url: string;
}

interface Lead {
  id: string;
  name: string;
  email?: string;
  emails?: string[];
  phone?: string;
  phones?: string[];
  website?: string;
  websites?: string[];
  company?: string;
  job_title?: string;
  industry?: string;
  status?: LeadStatus;
  value?: number | null;
  annual_revenue?: number | null;
  employee_count?: number | null;
  source?: string;
  location?: string;
  last_contact?: string | null;
  next_step?: string;
  notes?: string;
  tags?: string[];
  avatar?: string | null;
  company_logo?: string | null;
  socials?: Social[];
  listings?: Listing[];
  linkedin?: string;
  user_email?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface LeadForm {
  name: string;
  emails: string[];
  phones: string[];
  websites: string[];
  company: string;
  job_title: string;
  industry: string;
  status: LeadStatus;
  value: string;
  annual_revenue: string;
  employee_count: string;
  source: string;
  location: string;
  last_contact: string;
  next_step: string;
  notes: string;
  tags: string;
  avatar: string;
  company_logo: string;
  socials: Social[];
  listings: Listing[];
}

// ── Constants ────────────────────────────────────────────────────────────────
const STATUSES: LeadStatus[] = ["Lead", "Prospect", "Client", "Inactive"];

const STATUS_COLORS: Record<LeadStatus, string> = {
  Lead: "text-primary border-primary/30 bg-primary/10",
  Prospect: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  Client: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  Inactive: "text-white/30 border-white/15 bg-white/5",
};

const SOCIAL_PLATFORMS = ["linkedin", "twitter", "instagram", "github", "facebook", "other"];
const LISTING_TYPES = ["Google Business", "Yelp", "Crunchbase", "Clutch", "G2", "Other"];

// ── Helpers ──────────────────────────────────────────────────────────────────
async function dbAddLead(userEmail: string | null, lead: Partial<Lead>): Promise<Lead | null> {
  try {
    const payload = {
      ...lead,
      user_email: userEmail,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const data = await dbFetch("crm_contacts", {
      method: "POST",
      body: JSON.stringify(payload),
      prefer: "return=representation",
    });
    return data?.[0] || null;
  } catch (err) {
    console.error("dbAddLead error:", err);
    return null;
  }
}

// ── Sub Components ───────────────────────────────────────────────────────────
function DetailField({ label, value, icon }: { label: string; value?: string | number | null; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="text-[9px] font-display tracking-wider flex items-center gap-1 text-teal uppercase">
        {icon && <span className="opacity-60">{icon}</span>}
        {label}
      </div>
      <div className="text-[11px] text-white/60 break-all">{value ?? "—"}</div>
    </div>
  );
}

function MultiFieldList({ items, emptyText = "—" }: { items?: string[]; emptyText?: string }) {
  if (!items || items.length === 0) {
    return <div className="text-[11px] text-white/40">{emptyText}</div>;
  }
  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={i} className="text-[11px] text-white/60 break-all">{item}</div>
      ))}
    </div>
  );
}

const emptyForm: LeadForm = {
  name: "",
  emails: [""],
  phones: [""],
  websites: [""],
  company: "",
  job_title: "",
  industry: "",
  status: "Lead",
  value: "",
  annual_revenue: "",
  employee_count: "",
  source: "",
  location: "",
  last_contact: "",
  next_step: "",
  notes: "",
  tags: "",
  avatar: "",
  company_logo: "",
  socials: [{ platform: "linkedin", url: "" }],
  listings: [{ type: "Google Business", url: "" }],
};

// ── Add Lead Modal ───────────────────────────────────────────────────────────
function AddLeadModal({
  isOpen,
  onClose,
  onSubmit,
  userEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lead: Lead) => void;
  userEmail: string | null;
}) {
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setForm(emptyForm);
  }, [isOpen]);

  const updateArray = (key: "emails" | "phones" | "websites", index: number, value: string) => {
    setForm((prev) => {
      const arr = [...prev[key]];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });
  };

  const addArrayItem = (key: "emails" | "phones" | "websites") => {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
  };

  const removeArrayItem = (key: "emails" | "phones" | "websites", index: number) => {
    setForm((prev) => {
      const arr = prev[key].filter((_, i) => i !== index);
      return { ...prev, [key]: arr.length ? arr : [""] };
    });
  };

  const updateSocial = (index: number, field: "platform" | "url", value: string) => {
    setForm((prev) => {
      const socials = [...prev.socials];
      socials[index] = { ...socials[index], [field]: value };
      return { ...prev, socials };
    });
  };

  const addSocial = () => {
    setForm((prev) => ({
      ...prev,
      socials: [...prev.socials, { platform: "twitter", url: "" }],
    }));
  };

  const removeSocial = (index: number) => {
    setForm((prev) => {
      const socials = prev.socials.filter((_, i) => i !== index);
      return { ...prev, socials: socials.length ? socials : [{ platform: "linkedin", url: "" }] };
    });
  };

  const updateListing = (index: number, field: "type" | "url", value: string) => {
    setForm((prev) => {
      const listings = [...prev.listings];
      listings[index] = { ...listings[index], [field]: value };
      return { ...prev, listings };
    });
  };

  const addListing = () => {
    setForm((prev) => ({
      ...prev,
      listings: [...prev.listings, { type: "Yelp", url: "" }],
    }));
  };

  const removeListing = (index: number) => {
    setForm((prev) => {
      const listings = prev.listings.filter((_, i) => i !== index);
      return { ...prev, listings: listings.length ? listings : [{ type: "Google Business", url: "" }] };
    });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, field: "avatar" | "company_logo") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const cleaned = {
      name: form.name.trim(),
      email: form.emails.find((e) => e.trim()) || "",
      emails: form.emails.filter((e) => e.trim()),
      phone: form.phones.find((p) => p.trim()) || "",
      phones: form.phones.filter((p) => p.trim()),
      website: form.websites.find((w) => w.trim()) || "",
      websites: form.websites.filter((w) => w.trim()),
      company: form.company.trim(),
      job_title: form.job_title.trim(),
      industry: form.industry.trim(),
      status: form.status,
      value: form.value ? Number(form.value) : null,
      annual_revenue: form.annual_revenue ? Number(form.annual_revenue) : null,
      employee_count: form.employee_count ? Number(form.employee_count) : null,
      source: form.source.trim(),
      location: form.location.trim(),
      last_contact: form.last_contact || null,
      next_step: form.next_step.trim(),
      notes: form.notes.trim(),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      avatar: form.avatar || null,
      company_logo: form.company_logo || null,
      socials: form.socials.filter((s) => s.url.trim()),
      listings: form.listings.filter((l) => l.url.trim()),
      linkedin: form.socials.find((s) => s.platform === "linkedin")?.url || "",
    };

    setSubmitting(true);
    const newLead = await dbAddLead(userEmail, cleaned);
    setSubmitting(false);

    if (newLead) {
      onSubmit(newLead);
      onClose();
    } else {
      const localLead: Lead = {
        ...cleaned,
        id: crypto.randomUUID(),
        user_email: userEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      onSubmit(localLead);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-crimson border border-primary/30 rounded-2xl p-6 w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="font-display text-lg text-primary">Add Lead / Contact</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Contact Photo</div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                  {form.avatar ? (
                    <img src={form.avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={24} className="text-white/20" />
                  )}
                </div>
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white/70 hover:border-primary/40 transition-colors">
                  <Upload size={14} /> Upload
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "avatar")} className="hidden" />
                </label>
                {form.avatar && (
                  <button type="button" onClick={() => setForm((p) => ({ ...p, avatar: "" }))} className="text-xs text-white/40 hover:text-red-400">
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Company Logo</div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                  {form.company_logo ? (
                    <img src={form.company_logo} alt="logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Building2 size={24} className="text-white/20" />
                  )}
                </div>
                <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white/70 hover:border-primary/40 transition-colors">
                  <Upload size={14} /> Upload
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, "company_logo")} className="hidden" />
                </label>
                {form.company_logo && (
                  <button type="button" onClick={() => setForm((p) => ({ ...p, company_logo: "" }))} className="text-xs text-white/40 hover:text-red-400">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Core */}
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full Name *"
              className="col-span-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
              required
            />
            <input
              value={form.job_title}
              onChange={(e) => setForm({ ...form, job_title: e.target.value })}
              placeholder="Job Title"
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
            />
            <input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Company"
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
            />
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as LeadStatus })}
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-primary/40"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="Lead Source"
              className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
            />
          </div>

          {/* Emails */}
          <div>
            <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Emails</div>
            <div className="space-y-2">
              {form.emails.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={email}
                    onChange={(e) => updateArray("emails", i, e.target.value)}
                    placeholder="email@example.com"
                    type="email"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                  />
                  {form.emails.length > 1 && (
                    <button type="button" onClick={() => removeArrayItem("emails", i)} className="text-white/30 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem("emails")} className="text-xs text-primary/80 hover:text-primary">
                + Add email
              </button>
            </div>
          </div>

          {/* Phones */}
          <div>
            <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Phone Numbers</div>
            <div className="space-y-2">
              {form.phones.map((phone, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={phone}
                    onChange={(e) => updateArray("phones", i, e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                  />
                  {form.phones.length > 1 && (
                    <button type="button" onClick={() => removeArrayItem("phones", i)} className="text-white/30 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem("phones")} className="text-xs text-primary/80 hover:text-primary">
                + Add phone
              </button>
            </div>
          </div>

          {/* Websites */}
          <div>
            <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Websites</div>
            <div className="space-y-2">
              {form.websites.map((site, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={site}
                    onChange={(e) => updateArray("websites", i, e.target.value)}
                    placeholder="https://"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                  />
                  {form.websites.length > 1 && (
                    <button type="button" onClick={() => removeArrayItem("websites", i)} className="text-white/30 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addArrayItem("websites")} className="text-xs text-primary/80 hover:text-primary">
                + Add website
              </button>
            </div>
          </div>

          {/* Socials */}
          <div>
            <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Socials</div>
            <div className="space-y-2">
              {form.socials.map((social, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={social.platform}
                    onChange={(e) => updateSocial(i, "platform", e.target.value)}
                    className="w-32 px-2 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-primary/40"
                  >
                    {SOCIAL_PLATFORMS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    value={social.url}
                    onChange={(e) => updateSocial(i, "url", e.target.value)}
                    placeholder="Profile URL"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                  />
                  {form.socials.length > 1 && (
                    <button type="button" onClick={() => removeSocial(i)} className="text-white/30 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addSocial} className="text-xs text-primary/80 hover:text-primary">
                + Add social
              </button>
            </div>
          </div>

          {/* Business Listings */}
          <div>
            <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Business Listings</div>
            <div className="space-y-2">
              {form.listings.map((listing, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={listing.type}
                    onChange={(e) => updateListing(i, "type", e.target.value)}
                    className="w-40 px-2 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-primary/40"
                  >
                    {LISTING_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    value={listing.url}
                    onChange={(e) => updateListing(i, "url", e.target.value)}
                    placeholder="Listing URL"
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
                  />
                  {form.listings.length > 1 && (
                    <button type="button" onClick={() => removeListing(i)} className="text-white/30 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addListing} className="text-xs text-primary/80 hover:text-primary">
                + Add listing
              </button>
            </div>
          </div>

          {/* Business Intelligence */}
          <div className="grid grid-cols-2 gap-3">
            <input value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="Industry" className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="Deal Value $" type="number" step="0.01" className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.annual_revenue} onChange={(e) => setForm({ ...form, annual_revenue: e.target.value })} placeholder="Annual Revenue $" type="number" className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.employee_count} onChange={(e) => setForm({ ...form, employee_count: e.target.value })} placeholder="Employee Count" type="number" className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.last_contact} onChange={(e) => setForm({ ...form, last_contact: e.target.value })} placeholder="Last Contact" type="date" className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-primary/40" />
            <input value={form.next_step} onChange={(e) => setForm({ ...form, next_step: e.target.value })} placeholder="Next Step" className="col-span-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (comma separated)" className="col-span-2 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
          </div>

          {/* Notes */}
          <div>
            <div className="text-[10px] font-display tracking-wider text-teal uppercase mb-2">Notes</div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Context, conversation history, important details..."
              rows={3}
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-white/10 rounded-xl text-white/60 hover:border-primary/30 hover:text-primary transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.name.trim()}
              className="flex items-center gap-1.5 px-5 py-2 glass-crimson text-primary rounded-xl text-sm font-display uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <><Save size={14} /> Save Lead</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function CRMPanel() {
  const [contacts, setContacts] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LeadStatus>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const userEmail = useUserEmail();

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        const path = userEmail
          ? `crm_contacts?user_email=eq.${encodeURIComponent(userEmail)}&order=created_at.desc&limit=1000`
          : "crm_contacts?order=created_at.desc&limit=1000";
        const data = await dbFetch(path);
        setContacts(data || []);
      } catch (err) {
        console.error("CRM init error:", err);
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [userEmail]);

  useEffect(() => {
    async function fetchInsight() {
      if (!selectedId) return;
      const contact = contacts.find((c) => c.id === selectedId);
      if (!contact) return;
      setIsThinking(true);
      try {
        setAiInsight("Erebus agent not connected. Connect to enable CRM insights.");
      } catch {
        setAiInsight("Erebus is currently analyzing the pipeline...");
      } finally {
        setIsThinking(false);
      }
    }
    fetchInsight();
  }, [selectedId, contacts]);

  const handleAddLead = (newLead: Lead) => {
    setContacts((prev) => [newLead, ...prev]);
    setSelectedId(newLead.id);
  };

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return contacts.filter((c) => {
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;

      const haystack = [
        c.name,
        c.email,
        c.phone,
        c.company,
        c.job_title,
        c.industry,
        c.location,
        c.notes,
        c.source,
        ...(c.emails || []),
        ...(c.phones || []),
        ...(c.websites || []),
        ...(c.tags || []),
        ...(c.socials || []).map((s) => `${s.platform} ${s.url}`),
        ...(c.listings || []).map((l) => `${l.type} ${l.url}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [contacts, search, statusFilter]);

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedId),
    [contacts, selectedId]
  );

  return (
    <PanelLayout
      title="CRM"
      subtitle="Strategic lead and client orchestration"
      icon={<Briefcase size={18} />}
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all uppercase tracking-wider"
        >
          <Plus size={12} /> Add Lead
        </button>
      }
    >
      <AddLeadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddLead}
        userEmail={userEmail}
      />

      <div className="h-full flex gap-4 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pipeline..."
              className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-1.5 flex-wrap">
            {(["All", ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border font-display uppercase tracking-wider transition-all ${
                  statusFilter === s
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "border-white/10 text-white/40 hover:border-white/20 hover:text-white/60"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {isLoading ? (
              <div className="text-center py-10 text-white/20 text-xs">Syncing pipeline...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-10 text-white/20 text-xs">
                No leads yet. Click "Add Lead" to start.
              </div>
            ) : (
              filteredContacts.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                    selectedId === c.id
                      ? "glass-crimson border-primary/40"
                      : "glass border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs font-display text-white/60 group-hover:text-primary transition-colors shrink-0">
                      {c.avatar ? (
                        <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        c.name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className={`text-xs font-medium truncate ${selectedId === c.id ? "text-primary" : "text-white/80"}`}>
                          {c.name}
                        </div>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded border font-display uppercase shrink-0 ${STATUS_COLORS[c.status || "Lead"]}`}>
                          {c.status || "Lead"}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/40 truncate">
                        {c.company || c.email || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="flex-1 glass rounded-2xl border border-white/10 p-6 overflow-y-auto relative">
          {selectedContact ? (
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 overflow-hidden flex items-center justify-center text-2xl font-display text-primary shadow-lg shadow-primary/10 shrink-0">
                    {selectedContact.avatar ? (
                      <img src={selectedContact.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedContact.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-display text-white tracking-wide">{selectedContact.name}</h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-display uppercase ${STATUS_COLORS[selectedContact.status || "Lead"]}`}>
                        {selectedContact.status || "Lead"}
                      </span>
                      {selectedContact.job_title && (
                        <span className="text-xs text-white/50">{selectedContact.job_title}</span>
                      )}
                      {selectedContact.company && (
                        <span className="text-xs text-white/40">@ {selectedContact.company}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-white/20 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Company Logo */}
              {selectedContact.company_logo && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center">
                    <img src={selectedContact.company_logo} alt="logo" className="w-full h-full object-contain p-1" />
                  </div>
                  <span className="text-sm text-white/60">{selectedContact.company}</span>
                </div>
              )}

              {/* Main Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1">
                    Communication
                  </div>
                  <div>
                    <div className="text-[9px] font-display tracking-wider flex items-center gap-1 text-teal uppercase mb-1">
                      <Mail size={12} className="opacity-60" /> Emails
                    </div>
                    <MultiFieldList items={selectedContact.emails?.length ? selectedContact.emails : [selectedContact.email || ""]} />
                  </div>
                  <div>
                    <div className="text-[9px] font-display tracking-wider flex items-center gap-1 text-teal uppercase mb-1">
                      <Phone size={12} className="opacity-60" /> Phones
                    </div>
                    <MultiFieldList items={selectedContact.phones?.length ? selectedContact.phones : [selectedContact.phone || ""]} />
                  </div>
                  <div>
                    <div className="text-[9px] font-display tracking-wider flex items-center gap-1 text-teal uppercase mb-1">
                      <Globe size={12} className="opacity-60" /> Websites
                    </div>
                    <MultiFieldList items={selectedContact.websites?.length ? selectedContact.websites : [selectedContact.website || ""]} />
                  </div>
                  <DetailField label="Location" value={selectedContact.location} icon={<MapPin size={12} />} />
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1">
                    Business Intelligence
                  </div>
                  <DetailField
                    label="Deal Value"
                    value={selectedContact.value ? `$${Number(selectedContact.value).toLocaleString()}` : null}
                    icon={<DollarSign size={12} />}
                  />
                  <DetailField
                    label="Annual Revenue"
                    value={selectedContact.annual_revenue ? `$${Number(selectedContact.annual_revenue).toLocaleString()}` : null}
                    icon={<DollarSign size={12} />}
                  />
                  <DetailField label="Employees" value={selectedContact.employee_count} icon={<Users size={12} />} />
                  <DetailField label="Industry" value={selectedContact.industry} icon={<Sparkles size={12} />} />
                  <DetailField label="Lead Source" value={selectedContact.source} icon={<Tag size={12} />} />
                  <DetailField label="Last Contact" value={selectedContact.last_contact} icon={<Clock size={12} />} />
                  <DetailField label="Next Step" value={selectedContact.next_step} icon={<Calendar size={12} />} />
                </div>
              </div>

              {/* Socials */}
              {(selectedContact.socials?.length || selectedContact.linkedin) && (
                <div>
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-3 border-b border-white/10 pb-1">
                    Socials
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(selectedContact.socials || []).map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/70 hover:border-primary/40 hover:text-primary transition-colors capitalize"
                      >
                        {s.platform}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Business Listings */}
              {selectedContact.listings && selectedContact.listings.length > 0 && (
                <div>
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-3 border-b border-white/10 pb-1">
                    Business Listings
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.listings.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white/70 hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {l.type}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedContact.tags && selectedContact.tags.length > 0 && (
                <div>
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-3 border-b border-white/10 pb-1">
                    Tags
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedContact.tags.map((tag, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-[11px] text-primary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedContact.notes && (
                <div>
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1 flex items-center gap-1">
                    <FileText size={12} /> Notes
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">
                    {selectedContact.notes}
                  </p>
                </div>
              )}

              {/* Erebus Insight */}
              <div className="glass-crimson rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase">
                    CRM Strategic Insight
                  </div>
                  {isThinking && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </div>
                <p className="text-xs text-white/60 italic leading-relaxed">
                  {aiInsight || "Erebus is analyzing lead data..."}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <Briefcase size={48} className="mb-4" />
              <div className="text-sm font-display tracking-widest uppercase">
                Select a lead to view pipeline intelligence
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}