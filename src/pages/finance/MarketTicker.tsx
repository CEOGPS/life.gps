import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Bitcoin,
  LineChart,
  RefreshCw,
  Sparkles,
} from "lucide-react";

type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  changePct: number | null;
  source: "crypto" | "stock";
};

const COINS = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
];

const STOCKS = [
  { symbol: "SPY", name: "S&P 500" },
  { symbol: "QQQ", name: "Nasdaq 100" },
  { symbol: "AAPL", name: "Apple" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "NVDA", name: "NVIDIA" },
];

async function fetchCrypto(): Promise<Quote[]> {
  try {
    const ids = COINS.map((c) => c.id).join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error("coingecko error");
    const json = await res.json();
    return COINS.map((c) => ({
      symbol: c.symbol,
      name: c.name,
      price: json[c.id]?.usd ?? null,
      changePct: json[c.id]?.usd_24h_change ?? null,
      source: "crypto" as const,
    }));
  } catch {
    return [];
  }
}

async function fetchStock(symbol: string): Promise<Quote | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error("yahoo error");
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error("no meta");
    const prev = meta.chartPreviousClose ?? meta.previousClose;
    const price = meta.regularMarketPrice;
    const changePct = prev ? ((price - prev) / prev) * 100 : null;
    return {
      symbol,
      name: STOCKS.find((s) => s.symbol === symbol)?.name ?? symbol,
      price,
      changePct,
      source: "stock" as const,
    };
  } catch {
    return null;
  }
}

async function fetchAllStocks(): Promise<Quote[]> {
  const results = await Promise.allSettled(STOCKS.map((s) => fetchStock(s.symbol)));
  return results
    .filter((r): r is PromiseFulfilledResult<Quote> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value);
}

function Card({
  q,
  isCrypto,
}: {
  q: Quote;
  isCrypto: boolean;
}) {
  const up = (q.changePct ?? 0) >= 0;
  const fmtPrice = (p: number | null) =>
    p == null ? "--" : isCrypto ? `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return (
    <div className="glass rounded-xl p-3 border border-white/8 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        {isCrypto ? (
          <Bitcoin size={12} className={up ? "text-emerald-400/70" : "text-primary/70"} />
        ) : (
          <LineChart size={12} className={up ? "text-emerald-400/70" : "text-primary/70"} />
        )}
        <span className="text-[11px] font-display tracking-wider text-white/55">
          {q.symbol}
        </span>
      </div>
      <div className="text-base font-display text-white/85">{fmtPrice(q.price)}</div>
      <div className="flex items-center gap-1 mt-0.5">
        {up ? (
          <TrendingUp size={9} className="text-emerald-400/70" />
        ) : (
          <TrendingDown size={9} className="text-primary/70" />
        )}
        <span
          className={`text-[10px] ${up ? "text-emerald-400/70" : "text-primary/70"}`}
        >
          {q.changePct == null ? "--" : `${up ? "+" : ""}${q.changePct.toFixed(2)}%`}
        </span>
      </div>
    </div>
  );
}

export default function MarketTicker() {
  const [crypto, setCrypto] = useState<Quote[]>([]);
  const [stocks, setStocks] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = async () => {
    setLoading(true);
    const [c, s] = await Promise.all([fetchCrypto(), fetchAllStocks()]);
    setCrypto(c);
    setStocks(s);
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 60000);
    return () => clearInterval(t);
  }, []);

  const all = [...stocks, ...crypto];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-display tracking-widest" style={{ color: "oklch(0.75 0.15 175)" }}>
          LIVE MARKETS
        </span>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-1 px-2 py-1 rounded glass text-white/40 text-[10px] font-display hover:text-white/70 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={10} className={loading ? "animate-spin" : ""} /> REFRESH
        </button>
      </div>

      {lastUpdated && (
        <div className="text-[9px] text-white/25">
          Updated {lastUpdated.toLocaleTimeString()} · free live feeds
        </div>
      )}

      {all.length === 0 && !loading ? (
        <div className="glass rounded-xl border border-white/8 p-6 text-center">
          <div className="text-xs text-white/40">
            Live market feeds unreachable right now. They auto-retry.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {loading && all.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="glass rounded-xl p-3 h-[74px] animate-pulse border border-white/8" />
              ))
            : all.map((q) => (
                <Card key={`${q.source}-${q.symbol}`} q={q} isCrypto={q.source === "crypto"} />
              ))}
        </div>
      )}

      {/* AI Market Insight */}
      <div className="glass rounded-xl border border-primary/15 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles size={12} className="text-primary/80" />
          <span className="text-[9px] font-display tracking-widest text-primary/90">
            AI MARKET INSIGHT
          </span>
        </div>
        <p className="text-[11px] text-white/50 leading-relaxed">
          Live crypto and equity quotes refresh every minute from free feeds
          (CoinGecko + Yahoo Finance). Wire the AI backend here to summarize
          market moves, surface correlated assets, and flag positions that
          matter to you each morning.
        </p>
      </div>
    </div>
  );
}
