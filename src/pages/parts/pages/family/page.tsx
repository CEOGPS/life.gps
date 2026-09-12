import { useState } from "react";
import { Heart, Plus, Search, Star, Gift, Phone, Mail, MapPin, Camera, X } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { usePersistentState } from "@/lib/usePersistentState.ts";

type Person = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  birthday?: string;
  favFood?: string;
  favMovie?: string;
  notes?: string;
};

export default function FamilyPanel() {
  const [people, setPeople] = usePersistentState<Person[]>("family_people", []);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const visible = people.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const selected = people.find((p) => p.id === selectedId) || null;

  const addPerson = () => {
    if (!name.trim()) {
      setAdding(false);
      return;
    }
    const person: Person = { id: crypto.randomUUID(), name: name.trim() };
    setPeople([person, ...people]);
    setSelectedId(person.id);
    setName("");
    setAdding(false);
  };

  const updateSelected = (field: keyof Person, value: string) => {
    if (!selected) return;
    setPeople(people.map((p) => (p.id === selected.id ? { ...p, [field]: value } : p)));
  };

  const removeSelected = () => {
    if (!selected) return;
    setPeople(people.filter((p) => p.id !== selected.id));
    setSelectedId(null);
  };

  return (
    <PanelLayout
      title="Family & Friends"
      subtitle="Deep profiles for the people who matter most"
      icon={<Heart size={18} />}
      actions={
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
        >
          <Plus size={12} /> ADD PERSON
        </button>
      }
    >
      <div className="h-full flex gap-4">
        <div className="w-56 shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search people..."
              className="w-full h-8 pl-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/60 placeholder:text-white/20 focus:outline-none focus:border-primary/40"
            />
          </div>
          <div className="glass rounded-xl border border-white/8 p-2 flex-1 overflow-y-auto">
            <div className="text-[9px] text-white/20 font-display tracking-widest px-2 mb-2">PEOPLE</div>
            {adding && (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPerson()}
                onBlur={addPerson}
                placeholder="Person's name..."
                className="w-full px-2 py-1.5 mb-1 rounded bg-white/5 border border-primary/25 text-[11px] text-white/70 outline-none"
              />
            )}
            {visible.length === 0 && !adding ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Heart size={20} className="mx-auto text-white/10 mb-2" />
                  <div className="text-xs text-white/20">No profiles yet</div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {visible.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`px-2 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                      selectedId === p.id ? "bg-primary/10 border border-primary/25 text-primary" : "hover:bg-white/5 text-white/60"
                    }`}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center overflow-y-auto">
          {selected ? (
            <div className="w-full max-w-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full glass-crimson flex items-center justify-center glow-crimson">
                    <Camera size={20} className="text-primary/60" />
                  </div>
                  <div className="text-white/80 font-medium">{selected.name}</div>
                </div>
                <button onClick={removeSelected} className="text-white/20 hover:text-white/50">
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-2">
                {([
                  ["phone", "Phone"],
                  ["email", "Email"],
                  ["birthday", "Birthday"],
                  ["favFood", "Favorite Food"],
                  ["favMovie", "Favorite Movie"],
                  ["notes", "Notes"],
                ] as [keyof Person, string][]).map(([field, label]) => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="text-[10px] text-white/30 w-24 shrink-0">{label}</label>
                    <input
                      value={(selected[field] as string) || ""}
                      onChange={(e) => updateSelected(field, e.target.value)}
                      className="flex-1 px-2 py-1 rounded bg-white/4 border border-white/8 text-xs text-white/70 outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <a
                  href={selected.phone ? `tel:${selected.phone}` : undefined}
                  className={`flex flex-col items-center gap-1 p-2 glass rounded border border-white/5 ${selected.phone ? "text-primary/70 hover:border-primary/30" : "text-white/20 pointer-events-none"}`}
                >
                  <Phone size={12} />
                  <span className="text-[9px]">Call</span>
                </a>
                <a
                  href={selected.email ? `mailto:${selected.email}` : undefined}
                  className={`flex flex-col items-center gap-1 p-2 glass rounded border border-white/5 ${selected.email ? "text-primary/70 hover:border-primary/30" : "text-white/20 pointer-events-none"}`}
                >
                  <Mail size={12} />
                  <span className="text-[9px]">Email</span>
                </a>
                {[
                  { icon: <Gift size={12} />, label: "Gifts" },
                  { icon: <MapPin size={12} />, label: "Location" },
                  { icon: <Star size={12} />, label: "Milestones" },
                  { icon: <Heart size={12} />, label: "Memories" },
                ].map((a) => (
                  <div key={a.label} className="flex flex-col items-center gap-1 p-2 glass rounded border border-white/5 text-white/30">
                    {a.icon}
                    <span className="text-[9px]">{a.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 rounded-full glass-crimson flex items-center justify-center mx-auto mb-4 glow-crimson">
                <Camera size={28} className="text-primary/60" />
              </div>
              <div className="text-sm text-white/30 mb-2">Select a profile to view</div>
              <div className="text-[10px] text-white/15 leading-relaxed">
                Fields: Photo, Name, Contact info, All socials, Birthday, Fav food, Fav movie, Likes, Dislikes, Milestones, Notes & more
              </div>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}
