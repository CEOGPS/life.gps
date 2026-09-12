import { useState, useRef, useEffect } from "react";
import { Wand2, Image, Video, Music2, FileText, Plus, Folder, Users, Sparkles, Send } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const TEAL = "oklch(0.75 0.15 175)";

const TOOLS = [
  { icon: <Image size={18} />, label: "Image Studio", desc: "AI image generation & editing" },
  { icon: <Video size={18} />, label: "Video Studio", desc: "Create & edit video content" },
  { icon: <Music2 size={18} />, label: "Music Studio", desc: "Compose & produce music" },
  { icon: <FileText size={18} />, label: "Doc Studio", desc: "Write & publish content" },
  { icon: <Users size={18} />, label: "AI Matchmaker", desc: "Find customers, partners, hires" },
  { icon: <Sparkles size={18} />, label: "AI Assistant", desc: "Enhance any creation with AI" },
];

type ChatMsg = {
  role: "user" | "assistant";
  text: string;
};

export default function CreatorPanel() {
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = chatInput.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text },
      { role: "assistant", text: "I'm your AI creative assistant. I'll help you generate content, brainstorm ideas, and build projects." },
    ]);
    setChatInput("");
  };

  return (
    <PanelLayout
      title="CreatorOS1"
      subtitle="Full-stack content studio with AI"
      icon={<Wand2 size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Plus size={12} /> NEW PROJECT
        </button>
      }
    >
      <div className="h-full flex gap-4 overflow-y-auto">
        {/* Main content */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Tools grid */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            {TOOLS.map((tool) => (
              <div
                key={tool.label}
                className="glass rounded-xl p-4 border border-white/8 hover:border-primary/25 cursor-pointer group transition-all hover:glow-crimson"
              >
                <div className="w-10 h-10 rounded-lg glass-crimson flex items-center justify-center mb-3 group-hover:glow-crimson-sm transition-all">
                  <span className="text-primary/70">{tool.icon}</span>
                </div>
                <div className="text-xs text-white/80 font-medium mb-1">{tool.label}</div>
                <div className="text-[10px] text-white/40 leading-relaxed">{tool.desc}</div>
              </div>
            ))}
          </div>

          {/* Recent projects — shrunk to make room for chat */}
          <div className="h-24 glass rounded-xl border border-white/8 flex flex-col overflow-hidden shrink-0">
            <div className="px-3 py-2 border-b border-white/5">
              <span className="text-[10px] font-display tracking-wider" style={{ color: TEAL }}>RECENT PROJECTS</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center flex items-center gap-2">
                <Folder size={14} className="text-white/10" />
                <div className="text-xs text-white/30">No projects yet</div>
              </div>
            </div>
          </div>

          {/* LLM Chat box */}
          <div className="flex-1 glass rounded-xl border border-white/8 flex flex-col overflow-hidden min-h-[220px]">
            {/* Chat header */}
            <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2 shrink-0">
              <Wand2 size={12} className="text-primary/60" />
              <span className="text-[10px] font-display tracking-widest" style={{ color: TEAL }}>GENERATE</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Wand2 size={22} className="mx-auto text-white/10 mb-2" />
                    <div className="text-xs text-white/30">Ask AI to generate content, ideas, or scripts</div>
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        m.role === "user" ? "glass-crimson text-white/80" : "glass text-white/70"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5 flex items-center gap-2 shrink-0">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask AI to generate…"
                className="flex-1 h-8 px-3 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
              />
              <button
                onClick={handleSend}
                className="w-8 h-8 rounded-lg glass-crimson flex items-center justify-center text-primary hover:glow-crimson-sm transition-all"
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Local feed sidebar */}
        <div className="w-52 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl border border-white/8 p-3 flex-1 flex flex-col">
            <div className="text-[9px] font-display tracking-widest mb-2" style={{ color: TEAL }}>LOCAL FEED</div>
            <div className="text-[10px] text-white/40 leading-relaxed mb-3">
              Hyper-local feed for connections, collabs, and events in your area.
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users size={18} className="mx-auto text-white/10 mb-2" />
                <div className="text-[10px] text-white/30">Connect location to see local creators</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
