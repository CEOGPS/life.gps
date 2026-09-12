import { useState } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Plus, FileText,
  PieChart, CreditCard, Briefcase, AlertTriangle, Lightbulb,
} from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const TEAL = "oklch(0.75 0.15 175)";

const TABS = ["Overview", "Accounts", "Per Product Revenue", "Credit Repair", "Investments", "Invoices", "Budget", "Credit", "Disputes"];

const ACCOUNTS = [
  { name: "Chase Bank", type: "Checking", balance: "--", icon: "🏦", trend: "up" },
  { name: "Stripe", type: "Business Revenue", balance: "--", icon: "💳", trend: "up" },
  { name: "Cash App", type: "P2P", balance: "--", icon: "💸", trend: "neutral" },
  { name: "Venmo", type: "P2P", balance: "--", icon: "🔵", trend: "neutral" },
  { name: "OnePay", type: "Alt Payment", balance: "--", icon: "🟡", trend: "neutral" },
  { name: "Credit Karma", type: "Credit Monitoring", balance: "--", icon: "📊", trend: "up" },
];

function TabOverview() {
  return (
    <div className="flex gap-4 flex-1 min-h-0">
      {/* Left — accounts */}
      <div className="w-64 shrink-0 space-y-2 overflow-y-auto">
        <div className="text-[9px] font-display tracking-widest mb-1" style={{ color: TEAL }}>CONNECTED ACCOUNTS</div>
        {ACCOUNTS.map((acc) => (
          <div key={acc.name} className="glass rounded-xl p-3 border border-white/8 hover:border-primary/20 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="text-base">{acc.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white/80 font-medium">{acc.name}</div>
                <div className="text-[9px] text-white/40">{acc.type}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/55 font-display">${acc.balance}</div>
                {acc.trend === "up" && <TrendingUp size={9} className="text-emerald-400/60 ml-auto" />}
                {acc.trend === "down" && <TrendingDown size={9} className="text-primary/60 ml-auto" />}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Net Worth", val: "$--", icon: <DollarSign size={14} />, color: "text-emerald-400" },
            { label: "Monthly In", val: "$--", icon: <TrendingUp size={14} />, color: "text-emerald-400" },
            { label: "Monthly Out", val: "$--", icon: <TrendingDown size={14} />, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-3 border border-white/8">
              <div className="flex items-center gap-2 mb-2">
                <span className={s.color}>{s.icon}</span>
                <span className="text-[10px] font-display tracking-wider" style={{ color: TEAL }}>{s.label}</span>
              </div>
              <div className={`text-xl font-display ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center min-h-[120px]">
          <div className="text-center">
            <BarChart3 size={28} className="mx-auto text-white/8 mb-3" />
            <div className="text-sm text-white/55">Connect accounts to view growth charts</div>
            <div className="text-xs text-white/30 mt-1">Quarterly &amp; monthly breakdowns, AI insights</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="glass rounded-xl border border-white/8 p-3 flex items-center gap-2">
            <FileText size={16} className="text-white/30" />
            <span className="text-xs text-white/55">Invoices ready to send</span>
            <button className="ml-auto text-[10px] text-primary/60 font-display hover:text-primary transition-colors">CREATE</button>
          </div>
          <div className="glass rounded-xl border border-white/8 p-3 flex items-center gap-2">
            <PieChart size={16} className="text-white/30" />
            <span className="text-xs text-white/55">Payment portal (Stripe)</span>
            <button className="ml-auto text-[10px] text-primary/60 font-display hover:text-primary transition-colors">SETUP</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabPerProductRevenue() {
  return (
    <div className="flex flex-col gap-3 flex-1">
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Plus size={11} /> ADD PRODUCT / SERVICE
        </button>
      </div>
      <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
        <div className="text-center">
          <CreditCard size={28} className="mx-auto text-white/8 mb-3" />
          <div className="text-sm text-white/55">No product revenue data</div>
          <div className="text-[10px] text-white/30 mt-1">Connect Stripe / PayPal to sync product revenue</div>
        </div>
      </div>
    </div>
  );
}

function TabCreditRepair() {
  const bureaus = [
    { name: "Experian", score: "--/850" },
    { name: "Equifax", score: "--/850" },
    { name: "TransUnion", score: "--/850" },
  ];
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="grid grid-cols-3 gap-3">
        {bureaus.map((b) => (
          <div key={b.name} className="glass rounded-xl border border-white/8 p-4 text-center">
            <div className="text-[9px] font-display tracking-widest mb-2" style={{ color: TEAL }}>{b.name.toUpperCase()}</div>
            <div className="text-3xl font-display text-white/80">{b.score.split("/")[0]}</div>
            <div className="text-[9px] text-white/30 mt-0.5">/ {b.score.split("/")[1]}</div>
          </div>
        ))}
      </div>

      {/* Dispute tracker */}
      <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>DISPUTE TRACKER</div>
          <button className="flex items-center gap-1 px-2.5 py-1 rounded glass-crimson text-primary text-[10px] font-display hover:glow-crimson-sm transition-all">
            <Plus size={10} /> ADD DISPUTE
          </button>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <AlertTriangle size={20} className="mx-auto text-white/10 mb-2" />
            <div className="text-xs text-white/30">No open disputes</div>
          </div>
        </div>
      </div>

      {/* AI Tips + CTA */}
      <div className="glass rounded-xl border border-white/8 p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={13} className="text-yellow-400/60" />
          <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>AI CREDIT REPAIR TIPS</div>
        </div>
        <div className="text-xs text-white/30">Connect Credit Karma or Experian to get personalized AI tips.</div>
        <button className="self-start px-3 py-1.5 rounded-lg glass-crimson text-primary text-[10px] font-display hover:glow-crimson-sm transition-all mt-1">
          CONNECT CREDIT KARMA
        </button>
      </div>
    </div>
  );
}

function TabInvestments() {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="glass rounded-xl border border-white/8 p-4">
        <div className="text-[9px] font-display tracking-widest mb-3" style={{ color: TEAL }}>PORTFOLIO OVERVIEW</div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Value", val: "$--" },
            { label: "Total Gain", val: "$--" },
            { label: "Total Loss", val: "$--" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-xs text-white/30 mb-0.5">{s.label}</div>
              <div className="text-xl font-display text-white/80">{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 glass rounded-xl border border-white/8 p-4 flex flex-col gap-2">
        <div className="text-[9px] font-display tracking-widest" style={{ color: TEAL }}>HOLDINGS</div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Briefcase size={24} className="mx-auto text-white/10 mb-2" />
            <div className="text-xs text-white/55">No holdings found</div>
            <div className="text-[10px] text-white/30 mt-1">Connect brokerage to see insights</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex-1 glass rounded-xl border border-white/8 flex items-center justify-center">
      <div className="text-center">
        <div className="text-sm text-white/30">{label}</div>
        <div className="text-[10px] text-white/20 mt-1">Coming soon</div>
      </div>
    </div>
  );
}

export default function FinancePanel() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <PanelLayout
      title="Finance"
      subtitle="All accounts, investments, and credit in one place"
      icon={<DollarSign size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Plus size={12} /> CONNECT ACCOUNT
        </button>
      }
    >
      <div className="h-full flex flex-col gap-4 overflow-y-auto">
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

        <div className="flex-1 flex flex-col min-h-0">
          {activeTab === 0 && <TabOverview />}
          {activeTab === 1 && <TabPlaceholder label="Accounts" />}
          {activeTab === 2 && <TabPerProductRevenue />}
          {activeTab === 3 && <TabCreditRepair />}
          {activeTab === 4 && <TabInvestments />}
          {activeTab === 5 && <TabPlaceholder label="Invoices" />}
          {activeTab === 6 && <TabPlaceholder label="Budget" />}
          {activeTab === 7 && <TabPlaceholder label="Credit" />}
          {activeTab === 8 && <TabPlaceholder label="Disputes" />}
        </div>
      </div>
    </PanelLayout>
  );
}
