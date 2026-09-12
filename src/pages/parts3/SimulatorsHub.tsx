import { useState, lazy, Suspense } from "react";
import { GitBranch, Swords, Star, Gamepad2, UserRound, Sparkles, Loader2 } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.tsx";
import { usePersistentState } from "@/lib/usePersistentState.ts";

// Lazy load heavy simulators
const DreamForgeSimulator = lazy(() => import("../simulators/DreamForgeSimulator.jsx"));
const AlternateLifeExplorer = lazy(() => import("../simulators/AlternateLifeExplorer.jsx"));
const DarkCardGame = lazy(() => import("../simulators/DarkCardGame.jsx"));
const EchoPersonaWeaver = lazy(() => import("../simulators/EchoPersonaWeaver.jsx"));
const FantasyFriendSimulator = lazy(() => import("../simulators/FantasyFriendSimulator.jsx"));
const GameStateOptimizer = lazy(() => import("../simulators/GameStateOptimizer.jsx"));
const MoodToMonetization = lazy(() => import("../simulators/MoodToMonetization.jsx"));
const NarrativeConflictEngine = lazy(() => import("../simulators/NarrativeConflictEngine.jsx"));
const ShadowBudgetOracle = lazy(() => import("../simulators/ShadowBudgetOracle.jsx"));
const KarokeDuetGenerator = lazy(() => import("../simulators/KaraokeDuetGenerator.jsx"));

type SimulatorTab = 
  | "dreamforge" 
  | "alternate" 
  | "darkcard" 
  | "echo" 
  | "fantasy" 
  | "gamestate" 
  | "marketing" 
  | "mood" 
  | "narrative" 
  | "shadowbudget" 
  | "karaoke";

const SIMULATORS: { id: SimulatorTab; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "dreamforge", label: "DreamForge", icon: <Sparkles size={13} />, description: "Turn life visions into 6–12 month grounded simulations with revenue projections" },
  { id: "alternate", label: "Alternate Life", icon: <UserRound size={13} />, description: "Explore parallel life paths based on your current data" },
  { id: "darkcard", label: "Dark Card Game", icon: <Swords size={13} />, description: "Strategic decision-making through tarot-style card draws" },
  { id: "echo", label: "Echo Persona", icon: <Sparkles size={13} />, description: "Weave AI personas that echo your patterns" },
  { id: "fantasy", label: "Fantasy Friend", icon: <Gamepad2 size={13} />, description: "Co-create interactive fiction with AI companions" },
  { id: "gamestate", label: "Game State", icon: <Gamepad2 size={13} />, description: "Optimize your life as a strategy game" },
  { id: "marketing", label: "Marketing OS", icon: <Sparkles size={13} />, description: "Full marketing dashboard with listings, SEO, campaigns" },
  { id: "mood", label: "Mood → Monetize", icon: <Star size={13} />, description: "Turn emotional states into revenue opportunities" },
  { id: "narrative", label: "Narrative Engine", icon: <Sparkles size={13} />, description: "Generate conflict-driven story simulations" },
  { id: "shadowbudget", label: "Shadow Budget", icon: <Swords size={13} />, description: "Oracle for hidden financial patterns" },
  { id: "karaoke", label: "Karaoke Duet", icon: <Star size={13} />, description: "AI duet generator for creative breaks" },
];

function SimulatorLoader({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    }>
      {children}
    </Suspense>
  );
}

function RenderSimulator({ tab, setTab }: { tab: SimulatorTab; setTab: React.Dispatch<React.SetStateAction<SimulatorTab>> }) {
  const goBack = () => setTab("dreamforge");
  switch (tab) {
    case "dreamforge": return <SimulatorLoader><DreamForgeSimulator onBack={goBack} /></SimulatorLoader>;
    case "alternate": return <SimulatorLoader><AlternateLifeExplorer onBack={goBack} /></SimulatorLoader>;
    case "darkcard": return <SimulatorLoader><DarkCardGame onBack={goBack} /></SimulatorLoader>;
    case "echo": return <SimulatorLoader><EchoPersonaWeaver onBack={goBack} /></SimulatorLoader>;
    case "fantasy": return <SimulatorLoader><FantasyFriendSimulator onBack={goBack} /></SimulatorLoader>;
    case "gamestate": return <SimulatorLoader><GameStateOptimizer onBack={goBack} /></SimulatorLoader>;
    case "marketing": return <div className="flex items-center justify-center h-full text-white/40">Marketing Panel (coming soon)</div>;
    case "mood": return <SimulatorLoader><MoodToMonetization onBack={goBack} /></SimulatorLoader>;
    case "narrative": return <SimulatorLoader><NarrativeConflictEngine onBack={goBack} /></SimulatorLoader>;
    case "shadowbudget": return <SimulatorLoader><ShadowBudgetOracle onBack={goBack} /></SimulatorLoader>;
    case "karaoke": return <SimulatorLoader><KarokeDuetGenerator onBack={goBack} /></SimulatorLoader>;
    default: return <div className="flex items-center justify-center h-full text-white/40">Select a simulator</div>;
  }
}

export default function SimulatorsHub() {
  const [tab, setTab] = useState<SimulatorTab>("dreamforge");

  return (
    <PanelLayout
      title="Simulators Hub"
      subtitle="Playgrounds that rehearse decisions, actions, and parallel lives"
      icon={<GitBranch size={18} />}
    >
      <div className="h-full flex flex-col gap-4">
        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto shrink-0 pb-2">
          {SIMULATORS.map((s) => (
            <button
              key={s.id}
              onClick={() => setTab(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-display tracking-wider whitespace-nowrap transition-colors
                ${tab === s.id ? "glass-crimson text-primary" : "glass text-white/35 hover:text-white/70"}`}
              title={s.description}
            >
              {s.icon} {s.label.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0">
          <RenderSimulator tab={tab} setTab={setTab} />
        </div>
      </div>
    </PanelLayout>
  );
}