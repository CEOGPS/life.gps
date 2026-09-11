import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Heart, Brain, Activity, Moon, Sun, Target, CheckCircle, AlertCircle, HelpCircle, BarChart3, Clock, TrendingUp, TrendingDown, Sparkles, RotateCcw } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";

const PULSE_CATEGORIES = [
  {
    id: "energy",
    label: "Energy & Vitality",
    icon: Activity,
    color: "oklch(0.7 0.18 70)",
    questions: [
      { id: "sleep", label: "Sleep quality (1-10)", type: "scale", target: 8 },
      { id: "exercise", label: "Exercise sessions this week", type: "count", target: 4 },
      { id: "nutrition", label: "Nutrition consistency (1-10)", type: "scale", target: 7 },
      { id: "recovery", label: "Recovery time (hrs/day)", type: "scale", target: 2 },
    ],
  },
  {
    id: "focus",
    label: "Focus & Output",
    icon: Target,
    color: "oklch(0.65 0.22 265)",
    questions: [
      { id: "deepwork", label: "Deep work hours this week", type: "count", target: 15 },
      { id: "distractions", label: "Distraction frequency (1-10, lower=better)", type: "scale", target: 3 },
      { id: "completion", label: "Task completion rate (%)", type: "scale", target: 85 },
      { id: "learning", label: "Learning time (hrs/week)", type: "count", target: 5 },
    ],
  },
  {
    id: "relationships",
    label: "Relationships & Connection",
    icon: Heart,
    color: "oklch(0.68 0.2 310)",
    questions: [
      { id: "family", label: "Quality family time (hrs/week)", type: "count", target: 10 },
      { id: "friends", label: "Friend connections this week", type: "count", target: 3 },
      { id: "network", label: "Professional outreach", type: "count", target: 5 },
      { id: "boundaries", label: "Boundary maintenance (1-10)", type: "scale", target: 8 },
    ],
  },
  {
    id: "purpose",
    label: "Purpose & Alignment",
    icon: Brain,
    color: "oklch(0.75 0.15 175)",
    questions: [
      { id: "values", label: "Decisions aligned with values (1-10)", type: "scale", target: 9 },
      { id: "impact", label: "Perceived impact this week (1-10)", type: "scale", target: 7 },
      { id: "growth", label: "Growth momentum (1-10)", type: "scale", target: 8 },
      { id: "clarity", label: "Strategic clarity (1-10)", type: "scale", target: 8 },
    ],
  },
];

export default function PulsePanel() {
  const [responses, setResponses] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("pulse_responses");
    return saved ? JSON.parse(saved) : {};
  });
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    localStorage.setItem("pulse_responses", JSON.stringify(responses));
    const allAnswered = Object.keys(responses).length >= 16;
    setCompleted(allAnswered);
  }, [responses]);

  const handleResponse = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const getCategoryScore = (catId: string) => {
    const cat = PULSE_CATEGORIES.find(c => c.id === catId);
    if (!cat) return 0;
    let total = 0;
    let count = 0;
    cat.questions.forEach(q => {
      if (responses[q.id] !== undefined) {
        total += responses[q.id];
        count++;
      }
    });
    return count > 0 ? Math.round((total / count) * 10) : 0;
  };

  const overallScore = Math.round(
    PULSE_CATEGORIES.reduce((sum, cat) => sum + getCategoryScore(cat.id), 0) / PULSE_CATEGORIES.length
  );

  return (
    <PanelLayout
      title="Life Audit (Pulse)"
      subtitle="Weekly 60-second audit — Energy, Focus, Relationships, Purpose"
      icon={<Activity size={18} />}
      actions={
        <button 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all"
          onClick={() => {
            localStorage.removeItem("pulse_responses");
            setResponses({});
            setCompleted(false);
          }}
        >
          <RotateCcw size={12} /> RESET AUDIT
        </button>
      }
    >
      <div className="h-full overflow-y-auto space-y-4">
        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-xl border border-white/8 p-6 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-teal/10 opacity-50" />
          <div className="relative z-10">
            <div className="text-[10px] font-display tracking-widest text-white/40 mb-2">OVERALL PULSE SCORE</div>
            <div className="text-5xl font-display font-bold text-white/90 mb-1" style={{ 
              color: overallScore >= 80 ? "oklch(0.7 0.18 70)" : 
                     overallScore >= 60 ? "oklch(0.75 0.15 175)" : 
                     overallScore >= 40 ? "oklch(0.7 0.18 70)" : "oklch(0.65 0.22 15)" 
            }}>
              {overallScore}/100
            </div>
            <div className="text-sm text-white/40">
              {completed ? "Audit complete — review insights below" : `${Object.keys(responses).length}/16 questions answered`}
            </div>
          </div>
        </motion.div>

        {/* Category Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PULSE_CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4 border border-white/8"
            >
              <div className="flex items-center gap-2 mb-2">
                <cat.icon size={14} style={{ color: cat.color }} />
                <span className="text-[10px] font-display tracking-widest text-white/40">
                  {cat.label}
                </span>
              </div>
              <div className="text-2xl font-display font-bold text-white/90" style={{ color: cat.color }}>
                {getCategoryScore(cat.id)}/100
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getCategoryScore(cat.id)}%` }}
                  transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {PULSE_CATEGORIES.map((cat, catIndex) => (
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
              </div>
              <div className="p-4 space-y-4">
                {cat.questions.map((q, qIndex) => (
                  <div key={q.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">{q.label}</span>
                      <span className="text-[10px] text-white/30 font-display">Target: {q.target}{q.type === 'count' ? '' : '/10'}</span>
                    </div>
                    {q.type === "scale" ? (
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {[1,2,3,4,5,6,7,8,9,10].map((v) => (
                          <button
                            key={v}
                            onClick={() => handleResponse(q.id, v)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display transition-all flex-shrink-0 ${
                              responses[q.id] === v
                                ? "text-white font-bold"
                                : "text-white/30 hover:text-white/60"
                            } ${responses[q.id] === v ? `glow-sm` : ""}`}
                            style={{ 
                              backgroundColor: responses[q.id] === v ? cat.color : "rgba(255,255,255,0.05)",
                              borderColor: responses[q.id] === v ? cat.color : "transparent"
                            }}
                          >
                            {v === 10 ? "10" : v}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={responses[q.id] || ""}
                          onChange={(e) => handleResponse(q.id, parseInt(e.target.value) || 0)}
                          className="w-20 h-8 px-2 text-xs bg-white/4 border border-white/8 rounded-lg text-white/80 placeholder:text-white/30 focus:outline-none focus:border-primary/40"
                        />
                        <span className="text-[10px] text-white/30">sessions</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Insights */}
        {completed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl border border-primary/20 p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-primary" />
              <span className="font-display text-sm text-white/80 tracking-wider">Weekly Insights</span>
            </div>
            <div className="space-y-2 text-sm text-white/60">
              {overallScore >= 80 && <p>🟢 Excellent week — maintain momentum, consider raising targets</p>}
              {overallScore >= 60 && overallScore < 80 && <p>🟡 Solid week — identify 1-2 areas for incremental improvement</p>}
              {overallScore < 60 && <p>🔴 Recovery needed — focus on fundamentals: sleep, movement, boundaries</p>}
              {getCategoryScore("energy") < 50 && <p>⚡ Energy deficit detected — prioritize sleep & recovery this week</p>}
              {getCategoryScore("focus") < 50 && <p>🎯 Focus fragmentation — batch tasks, reduce context switching</p>}
              {getCategoryScore("relationships") < 50 && <p>💙 Connection gap — schedule 2 meaningful interactions this week</p>}
              {getCategoryScore("purpose") < 50 && <p>🧭 Alignment drift — review values & quarterly goals</p>}
            </div>
          </motion.div>
        )}
      </div>
    </PanelLayout>
  );
}