import { MapPin, Plus, Save, Layers, Search, Trash2, Eye, ZoomIn, ZoomOut, Navigation } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState } from "react";

const SAVED_AREAS = [
  { name: "North Dallas Service Area", type: "radius", color: "#dc2626" },
  { name: "Collin County", type: "county", color: "#2563eb" },
  { name: "TX Premium Zips", type: "zip", color: "#16a34a" },
];

const TOOLS = [
  { icon: <MapPin size={13} />, label: "Pin" },
  { icon: <Navigation size={13} />, label: "Radius" },
  { icon: <Layers size={13} />, label: "Zip Code" },
  { icon: <Eye size={13} />, label: "County" },
];

export default function MapsPanel() {
  const [activeTool, setActiveTool] = useState(0);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);

  return (
    <PanelLayout
      title="Maps"
      subtitle="Highlight service areas, zip codes, radius zones, and geolocate clients"
      icon={<MapPin size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Save size={12} /> SAVE AREA
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          {/* Left sidebar */}
          <div className="w-56 shrink-0 flex flex-col gap-3">
            {/* Drawing tools */}
            <div className="glass rounded-xl border border-white/8 p-3">
              <div className="text-[9px] font-display tracking-widest mb-2" style={{ color: "oklch(0.75 0.15 175)" }}>DRAWING TOOLS</div>
              <div className="grid grid-cols-2 gap-1.5">
                {TOOLS.map((t, i) => (
                  <button key={t.label} onClick={() => setActiveTool(i)}
                    className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-[10px] font-display transition-colors
                      ${activeTool === i ? "glass-crimson text-primary" : "glass text-white/40 hover:text-white/70"}`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search location */}
            <div className="glass rounded-xl border border-white/8 p-3">
              <div className="text-[9px] font-display tracking-widest mb-2" style={{ color: "oklch(0.75 0.15 175)" }}>SEARCH LOCATION</div>
              <div className="relative">
                <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/25" />
                <input placeholder="City, zip, address..." className="w-full h-7 pl-7 text-[11px] rounded-lg text-white/80 placeholder:text-white/25 focus:outline-none"
                  style={{ background: "oklch(1 0 0 / 4%)", border: "1px solid oklch(0.55 0.22 20 / 15%)" }} />
              </div>
              <input type="number" placeholder="Radius (miles)" className="w-full h-7 px-2 text-[11px] rounded-lg text-white/80 placeholder:text-white/25 focus:outline-none mt-1.5"
                style={{ background: "oklch(1 0 0 / 4%)", border: "1px solid oklch(0.55 0.22 20 / 15%)" }} />
            </div>

            {/* Saved areas */}
            <div className="glass rounded-xl border border-white/8 p-3 flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[9px] font-display tracking-widest" style={{ color: "oklch(0.75 0.15 175)" }}>SAVED AREAS</div>
                <button className="text-[9px] text-white/20 hover:text-primary/60 font-display">+ NEW</button>
              </div>
              <div className="space-y-1.5">
                {SAVED_AREAS.map((a) => (
                  <div key={a.name}
                    onClick={() => setSelectedArea(a.name)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
                      ${selectedArea === a.name ? "glass-crimson" : "hover:bg-white/4"}`}
                  >
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: a.color + "80", border: `1px solid ${a.color}` }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-white/70 truncate">{a.name}</div>
                      <div className="text-[8px] text-white/30 capitalize">{a.type}</div>
                    </div>
                    <button className="text-white/20 hover:text-primary/60 shrink-0"><Trash2 size={9} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Map canvas */}
          <div className="flex-1 glass rounded-xl border overflow-hidden flex flex-col" style={{ minHeight: 440, borderColor: "oklch(0.55 0.22 20 / 18%)" }}>
            {/* Map toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: "oklch(0.55 0.22 20 / 12%)", background: "oklch(0.05 0 0 / 80%)" }}>
              <button className="text-white/30 hover:text-white/70 p-1 rounded transition-colors"><ZoomIn size={13} /></button>
              <button className="text-white/30 hover:text-white/70 p-1 rounded transition-colors"><ZoomOut size={13} /></button>
              <div className="flex gap-1 ml-2">
                {["Road", "Satellite", "Hybrid"].map((m, i) => (
                  <button key={m} className={`text-[9px] px-2 py-0.5 rounded font-display transition-colors
                    ${i === 0 ? "glass-crimson text-primary" : "text-white/30 hover:text-white/60"}`}>{m}</button>
                ))}
              </div>
              <div className="ml-auto text-[9px] text-white/25">Connect Google Maps API to activate</div>
            </div>

            {/* Map placeholder */}
            <div className="flex-1 flex items-center justify-center relative"
              style={{ background: "linear-gradient(135deg, oklch(0.08 0 0), oklch(0.04 0 0))" }}
            >
              {/* Grid overlay mimicking map tiles */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "linear-gradient(oklch(0.55 0.22 20 / 15%) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.22 20 / 15%) 1px, transparent 1px)", backgroundSize: "60px 60px" }}
              />
              <div className="text-center z-10">
                <MapPin size={36} className="mx-auto mb-3 text-primary/40" />
                <div className="text-sm text-white/30 mb-1">Interactive Map</div>
                <div className="text-xs mb-4" style={{ color: "oklch(0.75 0.15 175 / 60%)" }}>Wire Google Maps API to draw service areas,<br />highlight zip codes, counties, and radius zones</div>
                <button className="px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
                  CONNECT MAPS API
                </button>
              </div>

              {/* Sample saved area overlays */}
              {SAVED_AREAS.map((a, i) => (
                <div key={a.name}
                  className="absolute rounded-full opacity-20 border-2"
                  style={{
                    width: 120 + i * 40, height: 120 + i * 40,
                    left: `${30 + i * 15}%`, top: `${25 + i * 10}%`,
                    borderColor: a.color,
                    background: a.color + "20",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="h-8" />
      </div>
    </PanelLayout>
  );
}
