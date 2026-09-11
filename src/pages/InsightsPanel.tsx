import { motion } from "motion/react";
import { Brain, Zap, TrendingUp, Lightbulb, Target, Eye, BarChart3, Sparkles } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const INSIGHT_CATEGORIES = [
  {
    id: "business",
    label: "Business Intelligence",
    icon: BarChart3,
    color: "oklch(0.65 0.22 265)",
    insights: [
      "Revenue up 23% QoQ — driven by enterprise renewals",
      "Churn risk: 3 accounts flagged by usage drop-off",
      "Pipeline velocity increased 1.4x after new outreach cadence",
    ],
  },
  {
    id: "marketing",
    label: "Marketing Performance",
    icon: TrendingUp,
    color: "oklch(0.75 0.15 175)",
    insights: [
      "Email open rate 34% — subject line A/B test winner: 'Quick question'",
      "LinkedIn engagement 3.2x baseline — video content outperforms",
      "CAC down 18% — organic referral loop accelerating",
    ],
  },
  {
    id: "operations",
    label: "Operational Efficiency",
    icon: Zap,
    color: "oklch(0.7 0.18 70)",
    insights: [
      "Avg task completion time: 2.3 days (target: <2)",
      "Meeting load: 14hrs/week — consider async updates for status",
      "Automation candidates: 12 repetitive workflows identified",
    ],
  },
  {
    id: "personal",
    label: "Personal Growth",
    icon: Lightbulb,
    color: "oklch(0.68 0.2 310)",
    insights: [
      "Deep work blocks: 11hrs this week (goal: 15)",
      "Sleep consistency: 89% — best month this year",
      "Learning velocity: 3 books + 2 courses completed",
    ],
  },
];

export default function InsightsPanel() {
  return (
    <PanelLayout
      title="Insight Engine"
      subtitle="AI-powered pattern detection across business & life"
      icon={<Brain size={18} />}
      actions={
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all">
          <Sparkles size={12} /> GENERATE INSIGHTS
        </button>
      }
    >
      <div className="h-full overflow-y-auto space-y-4">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Patterns Detected", value: "47", icon: Eye, color: "oklch(0.65 0.22 265)" },
            { label: "Action Items", value: "12", icon: Target, color: "oklch(0.7 0.18 70)" },
            { label: "Confidence Avg", value: "87%", icon: Brain, color: "oklch(0.75 0.15 175)" },
            { label: "Auto-Applied", value: "8", icon: Zap, color: "oklch(0.68 0.2 310)" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 border border-white/8"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon size={14} style={{ color: stat.color }} />
                <span className="text-[10px] font-display tracking-widest text-white/40">
                  {stat.label}
                </span>
              </div>
              <div className="text-2xl font-display font-bold text-white/90" style={{ color: stat.color }}>
                {stat.value}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Insight Categories */}
        <div className="space-y-4">
          {INSIGHT_CATEGORIES.map((cat, catIndex) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + catIndex * 0.05 }}
              className="glass rounded-xl border border-white/8 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color }}>
                  <cat.icon size={14} className="text-white" />
                </div>
                <h3 className="font-display text-sm text-white/80 tracking-wider" style={{ color: cat.color }}>
                  {cat.label}
                </h3>
                <span className="ml-auto text-[10px] text-white/30 font-display">{cat.insights.length} insights</span>
              </div>
              <div className="p-4 space-y-3">
                {cat.insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + catIndex * 0.05 + i * 0.03 }}
                    className="glass-crimson/50 rounded-lg p-3 border border-white/5 flex items-start gap-3 hover:border-primary/20 transition-all"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: cat.color }}>
                      <Target size={10} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/70 leading-relaxed">{insight}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button className="text-[10px] text-primary/70 hover:text-primary font-display tracking-wider">Accept</button>
                        <button className="text-[10px] text-white/30 hover:text-white/50 font-display tracking-wider">Dismiss</button>
                        <button className="text-[10px] text-white/30 hover:text-white/50 font-display tracking-wider">Defer</button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Insight Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl border border-white/8 p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} className="text-primary" />
            <span className="font-display text-sm text-white/80 tracking-wider">AI Insight Generator</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              "Analyze revenue patterns & predict next quarter",
              "Find correlation: calendar density vs. output quality",
              "Detect early churn signals in CRM activity",
            ].map((prompt, i) => (
              <button
                key={i}
                className="glass-crimson/30 rounded-lg p-3 text-left text-xs text-white/60 hover:text-white/90 hover:border-primary/30 hover:glow-crimson-sm border border-white/5 transition-all text-start"
              >
                {prompt}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </PanelLayout>
  );
}