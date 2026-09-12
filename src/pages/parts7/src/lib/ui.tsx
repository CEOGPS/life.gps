// LifeOS1 shared UI kit — the single source of truth for the crimson-metallic
// look (see DashboardHome.png). Every panel should import these primitives so a
// future restyle is a one-file change. Colors read CSS tokens (src/index.css /
// theme.js) so the Appearance switcher re-themes everything live.

import React, { useState, useRef } from 'react';

/* ── Color tokens (reference CSS variables so themes apply) ─────────────── */
export const C = {
  crimson: "var(--crimson)",
  crimsonDim: "var(--crimson-dim)",
  crimsonGlow: "var(--crimson-glow)",
  accent: "var(--accent)",
  bg1: "var(--bg1)", 
  bg2: "var(--bg2)", 
  bg3: "var(--bg3)",
  b1: "var(--b1)", 
  b2: "var(--b2)",
  t1: "var(--t1)", 
  t2: "var(--t2)", 
  t3: "var(--t3)",
  // data-viz palette
  teal: "var(--teal)", 
  blue: "var(--blue)", 
  pink: "var(--pink)",
  amber: "var(--amber)", 
  orange: "var(--orange)", 
  green: "var(--green)",
  red: "var(--red)", 
  purple: "var(--purple)", 
  white: "#f0ede8",
  gray: "rgba(255,255,255,0.42)",
};

// Raw hex fallbacks for SVG charts / places that can't take var().
export const HEX = {
  crimson: "#c8102e", 
  green: "#3dd68c", 
  red: "#ff4f5e", 
  blue: "#4a9eff",
  purple: "#8b7fff", 
  pink: "#ff6b9d", 
  orange: "#ff8c42", 
  amber: "#ffb347",
  teal: "#00c896", 
  white: "#f0ede8", 
  gray: "rgba(255,255,255,0.42)",
};

/* ── PanelShell — full-height page wrapper (identical for every panel) ──── */
export function PanelShell({ children, scroll = true, style = {}, pad = 16 }) {
  return (
    <div
      className="lo-page"
      style={{
        height: "calc(100vh - 52px)",
        overflowY: scroll ? "auto" : "hidden",
        padding: pad,
        boxSizing: "border-box",
        color: "var(--t1)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Panel — the beveled gunmetal module with a crimson title row ───────── */
export function Panel({ title, icon, actions, children, style = {}, bodyStyle = {} }) {
  const cardRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseMove = (event) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setCoords({ x, y });
    
    // Clear timeout on movement
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Outer container with tracking border glow and hover transforms (like the provided GridCard)
  const outerStyle = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '16px', // 2xl approx
    cursor: 'pointer',
    transition: 'transform 0.3s ease-out, box-shadow 0.3s',
    transform: isHovered ? 'translateY(-6px) scale(1.015)' : 'none',
    // p-[1px] bg-white/5 effect replicated by the glow + subtle base
    ...style,
  };

  // The 1px border glow that tracks mouse (outer layer)
  const borderGlowStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.3s',
    opacity: isHovered ? 1 : 0,
    background: `radial-gradient(300px circle at ${coords.x}px ${coords.y}px, rgba(220, 38, 38, 0.6), transparent 60%)`,
    borderRadius: 'inherit',
  };

  // Inner glass container (the liquid-glass + snug fit)
  const innerStyle = {
    position: 'relative',
    width: '100%',
    height: '100%',
    borderRadius: '14px', // snug inside the 1px
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    // the liquid-glass class provides the main glass + bevel
  };

  // Inner spotlight glow
  const spotlightStyle = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    transition: 'opacity 0.3s',
    opacity: isHovered ? 1 : 0,
    background: `radial-gradient(400px circle at ${coords.x}px ${coords.y}px, rgba(220, 38, 38, 0.12), transparent 80%)`,
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="liquid-glass"
      style={outerStyle}
    >
      {/* ANIMATED BORDER GLOW */}
      <div style={borderGlowStyle} />

      {/* MAIN INNER GLASS + SPOTLIGHT */}
      <div style={innerStyle}>
        {/* BACKGROUND SPOTLIGHT GLOW */}
        <div style={spotlightStyle} />

        {/* CONTENT */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
          {(title || actions) && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              padding: "11px 14px 9px", 
              borderBottom: "0.5px solid var(--b2)" 
            }}>
              {icon && <span style={{ fontSize: 12, lineHeight: 1 }}>{icon}</span>}
              {title && (
                <span style={{ 
                  flex: 1, 
                  fontSize: 10, 
                  fontWeight: 800, 
                  letterSpacing: ".14em", 
                  textTransform: "uppercase", 
                  color: isHovered ? '#e11d48' : "var(--crimson)", 
                  textShadow: "0 0 10px var(--crimson-glow)",
                  transition: 'color 0.3s'
                }}>
                  {title}
                </span>
              )}
              {actions && <div style={{ display: "flex", gap: 6, alignItems: "center" }}>{actions}</div>}
            </div>
          )}
          <div style={{ padding: 14, flex: 1, minHeight: 0, ...bodyStyle }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Card — lighter inner container ─────────────────────────────────────── */
export function Card({ children, style = {} }) {
  return (
    <div style={{ 
      background: "rgba(255,255,255,0.08)", 
      backdropFilter: "blur(8px)", 
      WebkitBackdropFilter: "blur(8px)", 
      border: "0.5px solid rgba(255,255,255,0.15)", 
      borderRadius: 10, 
      padding: "10px 12px", 
      ...style 
    }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, style = {} }) {
  return (
    <div style={{ 
      fontSize: 9, 
      fontWeight: 700, 
      letterSpacing: ".08em", 
      textTransform: "uppercase", 
      color: "var(--t3)", 
      marginBottom: 6, 
      ...style 
    }}>
      {children}
    </div>
  );
}

/* ── Button — primary (crimson) / ghost / danger ────────────────────────── */
export function Button({ variant = "primary", children, style = {}, disabled = false, ...rest }) {
  const variants = {
    primary: { 
      background: "linear-gradient(180deg, var(--crimson), var(--crimson-dim))", 
      color: "#fff", 
      border: "0.5px solid var(--crimson)", 
      boxShadow: "0 0 12px var(--crimson-glow)" 
    },
    ghost: { 
      background: "rgba(255,255,255,0.05)", 
      color: "var(--t1)", 
      border: "0.5px solid var(--b1)" 
    },
    danger: { 
      background: "rgba(255,79,94,0.12)", 
      color: "var(--red)", 
      border: "0.5px solid rgba(255,79,94,0.35)" 
    },
    teal: { 
      background: "rgba(0,200,150,0.12)", 
      color: "var(--teal)", 
      border: "0.5px solid rgba(0,200,150,0.3)" 
    },
  };
  
  const disabledStyle = disabled ? {
    opacity: 0.5,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  } : {};

  return (
    <button 
      {...rest} 
      disabled={disabled}
      style={{ 
        padding: "6px 14px", 
        borderRadius: 8, 
        fontSize: 11, 
        fontWeight: 600, 
        cursor: disabled ? 'not-allowed' : "pointer", 
        transition: "opacity .15s, transform .15s",
        ...variants[variant], 
        ...disabledStyle,
        ...style 
      }}
    >
      {children}
    </button>
  );
}

export function Input({ style = {}, ...rest }) {
  return (
    <input 
      {...rest} 
      style={{ 
        width: "100%", 
        padding: "8px 12px", 
        borderRadius: 8, 
        border: "0.5px solid var(--b1)", 
        background: "var(--bg3)", 
        color: "var(--t1)", 
        fontSize: 12, 
        outline: "none", 
        boxSizing: "border-box",
        transition: "border-color .15s, box-shadow .15s",
        ...style 
      }}
    />
  );
}

export function Pill({ children, color = "var(--crimson)", style = {} }) {
  return (
    <span style={{ 
      fontSize: 9, 
      padding: "2px 8px", 
      borderRadius: 20, 
      background: `color-mix(in srgb, ${color} 15%, transparent)`, 
      color, 
      fontWeight: 700, 
      ...style 
    }}>
      {children}
    </span>
  );
}

export function StatTile({ label, value, color = "var(--crimson)", icon }) {
  return (
    <div style={{ 
      flex: "1 1 150px", 
      minWidth: 130, 
      padding: "12px 14px", 
      borderRadius: 10, 
      background: "rgba(255,255,255,0.025)", 
      border: "0.5px solid var(--b2)", 
      display: "flex", 
      gap: 10, 
      alignItems: "center",
      transition: "border-color .15s, background .15s",
    }}>
      {icon && <span style={{ fontSize: 17 }}>{icon}</span>}
      <div>
        <div style={{ 
          fontSize: 9, 
          fontWeight: 700, 
          letterSpacing: ".08em", 
          color: "var(--t3)", 
          marginBottom: 2 
        }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color }}>{value ?? "—"}</div>
      </div>
    </div>
  );
}

export function Empty({ icon = "📡", text = "No data", sub = "" }) {
  return (
    <div style={{ textAlign: "center", padding: "22px 0", opacity: 0.5 }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 11, color: "var(--t2)", fontWeight: 600 }}>{text}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--t3)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const fmt = (n) => {
  if (n == null) return "—";
  if (typeof n !== 'number') return String(n);
  return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : 
         n >= 1e3 ? (n / 1e3).toFixed(1) + "K" : 
         String(n);
};

/* ── GrowthArrow — ▲/▼ with % vs a previous value ──────────────────────── */
export function GrowthArrow({ value, prev }) {
  if (prev == null || prev === 0) return <span style={{ fontSize: 9, color: "var(--t3)" }}>—</span>;
  
  const pct = ((value - prev) / Math.abs(prev)) * 100;
  
  if (Math.abs(pct) < 0.05) return <span style={{ fontSize: 10, color: "var(--t3)" }}>0%</span>;
  
  const up = pct > 0;
  const c = up ? HEX.green : HEX.red;
  const displayPct = Math.abs(pct) < 10 ? Math.abs(pct).toFixed(1) : Math.round(Math.abs(pct));
  
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: c }}>
      {up ? "▲" : "▼"} {displayPct}%
    </span>
  );
}

/* ── Bars — dependency-free vertical bar chart (always renders) ─────────── */
export function Bars({ data, height = 120, accent = HEX.crimson }) {
  if (!data || !data.length) return <Empty icon="📊" text="No data" />;
  
  const max = Math.max(...data.map(d => d.v), 1);
  
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height, padding: "4px 0" }}>
      {data.map((d, i) => {
        const barHeight = Math.max((d.v / max) * 100, 2);
        const fill = d.fill || accent;
        
        return (
          <div key={i} style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            gap: 4, 
            height: "100%", 
            justifyContent: "flex-end", 
            minWidth: 0 
          }}>
            <div style={{ fontSize: 9, color: fill, fontWeight: 700 }}>{fmt(d.v)}</div>
            <div style={{ 
              width: "100%", 
              height: `${barHeight}%`, 
              minHeight: 2, 
              borderRadius: "3px 3px 0 0",
              background: `linear-gradient(180deg, ${fill}, color-mix(in srgb, ${fill} 55%, transparent))`,
              boxShadow: `0 0 8px color-mix(in srgb, ${fill} 45%, transparent)`,
              transition: "height .3s ease-out",
            }} />
            <div style={{ 
              fontSize: 8, 
              color: "var(--t3)", 
              overflow: "hidden", 
              textOverflow: "ellipsis", 
              whiteSpace: "nowrap", 
              maxWidth: "100%" 
            }}>{d.name}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ── LineChart — dependency-free trend line ────────────────────────────── */
export function LineChart({ data, color = HEX.crimson, height = 64 }) {
  if (!data || data.length < 2) return <Empty icon="📈" text="Not enough history yet" />;
  
  const vals = data.map(d => (typeof d === "number" ? d : d.v));
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const W = 240;
  const H = height;
  const P = 4;
  
  const pts = vals.map((v, i) => 
    `${P + (i / (vals.length - 1)) * (W - 2 * P)},${H - P - ((v - min) / span) * (H - 2 * P)}`
  ).join(" ");
  
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline 
        points={pts} 
        fill="none" 
        stroke={color} 
        strokeWidth={2} 
        strokeLinejoin="round" 
        strokeLinecap="round" 
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ── Donut — dependency-free pie with legend ───────────────────────────── */
export function Donut({ data, height = 130 }) {
  const total = (data || []).reduce((a, b) => a + (b.v || 0), 0);
  
  if (!total) return <Empty icon="🥧" text="No data" />;
  
  const R = 30;
  const r = 18;
  const cx = 40;
  const cy = 40;
  const CIRC = 2 * Math.PI * R;
  let acc = 0;
  
  const segments = data.filter(d => d.v > 0);
  
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg viewBox="0 0 80 80" width={height} height={height} style={{ flexShrink: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={R - r} />
        {segments.map((d, i) => {
          const frac = d.v / total;
          const seg = (
            <circle 
              key={i} 
              cx={cx} 
              cy={cy} 
              r={R} 
              fill="none" 
              stroke={d.fill} 
              strokeWidth={R - r}
              strokeDasharray={`${frac * CIRC} ${CIRC}`} 
              strokeDashoffset={-acc * CIRC}
              transform={`rotate(-90 ${cx} ${cy})`} 
            />
          );
          acc += frac;
          return seg;
        })}
      </svg>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {segments.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.fill, flexShrink: 0 }} />
            <span style={{ color: "var(--t2)", flex: 1 }}>{d.name}</span>
            <span style={{ color: d.fill, fontWeight: 700 }}>{fmt(d.v)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Gauge — semicircular meter (credit scores etc.) ───────────────────── */
export function Gauge({ value = 0, min = 300, max = 850, label, color = HEX.green, size = 92 }) {
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const r = 38;
  const cx = 50;
  const cy = 50;
  const sw = 8;
  const start = -Math.PI * 0.8;
  const end = Math.PI * 0.8;
  const span = end - start;
  const endA = start + span * pct;
  
  const arc = (a) => ({ 
    x: cx + r * Math.cos(a), 
    y: cy + r * Math.sin(a) 
  });
  
  const s = arc(start);
  const e = arc(end);
  const ep = arc(endA);
  const bgPath = `M${s.x},${s.y} A${r},${r},0,1,1,${e.x},${e.y}`;
  const fgPath = pct > 0 ? `M${s.x},${s.y} A${r},${r},0,${pct > 0.5 ? 1 : 0},1,${ep.x},${ep.y}` : "";
  
  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={sw} strokeLinecap="round" />
        {fgPath && (
          <path 
            d={fgPath} 
            fill="none" 
            stroke={color} 
            strokeWidth={sw} 
            strokeLinecap="round" 
            style={{ filter: `drop-shadow(0 0 4px ${color})` }} 
          />
        )}
        <text 
          x={cx} 
          y={cy + 4} 
          textAnchor="middle" 
          fill={value ? color : "var(--t3)"} 
          fontSize={value ? 17 : 12} 
          fontWeight={800}
        >
          {value || "—"}
        </text>
      </svg>
      {label && <div style={{ fontSize: 9, color: "var(--t3)", marginTop: -6 }}>{label}</div>}
    </div>
  );
}

export { fmt };