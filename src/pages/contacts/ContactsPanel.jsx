import { useState, useEffect, useRef, useMemo } from "react";
import { 
  Users, Search, Plus, Upload, Download, Star, Mail, Phone, MapPin, 
  Sparkles, Globe, Link2, Briefcase, DollarSign, X 
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout";
import { dbFetch } from "@/lib/supabase";
import Erebus from "@/lib/agents/erebus/Erebus";

const LS_KEY = "lifeos_contacts";

function loadLocal() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch { return []; }
}
function saveLocal(list) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch (e) { console.warn("saveLocal failed", e); }
}

async function dbLoadContacts() {
  try {
    const data = await dbFetch("contacts?order=created_at.desc&limit=1000");
    return data || loadLocal();
  } catch { return loadLocal(); }
}

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

export default function ContactsPanel() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    async function init() {
      const data = await dbLoadContacts();
      setContacts(data);
      setIsLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    async function fetchInsight() {
      if (!selectedId) return;
      const contact = contacts.find(c => c.id === selectedId);
      if (!contact) return;

      setIsThinking(true);
      try {
        const prompt = `Analyze this contact: ${contact.name}, Industry: ${contact.industry}, Company: ${contact.company}. Suggest a relationship-building action.`;
        const result = await Erebus.reason(prompt);
        setAiInsight(result.response);
      } catch (e) {
        setAiInsight("Erebus is analyzing the network...");
      } finally {
        setIsThinking(false);
      }
    }
    fetchInsight();
  }, [selectedId, contacts]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(c => 
      c.name?.toLowerCase().includes(search.toLowerCase()) || 
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.toLowerCase().includes(search.toLowerCase())
    );
  }, [contacts, search]);

  const selectedContact = useMemo(() => 
    contacts.find(c => c.id === selectedId), 
    [contacts, selectedId]
  );

  return (
    <PanelLayout
      title="Contacts"
      subtitle="Global network and relationship management"
      icon={<Users size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all uppercase tracking-wider">
          <Plus size={12} /> Add Contact
        </button>
      }
    >
      <div className="h-full flex gap-4 overflow-hidden">
        <div className="w-80 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search network..."
              className="w-full h-9 pl-9 pr-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {isLoading ? (
              <div className="text-center py-10 text-white/20 text-xs">Loading network...</div>
            ) : filteredContacts.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedId(c.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                  selectedId === c.id ? "glass-crimson border-primary/40" : "glass border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-display text-white/60 group-hover:text-primary transition-colors">
                    {c.name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-medium truncate ${selectedId === c.id ? "text-primary" : "text-white/80"}`}>{c.name}</div>
                    <div className="text-[10px] text-white/40 truncate">{c.email}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 glass rounded-2xl border border-white/10 p-6 overflow-y-auto relative">
          {selectedContact ? (
            <div className="max-w-2xl mx-auto space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-display text-primary shadow-lg shadow-primary/10">
                    {selectedContact.name?.[0]}
                  </div>
                  <div>
                    <h2 className="text-xl font-display text-white tracking-wide">{selectedContact.name}</h2>
                    <p className="text-xs text-white/40">{selectedContact.role || "Contact"}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-white/20 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1">Core Identity</div>
                  <DetailField label="Email" value={selectedContact.email} icon={<Mail size={12} />} />
                  <DetailField label="Phone" value={selectedContact.phone} icon={<Phone size={12} />} />
                  <DetailField label="Location" value={selectedContact.location} icon={<MapPin size={12} />} />
                  <DetailField label="Website" value={selectedContact.website} icon={<Globe size={12} />} />
                </div>
                <div className="space-y-4">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2 border-b border-white/10 pb-1">Professional Profile</div>
                  <DetailField label="Company" value={selectedContact.company} icon={<Briefcase size={12} />} />
                  <DetailField label="Position" value={selectedContact.position} icon={<Users size={12} />} />
                  <DetailField label="Industry" value={selectedContact.industry} icon={<Sparkles size={12} />} />
                  <DetailField label="LinkedIn" value={selectedContact.linkedin} icon={<Link2 size={12} />} />
                </div>
              </div>

              <div className="glass-crimson rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[10px] font-display tracking-widest text-teal uppercase">Erebus Insight</div>
                  {isThinking && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                </div>
                <p className="text-xs text-white/60 italic leading-relaxed">
                  {aiInsight || "Erebus is analyzing the network..."}
                </p>
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
