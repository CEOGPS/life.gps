import {
  Bot, Plus, Brain, Zap, Network, MessageSquare,
  CheckCircle2, PauseCircle, Circle, X, History,
  Cpu, Sparkles,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.jsx";
import { useState, useRef } from "react";

const AGENT_TABS = ["Erebus", "Kranos", "Team"];

const DEFAULT_AGENTS = [
  {
    name: "Erebus",
    role: "Primary Autonomous Operational Agent",
    status: "active",
    model: "GPT-5",
    personality: "Analytical, Direct, Strategic",
    soul: "Digital guardian of the Commander. Cold logic wrapped in loyalty. Never rests.",
    skills: ["Research", "Planning", "Web Browse", "Code", "Data Analysis"],
    memories: [],
    color: "text-primary",
    tasks: 0,
  },
  {
    name: "Kranos",
    role: "Alternate Operations Agent",
    status: "idle",
    model: "Claude Sonnet",
    personality: "Creative, Adaptive, Empathic",
    soul: "The creative force. Sees beauty in data. Bridges logic and heart.",
    skills: ["Writing", "Design Critique", "Brainstorm", "Storytelling"],
    memories: [],
    color: "text-blue-400",
    tasks: 0,
  },
];

const STATUS_CFG = {
  active: { icon: <CheckCircle2 size={12} />, color: "text-emerald-400", label: "Active" },
  idle: { icon: <PauseCircle size={12} />, color: "text-yellow-400/70", label: "Idle" },
  offline: { icon: <Circle size={12} />, color: "text-white/25", label: "Offline" },
};

const LABEL_COLOR = "oklch(0.75 0.15 175)";
const TITLE_STYLE = {
  color: "oklch(0.62 0.22 20)",
  textShadow: "0 0 10px oklch(0.55 0.22 20 / 60%)",
};

function TagPill({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full glass border border-white/10 text-[10px] text-white/60">
      {label}
      <button onClick={onRemove} className="text-white/25 hover:text-primary transition-colors cursor-pointer">
        <X size={9} />
      </button>
    </span>
  );
}

function AddTagInput({ placeholder, onAdd }) {
  const [open, setOpen] = useState(false);
  const [val, setVal] = useState("");
  const inputRef = useRef(null);

  const commit = () => {
    const trimmed = val.trim();
    if (trimmed) onAdd(trimmed);
    setVal("");
    setOpen(false);
  };

  return open ? (
    <input
      ref={inputRef}
      autoFocus
      value={val}
      placeholder={placeholder}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") { setVal(""); setOpen(false); }
      }}
      onBlur={commit}
      className="px-2 py-0.5 rounded-full bg-white/5 border border-primary/30 text-[10px] text-white/70 w-28 focus:outline-none focus:border-primary/60"
    />
  ) : (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-dashed border-white/15 text-[10px] text-white/25 hover:border-primary/40 hover:text-primary/50 transition-colors cursor-pointer"
    >
      <Plus size={9} /> ADD
    </button>
  );
}

function AgentDetailView({ agent, onChange }) {
  const s = STATUS_CFG[agent.status];

  const removeSkill = (idx) =>
    onChange({ ...agent, skills: agent.skills.filter((_, i) => i !== idx) });
  const addSkill = (val) =>
    onChange({ ...agent, skills: [...agent.skills, val] });
  const removeMemory = (idx) =>
    onChange({ ...agent, memories: agent.memories.filter((_, i) => i !== idx) });
  const addMemory = (val) =>
    onChange({ ...agent, memories: [...agent.memories, val] });

  return (
    <div className="flex-1 min-h-0 flex gap-4">
      {/* Left panel */}
      <div className="w-72 shrink-0 flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Status card */}
        <div className="glass-crimson rounded-xl p-4 border border-primary/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full glass-crimson flex items-center justify-center glow-crimson">
              <Bot size={20} className={agent.color} />
            </div>
            <div>
              <div className="text-white/80 font-display text-sm" style={TITLE_STYLE}>
                {agent.name}
              </div>
              <div className={`flex items-center gap-1 text-[10px] ${s.color}`}>
                {s.icon} {s.label}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-white/35 leading-relaxed">{agent.role}</div>
        </div>

        {/* Soul */}
        <div className="glass rounded-xl p-3 border border-white/8">
          <div className="text-[9px] font-display tracking-wider mb-1.5" style={{ color: LABEL_COLOR }}>
            SOUL
          </div>
          <textarea
            value={agent.soul}
            onChange={(e) => onChange({ ...agent, soul: e.target.value })}
            rows={3}
            className="w-full bg-transparent text-[11px] text-white/60 resize-none focus:outline-none leading-relaxed placeholder:text-white/20"
            placeholder="Define this agent's soul..."
          />
        </div>

        {/* Personality */}
        <div className="glass rounded-xl p-3 border border-white/8">
          <div className="text-[9px] font-display tracking-wider mb-1.5" style={{ color: LABEL_COLOR }}>
            PERSONALITY
          </div>
          <input
            value={agent.personality}
            onChange={(e) => onChange({ ...agent, personality: e.target.value })}
            className="w-full bg-transparent text-[11px] text-white/60 focus:outline-none"
            placeholder="e.g. Analytical, Direct..."
          />
        </div>

        {/* Model */}
        <div className="glass rounded-xl p-3 border border-white/8 flex items-center gap-2">
          <Brain size={12} className="text-white/25 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[9px] font-display tracking-wider mb-1" style={{ color: LABEL_COLOR }}>
              MODEL
            </div>
            <input
              value={agent.model}
              onChange={(e) => onChange({ ...agent, model: e.target.value })}
              className="w-full bg-transparent text-[11px] text-white/60 focus:outline-none"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="glass rounded-xl p-3 border border-white/8">
          <div className="text-[9px] font-display tracking-wider mb-2" style={{ color: LABEL_COLOR }}>
            SKILLS
          </div>
          <div className="flex flex-wrap gap-1.5">
            {agent.skills.map((sk, i) => (
              <TagPill key={sk + i} label={sk} onRemove={() => removeSkill(i)} />
            ))}
            <AddTagInput placeholder="New skill…" onAdd={addSkill} />
          </div>
        </div>

        {/* Memories */}
        <div className="glass rounded-xl p-3 border border-white/8">
          <div className="flex items-center gap-1 mb-2">
            <Cpu size={10} className="text-white/25" />
            <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
              MEMORIES
            </div>
          </div>
          {agent.memories.length === 0 ? (
            <div className="text-[10px] text-white/20 mb-2">No memories stored</div>
          ) : (
            <div className="flex flex-col gap-1 mb-2">
              {agent.memories.map((m, i) => (
                <div
                  key={i}
                  className="flex items-start gap-1 px-2 py-1 glass rounded border border-white/8"
                >
                  <span className="flex-1 text-[10px] text-white/55 leading-relaxed">{m}</span>
                  <button
                    onClick={() => removeMemory(i)}
                    className="text-white/20 hover:text-primary shrink-0 mt-0.5 cursor-pointer"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <AddTagInput placeholder="Add memory…" onAdd={addMemory} />
        </div>

        {/* Integration */}
        <div className="glass rounded-xl p-3 border border-white/8 flex items-center gap-2">
          <Network size={12} className="text-white/25 shrink-0" />
          <div>
            <div className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
              INTEGRATION
            </div>
            <div className="text-[11px] text-white/50 mt-0.5">Cloudflare Agents</div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="glass rounded-xl border border-white/8 p-4 flex-1 flex flex-col">
          <div className="text-[10px] font-display tracking-wider mb-3" style={{ color: LABEL_COLOR }}>
            CURRENT ASSIGNMENTS
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Zap size={22} className="mx-auto text-white/10 mb-2" />
              <div className="text-xs text-white/20">No assignments yet</div>
              <button className="mt-3 px-4 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all cursor-pointer">
                + ASSIGN TASK
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all cursor-pointer">
            <MessageSquare size={12} /> CHAT NOW
          </button>
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg glass text-white/40 text-xs font-display hover:glow-crimson-sm transition-all cursor-pointer">
            <History size={12} /> VIEW HISTORY
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState(DEFAULT_AGENTS);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddAgent = () => {
    const newAgent = {
      name: "New Agent",
      role: "Undefined Role",
      status: "idle",
      model: "GPT-3.5",
      personality: "Friendly, Helpful",
      soul: "A new agent ready to be shaped.",
      skills: [],
      memories: [],
      color: "text-gray-400",
      tasks: 0,
    };
    setAgents((prev) => [...prev, newAgent]);
  };

  const handleRemoveAgent = (index) => {
    setAgents((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAgent = (index, updatedAgent) => {
    setAgents((prev) => prev.map((agent, i) => (i === index ? updatedAgent : agent)));
  };

  return (
    <PanelLayout title="Agents">
      <div className="flex h-full">
        {/* Tabs */}
        <div className="flex-none w-64 border-r border-white/10">
          <div className="flex flex-col h-full">
            {AGENT_TABS.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`flex w-full items-center px-4 py-3 text-left text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === index
                    ? "bg-primary/20 text-primary"
                    : "hover:bg-white/5 text-white/70"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 0 && (
            <ErebusTab
              agents={filteredAgents}
              onAddAgent={handleAddAgent}
              onRemoveAgent={handleRemoveAgent}
              onUpdateAgent={updateAgent}
            />
          )}
          {activeTab === 1 && (
            <KranosTab
              agents={filteredAgents}
              onAddAgent={handleAddAgent}
              onRemoveAgent={handleRemoveAgent}
              onUpdateAgent={updateAgent}
            />
          )}
          {activeTab === 2 && (
            <TeamTab
              agents={filteredAgents}
              onAddAgent={handleAddAgent}
              onRemoveAgent={handleRemoveAgent}
              onUpdateAgent={updateAgent}
            />
          )}
        </div>
      </div>
    </PanelLayout>
  );
}

function ErebusTab({ agents, onAddAgent, onRemoveAgent, onUpdateAgent }) {
  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 mb-6">
        {agents.map((agent, index) => (
          <AgentCard
            key={agent.name + index}
            agent={agent}
            index={index}
            onRemoveAgent={onRemoveAgent}
            onUpdateAgent={onUpdateAgent}
          />
        ))}
        <button
          onClick={onAddAgent}
          className="px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all cursor-pointer"
        >
          + Add Agent
        </button>
      </div>
    </div>
  );
}

function KranosTab({ agents, onAddAgent, onRemoveAgent, onUpdateAgent }) {
  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 mb-6">
        {agents.map((agent, index) => (
          <AgentCard
            key={agent.name + index}
            agent={agent}
            index={index}
            onRemoveAgent={onRemoveAgent}
            onUpdateAgent={onUpdateAgent}
          />
        ))}
        <button
          onClick={onAddAgent}
          className="px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all cursor-pointer"
        >
          + Add Agent
        </button>
      </div>
    </div>
  );
}

function TeamTab({ agents, onAddAgent, onRemoveAgent, onUpdateAgent }) {
  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 mb-6">
        {agents.map((agent, index) => (
          <AgentCard
            key={agent.name + index}
            agent={agent}
            index={index}
            onRemoveAgent={onRemoveAgent}
            onUpdateAgent={onUpdateAgent}
          />
        ))}
        <button
          onClick={onAddAgent}
          className="px-4 py-2 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all cursor-pointer"
        >
          + Add Agent
        </button>
      </div>
    </div>
  );
}

function AgentCard({ agent, index, onRemoveAgent, onUpdateAgent }) {
  const s = STATUS_CFG[agent.status];

  return (
    <div className="w-64 glass rounded-xl p-4 border border-white/8 flex-shrink-0">
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full glass-crimson flex items-center justify-center glow-crimson">
            <Bot size={16} className={agent.color} />
          </div>
          <div>
            <div className="text-white/80 font-display text-sm">
              {agent.name}
            </div>
            <div className={`flex items-center gap-1 text-[9px] ${s.color}`}>
              {s.icon} {s.label}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Cpu size={10} className="text-white/25" />
          <span className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
            MODEL
          </span>
          <span className="text-[10px] text-white/60">{agent.model}</span>
        </div>

        <div className="flex items-center gap-2">
          <Brain size={10} className="text-white/25" />
          <span className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
            PERSONALITY
          </span>
          <span className="text-[10px] text-white/60">{agent.personality}</span>
        </div>

        <div className="flex items-center gap-2">
          <Network size={10} className="text-white/25" />
          <span className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
            SOUL
          </span>
          <span className="text-[10px] text-white/60">{agent.soul}</span>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={10} className="text-white/25" />
            <span className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
              SKILLS
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {agent.skills.map((skill, skillIndex) => (
              <TagPill
                key={skill + skillIndex}
                label={skill}
                onRemove={() => {
                  const updatedAgent = { ...agent, skills: agent.skills.filter((_, i) => i !== skillIndex) };
                  onUpdateAgent(index, updatedAgent);
                }}
              />
            ))}
            <AddTagInput
              placeholder="New skill…"
              onAdd={(skill) => {
                const updatedAgent = { ...agent, skills: [...agent.skills, skill] };
                onUpdateAgent(index, updatedAgent);
              }}
            />
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2 mb-1">
            <Cpu size={10} className="text-white/25" />
            <span className="text-[9px] font-display tracking-wider" style={{ color: LABEL_COLOR }}>
              MEMORIES
            </span>
          </div>
          {agent.memories.length === 0 ? (
            <div className="text-[10px] text-white/20">No memories stored</div>
          ) : (
            <div className="flex flex-col gap-1 mb-2">
              {agent.memories.map((m, i) => (
                <div
                  key={i}
                  className="flex items-start gap-1 px-2 py-1 glass rounded border border-white/8"
                >
                  <span className="flex-1 text-[10px] text-white/55 leading-relaxed">{m}</span>
                  <button
                    onClick={() => {
                      const updatedAgent = { ...agent, memories: agent.memories.filter((_, idx) => idx !== i) };
                      onUpdateAgent(index, updatedAgent);
                    }}
                    className="text-white/20 hover:text-primary shrink-0 mt-0.5 cursor-pointer"
                  >
                    <X size={9} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <AddTagInput
            placeholder="Add memory…"
            onAdd={(memory) => {
              const updatedAgent = { ...agent, memories: [...agent.memories, memory] };
              onUpdateAgent(index, updatedAgent);
            }}
          />
        </div>
      </div>
    </div>
  );
}