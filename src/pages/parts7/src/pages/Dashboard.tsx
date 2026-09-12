import { motion } from "motion/react";
import Module from "./dashboard/_components/Module.tsx";
import TimeDateWeather from "./dashboard/_components/TimeDateWeather.tsx";
import NotesModule from "./dashboard/_components/NotesModule.tsx";
import TasksModule from "./dashboard/_components/TasksModule.tsx";
import LeadsModule from "./dashboard/_components/LeadsModule.tsx";
import NotificationsModule from "./dashboard/_components/NotificationsModule.tsx";
import AgentMonitor from "./dashboard/_components/AgentMonitor.tsx";
import YoutubePlayer from "./dashboard/_components/YoutubePlayer.tsx";
import MusicPlayer from "./dashboard/_components/MusicPlayer.tsx";
import FinancialStats from "./dashboard/_components/FinancialStats.tsx";
import RoiAnalysis from "./dashboard/_components/RoiAnalysis.tsx";
import CreditScore from "./dashboard/_components/CreditScore.tsx";
import BudgetExpenses from "./dashboard/_components/BudgetExpenses.tsx";
import AiMoneyTips from "./dashboard/_components/AiMoneyTips.tsx";
import AiInsights from "./dashboard/_components/AiInsights.tsx";
import LifeHacks from "./dashboard/_components/LifeHacks.tsx";
import SocialAnalytics from "./dashboard/_components/SocialAnalytics.tsx";
import MarketingAnalytics from "./dashboard/_components/MarketingAnalytics.tsx";
import CalendarModule from "./dashboard/_components/CalendarModule.tsx";
import BrowserArea from "./dashboard/_components/BrowserArea.tsx";
import QuickLinks from "./dashboard/_components/QuickLinks.tsx";

import {
  Clock, FileText, CheckSquare, UserPlus, Bell, Bot, PlayCircle, Music2,
  DollarSign, BarChart2, Star, Receipt, Sparkles, Brain, Lightbulb,
  Share2, Megaphone, Calendar, Globe, Link2,
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="p-4 min-h-full">
      {/* Welcome strip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-5"
      >
        <div>
          <h1 className="font-display text-base tracking-[0.12em]">
            <span className="text-white/70">WELCOME BACK, </span>
            <span style={{ color: "oklch(0.65 0.22 20)", textShadow: "0 0 14px oklch(0.55 0.22 20 / 80%)" }}>COMMANDER</span>
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.75 0.15 175)" }}>Your systems are standing by.</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 glass-crimson rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green" />
          <span className="text-[10px] font-display tracking-widest" style={{ color: "oklch(0.75 0.22 20)" }}>LIFEOS ONLINE</span>
        </div>
      </motion.div>

      {/* Module grid */}
      <div className="grid gap-4" style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
        gridAutoRows: "minmax(240px, auto)",
      }}>

        {/* Time / Date / Weather */}
        <Module title="Time & Weather" icon={<Clock size={13} />} accent>
          <TimeDateWeather />
        </Module>

        {/* Notifications */}
        <Module
          title="Notifications"
          icon={<Bell size={13} />}
          accent
          headerRight={
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-green" />
              <span className="text-[9px] font-display" style={{ color: "oklch(0.75 0.15 175)" }}>LIVE</span>
            </div>
          }
        >
          <NotificationsModule />
        </Module>

        {/* Quick Links — moved near top */}
        <Module title="Quick Links" icon={<Link2 size={13} />}>
          <QuickLinks />
        </Module>

        {/* Browser — moved near top */}
        <Module title="Browser" icon={<Globe size={13} />} className="col-span-1 row-span-1">
          <BrowserArea />
        </Module>

        {/* Tasks */}
        <Module title="Tasks" icon={<CheckSquare size={13} />}>
          <TasksModule />
        </Module>

        {/* Notes */}
        <Module title="Notes" icon={<FileText size={13} />}>
          <NotesModule />
        </Module>

        {/* AI Agent Monitor */}
        <Module title="AI Task Monitor" icon={<Bot size={13} />} accent>
          <AgentMonitor />
        </Module>

        {/* Leads */}
        <Module title="Leads" icon={<UserPlus size={13} />}>
          <LeadsModule />
        </Module>

        {/* 7-Day Calendar */}
        <Module title="Calendar" icon={<Calendar size={13} />}>
          <CalendarModule />
        </Module>

        {/* YouTube Player */}
        <Module title="YouTube Player" icon={<PlayCircle size={13} />}>
          <YoutubePlayer />
        </Module>

        {/* Music Player */}
        <Module title="Music Player" icon={<Music2 size={13} />} accent>
          <MusicPlayer />
        </Module>

        {/* Financial Stats */}
        <Module title="Financial Stats" icon={<DollarSign size={13} />} accent>
          <FinancialStats />
        </Module>

        {/* ROI Analysis */}
        <Module title="ROI & Volume" icon={<BarChart2 size={13} />}>
          <RoiAnalysis />
        </Module>

        {/* Credit Score */}
        <Module title="Credit Scores" icon={<Star size={13} />} accent>
          <CreditScore />
        </Module>

        {/* Budget / Expenses */}
        <Module title="Budget & Expenses" icon={<Receipt size={13} />}>
          <BudgetExpenses />
        </Module>

        {/* AI Money Tips */}
        <Module title="AI Money Tips" icon={<Sparkles size={13} />} accent>
          <AiMoneyTips />
        </Module>

        {/* AI Insights */}
        <Module title="AI Insights" icon={<Brain size={13} />} accent>
          <AiInsights />
        </Module>

        {/* Life Hacks */}
        <Module title="Life Hacks" icon={<Lightbulb size={13} />}>
          <LifeHacks />
        </Module>

        {/* Social Media Analytics */}
        <Module title="Social Analytics" icon={<Share2 size={13} />}>
          <SocialAnalytics />
        </Module>

        {/* Marketing & Website Analytics */}
        <Module title="Marketing & Web Analytics" icon={<Megaphone size={13} />}>
          <MarketingAnalytics />
        </Module>

      </div>

      {/* Bottom spacer for Erebus dock */}
      <div className="h-24" />
    </div>
  );
}
