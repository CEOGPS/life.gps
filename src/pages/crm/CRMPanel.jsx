import { useState, useEffect, useRef } from "react";
import { 
  Briefcase, Search, Plus, Upload, Filter, Tag, Mail, Phone, 
  Sparkles, Globe, Users, MapPin, DollarSign, 
  Calendar, Clock, Link2, X 
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout";
import { dbFetch } from "@/lib/supabase";

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

export default function CRMPanel() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const data = await dbFetch("crm_contacts?order=created_at.desc&limit=1000");
        setContacts(data || []);
      } catch {
        setContacts([]);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

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
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all uppercase tracking-wider">
          <Plus size={12} /> Add Lead
        </button>
      }
    >
      <div className="h-full flex gap-4 overflow-hidden">
        {/* Left: CRM List */}
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

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {isLoading ? (
              <div className="text-center py-10 text-white/20 text-xs">Syncing pipeline...</div>
            ) : filteredContacts.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedId(c.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                  selectedId === c.id ? "glass-crimson border-primary/40" : "glass border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className={`text-xs font-medium truncate ${selectedId === c.id ? "text-primary" : "text-white/80"}`}>{c.name}</div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded border font-display uppercase ${STATUS_COLORS[c.status] || STATUS_COLORS.Inactive}`}>
                    {c.status || "Lead"}
                  </span>
                </div>
                <div className="text-[10px] text-white/40 truncate">{c.email}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detailed CRM Profile */}
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
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-display uppercase ${STATUS_COLORS[selectedContact.status] || STATUS_COLORS.Inactive}`}>
                        {selectedContact.status || "Lead"}
                      </span>
                      <span className="text-xs text-white/40">{selectedContact.company}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-white/20 hover:text-white transition-colors">
                  <X size={20} />
                </button>
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
                <div className="text-[10px] font-display tracking-widest text-teal uppercase mb-2">CRM Strategic Insight</div>
                <p className="text-xs text-white/60 italic leading-relaxed">
                  "This lead has high intent based on their recent activity. Recommend a customized pitch focusing on {selectedContact.industry || 'their business needs'}."
                </p>
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
