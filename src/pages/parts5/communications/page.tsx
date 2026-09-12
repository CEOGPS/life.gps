import { useState } from "react";
import {
  MessageSquare, Search, Phone, Video, MoreVertical,
  Smile, Paperclip, Send, Bookmark, Trash2, Users, CreditCard,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const TEAL = "oklch(0.75 0.15 175)";

const CHANNELS = [
  { name: "Signal", dot: "bg-blue-500" },
  { name: "Telegram", dot: "bg-sky-400" },
  { name: "SMS", dot: "bg-green-500" },
  { name: "Messenger", dot: "bg-purple-500" },
  { name: "Instagram", dot: "bg-pink-500" },
  { name: "WhatsApp", dot: "bg-emerald-500" },
  { name: "Snapchat", dot: "bg-yellow-400" },
  { name: "Facetime", dot: "bg-green-400" },
  { name: "Google Voice", dot: "bg-blue-400" },
];

const CHANNEL_COLORS: Record<string, string> = {
  Signal: "text-blue-400",
  Telegram: "text-sky-400",
  SMS: "text-green-400",
  Messenger: "text-purple-400",
  Instagram: "text-pink-400",
  WhatsApp: "text-emerald-400",
  Snapchat: "text-yellow-400",
  Facetime: "text-green-300",
  "Google Voice": "text-blue-300",
};

type Message = {
  id: string;
  channel: string;
  sender: string;
  preview: string;
  time: string;
};

type ChatMsg = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
};

const FEED_MESSAGES: Message[] = [];
const CHAT_MESSAGES: ChatMsg[] = [];

export default function CommunicationsPanel() {
  const [selectedConv, setSelectedConv] = useState<Message | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messageList, setMessageList] = useState<ChatMsg[]>(CHAT_MESSAGES);

  const handleSend = () => {
    const text = chatInput.trim();
    if (!text) return;
    setMessageList((prev) => [
      ...prev,
      { id: Date.now().toString(), from: "me", text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setChatInput("");
  };

  return (
    <PanelLayout
      title="Communications"
      subtitle="Universal messaging &amp; calls"
      icon={<MessageSquare size={18} />}
    >
      <div className="h-full flex gap-3 overflow-y-auto">
        {/* Channels sidebar */}
        <div className="w-44 shrink-0 flex flex-col gap-3">
          <div className="glass rounded-xl border border-white/8 p-2 flex-1 flex flex-col">
            <div className="text-[9px] font-display tracking-widest px-2 mb-2" style={{ color: TEAL }}>CHANNELS</div>
            <div className="space-y-0.5 flex-1">
              {CHANNELS.map((c) => (
                <div key={c.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer group">
                  <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className={`text-[11px] flex-1 ${CHANNEL_COLORS[c.name] ?? "text-white/55"}`}>{c.name}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-primary/30 transition-colors" />
                </div>
              ))}
            </div>
            {/* Quick nav links */}
            <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-1">
              <button className="text-left text-[10px] text-white/40 hover:text-white/70 font-display px-2 py-1 rounded hover:bg-white/5 transition-all flex items-center gap-1.5">
                <Users size={10} /> → Contacts
              </button>
              <button className="text-left text-[10px] text-white/40 hover:text-white/70 font-display px-2 py-1 rounded hover:bg-white/5 transition-all flex items-center gap-1.5">
                <CreditCard size={10} /> → CRM
              </button>
            </div>
          </div>
        </div>

        {/* Message feed */}
        <div className="w-64 shrink-0 flex flex-col gap-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              placeholder="Search messages…"
              className="w-full h-8 pl-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
            />
          </div>
          <div className="flex-1 glass rounded-xl border border-white/8 overflow-y-auto">
            {FEED_MESSAGES.length === 0 ? (
              <div className="h-full flex items-center justify-center p-4">
                <div className="text-center">
                  <MessageSquare size={22} className="mx-auto text-white/10 mb-2" />
                  <div className="text-xs text-white/55">Connect channels to see your unified message feed</div>
                </div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {FEED_MESSAGES.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => setSelectedConv(msg)}
                    className={`p-2 rounded-lg cursor-pointer group transition-all hover:bg-white/5 ${selectedConv?.id === msg.id ? "bg-white/8" : ""}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-display px-1.5 py-0.5 rounded-full glass-crimson text-primary`}>{msg.channel}</span>
                      <span className="text-[9px] text-white/30 ml-auto">{msg.time}</span>
                    </div>
                    <div className="text-xs text-white/80 font-medium">{msg.sender}</div>
                    <div className="text-[10px] text-white/40 truncate">{msg.preview}</div>
                    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-0.5 text-white/30 hover:text-white/70"><Bookmark size={9} /></button>
                      <button className="p-0.5 text-white/30 hover:text-primary"><Trash2 size={9} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col glass rounded-xl border border-white/8 overflow-hidden min-w-0">
          {/* Header */}
          <div className="p-3 border-b border-white/5 flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full glass-crimson flex items-center justify-center">
              <MessageSquare size={13} className="text-primary/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/80 truncate">
                {selectedConv ? selectedConv.sender : "Select a conversation"}
              </div>
              <div className="text-[9px] text-white/30">
                {selectedConv ? selectedConv.channel : "Connect a messaging channel"}
              </div>
            </div>
            <div className="flex gap-1">
              <button className="text-white/30 hover:text-white/70 p-1.5 rounded transition-colors"><Phone size={13} /></button>
              <button className="text-white/30 hover:text-white/70 p-1.5 rounded transition-colors"><Video size={13} /></button>
              <button className="text-white/30 hover:text-white/70 p-1.5 rounded transition-colors"><MoreVertical size={13} /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
            {messageList.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-sm text-white/30">No messages yet</div>
              </div>
            ) : (
              messageList.map((m) => (
                <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-3 py-2 rounded-xl text-xs ${m.from === "me" ? "glass-crimson text-white/80" : "glass text-white/70"}`}>
                    {m.text}
                    <div className="text-[9px] text-white/30 mt-0.5 text-right">{m.time}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/5 flex items-center gap-2 shrink-0">
            <button className="text-white/30 hover:text-white/70 transition-colors"><Paperclip size={14} /></button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message…"
              className="flex-1 h-8 px-3 text-xs bg-white/4 border border-white/6 rounded-full text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
            />
            <button className="text-white/30 hover:text-white/70 transition-colors"><Smile size={14} /></button>
            <button
              onClick={handleSend}
              className="w-8 h-8 rounded-full glass-crimson flex items-center justify-center text-primary hover:glow-crimson-sm transition-all"
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      </div>
    </PanelLayout>
  );
}
