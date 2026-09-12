import { useState } from "react";
import { Plus, ExternalLink, Trash2, Link2 } from "lucide-react";

type QuickLink = { id: string; label: string; url: string; icon?: string };

export default function QuickLinks() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "", url: "" });

  const add = () => {
    if (!form.label || !form.url) return;
    const url = form.url.startsWith("http") ? form.url : `https://${form.url}`;
    setLinks((l) => [...l, { id: Date.now().toString(), label: form.label, url }]);
    setForm({ label: "", url: "" });
    setAdding(false);
  };

  const del = (id: string) => setLinks((l) => l.filter((x) => x.id !== id));

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex-1 overflow-y-auto">
        {links.length === 0 ? (
          <div className="text-center pt-6">
            <Link2 size={20} className="mx-auto text-white/10 mb-2" />
            <div className="text-[11px] text-white/20">No quick links yet</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {links.map((l) => (
              <div key={l.id} className="flex items-center gap-1.5 glass rounded p-2 border border-white/5 group hover:border-primary/20 transition-colors">
                <a href={l.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 flex items-center gap-1.5">
                  <ExternalLink size={10} className="text-primary/40 shrink-0" />
                  <span className="text-[10px] text-white/60 truncate">{l.label}</span>
                </a>
                <button onClick={() => del(l.id)} className="opacity-0 group-hover:opacity-100 text-white/15 hover:text-destructive transition-all">
                  <Trash2 size={9} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding ? (
        <div className="space-y-1.5 border-t border-white/5 pt-2">
          <input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} placeholder="Link label..." className="w-full h-6 px-2 text-[10px] bg-white/4 border border-white/6 rounded text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
          <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="URL or file path..." className="w-full h-6 px-2 text-[10px] bg-white/4 border border-white/6 rounded text-white/70 placeholder:text-white/20 focus:outline-none focus:border-primary/40" />
          <div className="flex gap-1.5">
            <button onClick={add} className="flex-1 h-6 text-[10px] rounded glass-crimson text-primary font-display">ADD</button>
            <button onClick={() => setAdding(false)} className="flex-1 h-6 text-[10px] rounded bg-white/4 text-white/30 font-display">CANCEL</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded border border-dashed border-white/10 text-[10px] text-white/20 hover:border-primary/30 hover:text-primary/50 transition-colors font-display tracking-wider">
          <Plus size={10} /> ADD LINK
        </button>
      )}
    </div>
  );
}
