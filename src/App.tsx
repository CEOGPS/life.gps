import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import { LifeOSDataProvider } from "./lib/LifeOSDataContext.tsx";
import { AudioProvider } from "./lib/AudioProvider.tsx";
import NotFound from "./pages/NotFound.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import PlaceholderPanel from "./components/layout/PlaceholderPanel.tsx";
import ProtectedRoute from "./pages/auth/ProtectedRoute.tsx";
import Login from "./pages/auth/Login.tsx";
import Logout from "./pages/auth/Logout.tsx";
import AuthCallback from "./pages/auth/AuthCallback.tsx";

// ─── PANELS (flat structure) ───
import MusicPanel from "./pages/MusicPanel.tsx";
import CreatorPanel from "./pages/creator/page.tsx";
import ContactsPanel from "./pages/ContactsPanel.tsx";
import CRMPanel from "./pages/CRMPanel.tsx";
import EmailPanel from "./pages/email_EmailPanel.jsx";
import CommunicationsPanel from "./pages/communications_MessagesPanel.jsx";
import FinancePanel from "./pages/finance_FinancePanel.jsx";
import AgentsPanel from "./pages/agents_AgentsPanel.jsx";
import CommunityPanel from "./pages/community_CommunityPanel.jsx";
import SocialPanel from "./pages/SocialPanel.tsx";
import SocialLinkOS1 from "./pages/social_SocialLinkOS1.jsx";
import MarketingPanel from "./pages/marketing_MarketingPanel.jsx";
import CalendarPanel from "./pages/calendar_CalendarPanel.jsx";
import FamilyPanel from "./pages/family_FamilyPanel.jsx";
import HealthPanel from "./pages/health_HealthPanel.jsx";
import JournalPanel from "./pages/journal_JournalPanel.jsx";
import IntegrationsPanel from "./pages/integrations/IntegrationsPanel.jsx";
import SimulatorsPanel from "./pages/simulators.tsx";
import MediaPanel from "./pages/MediaPanel.tsx";
import TerminalsPanel from "./pages/TerminalsPanel.tsx";
import ProjectsPanel from "./pages/projects_ProjectsPanel.jsx";
import OfficePanel from "./pages/office_KPIPanelUI.jsx";
import MapsPanel from "./pages/MapsPanel.tsx";
import BusinessCommandPanel from "./pages/business.tsx";
import OmniSearchPanel from "./pages/omnisearch.tsx";
import LegalPanel from "./pages/LegalPanel.tsx";
import VaultPanel from "./pages/VaultPanel.tsx";
import InsightsPanel from "./pages/InsightsPanel.tsx";
import PulsePanel from "./pages/PulsePanel.tsx";

// ─── SUB-APPS (embedded with their own routing) ───
import VeritonApp from "./pages/veriton/src/App.jsx";
import LucidSystemsApp from "./pages/lucidsystems/src/App.jsx";

// ─── SIMULATORS HUB ───
import SimulatorsHub from "./pages/parts3/SimulatorsHub.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <LifeOSDataProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AudioProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/logout" element={<Logout />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route element={<ProtectedRoute />}>
                                  <Route element={<AppLayout />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/music" element={<MusicPanel />} />
                    <Route path="/contacts" element={<ContactsPanel />} />
                    <Route path="/crm" element={<CRMPanel />} />
                    <Route path="/email" element={<EmailPanel />} />
                    <Route path="/communications" element={<CommunicationsPanel />} />
                    <Route path="/finance" element={<FinancePanel />} />
                    <Route path="/community" element={<CommunityPanel />} />
                    <Route path="/creator" element={<CreatorPanel />} />
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
            </AudioProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </LifeOSDataProvider>
    </DefaultProviders>
  );
}