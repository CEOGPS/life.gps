import { useState, useEffect, useRef } from "react";
import {
  Briefcase, Search, Plus, Upload, Filter, Tag, Mail, Phone,
  Sparkles, Globe, Users, MapPin, DollarSign,
  Calendar, Clock, Link2, X, Save, Loader2
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout";
import { dbFetch } from "@/lib/supabase";
import { useUserEmail } from "@/lib/useUserEmail";

const STATUSES = ["Lead", "Prospect", "Client", "Inactive"];
const STATUS_COLORS = {
  Lead: "text-primary border-primary/30",
  Prospect: "text-yellow-400 border-yellow-400/30",
  Client: "text-emerald-400 border-emerald-400/30",
  Inactive: "text-white/30 border-white/15",
};

function DetailField({ label, value, icon }) {
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

async function dbAddLead(userEmail, lead) {
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

function AddLeadModal({ isOpen, onClose, onSubmit, userEmail }) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", status: "Lead",
    value: "", source: "", linkedin: "", website: "",
    last_contact: "", next_step: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setForm({ name: "", email: "", phone: "", company: "", status: "Lead", value: "", source: "", linkedin: "", website: "", last_contact: "", next_step: "" });
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    const newLead = await dbAddLead(userEmail, form);
    setSubmitting(false);
    if (newLead) {
      onSubmit(newLead);
      onClose();
    } else {
      alert("Failed to add lead. Check console for details.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-crimson border border-primary/30 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-lg text-primary">Add Lead</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Name *" className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" required />
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email *" type="email" className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" required />
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Company" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 focus:outline-none focus:border-primary/40">
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder="Value $" type="number" step="0.01" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.source} onChange={e => setForm({...form, source: e.target.value})} placeholder="Lead Source" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.linkedin} onChange={e => setForm({...form, linkedin: e.target.value})} placeholder="LinkedIn URL" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.website} onChange={e => setForm({...form, website: e.target.value})} placeholder="Website" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.last_contact} onChange={e => setForm({...form, last_contact: e.target.value})} placeholder="Last Contact (YYYY-MM-DD)" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
            <input value={form.next_step} onChange={e => setForm({...form, next_step: e.target.value})} placeholder="Next Step" className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-white/10 rounded-xl text-white/60 hover:border-primary/30 hover:text-primary transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex items-center gap-1.5 px-4 py-2 glass-crimson text-primary rounded-xl text-sm font-display uppercase tracking-wider transition-colors disabled:opacity-50">
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <> <Save size={14} /> Save</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CRMPanel() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
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
        console.log("CRM contacts loaded:", data?.length || 0, "userEmail:", userEmail);
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
      const contact = contacts.find(c => c.id === selectedId);
      if (!contact) return;
      setIsThinking(true);
      try {
        setAiInsight("Erebus agent not connected. Connect to enable CRM insights.");
      } catch (e) {
        setAiInsight("Erebus is currently analyzing the pipeline...");
      } finally {
        setIsThinking(false);
      }
    }
    fetchInsight();
  }, [selectedId, contacts]);

  const handleAddLead = (newLead) => {
    setContacts([newLead, ...contacts]);
    setSelectedId(newLead.id);
  };

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedContact = contacts.find(c => c.id === selectedId);

  return (
    <PanelLayout
      title="CRM"
      subtitle="Strategic lead and client orchestration"
      icon={<Briefcase size={18} />}
      actions={
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all uppercase tracking-wider">
          <Plus size={12} /> Add Lead
        </button>
      }
    >
      <AddLeadModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSubmit={handleAddLead} userEmail={userEmail} />
      <div className="h-full flex gap-4 overflow-hidden">
        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pipeline..." className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {isLoading ? (
              <div className="text-center py-10 text-white/20 text-xs">Syncing pipeline...</div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-10 text-white/20 text-xs">No leads yet. Click "Add Lead" to start.</div>
            ) : filteredContacts.map(c => (
              <div key={c.id} onClick={() => setSelectedId(c.id)} className={`p-3 rounded-xl border transition-all cursor-pointer group ${selectedId === c.id ? "glass-crimson border-primary/40" : "glass border-white/10 hover:border-white/20"}`}>
                <div className="flex justify-between items-start mb-1">
                  <div className={`text-xs font-medium truncate ${selectedId === c.id ? "text-primary" : "text-white/80"}`}>{c.name}</div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded border font-display uppercase ${STATUS_COLORS[c.status] || STATUS_COLORS.Inactive}`}>{c.status || "Lead"}</span>
                </div>
                <div className="text-[10px] text-white/40 truncate">{c.email}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1 glass rounded-2xl border border-white/10 p-6 overflow-y-auto relative">
          {selectedContact ? (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-display text-primary shadow-lg shadow-primary/10">{selectedContact.name?.[0]}</div>
                  <div>
                    <h2 className="text-xl font-display text-white tracking-wide">{selectedContact.name}</h2>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-display uppercase ${STATUS_COLORS[selectedContact.status] || STATUS_COLORS.Inactive}`}>{selectedContact.status || "Lead"}</span>
                      <span className="text-xs text-white/40">{selectedContact.company}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-white/20 hover:text-white transition-colors"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1">Communication</div>
                  <DetailField label="Email" value={selectedContact.email} icon={<Mail size={12} />} />
                  <DetailField label="Phone" value={selectedContact.phone} icon={<Phone size={12} />} />
                  <DetailField label="LinkedIn" value={selectedContact.linkedin} icon={<Link2 size={12} />} />
                  <DetailField label="Website" value={selectedContact.website} icon={<Globe size={12} />} />
                </div>
                <div className="space-y-4">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1">Business Intelligence</div>
                  <DetailField label="Value" value={selectedContact.value} icon={<DollarSign size={12} />} />
                  <DetailField label="Lead Source" value={selectedContact.source} icon={<Sparkles size={12} />} />
                  <DetailField label="Last Contact" value={selectedContact.last_contact} icon={<Clock size={12} />} />
                  <DetailField label="Next Step" value={selectedContact.next_step} icon={<Calendar size={12} />} />
                </div>
              </div>
              <div className="glass-crimson rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase">CRM Strategic Insight</div>
                  {isThinking && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </div>
                <p className="text-xs text-white/60 italic leading-relaxed">{aiInsight || "Erebus is analyzing lead data..."}</p>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <Briefcase size={48} className="mb-4" />
              <div className="text-sm font-display tracking-widest uppercase">Select a lead to view pipeline intelligence</div>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}