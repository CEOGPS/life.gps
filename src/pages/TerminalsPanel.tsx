import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Terminal, TerminalSquare, Plus, Minus, X, Maximize2, Minimize2, Copy, Trash2, Search, Settings, Zap, Code, Server, Database, Globe, Shield, Key, Wifi, HardDrive, Cpu, MemoryStick, Monitor, Command, ChevronDown, ChevronUp, Send, Mic, Volume2, VolumeX, Link, Unlink, RefreshCw, Download, Upload, FolderOpen, FileText, Image, Video, Music, Archive, Code2, GitBranch, GitMerge, GitCommit, GitPullRequest, GitCompare } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const TERMINAL_THEMES = [
  { id: "default", name: "Default", bg: "#0d0d0d", fg: "#e0e0e0", accent: "#ff6b35" },
  { id: "dracula", name: "Dracula", bg: "#282a36", fg: "#f8f8f2", accent: "#bd93f9" },
  { id: "nord", name: "Nord", bg: "#2e3440", fg: "#d8dee9", accent: "#88c0d0" },
  { id: "solarized", name: "Solarized", bg: "#002b36", fg: "#839496", accent: "#b58900" },
  { id: "monokai", name: "Monokai", bg: "#272822", fg: "#f8f8f2", accent: "#a6e22e" },
  { id: "gruvbox", name: "Gruvbox", bg: "#282828", fg: "#ebdbb2", accent: "#fe8019" },
];

const SAMPLE_COMMANDS = [
  "ls -la",
  "cd ~/projects",
  "git status",
  "npm run dev",
  "docker ps",
  "kubectl get pods",
  "ps aux | grep node",
  "curl -s https://api.ceogps.com/health",
  "supabase db push",
  "wrangler deploy",
];

const TERMINAL_TYPES = [
  { id: "local", label: "Local Shell", icon: Terminal, color: "oklch(0.7 0.18 70)", desc: "Local machine terminal" },
  { id: "ssh", label: "SSH Session", icon: Server, color: "oklch(0.65 0.22 265)", desc: "Remote server connection" },
  { id: "db", label: "Database", icon: Database, color: "oklch(0.75 0.15 175)", desc: "Supabase/PostgreSQL CLI" },
  { id: "cloud", label: "Cloudflare", icon: Globe, color: "oklch(0.68 0.2 310)", desc: "Workers/Pages CLI" },
  { id: "k8s", label: "Kubernetes", icon: Cpu, color: "oklch(0.7 0.18 70)", desc: "Cluster management" },
  { id: "docker", label: "Docker", icon: HardDrive, color: "oklch(0.65 0.22 200)", desc: "Container management" },
];

export default function TerminalsPanel() {
  const [terminals, setTerminals] = useState<Array<{
    id: string;
    type: string;
    title: string;
    history: Array<{ type: string; content: string }>;
    cwd: string;
    theme: string;
    isActive: boolean;
  }>>(() => {
    const saved = localStorage.getItem("terminals_state");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return createDefaultTerminals();
      }
    }
    return createDefaultTerminals();
  });
  const [activeTerminalId, setActiveTerminalId] = useState(terminals[0]?.id || "");
  const [theme, setTheme] = useState("default");
  const [fontSize, setFontSize] = useState(13);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const terminalRefs = useRef<Record<string, HTMLDivElement>>({});

  function createDefaultTerminals() {
    return [
      {
        id: "term-1",
        type: "local",
        title: "Local Shell",
        history: [
          { type: "output", content: "Welcome to CEO GPS Terminal\nType 'help' for available commands\n" },
          { type: "input", content: "user@ceogps:~$ " },
        ],
        cwd: "~",
        theme: "default",
        isActive: true,
      },
      {
        id: "term-2",
        type: "cloud",
        title: "Cloudflare Workers",
        history: [
          { type: "output", content: "Cloudflare Wrangler CLI v4.113.0\nConnected to account: CEO GPS\n" },
          { type: "input", content: "wrangler@ceogps:~$ " },
        ],
        cwd: "~",
        theme: "dracula",
        isActive: false,
      },
      {
        id: "term-3",
        type: "db",
        title: "Supabase CLI",
        history: [
          { type: "output", content: "Supabase CLI v1.0.0\nProject: mhvcdstgkyplhzjptgfr\nRegion: us-east-1\n" },
          { type: "input", content: "supabase@ceogps:~$ " },
        ],
        cwd: "~",
        theme: "nord",
        isActive: false,
      },
    ];
  }

  useEffect(() => {
    localStorage.setItem("terminals_state", JSON.stringify(terminals));
  }, [terminals]);

  const activeTerminal = terminals.find(t => t.id === activeTerminalId);

  const executeCommand = (cmd: string) => {
    if (!activeTerminal) return;
    
    const newHistory = [...activeTerminal.history];
    // Replace the last input line with the executed command
    newHistory[newHistory.length - 1] = { type: "input", content: `user@ceogps:${activeTerminal.cwd}$ ${cmd}` };
    
    // Add output
    let output = "";
    if (cmd === "help") {
      output = `Available commands:
  help          - Show this help
  ls            - List directory
  cd <dir>      - Change directory
  pwd           - Print working directory
  clear         - Clear terminal
  history       - Show command history
  theme <name>  - Change theme (${TERMINAL_THEMES.map(t => t.id).join(", ")})
  new <type>    - New terminal (${TERMINAL_TYPES.map(t => t.id).join(", ")})
  close         - Close current terminal
  echo <text>   - Print text
  date          - Show current date
  whoami        - Show current user
  `;
    } else if (cmd === "clear") {
      newHistory.length = 0;
      newHistory.push({ type: "input", content: "user@ceogps:~$ " });
    } else if (cmd === "ls") {
      output = "Desktop/  Documents/  Downloads/  Projects/  ceogps-dashboard/  node_modules/  package.json  wrangler.toml\n";
    } else if (cmd === "pwd") {
      output = `${activeTerminal.cwd}\n`;
    } else if (cmd.startsWith("cd ")) {
      const dir = cmd.slice(3).trim();
      if (dir === "..") {
        newHistory[newHistory.length - 1] = { type: "input", content: `user@ceogps:${activeTerminal.cwd}$ ${cmd}` };
        setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, cwd: "/", history: newHistory } : t));
        return;
      } else if (dir === "~" || dir === "") {
        setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, cwd: "~", history: newHistory } : t));
        return;
      }
      output = `cd: ${dir}: No such file or directory\n`;
    } else if (cmd === "history") {
      output = commandHistoryRef.current.map((c, i) => `  ${i + 1}  ${c}`).join("\n") + "\n";
    } else if (cmd.startsWith("theme ")) {
      const themeName = cmd.slice(6).trim();
      if (TERMINAL_THEMES.find(t => t.id === themeName)) {
        setTheme(themeName);
        setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, theme: themeName, history: newHistory } : t));
        output = `Theme changed to ${themeName}\n`;
      } else {
        output = `Unknown theme: ${themeName}\n`;
      }
    } else if (cmd.startsWith("new ")) {
      const type = cmd.slice(4).trim();
      const termType = TERMINAL_TYPES.find(t => t.id === type);
      if (termType) {
        const newTerm = {
          id: `term-${Date.now()}`,
          type,
          title: termType.label,
          history: [
            { type: "output", content: `New ${termType.label} session\n` },
            { type: "input", content: "user@ceogps:~$ " },
          ],
          cwd: "~",
          theme: "default",
          isActive: false,
        };
        setTerminals(prev => [...prev, newTerm]);
        output = `Created new ${termType.label} terminal\n`;
      } else {
        output = `Unknown terminal type: ${type}\n`;
      }
    } else if (cmd === "close") {
      if (terminals.length > 1) {
        setTerminals(prev => prev.filter(t => t.id !== activeTerminalId));
        const remaining = terminals.filter(t => t.id !== activeTerminalId);
        setActiveTerminalId(remaining[remaining.length - 1].id);
        return;
      } else {
        output = "Cannot close last terminal\n";
      }
    } else if (cmd.startsWith("echo ")) {
      output = cmd.slice(5) + "\n";
    } else if (cmd === "date") {
      output = new Date().toString() + "\n";
    } else if (cmd === "whoami") {
      output = "cagednreality\n";
    } else if (cmd === "git status") {
      output = "On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean\n";
    } else if (cmd === "npm run dev") {
      output = "> lifeos1@0.0.0 dev\n> vite\n\n  VITE v7.3.6  ready in 234ms\n\n  ➜  Local:   http://localhost:5173/\n  ➜  Network: use --host to expose\n";
    } else if (cmd === "docker ps") {
      output = "CONTAINER ID   IMAGE                    COMMAND                  CREATED        STATUS          PORTS                    NAMES\nabc123456789   postgres:15              \"docker-entrypoint.s…\"   2 hours ago    Up 2 hours      0.0.0.0:5432->5432/tcp   supabase-db\ndef456789012   kong:2.8                 \"/docker-entrypoint.…\"   2 hours ago    Up 2 hours      0.0.0.0:8000->8000/tcp   supabase-kong\n";
    } else if (cmd === "kubectl get pods") {
      output = "NAME                              READY   STATUS    RESTARTS   AGE\nceogps-api-7b9c8f6d5-x2k4m       1/1     Running   0          2d\nceogps-worker-5d6f7b8c9-n3p2q    1/1     Running   0          2d\nceogps-db-0                      1/1     Running   0          2d\n";
    } else if (cmd === "curl -s https://api.ceogps.com/health") {
      output = '{"status":"healthy","timestamp":"2026-09-10T23:50:40.012Z","version":"1.0.0","services":{"supabase":"connected","email":"operational"}}\n';
    } else if (cmd === "supabase db push") {
      output = "Pushing schema changes to database...\nSchema pushed successfully!\n";
    } else if (cmd === "wrangler deploy") {
      output = "⛅️ wrangler 4.113.0\n───────────────────────────────────────────────\nUploading... (28/28)\n✨ Success! Uploaded 0 files (28 already uploaded)\n✨ Deployment complete! https://lifeos1-api.ceogps.workers.dev\n";
    } else {
      output = `zsh: command not found: ${cmd.split(" ")[0]}\n`;
    }

    if (output) {
      newHistory.push({ type: output.startsWith("zsh:") ? "error" : "output", content: output });
    }
    newHistory.push({ type: "input", content: `user@ceogps:${activeTerminal.cwd}$ ` });
    
    commandHistoryRef.current.push(cmd);
    historyIndexRef.current = commandHistoryRef.current.length;
    
    setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, history: newHistory } : t));
    setCommandInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (commandInput.trim()) {
        executeCommand(commandInput.trim());
      } else {
        // Empty command, just add new prompt
        if (activeTerminal) {
          const newHistory = [...activeTerminal.history];
          newHistory[newHistory.length - 1] = { type: "input", content: `user@ceogps:${activeTerminal.cwd}$ ` };
          newHistory.push({ type: "input", content: `user@ceogps:${activeTerminal.cwd}$ ` });
          setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, history: newHistory } : t));
        }
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistoryRef.current.length > 0 && historyIndexRef.current > 0) {
        historyIndexRef.current--;
        setCommandInput(commandHistoryRef.current[historyIndexRef.current]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
        historyIndexRef.current++;
        setCommandInput(commandHistoryRef.current[historyIndexRef.current]);
      } else {
        historyIndexRef.current = commandHistoryRef.current.length;
        setCommandInput("");
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple tab completion
      const cmds = ["help", "ls", "cd", "pwd", "clear", "history", "theme", "new", "close", "echo", "date", "whoami", "git status", "npm run dev", "docker ps", "kubectl get pods"];
      const matches = cmds.filter(c => c.startsWith(commandInput));
      if (matches.length === 1) {
        setCommandInput(matches[0] + " ");
      } else if (matches.length > 1) {
        // Show matches
        const newHistory = [...activeTerminal!.history];
        newHistory[newHistory.length - 1] = { type: "input", content: `user@ceogps:${activeTerminal!.cwd}$ ${commandInput}` };
        newHistory.push({ type: "output", content: matches.join("  ") + "\n" });
        newHistory.push({ type: "input", content: `user@ceogps:${activeTerminal!.cwd}$ ${commandInput}` });
        setTerminals(prev => prev.map(t => t.id === activeTerminalId ? { ...t, history: newHistory } : t));
      }
    }
  };

  const addTerminal = (type: string) => {
    const termType = TERMINAL_TYPES.find(t => t.id === type);
    if (!termType) return;
    
    const newTerm = {
      id: `term-${Date.now()}`,
      type,
      title: termType.label,
      history: [
        { type: "output", content: `New ${termType.label} session\n` },
        { type: "input", content: "user@ceogps:~$ " },
      ],
      cwd: "~",
      theme: "default",
      isActive: false,
    };
    setTerminals(prev => prev.map(t => ({ ...t, isActive: false })).concat(newTerm));
    setActiveTerminalId(newTerm.id);
  };

  const closeTerminal = (id: string) => {
    if (terminals.length <= 1) return;
    const idx = terminals.findIndex(t => t.id === id);
    const newTerminals = terminals.filter(t => t.id !== id);
    if (activeTerminalId === id) {
      const newActive = newTerminals[Math.min(idx, newTerminals.length - 1)];
      setActiveTerminalId(newActive.id);
    }
    setTerminals(newTerminals);
  };

  const switchTerminal = (id: string) => {
    setTerminals(prev => prev.map(t => ({ ...t, isActive: t.id === id })));
    setActiveTerminalId(id);
  };

  const clearTerminal = (id: string) => {
    setTerminals(prev => prev.map(t => 
      t.id === id ? { ...t, history: [{ type: "input", content: "user@ceogps:~$ " }] } : t
    ));
  };

  const getThemeColors = (themeName: string) => {
    return TERMINAL_THEMES.find(t => t.id === themeName) || TERMINAL_THEMES[0];
  };

  const currentTheme = getThemeColors(activeTerminal?.theme || theme);

  return (
    <PanelLayout
      title="Terminals"
      subtitle="Multi-session terminal emulator — Local, SSH, DB, Cloud, K8s, Docker"
      icon={<Terminal size={18} />}
      actions={
        <div className="flex items-center gap-2">
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="h-8 px-2 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 focus:outline-none focus:border-primary/40"
          >
            {TERMINAL_THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <button className="w-8 h-8 rounded-lg glass-crimson flex items-center justify-center text-primary hover:glow-crimson-sm transition-all" onClick={() => addTerminal("local")} title="New Local Terminal">
            <Plus size={14} />
          </button>
        </div>
      }
    >
      <div className="h-full flex flex-col" style={{ backgroundColor: currentTheme.bg, color: currentTheme.fg }}>
        {/* Terminal Tabs */}
        <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/10 shrink-0" style={{ backgroundColor: currentTheme.bg }}>
          <div className="flex-1 flex gap-1 overflow-x-auto pb-1">
            {terminals.map((term, i) => {
              const termType = TERMINAL_TYPES.find(t => t.id === term.type);
              return (
                <button
                  key={term.id}
                  onClick={() => switchTerminal(term.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg text-xs font-display transition-all whitespace-nowrap shrink-0 ${
                    term.id === activeTerminalId
                      ? "bg-primary/20 text-primary border-b-2 border-primary"
                      : "text-white/50 hover:text-white/80 hover:bg-white/5"
                  }`}
                  style={{ backgroundColor: term.id === activeTerminalId ? currentTheme.accent + "20" : "transparent" }}
                >
                  {termType?.icon && <termType.icon size={10} className={term.id === activeTerminalId ? "text-primary" : "text-white/40"} />}
                  <span>{term.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); closeTerminal(term.id); }}
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all ml-1"
                  >
                    <X size={10} />
                  </button>
                </button>
              );
            })}
            <button
              onClick={() => setShowCommandPalette(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display text-white/50 hover:text-white/80 hover:bg-white/5 transition-all shrink-0"
            >
              <Plus size={12} />
            </button>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[10px] text-white/30 font-display">{terminals.length} sessions</span>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="flex-1 relative overflow-hidden">
          {activeTerminal && (
            <div
              ref={(el) => { terminalRefs.current[activeTerminal.id] = el!; }}
              className="h-full p-4 font-mono text-sm overflow-y-auto"
              style={{ backgroundColor: currentTheme.bg, color: currentTheme.fg, fontSize: `${fontSize}px`, lineHeight: "1.6" }}
            >
              {activeTerminal.history.map((entry, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap break-all ${
                    entry.type === "input" ? "text-green-400" :
                    entry.type === "error" ? "text-red-400" :
                    "text-white/70"
                  }`}
                >
                  {entry.content}
                </div>
              ))}
              <div ref={(el) => { if (el) el.scrollIntoView({ behavior: "smooth" }); }} />
            </div>
          )}
        </div>

        {/* Command Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 shrink-0" style={{ backgroundColor: currentTheme.bg }}>
          <span className="text-green-400 font-mono text-sm shrink-0">
            {activeTerminal ? `user@ceogps:${activeTerminal.cwd}$` : "user@ceogps:~$"}
          </span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type command... (Tab for completion, ↑↓ for history)"
            className="flex-1 bg-transparent border-none text-white/90 focus:outline-none text-sm font-mono"
            style={{ color: currentTheme.fg, caretColor: currentTheme.accent }}
            autoFocus
          />
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/50 hover:text-primary transition-all" title="Send" onClick={() => commandInput.trim() && executeCommand(commandInput.trim())}>
              <Send size={14} />
            </button>
            <button className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/50 hover:text-primary transition-all" title="Clear" onClick={() => activeTerminal && clearTerminal(activeTerminal.id)}>
              <Trash2 size={14} />
            </button>
            <button className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/50 hover:text-primary transition-all" title="Font size -" onClick={() => setFontSize(Math.max(10, fontSize - 1))}>
              <Minus size={14} />
            </button>
            <button className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/50 hover:text-primary transition-all" title="Font size +" onClick={() => setFontSize(Math.min(20, fontSize + 1))}>
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Command Palette Modal */}
        {showCommandPalette && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowCommandPalette(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative glass rounded-xl border border-white/8 w-full max-w-2xl max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-display text-sm text-white/80 tracking-wider">New Terminal</h3>
                <button onClick={() => setShowCommandPalette(false)} className="w-8 h-8 rounded-lg glass border border-white/10 flex items-center justify-center text-white/50 hover:text-red-400 transition-all">
                  <X size={14} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TERMINAL_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => { addTerminal(type.id); setShowCommandPalette(false); }}
                      className="glass rounded-lg p-4 border border-white/5 flex flex-col items-start gap-2 hover:border-primary/20 hover:glow-crimson-sm transition-all text-start"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: type.color }}>
                        <type.icon size={18} className="text-white" />
                      </div>
                      <div className="font-medium text-sm text-white/80">{type.label}</div>
                      <div className="text-[10px] text-white/40">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PanelLayout>
  );
}