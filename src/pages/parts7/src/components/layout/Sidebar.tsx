import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Music2, Users, Briefcase, Mail, MessageSquare, DollarSign,
  Wand2, Globe2, Share2, Megaphone, CalendarDays, Bot, Zap, GraduationCap,
  Brain, Search, BarChart3, FolderKanban, Calendar, FileSpreadsheet,
  Heart, Activity, BookOpen, Gamepad2, Image, Lock, Terminal, Scale,
  GitBranch, Plug, Swords, Star, ChevronLeft, ChevronRight, Gauge, MapPin,
} from "lucide-react";
import { SIDEBAR_GROUPS } from "./sidebar-items.ts";

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard size={15} />,
  Music2: <Music2 size={15} />,
  Users: <Users size={15} />,
  Briefcase: <Briefcase size={15} />,
  Mail: <Mail size={15} />,
  MessageSquare: <MessageSquare size={15} />,
  DollarSign: <DollarSign size={15} />,
  Wand2: <Wand2 size={15} />,
  Globe2: <Globe2 size={15} />,
  Share2: <Share2 size={15} />,
  Megaphone: <Megaphone size={15} />,
  CalendarDays: <CalendarDays size={15} />,
  Bot: <Bot size={15} />,
  Zap: <Zap size={15} />,
  GraduationCap: <GraduationCap size={15} />,
  Brain: <Brain size={15} />,
  Search: <Search size={15} />,
  BarChart3: <BarChart3 size={15} />,
  FolderKanban: <FolderKanban size={15} />,
  Calendar: <Calendar size={15} />,
  FileSpreadsheet: <FileSpreadsheet size={15} />,
  Heart: <Heart size={15} />,
  Activity: <Activity size={15} />,
  BookOpen: <BookOpen size={15} />,
  Gamepad2: <Gamepad2 size={15} />,
  Pulse: <Gauge size={15} />,
  Image: <Image size={15} />,
  Lock: <Lock size={15} />,
  Terminal: <Terminal size={15} />,
  Scale: <Scale size={15} />,
  GitBranch: <GitBranch size={15} />,
  Plug: <Plug size={15} />,
  Swords: <Swords size={15} />,
  Star: <Star size={15} />,
  MapPin: <MapPin size={15} />,
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 54 : 216 }}
      transition={{ duration: 0.28, ease: "easeInOut" }}
      className="relative flex flex-col h-full shrink-0 overflow-hidden border-r z-20"
      style={{ background: "oklch(0.03 0 0)", borderColor: "oklch(0.55 0.22 20 / 12%)" }}
    >
      {/* Top logo area */}
      <div className="flex items-center justify-between px-3 py-3.5 border-b shrink-0" style={{ borderColor: "oklch(0.55 0.22 20 / 10%)" }}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{ background: "oklch(0.55 0.22 20 / 18%)", border: "1px solid oklch(0.55 0.22 20 / 35%)", boxShadow: "0 0 10px oklch(0.55 0.22 20 / 30%)" }}
            >
              <span className="font-display text-xs font-bold" style={{ color: "oklch(0.65 0.22 20)", textShadow: "0 0 8px oklch(0.55 0.22 20 / 80%)" }}>L</span>
            </div>
            <span className="font-display text-[10px] tracking-[0.18em] text-white/65 uppercase">LifeOS</span>
          </motion.div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-white/25 hover:text-primary transition-colors p-1 rounded"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-3">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-3 mb-1 mt-1">
                <span className="text-[8px] tracking-[0.25em] font-display" style={{ color: "oklch(0.75 0.15 175 / 60%)" }}>
                  {group.label}
                </span>
              </div>
            )}
            <div className="space-y-0.5 px-1.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link key={item.id} to={item.path}>
                    <motion.div
                      whileHover={{ x: collapsed ? 0 : 2 }}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-all duration-200 group cursor-pointer
                        ${isActive
                          ? "glass-crimson"
                          : "text-white/40 hover:text-white/80 hover:bg-white/4"
                        }`}
                    >
                      <span className={`shrink-0 ${isActive ? "text-primary" : "text-white/30 group-hover:text-white/60"}`}>
                        {ICON_MAP[item.icon]}
                      </span>
                      {!collapsed && (
                        <span
                          className={`text-xs tracking-wide truncate font-medium ${
                            isActive ? "" : "text-white/65 group-hover:text-white/90"
                          }`}
                          style={isActive ? { color: "oklch(0.65 0.22 20)" } : {}}
                        >
                          {item.label}
                        </span>
                      )}
                      {!collapsed && isActive && (
                        <div className="ml-auto w-1 h-1 rounded-full bg-primary" />
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t shrink-0" style={{ borderColor: "oklch(0.55 0.22 20 / 8%)" }}>
        {!collapsed ? (
          <div className="text-[8px] font-display tracking-widest text-center" style={{ color: "oklch(0.75 0.15 175 / 40%)" }}>
            v2.0 LIFEOS
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-primary/40 mx-auto" />
        )}
      </div>
    </motion.aside>
  );
}
