import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import { LifeOSDataProvider } from "./lib/LifeOSDataContext.tsx";
import { AudioProvider } from "./lib/AudioProvider.tsx";
import NotFound from "./pages/NotFound.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import PlaceholderPanel from "./components/layout/PlaceholderPanel.tsx";
import ProtectedRoute from "./pages/auth/ProtectedRoute.tsx";
import Login from "./app/routes/login.tsx";
import Logout from "./app/routes/logout.tsx";
import AuthCallback from "./app/routes/auth.oauth.tsx";

// ─── PANELS (flat structure) — lazy-loaded, only fetched when visited ───
const DashboardPanel = lazy(() => import("./pages/dashboard_DashboardPanel.jsx"));
const MusicPanel = lazy(() => import("./pages/MusicPanel.tsx"));
const ContactsPanel = lazy(() => import("./pages/ContactsPanel.tsx"));
const CRMPanel = lazy(() => import("./pages/CRMPanel.tsx"));
const EmailPanel = lazy(() => import("./pages/email_EmailPanel.jsx"));
const CommunicationsPanel = lazy(() => import("./pages/communications/MessagesPanel.jsx"));
const FinancePanel = lazy(() => import("./pages/finance_FinancePanel.jsx"));
const AgentsPanel = lazy(() => import("./pages/agents/AgentsPanel.jsx"));
const CommunityPanel = lazy(() => import("./pages/community/CommunityPanel.jsx"));
const SocialPanel = lazy(() => import("./pages/SocialPanel.tsx"));
const SocialLinkOS1 = lazy(() => import("./pages/social_SocialLinkOS1.jsx"));
const MarketingPanel = lazy(() => import("./pages/marketing_MarketingPanel.jsx"));
const CalendarPanel = lazy(() => import("./pages/calendar_CalendarPanel.jsx"));
const FamilyPanel = lazy(() => import("./pages/family/FamilyPanel.jsx"));
const HealthPanel = lazy(() => import("./pages/health/HealthPanel.jsx"));
const JournalPanel = lazy(() => import("./pages/journal/JournalPanel.jsx"));
const IntegrationsPanel = lazy(() => import("./pages/integrations/IntegrationsPanel.jsx"));
const SimulatorsPanel = lazy(() => import("./pages/simulators.tsx"));
const MediaPanel = lazy(() => import("./pages/MediaPanel.tsx"));
const TerminalsPanel = lazy(() => import("./pages/TerminalsPanel.tsx"));
const ProjectsPanel = lazy(() => import("./pages/projects_ProjectsPanel.jsx"));
const OfficePanel = lazy(() => import("./pages/office/KPIPanelUI.jsx"));
const MapsPanel = lazy(() => import("./pages/MapsPanel.tsx"));
const BusinessCommandPanel = lazy(() => import("./pages/business.tsx"));
const OmniSearchPanel = lazy(() => import("./pages/omnisearch.tsx"));
const LegalPanel = lazy(() => import("./pages/LegalPanel.tsx"));
const VaultPanel = lazy(() => import("./pages/VaultPanel.tsx"));
const InsightsPanel = lazy(() => import("./pages/InsightsPanel.tsx"));
const PulsePanel = lazy(() => import("./pages/PulsePanel.tsx"));
const EntertainmentHub = lazy(() => import("./pages/entertainment_EntertainmentHub.tsx"));

// ─── SUB-APPS (embedded with their own routing) — lazy-loaded, largest chunks ───
const CreatorApp = lazy(() => import("./pages/creator/src/App.jsx"));
const VeritonApp = lazy(() => import("./pages/veriton/src/App.jsx"));
const LucidSystemsApp = lazy(() => import("./pages/lucidsystems/src/App.jsx"));

// ─── SIMULATORS HUB ───
const SimulatorsHub = lazy(() => import("./pages/parts3/SimulatorsHub.tsx"));

function RouteLoadingFallback() {
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="text-xs text-white/30 font-display tracking-widest">
        LOADING...
      </div>
    </div>
  );
}

function DashboardRoute() {
  const navigate = useNavigate();
  return <DashboardPanel setActive={(id) => navigate("/" + id)} />;
}

export default function App() {
  return (
    <DefaultProviders>
      <LifeOSDataProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AudioProvider>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/logout" element={<Logout />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/" element={<DashboardRoute />} />
                      <Route path="/music" element={<MusicPanel />} />
                      <Route path="/contacts" element={<ContactsPanel />} />
                      <Route path="/crm" element={<CRMPanel />} />
                      <Route path="/email" element={<EmailPanel />} />
                      <Route path="/communications" element={<CommunicationsPanel />} />
                      <Route path="/finance" element={<FinancePanel />} />
                      <Route path="/community" element={<CommunityPanel />} />
                      <Route path="/creator/*" element={<CreatorApp />} />
                      <Route path="/social" element={<SocialPanel />} />
                      <Route path="/sociallink" element={<SocialLinkOS1 />} />
                      <Route path="/marketing" element={<MarketingPanel />} />
                      {/* Events moved into the Calendar panel */}
                      <Route path="/events" element={<CalendarPanel />} />
                      <Route path="/agents" element={<AgentsPanel />} />
                      {/* Opportunity Engine folded into Community */}
                      <Route path="/opportunity" element={<CommunityPanel />} />
                      {/* AI Academy removed */}
                      <Route path="/omnisearch" element={<OmniSearchPanel />} />
                      <Route path="/ceogps" element={<BusinessCommandPanel />} />
                      <Route path="/business" element={<BusinessCommandPanel />} />
                      <Route path="/projects" element={<ProjectsPanel />} />
                      <Route path="/calendar" element={<CalendarPanel />} />
                      <Route path="/office" element={<OfficePanel />} />
                      <Route path="/maps" element={<MapsPanel />} />
                      <Route path="/family" element={<FamilyPanel />} />
                      <Route path="/health" element={<HealthPanel />} />
                      <Route path="/journal" element={<JournalPanel />} />
                      {/* Life RPG folded into Simulators hub */}
                      <Route path="/liferpg" element={<SimulatorsHub />} />
                      <Route path="/pulse" element={<PulsePanel />} />
                      <Route path="/insights" element={<InsightsPanel />} />
                      <Route path="/media" element={<MediaPanel />} />
                      <Route path="/vault" element={<VaultPanel />} />
                      <Route path="/privacy" element={<LegalPanel />} />
                      <Route path="/legal" element={<LegalPanel />} />
                      <Route path="/terminals" element={<TerminalsPanel />} />
                      <Route path="/simulators" element={<SimulatorsHub />} />
                      <Route path="/entertainment" element={<EntertainmentHub />} />
                      <Route path="/integrations" element={<IntegrationsPanel />} />
                      {/* Conflict Resolver + Karma Credit folded into Simulators hub */}
                      <Route path="/conflict" element={<SimulatorsHub />} />
                      <Route path="/karma" element={<SimulatorsHub />} />

                      {/* SUB-APPS with nested routing */}
                      <Route path="/veriton/*" element={<VeritonApp />} />
                      <Route path="/lucidsystems/*" element={<LucidSystemsApp />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </AudioProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </LifeOSDataProvider>
    </DefaultProviders>
  );
}