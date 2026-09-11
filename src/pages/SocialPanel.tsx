import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Share2, BarChart3, Users, MessageSquare, TrendingUp, Target, Globe, Calendar, Settings, Plus, RefreshCw, Download, AlertTriangle, CheckCircle, Camera } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

// Custom SVG icons for social platforms not in lucide-react
const InstagramIcon = ({ className = "", size = 16, ...props }: React.SVGProps<SVGSVGElement> & { className?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} fill="currentColor" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const FacebookCustomIcon = ({ className = "", size = 16, ...props }: React.SVGProps<SVGSVGElement> & { className?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterCustomIcon = ({ className = "", size = 16, ...props }: React.SVGProps<SVGSVGElement> & { className?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} fill="currentColor" {...props}>
    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
  </svg>
);

const LinkedinCustomIcon = ({ className = "", size = 16, ...props }: React.SVGProps<SVGSVGElement> & { className?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const YoutubeCustomIcon = ({ className = "", size = 16, ...props }: React.SVGProps<SVGSVGElement> & { className?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} fill="currentColor" {...props}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12 9.545 15.568z"/>
  </svg>
);

const TiktokCustomIcon = ({ className = "", size = 16, ...props }: React.SVGProps<SVGSVGElement> & { className?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" className={className} width={size} height={size} fill="currentColor" {...props}>
    <path d="M12.545 0c4.443 0 8.039 3.592 8.039 8.035 0 4.443-3.596 8.039-8.039 8.039-4.444 0-8.04-3.596-8.04-8.039 0-4.443 3.596-8.035 8.04-8.035zm-1.304 11.895c.723-.054 1.412-.286 2.012-.693V8.08c-1.668.17-3.245.565-4.586 1.222 1.434 1.81 4.213 2.63 6.574 1.47zm5.74 4.354c-.285 1.48-1.445 2.797-2.986 3.106-1.904.387-3.898-.677-4.813-2.39-1.012 2.23 1.025 4.237 3.515 3.746v-1.22c-1.81-.285-2.986-2.353-2.146-4.207.61-1.33 2.183-2.197 3.604-2.093 2.074.15 3.47 1.896 3.52 3.795zM12.545 3.31c3.518 0 6.37 2.852 6.37 6.37 0 3.518-2.852 6.37-6.37 6.37-3.518 0-6.37-2.852-6.37-6.37 0-3.518 2.852-6.37 6.37-6.37z"/>
  </svg>
);

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: InstagramIcon, color: "#E4405F", bg: "oklch(0.65 0.22 15)", connected: true, username: "@ceogps" },
  { id: "facebook", label: "Facebook", icon: FacebookCustomIcon, color: "#1877F2", bg: "oklch(0.65 0.22 265)", connected: true, username: "ceogps" },
  { id: "twitter", label: "X (Twitter)", icon: TwitterCustomIcon, color: "#1DA1F2", bg: "oklch(0.7 0.18 240)", connected: true, username: "@ceogps" },
  { id: "linkedin", label: "LinkedIn", icon: LinkedinCustomIcon, color: "#0A66C2", bg: "oklch(0.6 0.2 265)", connected: true, username: "ceogps" },
  { id: "youtube", label: "YouTube", icon: YoutubeCustomIcon, color: "#FF0000", bg: "oklch(0.65 0.22 15)", connected: false, username: null },
  { id: "tiktok", label: "TikTok", icon: TiktokCustomIcon, color: "#000000", bg: "oklch(0.7 0.18 70)", connected: false, username: null },
];

const METRICS = [
  { label: "Total Followers", value: "24.7K", change: "+12%", trend: "up" },
  { label: "Engagement Rate", value: "4.2%", change: "+0.3%", trend: "up" },
  { label: "Reach (30d)", value: "184K", change: "-8%", trend: "down" },
  { label: "Content Published", value: "47", change: "+5", trend: "up" },
];

const RECENT_POSTS = [
  { platform: "instagram", content: "Behind the scenes: building CEO GPS dashboard...", engagement: "1.2K", time: "2h ago", type: "reel" },
  { platform: "twitter", content: "Just shipped the new Insight Engine panel. AI-powered pattern detection across business metrics. 🚀", engagement: "342", time: "5h ago", type: "tweet" },
  { platform: "linkedin", content: "Thoughts on the future of personal operating systems...", engagement: "89", time: "1d ago", type: "article" },
  { platform: "facebook", content: "Community update: CreatorOS1 beta access opening soon!", engagement: "156", time: "2d ago", type: "post" },
];

const SCHEDULED_POSTS = [
  { platform: "instagram", content: "Monday motivation: Systems > Goals", time: "Tomorrow 9:00 AM", status: "scheduled" },
  { platform: "twitter", content: "Thread: How I automate 80% of my content workflow", time: "Tomorrow 12:00 PM", status: "scheduled" },
  { platform: "linkedin", content: "Case study: 3x revenue with AI-assisted outreach", time: "Wed 10:00 AM", status: "draft" },
];

export default function SocialPanel() {
  const [activeTab, setActiveTab] = useState<"overview" | "analytics" | "schedule" | "engage" | "settings">("overview");
  const [connectedPlatforms, setConnectedPlatforms] = useState(() => {
    const saved = localStorage.getItem("social_connected_platforms");
    return saved ? JSON.parse(saved) : PLATFORMS.map(p => ({ ...p, connected: p.connected }));
  });

  useEffect(() => {
    localStorage.setItem("social_connected_platforms", JSON.stringify(connectedPlatforms));
  }, [connectedPlatforms]);

  const togglePlatform = (platformId: string) => {
    setConnectedPlatforms(prev => prev.map(p => 
      p.id === platformId ? { ...p, connected: !p.connected, username: !p.connected ? p.username || `@${platformId}_user` : p.username } : p
    ));
  };

  const handleConnect = (platformId: string) => {
    // Simulate OAuth flow
    alert(`OAuth PKCE flow for ${platformId} would launch here. Redirect URI: https://oauth.ceogps.com/api/oauth/callback`);
    togglePlatform(platformId);
  };

  const getPlatformIcon = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    return platform ? platform.icon : Globe;
  };

  const getPlatformBg = (platformId: string) => {
    const platform = PLATFORMS.find(p => p.id === platformId);
    return platform ? platform.bg : "oklch(0.5 0.1 265)";
  };

  return (
    <PanelLayout
      title="SocialLinkOS1"
      subtitle="Unified social command center — publish, analyze, engage"
      icon={<Share2 size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Plus size={12} /> NEW POST
        </button>
      }
    >
      <div className="h-full flex flex-col">
        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 glass rounded-xl border border-white/8 shrink-0">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
            { id: "schedule", label: "Schedule", icon: Calendar },
            { id: "engage", label: "Engage", icon: MessageSquare },
            { id: "settings", label: "Connections", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-display transition-all ${
                activeTab === tab.id
                  ? "glass-crimson text-primary glow-crimson-sm"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "overview" && (
            <div className="space-y-4 p-2">
              {/* Platform Connections */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-sm text-white/80 tracking-wider">Platform Connections</h3>
                  <span className="text-[10px] text-primary/70 font-display">
                    {connectedPlatforms.filter(p => p.connected).length}/{connectedPlatforms.length} Connected
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {connectedPlatforms.map((platform) => (
                    <motion.div
                      key={platform.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 }}
                      className={`relative glass rounded-lg p-3 border transition-all ${
                        platform.connected ? "border-primary/20 bg-primary/5" : "border-white/5 hover:border-primary/20"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: platform.bg }}>
                        <platform.icon size={16} className="text-white" />
                      </div>
                      <div className="font-medium text-sm text-white/80">{platform.label}</div>
                      <div className="text-[10px] text-white/40 mt-1">
                        {platform.connected ? platform.username : "Not connected"}
                      </div>
                      <button
                        onClick={() => platform.connected ? togglePlatform(platform.id) : handleConnect(platform.id)}
                        className={`mt-2 w-full text-[10px] font-display px-2 py-1.5 rounded transition-all ${
                          platform.connected
                            ? "bg-white/5 text-white/60 hover:bg-white/10"
                            : "bg-primary/20 text-primary hover:bg-primary/30 glow-crimson-sm"
                        }`}
                      >
                        {platform.connected ? "DISCONNECT" : "CONNECT"}
                      </button>
                      {platform.connected && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ backgroundColor: "oklch(0.7 0.18 70)" }} />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Key Metrics */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
              >
                {METRICS.map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                    className="glass rounded-xl p-4 border border-white/8"
                  >
                    <div className="text-[10px] font-display tracking-widest text-white/40 mb-1">
                      {metric.label}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-display font-bold text-white/90">{metric.value}</span>
                      <span className={`text-[10px] font-display ${metric.trend === "up" ? "text-green-400" : "text-red-400"}`}>
                        {metric.change}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Recent Posts */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-xl border border-white/8 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <h3 className="font-display text-sm text-white/80 tracking-wider">Recent Posts</h3>
                </div>
                <div className="divide-y divide-white/5">
                  {RECENT_POSTS.map((post, i) => (
                    <div key={i} className="p-4 hover:bg-white/3 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: getPlatformBg(post.platform) }}>
                          {(() => {
                            const Icon = getPlatformIcon(post.platform);
                            return Icon ? <Icon size={10} className="text-white" /> : null;
                          })()}
                        </div>
                        <span className="text-xs font-medium text-white/70">{post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}</span>
                        <span className="text-[10px] text-white/30 ml-auto">{post.time}</span>
                      </div>
                      <p className="text-sm text-white/60 line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-white/40">
                          <CheckCircle size={10} /> {post.engagement}
                        </span>
                        <span className="text-[10px] text-white/30 capitalize">{post.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-4 p-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Platform Performance (30 Days)</h3>
                <div className="space-y-3">
                  {connectedPlatforms.filter(p => p.connected).map((platform, i) => (
                    <motion.div
                      key={platform.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-lg p-3 border border-white/5 flex items-center gap-4"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: platform.bg }}>
                        <platform.icon size={16} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-white/80">{platform.label}</div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.floor(Math.random() * 40) + 60}%` }}
                            transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: platform.color }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-white/90">{Math.floor(Math.random() * 10) + 2}.{Math.floor(Math.random() * 10)}%</div>
                        <div className="text-[10px] text-white/30">Engagement Rate</div>
                      </div>
                    </motion.div>
                  ))}
                  {connectedPlatforms.filter(p => !p.connected).length > 0 && (
                    <div className="text-center py-6 text-white/30 border-t border-white/5">
                      Connect platforms to see analytics
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Content Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { label: "Best Performing", value: "Instagram Reel", metric: "12.4K views", icon: TrendingUp },
                    { label: "Most Engaging", value: "LinkedIn Article", metric: "8.2% engagement", icon: MessageSquare },
                    { label: "Fastest Growth", value: "Twitter Thread", metric: "+340 followers", icon: Users },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.05 }}
                      className="glass-crimson/30 rounded-lg p-3 border border-primary/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <item.icon size={12} className="text-primary" />
                        <span className="text-[10px] font-display text-primary/70">{item.label}</span>
                      </div>
                      <div className="font-medium text-sm text-white/80">{item.value}</div>
                      <div className="text-xs text-white/50 mt-1">{item.metric}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="space-y-4 p-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-sm text-white/80 tracking-wider">Scheduled Posts</h3>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
                    <Plus size={12} /> SCHEDULE
                  </button>
                </div>
                <div className="space-y-3">
                  {SCHEDULED_POSTS.map((post, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass rounded-lg p-3 border border-white/5 flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: getPlatformBg(post.platform) }}>
                        {(() => {
                          const Icon = getPlatformIcon(post.platform);
                          return Icon ? <Icon size={14} className="text-white" /> : null;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/70 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px]">
                          <span className="flex items-center gap-1 text-white/40">
                            <Calendar size={10} /> {post.time}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-display ${
                            post.status === "scheduled" ? "bg-green-500/20 text-green-400" :
                            post.status === "draft" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-primary/20 text-primary"
                          }`}>
                            {post.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button className="text-[10px] text-white/50 hover:text-primary font-display">Edit</button>
                        <button className="text-[10px] text-white/50 hover:text-red-400 font-display">Cancel</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Calendar View Placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Content Calendar</h3>
                <div className="glass rounded-lg p-8 text-center border border-white/5">
                  <Calendar size={32} className="mx-auto text-white/10 mb-3" />
                  <p className="text-sm text-white/40">Calendar view — drag & drop to reschedule</p>
                  <p className="text-[10px] text-white/30 mt-1">Integrate with Google Calendar, Notion, or Airtable</p>
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "engage" && (
            <div className="space-y-4 p-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Unified Inbox</h3>
                <div className="space-y-2">
                  {[
                    { platform: "instagram", from: "sarah_designs", message: "Love the new dashboard! How did you build the charts?", time: "15m ago", unread: true },
                    { platform: "twitter", from: "tech_founder", message: "Great thread on automation. Bookmarked for later.", time: "1h ago", unread: true },
                    { platform: "linkedin", from: "marcus_chen", message: "Interested in collaborating on the CreatorOS1 launch.", time: "3h ago", unread: false },
                    { platform: "facebook", from: "alex_m", message: "When does the beta open for CreatorOS1?", time: "5h ago", unread: false },
                  ].map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`glass rounded-lg p-3 border border-white/5 flex items-start gap-3 ${msg.unread ? "border-primary/20 bg-primary/5" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: getPlatformBg(msg.platform) }}>
                        {(() => {
                          const Icon = getPlatformIcon(msg.platform);
                          return Icon ? <Icon size={12} className="text-white" /> : null;
                        })()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-white/80">@{msg.from}</span>
                          <span className="text-[10px] text-white/30">{msg.platform}</span>
                          {msg.unread && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "oklch(0.7 0.18 70)" }} />}
                        </div>
                        <p className="text-sm text-white/60">{msg.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-[10px]">
                          <span className="text-white/30">{msg.time}</span>
                          <button className="text-primary/70 hover:text-primary font-display">Reply</button>
                          <button className="text-white/40 hover:text-white/60 font-display">Mark Read</button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-4 p-2">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">OAuth Connections</h3>
                <p className="text-sm text-white/40 mb-4">Manage API connections for each platform. Each uses PKCE flow with unique redirect URIs.</p>
                <div className="space-y-3">
                  {connectedPlatforms.map((platform) => (
                    <div key={platform.id} className="glass rounded-lg p-3 border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: platform.bg }}>
                          <platform.icon size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-white/80">{platform.label}</div>
                          <div className="text-[10px] text-white/40">
                            {platform.connected ? `Connected as ${platform.username}` : "Not connected"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {platform.connected ? (
                          <>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "oklch(0.7 0.18 70)" }} />
                            <button onClick={() => togglePlatform(platform.id)} className="text-[10px] text-red-400 hover:text-red-300 font-display">Disconnect</button>
                          </>
                        ) : (
                          <button onClick={() => handleConnect(platform.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
                            <Globe size={12} /> CONNECT
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl border border-white/8 p-4"
              >
                <h3 className="font-display text-sm text-white/80 tracking-wider mb-4">Posting Defaults</h3>
                <div className="space-y-3">
                  {[
                    { label: "Auto-add hashtags", description: "Append relevant hashtags based on content analysis" },
                    { label: "Cross-post to connected platforms", description: "Automatically adapt and post to all connected accounts" },
                    { label: "Optimal timing suggestions", description: "AI recommends best posting times per platform" },
                    { label: "Brand voice consistency check", description: "Flag content that deviates from defined voice guidelines" },
                  ].map((setting, i) => (
                    <label key={i} className="flex items-center justify-between cursor-pointer">
                      <div>
                        <div className="text-sm text-white/70">{setting.label}</div>
                        <div className="text-[10px] text-white/40">{setting.description}</div>
                      </div>
                      <input type="checkbox" className="w-4 h-4 accent-primary" defaultChecked />
                    </label>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </PanelLayout>
  );
}