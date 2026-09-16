import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import BrandIcon from "@/components/lifeos/icons/BrandIcon";
import { kvGet, kvSet } from "@/utils/storage";
import { supabase } from "@/lib/supabaseClient";

import { usePersistentState } from "@/lib/usePersistentState";
import { Button, Input, Empty, HEX, fmt, Donut, LineChart, Gauge } from "@/lib/ui";
import { useLifeOSData } from "@/lib/LifeOSDataContext";
import { useAudio } from "@/lib/AudioProvider";
import {
  Calendar,
  CheckSquare,
  Contact,
  FolderKanban,
  LineChart as LucideLineChart,
  Wallet,
  BarChart3 as LucideBarChart3,
  Share2,
  Music,
  Bot,
  Send,
  BookOpen,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Thermometer,
  Droplets,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Search,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Activity,
  Zap,
  TrendingUp,
  CreditCard,
  Globe,
  WindowMinimize,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
  RefreshCcw
} from 'lucide-react';

const GridCard = ({ title, icon, actions, children, style: styleProp, gridColumn }) => {
  const cardRef = useRef(null);
  const [localCoords, setLocalCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const timeoutRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setLocalCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsMoving(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsMoving(false), 1000);
  };

  const showEffects = isHovered && isMoving;
  const glowIntensity = showEffects ? 0.6 : 0;
  const spotlightIntensity = showEffects ? 0.35 : 0;
  const gridIntensity = showEffects ? 0.15 : 0;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsMoving(false); }}
      style={{
        gridColumn: gridColumn || "span 4",
        position: 'relative',
        borderRadius: '20px',
        cursor: 'pointer',
        transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        transform: isHovered ? 'translateY(-4px) scale(1.01)' : 'none',
        boxShadow: isHovered ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
        ...styleProp,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          borderRadius: '20px',
          opacity: glowIntensity,
          background: `radial-gradient(180px circle at ${localCoords.x}px ${localCoords.y}px, rgba(255, 0, 13, 0.3), transparent 70%)`,
          transition: 'opacity 0.6s ease-out',
        }}
      />
      <div 
        style={{ 
          position: 'relative',
          width: '100%',
          height: '100%',
          background: showEffects ? 'rgba(20, 20, 20, 0.7)' : 'rgba(15, 15, 15, 0.5)',
          borderRadius: '20px',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '24px',
          overflow: 'hidden',
          transition: 'background 0.6s ease-out',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: '20px',
            opacity: spotlightIntensity,
            background: `radial-gradient(350px circle at ${localCoords.x}px ${localCoords.y}px, rgba(128, 0, 0, 0.2), transparent 80%)`,
            transition: 'opacity 0.6s ease-out',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            borderRadius: '20px',
            opacity: gridIntensity,
            background: `radial-gradient(130px circle at ${localCoords.x}px ${localCoords.y}px, rgba(255,0,13,0.1), transparent 55%), radial-gradient(circle, rgba(255, 0, 13, 0.15) 1px, transparent 0)`,
            backgroundSize: `auto, 20px 20px`,
            backgroundPosition: `0 0, ${localCoords.x % 20}px ${localCoords.y % 20}px`,
            transition: 'opacity 1s ease-out',
          }}
        />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
          {(title || icon || actions) && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 10, 
              paddingBottom: 12, 
              borderBottom: "1px solid rgba(255,255,255,0.06)", 
              marginBottom: 16,
              flexShrink: 0,
            }}>
              {icon && <span style={{ fontSize: 16, color: '#ff000d' }}>{icon}</span>}
              {title && (
                <span style={{ 
                  flex: 1, 
                  fontSize: 12, 
                  fontWeight: 600, 
                  letterSpacing: ".1em", 
                  textTransform: "uppercase", 
                  color: 'rgba(255,0,13,0.8)',
                  transition: 'all 0.3s ease',
                }}>
                  {title}
                </span>
              )}
              {actions && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{actions}</div>}
            </div>
          )}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

function ClockWeatherWidget() {
  const [t, setT] = useState(new Date());
  const [weather, setWeather] = useState({ temp: 72, humidity: 40, code: 0, wind: 5 });

  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 1000);
    fetch('https://api.open-meteo.com/v1/forecast?latitude=33.75&longitude=-84.39&current_weather=true&hourly=relativehumidity_2m&forecast_days=1')
      .then(r => r.json())
      .then(d => {
        if (d.current_weather) {
          setWeather({ 
            temp: Math.round(d.current_weather.temperature), 
            humidity: d.hourly ? d.hourly.relativehumidity_2m[0] : 40, 
            code: d.current_weather.weathercode, 
            wind: Math.round(d.current_weather.windspeed || 0) 
          });
        }
      }).catch(() => {});
    return () => clearInterval(id);
  }, []);

  function getWeatherIcon(code) {
    if (code === 0) return <Sun size={32} className="text-yellow-400" />;
    if (code <= 3) return <Cloud size={32} className="text-white-60" />;
    if (code <= 48) return <CloudFog size={32} className="text-white-40" />;
    if (code <= 67 || (code >= 80 && code <= 82)) return <CloudRain size={32} className="text-blue-400" />;
    if (code <= 77 || (code >= 85 && code <= 86)) return <CloudSnow size={32} className="text-blue-200" />;
    if (code >= 95) return <CloudLightning size={32} className="text-yellow-500" />;
    return <Cloud size={32} className="text-white-60" />;
  }

  const hh = t.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const [time, ap] = hh.split(" ");
  const dateStr = t.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "long" }).toUpperCase();

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", textAlign: "center" }}>
      <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: "-0.03em", color: "white", lineHeight: 1, fontFamily: '"Lumina", monospace' }}>
        {time}<span style={{ fontSize: 24, color: "var(--crimson)", marginLeft: 8, fontWeight: 600 }}>{ap}</span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: ".1em", color: "rgba(255,255,255,0.6)", marginTop: 12, fontFamily: '"Lumina", monospace' }}>
        {dateStr}
      </div>
      <div style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {getWeatherIcon(weather.code)}
          <span style={{ fontSize: 22, fontWeight: 700 }}>{weather.temp}°F</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)" }}>
          <Droplets size={18} /> {weather.humidity}%
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.5)" }}>
          <Wind size={18} /> {weather.wind} mph
        </span>
      </div>
    </div>
  );
}

function NotificationsWidget() {
  const { notifications, markNotificationRead } = useLifeOSData();
  const unread = notifications.filter(n => !n.read);

  if (unread.length === 0) return <div className="text-white/30 text-sm italic">No new notifications</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", overflowY: "auto" }}>
      {unread.slice(0, 4).map(n => (
        <div key={n.id} onClick={() => markNotificationRead(n.id)} style={{ 
          padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.04)", 
          borderLeft: "3px solid var(--crimson)", cursor: "pointer", transition: "background 0.2s"
        }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "white", marginBottom: 4 }}>{n.title}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>{n.body}</div>
        </div>
      ))}
      {unread.length > 4 && <div style={{ textAlign: "center", fontSize: 10, color: "var(--crimson)", fontWeight: 700 }}>+{unread.length - 4} more</div>}
    </div>
  );
}

function OmniBrowserWidget() {
  const [url, setUrl] = useState("");
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!input) return;
    const searchUrl = input.includes(".") ? `https://${input}` : `https://www.google.com/search?q=${encodeURIComponent(input)}`;
    setUrl(searchUrl);
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 10, height: "100%", alignItems: "center" }}>
        <Input 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Omni Search / URL..." 
          style={{ flex: 1, height: 44, borderRadius: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "white", padding: "0 16px" }} 
        />
        <Button type="submit" style={{ height: 44, width: 44, borderRadius: 12, background: "var(--crimson)", color: "white" }}><Search size={18} /></Button>
      </form>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', top: '10%', left: '10%', width: isMaximized ? '80%' : '60%', height: isMaximized ? '80%' : '60%', 
      zIndex: 100, background: '#111', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 0 100px rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 15, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{url}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button onClick={() => setIsMaximized(!isMaximized)} style={{ background: 'transparent', color: 'white', padding: 4 }}><Maximize2 size={14} /></Button>
          <Button onClick={() => setIsOpen(false)} style={{ background: 'transparent', color: 'white', padding: 4 }}><X size={14} /></Button>
        </div
      </div
      <iframe src={url} style={{ flex: 1, border: 'none', background: 'white' }} />
    </div
  );
}

function YouTubePlayerWidget() {
  const { ytVideoId, setYtVideoId, ytIsPlaying, setYtIsPlaying } = useAudio();
  const playerRef = useRef(null);

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => {
        if (ytVideoId) initPlayer();
      };
    } else {
      initPlayer();
    }

    function initPlayer() {
      playerRef.current = new window.YT.Player('yt-player', {
        videoId: ytVideoId || 'dQw4w9WgXcQ',
        playerVars: { 
          autoplay: ytIsPlaying ? 1 : 0, 
          controls: 1, 
          modestbranding: 1, 
          rel: 0 
        },
        events: {
          onStateChange: (event) => {
            const playing = event.data === window.YT.PlayerState.PLAYING;
            setYtIsPlaying(playing);
          }
        }
      });
    }
  }, [ytVideoId]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (ytIsPlaying) {
      playerRef.current.pauseVideo();
      setYtIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setYtIsPlaying(true);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
        <iframe 
          id="yt-player"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Button onClick={handlePlayPause} style={{ borderRadius: '50%', width: 36, height: 36, background: 'var(--crimson)', color: 'white' }}>
          {ytIsPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>YouTube Stream</div>
      </div>
    </div>
  );
}

function MusicPlayerWidget() {
  const { currentTrack, musicIsPlaying, musicProgress, musicVolume, playTrack, toggleMusicPlay, nextTrack, prevTrack, seekMusic } = useAudio();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ 
          width: 64, height: 64, borderRadius: '12px', background: 'linear-gradient(45deg, #333, #111)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--crimson)', 
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <Music size={32} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "white", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentTrack?.name || "No Track Selected"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentTrack?.artist || "Music Hub"}
          </div>
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Button onClick={() => prevTrack([], null, [], null)} style={{ background: 'transparent', color: 'white', padding: 6 }}><SkipBack size={18} /></Button>
        <Button onClick={toggleMusicPlay} style={{ borderRadius: '50%', width: 40, height: 40, background: 'var(--crimson)', color: 'white' }}>
          {musicIsPlaying ? <Pause size={20} /> : <Play size={20} />}
        </Button>
        <Button onClick={() => nextTrack([], null, [], null)} style={{ background: 'transparent', color: 'white', padding: 6 }}><SkipForward size={18} /></Button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>0:00</span>
        <div 
          style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, cursor: 'pointer', position: 'relative' }} 
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const progress = (e.clientX - rect.left) / rect.width;
            seekMusic(progress);
          }}
        >
          <div style={{ width: `${musicProgress * 100}%`, height: '100%', background: 'var(--crimson)', borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>3:45</span>
      </div>
    </div>
  );
}

function FinanceWidget() {
  const { budgetBills } = useLifeOSData();
  const totalBudget = budgetBills.reduce((sum, b) => sum + (b.amount || 0), 0);
  const paidAmount = budgetBills.filter(b => b.paid).reduce((sum, b) => sum + (b.amount || 0), 0);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, height: "100%" }}>
      <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Monthly Budget</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>${totalBudget.toLocaleString()}</div>
        <div style={{ fontSize: 12, color: "rgba(0,255,127,0.7)", marginTop: 4 }}>{((paidAmount/totalBudget)*100 || 0).toFixed(1)}% Paid</div>
      </div>
      <div style={{ padding: "16px", borderRadius: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>Credit Score</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: "white" }}>742</div>
        <div style={{ fontSize: 12, color: "var(--crimson)", marginTop: 4 }}>↑ 12 pts this mo</div>
      </div>
    </div>
  );
}

function SocialWidget() {
  const { leads } = useLifeOSData();
  const reach = leads.length * 1250; // Simulated aggregate reach based on lead volume
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "white", fontWeight: 600 }}>Social Reach</div>
        <TrendingUp size={14} color="var(--crimson)" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { label: "IG", val: "12.4k", color: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" },
          { label: "YT", val: "45.2k", color: "linear-gradient(45deg, #ff0000, #cc0000)" },
          { label: "X", val: "8.1k", color: "linear-gradient(45deg, #000, #333)" },
          { label: "LI", val: "2.3k", color: "linear-gradient(45deg, #0077b5, #00a0dc)" },
        ].map(s => (
          <div key={s.label} style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{s.label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AIInsightsWidget() {
  const [insight, setInsight] = useState({ title: "Loading...", body: "Fetching today's alpha..." });

  useEffect(() => {
    const updateInsight = async () => {
      const insights = [
        { title: "Money Maker", body: "Explore high-ticket affiliate marketing for SaaS tools in the AI space." },
        { title: "Life Hack", body: "Use the 2-minute rule: If a task takes less than 2 minutes, do it immediately." },
        { title: "AI Tip", body: "Chain-of-Thought prompting: Ask AI to 'think step-by-step' for 40% better logic." },
        { title: "Wealth Alpha", body: "Diversify into index funds while maintaining a 6-month liquid cash reserve." },
        { title: "Productivity", body: "Time-block your deep work sessions in 90-minute sprints with no distractions." },
        { title: "Mindset", body: "Focus on systems, not goals. A goal is a destination, a system is the vehicle." },
        { title: "Network", body: "Reach out to one high-value contact per day without asking for anything." },
      ];
      const today = new Date().getDate();
      setInsight(insights[today % insights.length]);
    };
    updateInsight();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--crimson)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".1em" }}>
        <Zap size={12} /> Daily Alpha
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 4 }}>{insight.title}</div>
      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{insight.body}</div>
    </div>
  );
}

function ActivityFeedWidget() {
  const { activityEvents } = useLifeOSData();
  const events = activityEvents.slice(0, 5);

  if (events.length === 0) return <div className="text-white/30 text-sm italic">System quiet...</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", overflowY: "auto" }}>
      {events.map(e => (
        <div key={e.id} style={{ display: "flex", gap: 10, fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--crimson)', marginTop: 4, flexShrink: 0 }} />
          <div>
            <span style={{ color: "white", fontWeight: 600 }}>{e.title}</span> {e.body}
            <div style={{ fontSize: 9, opacity: 0.5, marginTop: 2 }}>{new Date(e.created_at).toLocaleTimeString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentMonitorWidget() {
  const { agents } = useLifeOSData();
  const activeAgents = agents.filter(a => a.enabled);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "white", fontWeight: 600 }}>Active Agents</div>
        <div style={{ fontSize: 10, color: "var(--crimson)", fontWeight: 700 }}>{activeAgents.length} ONLINE</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {activeAgents.slice(0, 3).map(a => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff00', boxShadow: '0 0 8px #00ff00' }} />
            <span style={{ fontSize: 12, color: "white", fontWeight: 500 }}>{a.name}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginLeft: 'auto' }}>IDLE</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPanel({ setActive }) {
  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "repeat(12, 1fr)", 
      gap: 24, 
      padding: "24px", 
      height: "100%", 
      overflowY: "auto", 
      boxSizing: "border-box" 
    }}>
      <GridCard title="Chronos" icon={<Calendar size={16} />} gridColumn="span 8">
        <ClockWeatherWidget />
      </GridCard>
      <GridCard title="Alerts" icon={<Bell size={16} />} gridColumn="span 4">
        <NotificationsWidget />
      </GridCard>

      <GridCard title="Omni Browser" icon={<Globe size={16} />} gridColumn="span 8">
        <OmniBrowserWidget />
      </GridCard>
      <GridCard title="Neural Alpha" icon={<Zap size={16} />} gridColumn="span 4">
        <AIInsightsWidget />
      </GridCard>

      <GridCard title="YouTube Stream" icon={<Play size={16} />} gridColumn="span 6">
        <YouTubePlayerWidget />
      </GridCard>
      <GridCard title="Music Hub" icon={<Music size={16} />} gridColumn="span 6">
        <MusicPlayerWidget />
      </GridCard>

      <GridCard title="Wealth Index" icon={<Wallet size={16} />} gridColumn="span 4">
        <FinanceWidget />
      </GridCard>
      <GridCard title="Social Pulse" icon={<Share2 size={16} />} gridColumn="span 4">
        <SocialWidget />
      </GridCard>
      <GridCard title="Agent Network" icon={<Bot size={16} />} gridColumn="span 4">
        <AgentMonitorWidget />
      </GridCard>

      <GridCard title="System Event Log" icon={<Activity size={16} />} gridColumn="span 12">
        <ActivityFeedWidget />
      </GridCard>
    </div>
  );
}
