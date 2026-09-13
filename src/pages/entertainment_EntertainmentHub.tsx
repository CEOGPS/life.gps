import { Sparkles, Search, Star, Zap, Music, Video, Image, Bot, Code, Palette, PenTool } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { useState, useEffect } from "react";

const CATEGORIES = [
  { id: "all", label: "All", icon: <Sparkles size={14} /> },
  { id: "life-hacks", label: "Life Hacks", icon: <Zap size={14} /> },
  { id: "free-tools", label: "Free Tools", icon: <Search size={14} /> },
  { id: "make-money", label: "Make Money", icon: <Star size={14} /> },
  { id: "ai-simulators", label: "AI Simulators", icon: <Bot size={14} /> },
  { id: "creative", label: "Creative", icon: <Palette size={14} /> },
  { id: "gaming", label: "Gaming", icon: <Video size={14} /> },
];

const ENTERTAINMENT_ITEMS = [
  {
    id: "dream-forge",
    title: "Dream Forge Simulator",
    desc: "Turn life visions into 6-12 month grounded simulations with revenue projections",
    category: "ai-simulators",
    icon: <Sparkles size={16} />,
    color: "#8b7fff",
  },
  {
    id: "alternate-life",
    title: "Alternate Life Explorer",
    desc: "Explore parallel life paths based on your current data",
    category: "ai-simulators",
    icon: <Bot size={16} />,
    color: "#4ab3f4",
  },
  {
    id: "dark-card",
    title: "Dark Card Game",
    desc: "Strategic decision-making through tarot-style card draws",
    category: "gaming",
    icon: <Video size={16} />,
    color: "#ff4f5e",
  },
  {
    id: "echo-persona",
    title: "Echo Persona Weaver",
    desc: "Weave AI personas that echo your patterns",
    category: "ai-simulators",
    icon: <Bot size={16} />,
    color: "#8b7fff",
  },
  {
    id: "fantasy-friend",
    title: "Fantasy Friend Simulator",
    desc: "Co-create interactive fiction with AI companions",
    category: "creative",
    icon: <Image size={16} />,
    color: "#4ab3f4",
  },
  {
    id: "game-state",
    title: "Game State Optimizer",
    desc: "Optimize your life as a strategy game",
    category: "gaming",
    icon: <Video size={16} />,
    color: "#ff8c42",
  },
  {
    id: "marketing-os",
    title: "Marketing OS",
    desc: "Full marketing dashboard with listings, SEO, campaigns",
    category: "make-money",
    icon: <Star size={16} />,
    color: "#8b7fff",
  },
  {
    id: "mood-monetize",
    title: "Mood → Monetization",
    desc: "Turn emotional states into revenue opportunities",
    category: "make-money",
    icon: <Star size={16} />,
    color: "#ff6b9d",
  },
  {
    id: "narrative-engine",
    title: "Narrative Conflict Engine",
    desc: "Generate conflict-driven story simulations",
    category: "creative",
    icon: <PenTool size={16} />,
    color: "#8b7fff",
  },
  {
    id: "shadow-budget",
    title: "Shadow Budget Oracle",
    desc: "Oracle for hidden financial patterns",
    category: "make-money",
    icon: <Search size={16} />,
    color: "#8b7fff",
  },
  {
    id: "karaoke",
    title: "Karaoke Duet Generator",
    desc: "AI duet generator for creative breaks",
    category: "creative",
    icon: <Music size={16} />,
    color: "#ff6b9d",
  },
  {
    id: "life-hacks",
    title: "Daily Life Hacks",
    desc: "Practical shortcuts that compound over time",
    category: "life-hacks",
    icon: <Zap size={16} />,
    color: "#00c896",
  },
  {
    id: "free-tools",
    title: "Free Online Tools",
    desc: "Best free tools to run your business and life",
    category: "free-tools",
    icon: <Search size={16} />,
    color: "#4ab3f4",
  },
  {
    id: "make-money-ideas",
    title: "Income Stream Ideas",
    desc: "Ways to make money ranked by effort vs potential",
    category: "make-money",
    icon: <Star size={16} />,
    color: "#ff8c42",
  },
];

function Card({ item, onClick }: { item: typeof ENTERTAINMENT_ITEMS[0]; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group p-4 rounded-xl border bg-white/3 hover:bg-white/6 hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col"
      style={{ borderColor: `${item.color}20` }}
    >
      <div className="flex items-center justify-between mb-3">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${item.color}20`, border: `1px solid ${item.color}40` }}
        >
          {item.icon}
        </div>
      </div>
      <h3 className="font-semibold text-white-90 mb-1 group-hover:text-white transition-colors">
        {item.title}
      </h3>
      <p className="text-sm text-white-50 flex-1 mb-3">{item.desc}</p>
      <span 
        className="text-xs font-medium px-2 py-1 rounded-full self-start"
        style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}40` }}
      >
        {CATEGORIES.find(c => c.id === item.category)?.label || item.category}
      </span>
    </button>
  );
}

export default function EntertainmentHub() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<typeof ENTERTAINMENT_ITEMS[0] | null>(null);

  const filteredItems = ENTERTAINMENT_ITEMS.filter(item => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch = searchQuery === "" || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <PanelLayout
      title="Entertainment Hub"
      subtitle="Playgrounds, tools, and simulators for work and play"
      icon={<Sparkles size={18} />}
    >
      <div className="h-full flex flex-col gap-4">
        {/* Search & Filter */}
        <div className="flex flex-col gap-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entertainment..."
              className="w-full h-10 pl-10 pr-4 text-sm bg-white/4 border border-white/6 rounded-lg text-white-90 placeholder:text-white-30 focus:outline-none focus:border-primary/40"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display tracking-wider whitespace-nowrap transition-all ${
                  activeCategory === cat.id
                    ? "glass-crimson text-primary"
                    : "glass text-white/35 hover:text-white/70"
                }`}
              >
                {cat.icon} {cat.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/30 gap-2">
              <Search size={48} className="text-white/20" />
              <p className="text-sm">No items found</p>
              <p className="text-xs">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <Card key={item.id} item={item} onClick={() => setSelectedItem(item)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setSelectedItem(null)}>
          <div className="bg-black/95 border rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" style={{ borderColor: `${selectedItem.color}40` }} onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${selectedItem.color}20`, border: `1px solid ${selectedItem.color}40` }}>
                  {selectedItem.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg" style={{ color: selectedItem.color }}>{selectedItem.title}</h3>
                  <span className="text-xs text-white-50 px-2 py-0.5 rounded-full" style={{ background: `${selectedItem.color}20`, border: `1px solid ${selectedItem.color}40` }}>
                    {CATEGORIES.find(c => c.id === selectedItem.category)?.label || selectedItem.category}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-white/40 hover:text-white text-2xl">×</button>
            </div>
            <p className="text-white-70 mb-4">{selectedItem.desc}</p>
            <div className="p-4 rounded-xl" style={{ background: `${selectedItem.color}10`, border: `1px solid ${selectedItem.color}30` }}>
              <p className="text-sm text-white-60 mb-3">This would launch the full simulator/tool experience.</p>
              <button className="w-full py-2 px-4 rounded-lg font-medium text-sm text-black" style={{ background: selectedItem.color }}>
                Launch {selectedItem.title}
              </button>
            </div>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}