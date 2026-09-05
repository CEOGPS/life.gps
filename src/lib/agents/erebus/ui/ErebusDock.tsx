// ErebusDock.tsx — Compact version with accessible input
import { useState, useRef, useCallback, useEffect } from "react";
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
  isUnprompted?: boolean;
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
  { icon: <MessageSquare size={10} />, label: "Chat" },
  { icon: <ImageIcon size={10} />, label: "Image" },
  { icon: <Video size={10} />, label: "Video" },
  { icon: <Music2 size={10} />, label: "Sound" },
];

const COLOR_OPTIONS: ColorOption[] = [
  { label: "Crimson", value: "text-primary", hex: "oklch(0.55 0.22 20)" },
  { label: "Blue", value: "text-blue-400", hex: "#60a5fa" },
  { label: "Teal", value: "text-teal-400", hex: "oklch(0.75 0.15 175)" },
  { label: "Purple", value: "text-purple-400", hex: "#c084fc" },
  { label: "Green", value: "text-green-400", hex: "#4ade80" },
];

const WAVEFORM_HEIGHTS = [8, 14, 20, 14, 8];

// ─── Waveform Avatar (Compact) ─────────────────────────────────────────────

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
        width: 44,
        height: 44,
        background: "rgba(0,0,0,0.6)",
        border: `1.5px solid ${color}44`,
        boxShadow: isSpeaking ? `0 0 16px ${color}66` : "none",
        transition: "box-shadow 0.4s",
        flexShrink: 0,
      }}
    >
      {isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid ${color}55` }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="flex items-center gap-[2px]">
        {WAVEFORM_HEIGHTS.map((maxH, i) => (
          <motion.div
            key={i}
            style={{
              width: 2.5,
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
                    duration: 0.5 + i * 0.08,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.06,
                  }
                : { duration: 0.3 }
            }
          />
        ))}
      </div>
    </div>
  );
}

// ─── Avatar Stage (Compact) ────────────────────────────────────────────────

function AvatarStage({
  isSpeaking,
  agentColor,
  agentName,
  pendingMessage,
}: {
  isSpeaking: boolean;
  agentColor: string;
  agentName: string;
  pendingMessage?: { text: string } | null;
}) {
  const colorMap: Record<string, string> = {
    "text-primary": "oklch(0.55 0.22 20)",
    "text-blue-400": "#60a5fa",
    "text-teal-400": "oklch(0.75 0.15 175)",
    "text-purple-400": "#c084fc",
    "text-green-400": "#4ade80",
  };
  const glow = colorMap[agentColor] ?? "oklch(0.55 0.22 20)";
  const hasPending = !!pendingMessage;

  return (
    <div
      className="relative flex items-center justify-center w-full rounded-xl overflow-hidden"
      style={{
        height: 60,
        background: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.03), transparent 70%), #050505",
        border: hasPending ? `1px solid ${glow}77` : `1px solid ${glow}33`,
        boxShadow: isSpeaking || hasPending
          ? `0 0 20px ${glow}33, inset 0 0 30px ${glow}08`
          : `inset 0 0 30px ${glow}05`,
        transition: "all 0.3s",
      }}
    >
      {/* Agent label */}
      <div className="absolute top-1 left-2 z-10 text-[7px] font-display tracking-widest uppercase" style={{ color: glow }}>
        {agentName}
      </div>

      {hasPending && (
        <div className="absolute top-1 right-2 z-10 px-2 py-0.5 rounded-full text-[6px] font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
          ✦ Thinking
        </div>
      )}

      <div
        className="relative w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 35% 30%, ${glow}22, #0a0a0a 70%)`,
          border: `1px solid ${glow}55`,
          boxShadow: `0 0 16px ${glow}33`,
        }}
      >
        <div className="flex items-center justify-center gap-3 w-full">
          {[0, 1].map((i) => (
            <div key={i} className="relative w-2.5 h-3 rounded-full" style={{ width: 10, height: 12, background: "#0a0a0a", border: `0.5px solid ${glow}66` }}>
              <div
                className="absolute rounded-full"
                style={{
                  width: 3.5,
                  height: 4,
                  background: glow,
                  boxShadow: `0 0 6px ${glow}cc`,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute bottom-0.5 flex items-end justify-center gap-0.5" style={{ width: 20, height: 6 }}>
          {[3, 5, 7, 5, 3].map((h, idx) => (
            <motion.div
              key={idx}
              animate={{
                height: isSpeaking ? [2, h, 2] : 2,
                translateY: isSpeaking ? [0, -(h - 2) / 2, 0] : 0,
              }}
              transition={isSpeaking
                ? { duration: 0.12 + idx * 0.03, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 }
              }
              style={{ width: 2, borderRadius: 1, background: glow }}
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-0.5 left-0 right-0 flex items-center justify-center gap-1 z-10">
        <span className={`text-[6px] font-display tracking-widest ${isSpeaking || hasPending ? "text-white/70" : "text-white/30"}`}>
          {isSpeaking ? "● SPEAKING" : hasPending ? "✦ THINKING" : "STANDBY"}
        </span>
      </div>
    </div>
  );
}

// ─── Agent Settings Panel (Compact) ────────────────────────────────────────

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
        className="p-2 mt-1 rounded-lg space-y-2 text-[10px]"
        style={{ background: "rgba(0,0,0,0.8)", border: "1px solid #ffffff11" }}
      >
        {(["name", "role", "model"] as const).map((k) => (
          <div key={k}>
            <label className="block mb-0.5 uppercase tracking-wider text-[8px] text-white/40">
              {k}
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/80 focus:outline-none focus:border-white/30 text-[10px]"
              value={draft[k] as string}
              onChange={(e) => field(k, e.target.value)}
            />
          </div>
        ))}
        <div>
          <label className="block mb-0.5 uppercase tracking-wider text-[8px] text-white/40">
            Soul
          </label>
          <textarea
            rows={1}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/80 focus:outline-none focus:border-white/30 resize-none text-[10px]"
            value={draft.soul}
            onChange={(e) => field("soul", e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-0.5 uppercase tracking-wider text-[8px] text-white/40">
            Personality
          </label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/80 focus:outline-none focus:border-white/30 text-[10px]"
            value={draft.personality}
            onChange={(e) => field("personality", e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-0.5 uppercase tracking-wider text-[8px] text-white/40">
            Color
          </label>
          <div className="flex gap-1 flex-wrap">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => field("color", c.value)}
                className="relative w-3 h-3 rounded-full cursor-pointer"
                style={{ background: c.hex }}
                title={c.label}
              >
                {draft.color === c.value && (
                  <Check size={6} className="absolute inset-0 m-auto text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-1 pt-1">
          <button
            onClick={onClose}
            className="px-2 py-0.5 rounded text-white/50 hover:text-white/80 cursor-pointer text-[9px]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onUpdate(draft);
              onClose();
            }}
            className="px-2 py-0.5 rounded text-[9px] font-medium cursor-pointer"
            style={{ background: "oklch(0.55 0.22 20)", color: "white" }}
          >
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Add Agent Form (Compact) ──────────────────────────────────────────────

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

  const handle = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

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
        className="p-2 mt-1 rounded-lg space-y-1.5 text-[10px]"
        style={{ background: "rgba(0,0,0,0.8)", border: "1px solid #ffffff11" }}
      >
        <p className="text-white/50 uppercase tracking-widest text-[8px]">New Agent</p>
        {(["name", "role", "model", "personality"] as (keyof typeof form)[]).map((k) => (
          <div key={k}>
            <label className="block mb-0.5 text-white/30 text-[8px] uppercase tracking-wider">
              {k}
            </label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/80 focus:outline-none focus:border-white/30 text-[10px]"
              value={form[k]}
              onChange={handle(k)}
            />
          </div>
        ))}
        <div>
          <label className="block mb-0.5 text-white/30 text-[8px] uppercase tracking-wider">
            Soul
          </label>
          <textarea
            rows={1}
            className="w-full bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/80 focus:outline-none focus:border-white/30 resize-none text-[10px]"
            value={form.soul}
            onChange={handle("soul")}
          />
        </div>
        <div className="flex justify-end gap-1 pt-1">
          <button
            onClick={onCancel}
            className="px-2 py-0.5 rounded text-white/50 hover:text-white/80 cursor-pointer text-[9px]"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="px-2 py-0.5 rounded text-[9px] font-medium cursor-pointer"
            style={{ background: "oklch(0.55 0.22 20)", color: "white" }}
          >
            Add
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ErebusDockProps {
  pendingMessage?: { text: string } | null;
  onDismissPending?: () => void;
  isSpeaking?: boolean;
  isThinking?: boolean;
}

export default function ErebusDock({
  pendingMessage = null,
  onDismissPending,
  isSpeaking = false,
  isThinking = false,
}: ErebusDockProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [agents, setAgents] = useState<Agent[]>(INITIAL_AGENTS);
  const [activeAgentId, setActiveAgentId] = useState("erebus");
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
  const [settingsAgentId, setSettingsAgentId] = useState<string | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("Chat");
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", text: "EREBUS online. Ready.", agent: "Erebus" },
  ]);
  const [input, setInput] = useState("");
  const [isMicOn, setIsMicOn] = useState(false);
  const [localIsSpeaking, setLocalIsSpeaking] = useState(false);

  const dragControls = useDragControls();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeAgent = agents.find((a) => a.id === activeAgentId) ?? agents[0];

  useEffect(() => {
    if (isSpeaking) setLocalIsSpeaking(true);
  }, [isSpeaking]);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (onDismissPending) onDismissPending();

    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      {
        role: "agent",
        text: `[${activeAgent.name}] Processing...`,
        agent: activeAgent.name,
      },
    ]);
    setInput("");
    setLocalIsSpeaking(true);
    setTimeout(() => setLocalIsSpeaking(false), 1200);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, [input, activeAgent, onDismissPending]);

  useEffect(() => {
    if (pendingMessage && isOpen) {
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: pendingMessage.text,
          agent: activeAgent.name,
          isUnprompted: true,
        },
      ]);
      setLocalIsSpeaking(true);
      setTimeout(() => setLocalIsSpeaking(false), 1500);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [pendingMessage, isOpen, activeAgent.name]);

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

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Floating trigger button
  if (!isOpen) {
    return (
      <motion.button
        className="fixed bottom-4 right-4 z-50 flex items-center justify-center rounded-full glass-crimson glow-crimson cursor-pointer"
        style={{ width: 48, height: 48 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Bot size={18} className="text-white/90" />
        <span
          className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full"
          style={{ background: pendingMessage ? "#ff8c42" : "#4ade80" }}
        />
      </motion.button>
    );
  }

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 z-40 pointer-events-none" />

      <motion.div
        drag
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={constraintsRef}
        style={{ x, y }}
        className="fixed z-50"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 28 }}
      >
        <div
          className="bg-black rounded-xl overflow-hidden"
          style={{
            width: 340,
            border: pendingMessage ? "1px solid rgba(255,140,66,0.4)" : "1px solid rgba(255,255,255,0.08)",
            boxShadow: pendingMessage
              ? "0 0 30px rgba(255,140,66,0.15), 0 0 15px oklch(0.55 0.22 20 / 0.12)"
              : "0 0 30px rgba(0,0,0,0.7), 0 0 15px oklch(0.55 0.22 20 / 0.1)",
          }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-2.5 py-1.5 cursor-grab active:cursor-grabbing select-none"
            style={{
              background: pendingMessage ? "rgba(255,140,66,0.06)" : "rgba(255,255,255,0.02)",
              borderBottom: pendingMessage ? "1px solid rgba(255,140,66,0.15)" : "1px solid rgba(255,255,255,0.05)",
            }}
            onPointerDown={(e) => dragControls.start(e)}
          >
            <div className="flex items-center gap-1.5">
              <GripVertical size={12} className="text-white/30" />
              <span className="font-display text-[10px] tracking-widest text-white/50 uppercase">
                Erebus Dock
              </span>
              {pendingMessage && (
                <span className="text-[6px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold uppercase tracking-wider">
                  ✦ Thinking
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized((v) => !v)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white/70 cursor-pointer transition-colors"
              >
                <Minimize2 size={10} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/10 text-white/40 hover:text-white/70 cursor-pointer transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {!isMinimized && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* ── Avatar ── */}
                <div className="px-2.5 pt-2 pb-1">
                  <AvatarStage
                    isSpeaking={localIsSpeaking || isSpeaking}
                    agentColor={activeAgent.color}
                    agentName={activeAgent.name}
                    pendingMessage={pendingMessage}
                  />
                </div>

                {/* ── Agent Switcher ── */}
                <div className="px-2.5 pb-1">
                  <button
                    onClick={() => setAgentDropdownOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded-lg text-[10px] cursor-pointer transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: pendingMessage ? "1px solid rgba(255,140,66,0.25)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span className={`font-medium ${activeAgent.color}`}>
                      {activeAgent.name}
                    </span>
                    <motion.div animate={{ rotate: agentDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown size={10} className="text-white/40" />
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
                        <div className="mt-1 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                          {agents.map((agent) => (
                            <div key={agent.id}>
                              <div
                                className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/5 transition-colors text-[10px]"
                                style={{
                                  background: activeAgentId === agent.id ? "rgba(255,255,255,0.04)" : "transparent",
                                }}
                              >
                                <button
                                  className="flex-1 flex items-center gap-1.5 text-left cursor-pointer"
                                  onClick={() => {
                                    setActiveAgentId(agent.id);
                                    setAgentDropdownOpen(false);
                                    setSettingsAgentId(null);
                                  }}
                                >
                                  <span
                                    className="w-1 h-1 rounded-full"
                                    style={{ background: agent.status === "active" ? "#4ade80" : "#ffffff33" }}
                                  />
                                  <span className={`font-medium ${agent.color}`}>{agent.name}</span>
                                  <span className="text-[8px] text-white/30">{agent.role}</span>
                                </button>
                                <button
                                  onClick={() => setSettingsAgentId((id) => id === agent.id ? null : agent.id)}
                                  className="w-4 h-4 flex items-center justify-center rounded hover:bg-white/10 text-white/30 hover:text-white/60 cursor-pointer transition-colors"
                                >
                                  <Settings size={8} />
                                </button>
                                {agents.length > 1 && (
                                  <button
                                    onClick={() => deleteAgent(agent.id)}
                                    className="w-4 h-4 flex items-center justify-center rounded hover:bg-red-900/40 text-white/20 hover:text-red-400 cursor-pointer transition-colors"
                                  >
                                    <Trash2 size={8} />
                                  </button>
                                )}
                              </div>
                              <AnimatePresence>
                                {settingsAgentId === agent.id && (
                                  <div className="px-2 pb-1">
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
                          <div className="px-2 pb-1">
                            {!showAddAgent ? (
                              <button
                                onClick={() => setShowAddAgent(true)}
                                className="w-full mt-0.5 flex items-center justify-center gap-1 py-1 rounded text-[8px] uppercase tracking-widest cursor-pointer transition-colors"
                                style={{
                                  color: "oklch(0.75 0.15 175)",
                                  border: "1px dashed rgba(255,255,255,0.08)",
                                }}
                              >
                                <Plus size={8} /> Add Agent
                              </button>
                            ) : (
                              <AnimatePresence>
                                <AddAgentForm onAdd={addAgent} onCancel={() => setShowAddAgent(false)} />
                              </AnimatePresence>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── Chat Mode Tabs ── */}
                <div className="flex gap-0.5 px-2.5 pb-1">
                  {CHAT_MODES.map(({ icon, label }) => (
                    <button
                      key={label}
                      onClick={() => setChatMode(label)}
                      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium cursor-pointer transition-all"
                      style={{
                        background: chatMode === label ? "oklch(0.55 0.22 20 / 0.2)" : "rgba(255,255,255,0.03)",
                        border: chatMode === label ? "1px solid oklch(0.55 0.22 20 / 0.4)" : "1px solid transparent",
                        color: chatMode === label ? "oklch(0.75 0.22 20)" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── Messages ── */}
                <div className="px-2.5 overflow-y-auto space-y-1" style={{ height: 140 }}>
                  {messages.slice(-8).map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className="max-w-[80%] px-2 py-1 rounded-lg text-[9px] leading-relaxed"
                        style={
                          msg.role === "user"
                            ? {
                                background: "oklch(0.55 0.22 20 / 0.2)",
                                border: "1px solid oklch(0.55 0.22 20 / 0.25)",
                                color: "rgba(255,255,255,0.85)",
                              }
                            : {
                                background: msg.isUnprompted ? "rgba(255,140,66,0.1)" : "rgba(255,255,255,0.04)",
                                border: msg.isUnprompted ? "1px solid rgba(255,140,66,0.2)" : "1px solid rgba(255,255,255,0.06)",
                                color: "rgba(255,255,255,0.7)",
                              }
                        }
                      >
                        {msg.role === "agent" && msg.agent && (
                          <p className={`text-[7px] uppercase tracking-widest mb-0.5 ${msg.isUnprompted ? "text-orange-400" : ""}`}>
                            {msg.isUnprompted && "✦ "}{msg.agent}
                          </p>
                        )}
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* ── Input Area ── */}
                <div className="px-2.5 py-1.5 border-t border-white/5">
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                    style={{
                      background: pendingMessage ? "rgba(255,140,66,0.05)" : "rgba(255,255,255,0.03)",
                      border: pendingMessage ? "1px solid rgba(255,140,66,0.2)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <input ref={fileInputRef} type="file" className="hidden" multiple />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-white/30 hover:text-white/60 cursor-pointer transition-colors"
                    >
                      <Paperclip size={10} />
                    </button>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKey}
                      placeholder={pendingMessage ? "Reply..." : "Message..."}
                      rows={1}
                      className="flex-1 bg-transparent text-[10px] text-white/80 placeholder-white/25 focus:outline-none resize-none font-inherit leading-relaxed"
                      style={{ maxHeight: 60, minHeight: 20 }}
                      onInput={(e) => {
                        e.currentTarget.style.height = "auto";
                        e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 60) + "px";
                      }}
                    />
                    <button
                      onClick={() => {
                        setIsMicOn((v) => !v);
                        setLocalIsSpeaking((v) => !v);
                      }}
                      className={`transition-colors cursor-pointer ${isMicOn ? "text-red-400" : "text-white/30 hover:text-white/60"}`}
                    >
                      {isMicOn ? <Mic size={10} /> : <MicOff size={10} />}
                    </button>
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim()}
                      className="w-5 h-5 flex items-center justify-center rounded cursor-pointer transition-all disabled:opacity-25"
                      style={{
                        background: input.trim() ? (pendingMessage ? "#ff8c42" : "oklch(0.55 0.22 20)") : "rgba(255,255,255,0.06)",
                      }}
                    >
                      <Send size={8} className="text-white" />
                    </button>
                  </div>

                  {/* Skills row */}
                  <div className="flex flex-wrap gap-0.5 mt-1">
                    {activeAgent.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="px-1.5 py-0.5 rounded-full text-[7px] uppercase tracking-wider"
                        style={{
                          background: pendingMessage ? "rgba(255,140,66,0.08)" : "rgba(255,255,255,0.04)",
                          border: pendingMessage ? "1px solid rgba(255,140,66,0.15)" : "1px solid rgba(255,255,255,0.06)",
                          color: pendingMessage ? "#ff8c42" : "oklch(0.75 0.15 175)",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                    {activeAgent.skills.length > 4 && (
                      <span className="text-[7px] text-white/20">+{activeAgent.skills.length - 4}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}