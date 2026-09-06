import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import { LifeOSDataProvider } from "./lib/LifeOSDataContext.tsx";
import { AudioProvider } from "./lib/AudioProvider.tsx";
import NotFound from "./pages/NotFound.tsx";
import ErrorBoundary from "./components/ErrorBoundary.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import PlaceholderPanel from "./components/layout/PlaceholderPanel.tsx";

// ─── PANELS (flat structure) ───
import MusicPanel from "./pages/music_MusicHub.jsx";
import CreatorPanel from "./pages/creator/page.tsx";
import ContactsPanel from "./pages/contacts_ContactsPanel.jsx";
import CrmPanel from "./pages/crm_CRMPanel.jsx";
import EmailPanel from "./pages/email_EmailPanel.jsx";
import CommunicationsPanel from "./pages/communications_MessagesPanel.jsx";
import FinancePanel from "./pages/finance_FinancePanel.jsx";
import AgentsPanel from "./pages/agents_AgentsPanel.jsx";
import CommunityPanel from "./pages/community_CommunityPanel.jsx";
import SocialPanel from "./pages/social_SocialPanel.jsx";
import SocialLinkOS1 from "./pages/social_SocialLinkOS1.jsx";
import MarketingPanel from "./pages/marketing_MarketingPanel.jsx";
import CalendarPanel from "./pages/calendar_CalendarPanel.jsx";
import FamilyPanel from "./pages/family_FamilyPanel.jsx";
import HealthPanel from "./pages/health_HealthPanel.jsx";
import JournalPanel from "./pages/journal_JournalPanel.jsx";
import IntegrationsPanel from "./pages/integrations_IntegrationsPanel.jsx";
import SimulatorsPanel from "./pages/simulators.tsx";
import MediaPanel from "./pages/media_MediaPanel.jsx";
import TerminalsPanel from "./pages/terminals_TerminalPanel.jsx";
import ProjectsPanel from "./pages/projects_ProjectsPanel.jsx";
import OfficePanel from "./pages/office_KPIPanelUI.jsx";
import MapsPanel from "./pages/maps_MapsPage.jsx";
import BusinessCommandPanel from "./pages/business.tsx";
import OmniSearchPanel from "./pages/omnisearch.tsx";
import LegalPanel from "./pages/legal_LegalPage.jsx";
import VaultPanel from "./pages/vault.tsx";


export default function App() {
  return (
    <DefaultProviders>
      <LifeOSDataProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AudioProvider>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/music" element={<MusicPanel />} />
                  <Route path="/contacts" element={<ContactsPanel />} />
                  <Route path="/crm" element={<CrmPanel />} />
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
                  <Route path="/liferpg" element={<SimulatorsPanel />} />
                  <Route
                    path="/pulse"
                    element={
                      <PlaceholderPanel
                        name="Life Audit (Pulse)"
                        description="Weekly 60-second audit correlating calendar, revenue, family time, and spending."
                      />
                    }
                  />
                  <Route path="/media" element={<MediaPanel />} />
                  <Route path="/vault" element={<VaultPanel />} />
                  <Route path="/privacy" element={<LegalPanel />} />
                  <Route path="/legal" element={<LegalPanel />} />
                  <Route path="/terminals" element={<TerminalsPanel />} />
                  <Route path="/simulators" element={<SimulatorsPanel />} />
                  <Route path="/integrations" element={<IntegrationsPanel />} />
                  {/* Conflict Resolver + Karma Credit folded into Simulators hub */}
                  <Route path="/conflict" element={<SimulatorsPanel />} />
                  <Route path="/karma" element={<SimulatorsPanel />} />
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