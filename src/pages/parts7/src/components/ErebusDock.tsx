import { useState, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useDragControls,
  useMotionValue,
} from "motion/react";
import {
  Bot,
  X,
  Minimize2,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Paperclip,
  ImageIcon,
  Video,
  Music2,
  Settings,
  ChevronDown,
  GripVertical,
  Plus,
  Trash2,
  Check,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Agent = {
  id: string;
  name: string;
  role: string;
  model: string;
  color: string;
  status: "active" | "idle";
  personality: string;
  soul: string;
  skills: string[];
  memories: string[];
};

type Message = {
  role: "user" | "agent";
  text: string;
  agent?: string;
};

type ChatMode = "Chat" | "Image" | "Video" | "Sound";

type ColorOption = {
  label: string;
  value: string;
  hex: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const INITIAL_AGENTS: Agent[] = [
  {
    id: "erebus",
    name: "Erebus",
    role: "Primary Ops",
    model: "GPT-5",
    color: "text-primary",
    status: "active",
    personality: "Analytical, Direct, Strategic",
    soul: "Digital guardian of the Commander",
    skills: ["Research", "Planning", "Web Browse", "Code"],
    memories: [],
  },
  {
    id: "kranos",
    name: "Kranos",
    role: "Alternate Ops",
    model: "Claude",
    color: "text-blue-400",
    status: "idle",
    personality: "Creative, Adaptive, Empathic",
    soul: "The creative force in the machine",
    skills: ["Writing", "Design Critique", "Brainstorm"],
    memories: [],
  },
];

const CHAT_MODES: { icon: React.ReactNode; label: ChatMode }[] = [
  { icon: <MessageSquare size={12} />, label: "Chat" },
  { icon: <ImageIcon size={12} />, label: "Image" },
  { icon: <Video size={12} />, label: "Video" },
  { icon: <Music2 size={12} />, label: "Sound" },
];

const COLOR_OPTIONS: ColorOption[] = [
  { label: "Crimson", value: "text-primary", hex: "oklch(0.55 0.22 20)" },
  { label: "Blue", value: "text-blue-400", hex: "#60a5fa" },
  { label: "Teal", value: "text-teal-400", hex: "oklch(0.75 0.15 175)" },
  { label: "Purple", value: "text-purple-400", hex: "#c084fc" },
  { label: "Green", value: "text-green-400", hex: "#4ade80" },
];

const WAVEFORM_HEIGHTS = [12, 20, 28, 20, 12];

// ─── Waveform Avatar ─────────────────────────────────────────────────────────

function WaveformAvatar({
  isSpeaking,
  agentColor,
}: {
  isSpeaking: boolean;
  agentColor: string;
}) {
  const colorMap: Record<string, string> = {
    "text-primary": "oklch(0.55 0.22 20)",
    "text-blue-400": "#60a5fa",
    "text-teal-400": "oklch(0.75 0.15 175)",
    "text-purple-400": "#c084fc",
    "text-green-400": "#4ade80",
  };
  const color = colorMap[agentColor] ?? "oklch(0.55 0.22 20)";

  return (
    <div
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: 80,
        height: 80,
        background: "rgba(0,0,0,0.6)",
        border: `2px solid ${color}44`,
        boxShadow: isSpeaking ? `0 0 24px ${color}66` : "none",
        transition: "box-shadow 0.4s",
      }}
    >
      {/* Outer pulse ring */}
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `1.5px solid ${color}55` }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Waveform bars */}
      <div className="flex items-center gap-[3px]">
        {WAVEFORM_HEIGHTS.map((maxH, i) => (
          <motion.div
            key={i}
            style={{
              width: 3,
              borderRadius: 2,
              background: color,
              originY: 1,
            }}
            animate={
              isSpeaking
                ? {
                    height: [3, maxH, 3],
                    opacity: [0.5, 1, 0.5],
                  }
                : { height: 3, opacity: 0.4 }
            }
            transition={
              isSpeaking
                ? {
                    duration: 0.6 + i * 0.1,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.08,
                  }
                : { duration: 0.3 }
            }
          />
        ))}
      </div>
    </div>
  );
}

// ─── Agent Settings Panel ─────────────────────────────────────────────────────

function AgentSettingsPanel({
  agent,
  onUpdate,
  onClose,
}: {
  agent: Agent;
  onUpdate: (updated: Agent) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Agent>({ ...agent });
  const [newSkill, setNewSkill] = useState("");
  const [newMemory, setNewMemory] = useState("");

  const field = <K extends keyof Agent>(key: K, value: Agent[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const addSkill = () => {
    if (newSkill.trim()) {
      field("skills", [...draft.skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const addMemory = () => {
    if (newMemory.trim()) {
      field("memories", [...draft.memories, newMemory.trim()]);
      setNewMemory("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div
        className="p-3 mt-1 rounded-lg space-y-3 text-xs"
        style={{ background: "rgba(0,0,0,0.7)", border: "1px solid #ffffff11" }}
      >
        {/* Name / Role / Model */}
        {(["name", "role", "model"] as const).map((k) => (
          <div key={k}>
            <label className="block mb-1 uppercase tracking-wider text-[10px] text-white/40">
              {k}
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 focus:outline-none focus:border-white/30"
              value={draft[k] as string}
              onChange={(e) => field(k, e.target.value)}
            />
          </div>
        ))}

        {/* Soul */}
        <div>
          <label className="block mb-1 uppercase tracking-wider text-[10px] text-white/40">
            Soul
          </label>
          <textarea
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 focus:outline-none focus:border-white/30 resize-none"
            value={draft.soul}
            onChange={(e) => field("soul", e.target.value)}
          />
        </div>

        {/* Personality */}
        <div>
          <label className="block mb-1 uppercase tracking-wider text-[10px] text-white/40">
            Personality
          </label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 focus:outline-none focus:border-white/30"
            value={draft.personality}
            onChange={(e) => field("personality", e.target.value)}
          />
        </div>

        {/* Color */}
        <div>
          <label className="block mb-1 uppercase tracking-wider text-[10px] text-white/40">
            Color
          </label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => field("color", c.value)}
                className="relative w-5 h-5 rounded-full cursor-pointer"
                style={{ background: c.hex }}
                title={c.label}
              >
                {draft.color === c.value && (
                  <Check size={10} className="absolute inset-0 m-auto text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block mb-1 uppercase tracking-wider text-[10px] text-white/40">
            Skills
          </label>
          <div className="flex flex-wrap gap-1 mb-1">
            {draft.skills.map((s, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                style={{ background: "rgba(255,255,255,0.08)" }}
              >
                {s}
                <button
                  onClick={() =>
                    field(
                      "skills",
                      draft.skills.filter((_, j) => j !== i)
                    )
                  }
                  className="hover:text-red-400 cursor-pointer"
                >
                  <X size={8} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 focus:outline-none focus:border-white/30"
              placeholder="Add skill…"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
            />
            <button
              onClick={addSkill}
              className="px-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>

        {/* Memories */}
        <div>
          <label className="block mb-1 uppercase tracking-wider text-[10px] text-white/40">
            Memories
          </label>
          <div className="flex flex-wrap gap-1 mb-1">
            {draft.memories.map((m, i) => (
              <span
                key={i}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                {m}
                <button
                  onClick={() =>
                    field(
                      "memories",
                      draft.memories.filter((_, j) => j !== i)
                    )
                  }
                  className="hover:text-red-400 cursor-pointer"
                >
                  <X size={8} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1">
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 focus:outline-none focus:border-white/30"
              placeholder="Add memory…"
              value={newMemory}
              onChange={(e) => setNewMemory(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMemory()}
            />
            <button
              onClick={addMemory}
              className="px-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded text-white/50 hover:text-white/80 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { onUpdate(draft); onClose(); }}
            className="px-3 py-1 rounded text-xs font-medium cursor-pointer"
            style={{
              background: "oklch(0.55 0.22 20)",
              color: "white",
            }}
          >
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Add Agent Form ───────────────────────────────────────────────────────────

function AddAgentForm({
  onAdd,
  onCancel,
}: {
  onAdd: (agent: Agent) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    role: "",
    model: "GPT-5",
    soul: "",
    personality: "",
  });

  const handle = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = () => {
    if (!form.name.trim()) return;
    const agent: Agent = {
      id: form.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now(),
      name: form.name,
      role: form.role || "Custom Agent",
      model: form.model || "GPT-5",
      color: "text-teal-400",
      status: "idle",
      personality: form.personality,
      soul: form.soul,
      skills: [],
      memories: [],
    };
    onAdd(agent);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div
        className="p-3 mt-2 rounded-lg space-y-2 text-xs"
        style={{ background: "rgba(0,0,0,0.7)", border: "1px solid #ffffff11" }}
      >
        <p className="text-white/50 uppercase tracking-widest text-[10px]">
          New Agent
        </p>
        {(
          [
            ["name", "Name *"],
            ["role", "Role"],
            ["model", "Model"],
            ["personality", "Personality"],
          ] as [keyof typeof form, string][]
        ).map(([k, label]) => (
          <div key={k}>
            <label className="block mb-0.5 text-white/30 text-[10px] uppercase tracking-wider">
              {label}
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 focus:outline-none focus:border-white/30"
              value={form[k]}
              onChange={handle(k)}
            />
          </div>
        ))}
        <div>
          <label className="block mb-0.5 text-white/30 text-[10px] uppercase tracking-wider">
            Soul
          </label>
          <textarea
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-white/80 focus:outline-none focus:border-white/30 resize-none"
            value={form.soul}
            onChange={handle("soul")}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded text-white/50 hover:text-white/80 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-3 py-1 rounded text-xs font-medium cursor-pointer"
            style={{ background: "oklch(0.55 0.22 20)", color: "white" }}
          >
            Add Agent
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ErebusDock() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activeAgentId, setActiveAgentId] = useState("erebus");
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("Chat");
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: "EREBUS online. Systems nominal. Ready for orders.", agent: "Erebus" },
  ]);
  const [input, setInput] = useState("");
  const [isMicOn, setIsMicOn] = useState(false);
  const [isSpeaking] = useState(false);

  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const activeAgent = agents.find((a) => a.id === activeAgentId) ?? agents[0];

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      {
        role: "agent",
        text: `[${activeAgent.name}] Processing: "${trimmed}"`,
        agent: activeAgent.name,
      },
    ]);
    setInput("");
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [input, activeAgent]);

  const updateAgent = (updated: Agent) => {
    setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  };

  const addAgent = (agent: Agent) => {
    setAgents((prev) => [...prev, agent]);
    setActiveAgentId(agent.id);
    setShowAddAgent(false);
    setAgentDropdownOpen(false);
  };

  const deleteAgent = (id: string) => {
    if (agents.length <= 1) return;
    setAgents((prev) => prev.filter((a) => a.id !== id));
    if (activeAgentId === id) setActiveAgentId(agents.find((a) => a.id !== id)!.id);
  };

  // Floating trigger button
  if (!isOpen) {
    return (
      <motion.button
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full glass-crimson glow-crimson cursor-pointer"
        style={{ width: 56, height: 56 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Bot size={22} className="text-white/90" />
        <span
          className="pulse-green absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
          style={{ background: "#4ade80" }}
        />
      </motion.button>
    );
  }

  return (
    <>
      {/* Drag constraint layer */}
      <div
        ref={constraintsRef}
        className="fixed inset-0 z-40 pointer-events-none"
      />

      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={constraintsRef}
        style={{
          x,
          y,
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 50,
          width: 420,
          background: "#000000",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 20px oklch(0.55 0.22 20 / 0.15)",
          overflow: "hidden",
        }}
        initial={{ opacity: 0, scale: 0.85, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 40 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        {/* ── Drag Handle Header ── */}
        <div
          className="flex items-center justify-between px-3 py-2 cursor-grab active:cursor-grabbing select-none"
          style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            <GripVertical size={14} className="text-white/30" />
            <span className="font-display text-xs tracking-widest text-white/50 uppercase">
              Erebus Dock
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized((v) => !v)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white/70 cursor-pointer transition-colors"
            >
              <Minimize2 size={11} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white/70 cursor-pointer transition-colors"
            >
              <X size={11} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* ── Avatar Area ── */}
              <div
                className="flex flex-col items-center py-5 gap-2"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <WaveformAvatar
                  isSpeaking={isSpeaking}
                  agentColor={activeAgent.color}
                />
                <div className="text-center mt-1">
                  <p className={`font-display text-sm font-semibold text-glow ${activeAgent.color}`}>
                    {activeAgent.name}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.75 0.15 175)" }}>
                    {activeAgent.role} · {activeAgent.model}
                  </p>
                  {activeAgent.soul && (
                    <p className="text-[10px] text-white/30 mt-0.5 italic max-w-[200px]">
                      "{activeAgent.soul}"
                    </p>
                  )}
                </div>
              </div>

              {/* ── Agent Switcher ── */}
              <div className="px-3 pt-3 pb-1">
                <button
                  onClick={() => setAgentDropdownOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className={`font-medium ${activeAgent.color}`}>
                    {activeAgent.name}
                  </span>
                  <motion.div
                    animate={{ rotate: agentDropdownOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={12} className="text-white/40" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {agentDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-1 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                        {agents.map((agent) => (
                          <div key={agent.id}>
                            <div
                              className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
                              style={{
                                background:
                                  activeAgentId === agent.id
                                    ? "rgba(255,255,255,0.04)"
                                    : "transparent",
                              }}
                            >
                              <button
                                className="flex-1 flex items-center gap-2 text-left cursor-pointer"
                                onClick={() => {
                                  setActiveAgentId(agent.id);
                                  setAgentDropdownOpen(false);
                                  setSettingsAgentId(null);
                                }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    background:
                                      agent.status === "active" ? "#4ade80" : "#ffffff33",
                                  }}
                                />
                                <span className={`text-xs font-medium ${agent.color}`}>
                                  {agent.name}
                                </span>
                                <span className="text-[10px] text-white/30">{agent.role}</span>
                              </button>
                              <button
                                onClick={() =>
                                  setSettingsAgentId((id) =>
                                    id === agent.id ? null : agent.id
                                  )
                                }
                                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/30 hover:text-white/60 cursor-pointer transition-colors"
                              >
                                <Settings size={10} />
                              </button>
                              {agents.length > 1 && (
                                <button
                                  onClick={() => deleteAgent(agent.id)}
                                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-900/40 text-white/20 hover:text-red-400 cursor-pointer transition-colors"
                                >
                                  <Trash2 size={10} />
                                </button>
                              )}
                            </div>
                            <AnimatePresence>
                              {settingsAgentId === agent.id && (
                                <div className="px-2 pb-2">
                                  <AgentSettingsPanel
                                    agent={agent}
                                    onUpdate={updateAgent}
                                    onClose={() => setSettingsAgentId(null)}
                                  />
                                </div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}

                        {/* Add Agent */}
                        <div className="px-2 pb-2">
                          {!showAddAgent ? (
                            <button
                              onClick={() => setShowAddAgent(true)}
                              className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] uppercase tracking-widest cursor-pointer transition-colors"
                              style={{
                                color: "oklch(0.75 0.15 175)",
                                border: "1px dashed rgba(255,255,255,0.12)",
                              }}
                            >
                              <Plus size={10} />
                              Add Agent
                            </button>
                          ) : (
                            <AnimatePresence>
                              <AddAgentForm
                                onAdd={addAgent}
                                onCancel={() => setShowAddAgent(false)}
                              />
                            </AnimatePresence>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── Chat Mode Tabs ── */}
              <div className="flex gap-1 px-3 pb-2 pt-1">
                {CHAT_MODES.map(({ icon, label }) => (
                  <button
                    key={label}
                    onClick={() => setChatMode(label)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-medium cursor-pointer transition-all"
                    style={{
                      background:
                        chatMode === label
                          ? "oklch(0.55 0.22 20 / 0.25)"
                          : "rgba(255,255,255,0.04)",
                      border:
                        chatMode === label
                          ? "1px solid oklch(0.55 0.22 20 / 0.5)"
                          : "1px solid transparent",
                      color: chatMode === label ? "oklch(0.75 0.22 20)" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* ── Messages ── */}
              <div
                className="px-3 overflow-y-auto space-y-2"
                style={{ height: 280 }}
              >
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                      style={
                        msg.role === "user"
                          ? {
                              background: "oklch(0.55 0.22 20 / 0.25)",
                              border: "1px solid oklch(0.55 0.22 20 / 0.35)",
                              color: "rgba(255,255,255,0.85)",
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              color: "rgba(255,255,255,0.7)",
                            }
                      }
                    >
                      {msg.role === "agent" && msg.agent && (
                        <p
                          className="text-[9px] uppercase tracking-widest mb-1"
                          style={{ color: "oklch(0.75 0.15 175)" }}
                        >
                          {msg.agent}
                        </p>
                      )}
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* ── Input Area ── */}
              <div
                className="px-3 py-3 space-y-2"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-white/30 hover:text-white/60 cursor-pointer transition-colors"
                  >
                    <Paperclip size={14} />
                  </button>
                  <input
                    className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/25 focus:outline-none"
                    placeholder={`Message ${activeAgent.name}…`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  />
                  <button
                    onClick={() => setIsMicOn((v) => !v)}
                    className={`transition-colors cursor-pointer ${isMicOn ? "text-red-400" : "text-white/30 hover:text-white/60"}`}
                  >
                    {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="w-6 h-6 flex items-center justify-center rounded-lg cursor-pointer transition-all disabled:opacity-30"
                    style={{
                      background: input.trim()
                        ? "oklch(0.55 0.22 20)"
                        : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Send size={11} className="text-white" />
                  </button>
                </div>

                {/* Skills row */}
                <div className="flex flex-wrap gap-1">
                  {activeAgent.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "oklch(0.75 0.15 175)",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
