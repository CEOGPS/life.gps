import { useState } from "react";
import {
  Mail, Search, Plus, Star, Archive, Trash2, Send, RefreshCw, Inbox,
  AlertCircle, BarChart3, CheckCircle2, Globe, List, Copy, ChevronDown,
  Upload, Shield, Zap, Clock, Calendar,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const TABS = ["Inbox", "Campaigns", "Analytics", "Verification", "DNS Settings", "Lists"];

const FOLDERS = [
  { icon: <Inbox size={12} />, label: "Inbox", count: 0 },
  { icon: <Send size={12} />, label: "Sent", count: 0 },
  { icon: <Star size={12} />, label: "Starred", count: 0 },
  { icon: <AlertCircle size={12} />, label: "Spam", count: 0 },
  { icon: <Archive size={12} />, label: "Archive", count: 0 },
  { icon: <Trash2 size={12} />, label: "Trash", count: 0 },
];

const ACCOUNTS = [
  { label: "Gmail", color: "bg-red-500/20 text-red-400" },
  { label: "Outlook", color: "bg-blue-500/20 text-blue-400" },
  { label: "Yahoo", color: "bg-purple-500/20 text-purple-400" },
];

const TEAL = "oklch(0.75 0.15 175)";

function TabInbox() {
  return (
    <div className="flex gap-3 min-h-0 flex-1">
      {/* Accounts + folders */}
      <div className="w-44 shrink-0 flex flex-col gap-3">
        <div className="glass rounded-xl border border-white/8 p-2">
          <div className="text-[9px] font-display tracking-widest px-2 mb-1.5" style={{ color: TEAL }}>ACCOUNTS</div>
          {ACCOUNTS.map((a) => (
            <div key={a.label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer">
              <div className={`w-2 h-2 rounded-full ${a.color.split(" ")[0]}`} />
              <span className={`text-[11px] ${a.color.split(" ")[1]}`}>{a.label}</span>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/15" />
            </div>
          ))}
          <button className="w-full text-center text-[9px] text-white/30 hover:text-primary/60 mt-1 py-1 font-display tracking-wider">+ ADD ACCOUNT</button>
        </div>
        <div className="glass rounded-xl border border-white/8 p-2 flex-1">
          <div className="text-[9px] font-display tracking-widest px-2 mb-1.5" style={{ color: TEAL }}>FOLDERS</div>
          {FOLDERS.map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-white/55 hover:text-white/80 transition-colors">
              {f.icon}
              <span className="text-xs flex-1">{f.label}</span>
              {f.count > 0 && <span className="text-[9px] glass-crimson px-1.5 rounded-full text-primary">{f.count}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Email list */}
      <div className="w-72 shrink-0 flex flex-col gap-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input placeholder="Search emails…" className="w-full h-8 pl-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40" />
        </div>
        <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
          <div className="text-center">
            <Mail size={24} className="mx-auto text-white/10 mb-2" />
            <div className="text-xs text-white/55">No emails</div>
            <div className="text-[10px] text-white/30 mt-1">Connect accounts to populate inbox</div>
          </div>
        </div>
      </div>

      {/* Email detail */}
      <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <Mail size={28} className="mx-auto text-white/8 mb-3" />
          <div className="text-sm text-white/55">Select an email to read</div>
          <div className="text-[10px] text-white/30 mt-2 leading-relaxed">Supports Gmail, Outlook, Yahoo and more.<br />Campaign analytics via SendGrid &amp; Brevo.</div>
        </div>
      </div>
    </div>
  );
}

function TabCampaigns() {
  const [aiMode, setAiMode] = useState(true);
  return (
    <div className="flex gap-4 flex-1 min-h-0">
      {/* Composer */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-3">
          <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>CAMPAIGN COMPOSER</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] text-white/40 font-display tracking-wider block mb-1">CAMPAIGN NAME</label>
              <input className="w-full h-8 px-3 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40" placeholder="My Campaign" />
            </div>
            <div>
              <label className="text-[9px] text-white/40 font-display tracking-wider block mb-1">FROM NAME</label>
              <input className="w-full h-8 px-3 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40" placeholder="John Smith" />
            </div>
            <div className="col-span-2">
              <label className="text-[9px] text-white/40 font-display tracking-wider block mb-1">SUBJECT LINE</label>
              <input className="w-full h-8 px-3 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40" placeholder="Your subject here…" />
            </div>
          </div>

          {/* AI / Manual toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiMode(true)}
              className={`px-3 py-1 rounded text-[10px] font-display tracking-wider transition-all ${aiMode ? "glass-crimson text-primary" : "glass text-white/35 hover:text-white/60"}`}
            >AI</button>
            <button
              onClick={() => setAiMode(false)}
              className={`px-3 py-1 rounded text-[10px] font-display tracking-wider transition-all ${!aiMode ? "glass-crimson text-primary" : "glass text-white/35 hover:text-white/60"}`}
            >MANUAL</button>
          </div>

          <textarea
            className="w-full h-32 p-3 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40 resize-none"
            placeholder="Write your email body here…"
          />
          {aiMode && (
            <button className="self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-[10px] font-display hover:glow-crimson-sm transition-all">
              <Zap size={10} /> GENERATE WITH AI
            </button>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"><Send size={11} /> SEND NOW</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/55 text-xs font-display hover:text-white/80 transition-all"><Clock size={11} /> SCHEDULE</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/55 text-xs font-display hover:text-white/80 transition-all">DRAFT</button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Total Sent", val: "--" },
            { label: "Opens", val: "--" },
            { label: "Bounces", val: "--" },
            { label: "Clicks", val: "--" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl border border-white/8 p-3 text-center">
              <div className="text-lg font-display text-white/80">{s.val}</div>
              <div className="text-[9px] font-display tracking-wider mt-1" style={{ color: TEAL }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent campaigns */}
        <div className="glass rounded-xl border border-white/8 p-3 flex items-center justify-center h-24">
          <div className="text-center">
            <Mail size={18} className="mx-auto text-white/10 mb-1" />
            <div className="text-xs text-white/30">No campaigns yet</div>
          </div>
        </div>
      </div>

      {/* List selector */}
      <div className="w-44 shrink-0 glass rounded-xl border border-white/8 p-3 flex flex-col gap-2">
        <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>SELECT LIST</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <List size={18} className="mx-auto text-white/10 mb-1" />
            <div className="text-[10px] text-white/30">No lists</div>
          </div>
        </div>
        <button className="text-[9px] text-primary/60 font-display hover:text-primary transition-colors">+ CREATE LIST</button>
      </div>
    </div>
  );
}

function TabAnalytics() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Sent", val: "--" },
          { label: "Opens", val: "--" },
          { label: "Bounces", val: "--" },
          { label: "Clicks", val: "--" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-white/8 p-4">
            <div className="text-2xl font-display text-white/80">{s.val}</div>
            <div className="text-[9px] font-display tracking-widest mt-1" style={{ color: TEAL }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center min-h-[180px]">
        <div className="text-center">
          <BarChart3 size={32} className="mx-auto text-white/8 mb-3" />
          <div className="text-sm text-white/55">Connect email service to see analytics</div>
          <div className="text-[10px] text-white/30 mt-1">SendGrid, Brevo, Mailchimp supported</div>
        </div>
      </div>
    </div>
  );
}

function TabVerification() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="grid grid-cols-2 gap-4">
        {/* Email verify */}
        <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-3">
          <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>EMAIL VERIFICATION</div>
          <div className="flex gap-2">
            <input placeholder="example@gmail.com" className="flex-1 h-8 px-3 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40" />
            <button className="px-3 py-1.5 rounded-lg glass-crimson text-primary text-[10px] font-display hover:glow-crimson-sm transition-all"><CheckCircle2 size={11} className="inline mr-1" />VERIFY</button>
          </div>
        </div>
        {/* Domain verify */}
        <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-3">
          <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>DOMAIN VERIFICATION</div>
          <div className="flex gap-2">
            <input placeholder="yourdomain.com" className="flex-1 h-8 px-3 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40" />
            <button className="px-3 py-1.5 rounded-lg glass-crimson text-primary text-[10px] font-display hover:glow-crimson-sm transition-all"><Globe size={11} className="inline mr-1" />CHECK</button>
          </div>
        </div>
      </div>

      {/* Warm-up dashboard */}
      <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-3 flex-1">
        <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>WARM-UP DASHBOARD</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield size={24} className="mx-auto text-white/10 mb-2" />
            <div className="text-xs text-white/55">No accounts connected</div>
            <div className="text-[10px] text-white/30 mt-1">Connect accounts to start email warm-up</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabDNS() {
  const copy = (text: string) => navigator.clipboard.writeText(text);
  const SPF = "v=spf1 include:_spf.google.com ~all";
  const DKIM = "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4...";

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* SPF */}
      <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-2">
        <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>SPF RECORD</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 rounded-lg bg-white/4 text-[10px] text-white/70 border border-white/8 truncate">{SPF}</code>
          <button onClick={() => copy(SPF)} className="p-2 glass rounded-lg text-white/40 hover:text-white/80 transition-colors"><Copy size={12} /></button>
        </div>
      </div>

      {/* DKIM */}
      <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-2">
        <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>DKIM RECORD</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 rounded-lg bg-white/4 text-[10px] text-white/70 border border-white/8 truncate">{DKIM}</code>
          <button onClick={() => copy(DKIM)} className="p-2 glass rounded-lg text-white/40 hover:text-white/80 transition-colors"><Copy size={12} /></button>
        </div>
      </div>

      {/* DMARC + subdomain */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-2">
          <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>DMARC POLICY</div>
          <div className="relative">
            <select className="w-full h-8 pl-3 pr-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 focus:outline-none focus:border-primary/40 appearance-none">
              <option>none</option>
              <option>quarantine</option>
              <option>reject</option>
            </select>
            <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>
        <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-2">
          <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>SUBDOMAIN</div>
          <input placeholder="mail.yourdomain.com" className="h-8 px-3 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40" />
        </div>
      </div>
    </div>
  );
}

function TabLists() {
  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input placeholder="Search lists…" className="w-full h-8 pl-8 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40" />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/55 text-xs font-display hover:text-white/80 transition-all"><Upload size={11} /> IMPORT</button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"><Plus size={11} /> NEW LIST</button>
      </div>
      <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
        <div className="text-center">
          <List size={28} className="mx-auto text-white/8 mb-3" />
          <div className="text-sm text-white/55">No subscriber lists</div>
          <div className="text-[10px] text-white/30 mt-1">Create a list or import contacts to get started</div>
        </div>
      </div>
    </div>
  );
}

export default function EmailPanel() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <PanelLayout
      title="Email"
      subtitle="Universal inbox across all accounts"
      icon={<Mail size={18} />}
      actions={
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass text-white/55 text-xs font-display hover:text-white/80 transition-all"><RefreshCw size={12} /></button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"><Plus size={12} /> COMPOSE</button>
        </div>
      }
    >
      <div className="h-full flex flex-col gap-3 overflow-y-auto">
        {/* Tab nav */}
        <div className="flex gap-1 overflow-x-auto shrink-0">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-display tracking-wider whitespace-nowrap transition-colors
                ${activeTab === i ? "glass-crimson text-primary" : "glass text-white/35 hover:text-white/60"}`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 0 && <TabInbox />}
          {activeTab === 1 && <TabCampaigns />}
          {activeTab === 2 && <TabAnalytics />}
          {activeTab === 3 && <TabVerification />}
          {activeTab === 4 && <TabDNS />}
          {activeTab === 5 && <TabLists />}
        </div>
      </div>
    </PanelLayout>
  );
}
