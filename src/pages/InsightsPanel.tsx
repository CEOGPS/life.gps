import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Brain, Zap, TrendingUp, Lightbulb, Target, Eye, BarChart3, Sparkles } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { lifeosApi } from "@/lib/api.ts";

type InsightStatus = "pending" | "accepted" | "dismissed";

type Insight = {
  id: string;
  text: string;
  status: InsightStatus;
};

type CategoryId = "business" | "marketing" | "operations" | "personal";

const INSIGHT_CATEGORIES: {
  id: CategoryId;
  label: string;
  icon: typeof Brain;
  color: string;
  prompt: string;
}[] = [
  {
    id: "business",
    label: "Business Intelligence",
    icon: BarChart3,
    color: "oklch(0.65 0.22 265)",
    prompt: "Give 3 short, concrete business-intelligence observations a small business owner should watch for (revenue, pipeline, churn risk). Be generic best-practice guidance since you don't have their live numbers yet.",
  },
  {
    id: "marketing",
    label: "Marketing Performance",
    icon: TrendingUp,
    color: "oklch(0.75 0.15 175)",
    prompt: "Give 3 short, concrete marketing-performance observations or experiments a small business should try this month (email, social, paid, organic).",
  },
  {
    id: "operations",
    label: "Operational Efficiency",
    icon: Zap,
    color: "oklch(0.7 0.18 70)",
    prompt: "Give 3 short, concrete operational-efficiency suggestions (task completion, meeting load, automation candidates) for a busy founder.",
  },
  {
    id: "personal",
    label: "Personal Growth",
    icon: Lightbulb,
    color: "oklch(0.68 0.2 310)",
    prompt: "Give 3 short, concrete personal-growth suggestions (deep work, sleep, learning) for someone balancing a business and a personal life.",
  },
];

const GENERATOR_PROMPTS = [
  "Analyze revenue patterns & predict next quarter",
  "Find correlation: calendar density vs. output quality",
  "Detect early churn signals in CRM activity",
];

/** Splits an LLM's free-text response into individual insight lines. */
function parseInsightLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[\s*\-\•\d.)]+/, "").trim())
    .filter((l) => l.length > 0);
}

export default function InsightsPanel() {
  const [categoryInsights, setCategoryInsights] = useState<Record<CategoryId, Insight[]>>({
    business: [],
    marketing: [],
    operations: [],
    personal: [],
  });
  const [generatorResults, setGeneratorResults] = useState<Insight[]>([]);
  const [loadingCategory, setLoadingCategory] = useState<CategoryId | null>(null);
  const [loadingGeneratorIndex, setLoadingGeneratorIndex] = useState<number | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);

  const askForInsights = useCallback(async (prompt: string): Promise<string[]> => {
    try {
      const result = await lifeosApi.post("/api/llm/invoke", {
        system:
          "You are the LifeOS Insight Engine. Respond with exactly 3 short lines, one insight per line, no preamble, no numbering beyond a leading dash.",
        model: "auto",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });
      if (typeof result?.text === "string" && result.text.trim()) {
        return parseInsightLines(result.text);
      }
      return ["No AI provider responded - add an API key under Integrations."];
    } catch {
      return ["Couldn't reach the LifeOS worker. Try again in a moment."];
    }
  }, []);

  const generateForCategory = useCallback(
    async (cat: (typeof INSIGHT_CATEGORIES)[number]) => {
      setLoadingCategory(cat.id);
      const lines = await askForInsights(cat.prompt);
      setCategoryInsights((prev) => ({
        ...prev,
        [cat.id]: [
          ...lines.map((text) => ({ id: `${cat.id}-${Date.now()}-${Math.random()}`, text, status: "pending" as InsightStatus })),
          ...prev[cat.id],
        ],
      }));
      setLoadingCategory(null);
    },
    [askForInsights],
  );

  const generateAll = useCallback(async () => {
    setLoadingAll(true);
    await Promise.all(INSIGHT_CATEGORIES.map((cat) => generateForCategory(cat)));
    setLoadingAll(false);
  }, [generateForCategory]);

  const runGeneratorPrompt = useCallback(
    async (prompt: string, index: number) => {
      setLoadingGeneratorIndex(index);
      const lines = await askForInsights(prompt);
      setGeneratorResults((prev) => [
        ...lines.map((text) => ({ id: `gen-${Date.now()}-${Math.random()}`, text, status: "pending" as InsightStatus })),
        ...prev,
      ]);
      setLoadingGeneratorIndex(null);
    },
    [askForInsights],
  );

  const setInsightStatus = (catId: CategoryId, insightId: string, status: InsightStatus) => {
    setCategoryInsights((prev) => ({
      ...prev,
      [catId]: prev[catId].map((i) => (i.id === insightId ? { ...i, status } : i)),
    }));
  };

  const allInsights = [...Object.values(categoryInsights).flat(), ...generatorResults];
  const totalGenerated = allInsights.length;
  const pendingCount = allInsights.filter((i) => i.status === "pending").length;
  const acceptedCount = allInsights.filter((i) => i.status === "accepted").length;
  const dismissedCount = allInsights.filter((i) => i.status === "dismissed").length;

  return (
    <PanelLayout
      title="Insight Engine"
      subtitle="AI-generated patterns across business & life - not yet connected to your live CRM/calendar data"
      icon={<Brain size={18} />}
      actions={
        <button
          onClick={generateAll}
          disabled={loadingAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-crimson text-primary text-xs font-display hover:glow-crimson-sm transition-all disabled:opacity-50"
        >
          <Sparkles size={12} /> {loadingAll ? "GENERATING…" : "GENERATE INSIGHTS"}
        </button>
      }
    >
      <div className="h-full overflow-y-auto space-y-4">
        {/* Quick Stats Row - real counters, not fabricated numbers */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Generated", value: String(totalGenerated), icon: Eye, color: "oklch(0.65 0.22 265)" },
            { label: "Pending Review", value: String(pendingCount), icon: Target, color: "oklch(0.7 0.18 70)" },
            { label: "Accepted", value: String(acceptedCount), icon: Brain, color: "oklch(0.75 0.15 175)" },
            { label: "Dismissed", value: String(dismissedCount), icon: Zap, color: "oklch(0.68 0.2 310)" },
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
          {INSIGHT_CATEGORIES.map((cat, catIndex) => {
            const insights = categoryInsights[cat.id];
            return (
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
                  <span className="ml-auto text-[10px] text-white/30 font-display">{insights.length} insights</span>
                  <button
                    onClick={() => generateForCategory(cat)}
                    disabled={loadingCategory === cat.id}
                    className="text-[10px] text-primary/70 hover:text-primary font-display tracking-wider disabled:opacity-50"
                  >
                    {loadingCategory === cat.id ? "GENERATING…" : "+ GENERATE"}
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  {insights.length === 0 ? (
                    <p className="text-xs text-white/30 italic">No insights yet - click generate above.</p>
                  ) : (
                    insights.map((insight, i) => (
                      <motion.div
                        key={insight.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`glass-crimson/50 rounded-lg p-3 border flex items-start gap-3 hover:border-primary/20 transition-all ${
                          insight.status === "accepted"
                            ? "border-green-400/30"
                            : insight.status === "dismissed"
                              ? "border-white/5 opacity-40"
                              : "border-white/5"
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: cat.color }}>
                          <Target size={10} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/70 leading-relaxed">{insight.text}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => setInsightStatus(cat.id, insight.id, "accepted")}
                              className="text-[10px] text-primary/70 hover:text-primary font-display tracking-wider"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => setInsightStatus(cat.id, insight.id, "dismissed")}
                              className="text-[10px] text-white/30 hover:text-white/50 font-display tracking-wider"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => setInsightStatus(cat.id, insight.id, "pending")}
                              className="text-[10px] text-white/30 hover:text-white/50 font-display tracking-wider"
                            >
                              Defer
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}
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
            {GENERATOR_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => runGeneratorPrompt(prompt, i)}
                disabled={loadingGeneratorIndex === i}
                className="glass-crimson/30 rounded-lg p-3 text-left text-xs text-white/60 hover:text-white/90 hover:border-primary/30 hover:glow-crimson-sm border border-white/5 transition-all text-start disabled:opacity-50"
              >
                {loadingGeneratorIndex === i ? "Generating…" : prompt}
              </button>
            ))}
          </div>
          {generatorResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {generatorResults.map((insight) => (
                <div key={insight.id} className="text-sm text-white/70 glass-crimson/30 rounded-lg p-3 border border-white/5">
                  {insight.text}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </PanelLayout>
  );
}