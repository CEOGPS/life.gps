import { TrendingUp, TrendingDown, DollarSign, CreditCard, BarChart3 } from "lucide-react";

const ACCOUNTS = [
  { name: "Banking", sub: "Primary", icon: "🏦" },
  { name: "Stripe", sub: "Revenue", icon: "💳" },
  { name: "Cash App", sub: "P2P", icon: "💸" },
  { name: "Venmo", sub: "P2P", icon: "🔵" },
  { name: "OnePay", sub: "Alt Pay", icon: "🟡" },
  { name: "Credit Karma", sub: "Credit", icon: "📊" },
];

export default function FinancialStats() {
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Total balance placeholder */}
      <div className="glass-crimson rounded-lg p-3 text-center">
        <div className="text-[10px] text-white/30 font-display tracking-widest mb-1">TOTAL BALANCE</div>
        <div className="text-2xl text-white/80 font-display">$--,---.--</div>
        <div className="flex items-center justify-center gap-1 mt-1">
          <TrendingUp size={11} className="text-emerald-400/60" />
          <span className="text-[10px] text-white/25">Connect accounts to track growth</span>
        </div>
      </div>

      {/* Chart area */}
      <div className="h-16 rounded-lg bg-white/2 border border-white/5 flex items-center justify-center">
        <div className="flex items-center gap-2 text-white/15">
          <BarChart3 size={14} />
          <span className="text-[10px]">Growth chart loads after account sync</span>
        </div>
      </div>

      {/* Account grid */}
      <div className="grid grid-cols-3 gap-1.5 overflow-y-auto">
        {ACCOUNTS.map((acc) => (
          <div key={acc.name} className="glass rounded p-2 text-center border border-white/5 hover:border-primary/20 transition-colors cursor-pointer">
            <div className="text-base mb-1">{acc.icon}</div>
            <div className="text-[10px] text-white/60 font-medium leading-none">{acc.name}</div>
            <div className="text-[9px] text-white/20 mt-0.5">{acc.sub}</div>
            <div className="text-[10px] text-white/30 mt-1">$--</div>
          </div>
        ))}
      </div>
    </div>
  );
}
