import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import NotFound from "./pages/NotFound.tsx";
import AppLayout from "./components/layout/AppLayout.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import PlaceholderPanel from "./components/layout/PlaceholderPanel.tsx";
import MusicPanel from "./pages/music/page.tsx";
import ContactsPanel from "./pages/contacts/page.tsx";
import CrmPanel from "./pages/crm/page.tsx";
import EmailPanel from "./pages/email/page.tsx";
import CommunicationsPanel from "./pages/communications/page.tsx";
import FinancePanel from "./pages/finance/page.tsx";
import CreatorPanel from "./pages/creator/page.tsx";
import AgentsPanel from "./pages/agents/page.tsx";
import CommunityPanel from "./pages/community/page.tsx";
import SocialPanel from "./pages/social/page.tsx";
import MarketingPanel from "./pages/marketing/page.tsx";
import CalendarPanel from "./pages/calendar/page.tsx";
import FamilyPanel from "./pages/family/page.tsx";
import HealthPanel from "./pages/health/page.tsx";
import JournalPanel from "./pages/journal/page.tsx";
import IntegrationsPanel from "./pages/integrations/page.tsx";
import SimulatorsPanel from "./pages/simulators/page.tsx";
import MediaPanel from "./pages/media/page.tsx";
import TerminalsPanel from "./pages/terminals/page.tsx";
import ProjectsPanel from "./pages/projects/page.tsx";
import OfficePanel from "./pages/office/page.tsx";
import MapsPanel from "./pages/maps/page.tsx";
import BusinessCommandPanel from "./pages/business/page.tsx";
import OmniSearchPanel from "./pages/omnisearch/page.tsx";
import LegalPanel from "./pages/legal/page.tsx";
import VaultPanel from "./pages/vault/page.tsx";
import { PlayerProvider } from "./pages/veriton/lib/PlayerContext.jsx";
import VeritonDashboard from "./pages/veriton/VeritonDashboard.jsx";
import VeritonLibrary from "./pages/veriton/Library.jsx";
import VeritonPlaylists from "./pages/veriton/Playlists.jsx";
import VeritonCreate from "./pages/veriton/Create.jsx";
import VeritonTrackDetail from "./pages/veriton/TrackDetail.jsx";
import VeritonVideoStudio from "./pages/veriton/VideoStudio.jsx";

function VeritonPanel() {
  return (
    <PlayerProvider>
      <Routes>
        <Route index element={<VeritonDashboard />} />
        <Route path="library" element={<VeritonLibrary />} />
        <Route path="playlists" element={<VeritonPlaylists />} />
        <Route path="create" element={<VeritonCreate />} />
        <Route path="track/:id" element={<VeritonTrackDetail />} />
        <Route path="video-studio" element={<VeritonVideoStudio />} />
      </Routes>
    </PlayerProvider>
  );
}

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/music" element={<MusicPanel />} />
            <Route path="/contacts" element={<ContactsPanel />} />
            <Route path="/crm" element={<CrmPanel />} />
            <Route path="/email" element={<EmailPanel />} />
            <Route path="/communications" element={<CommunicationsPanel />} />
            <Route path="/finance" element={<FinancePanel />} />
            <Route path="/creator" element={<CreatorPanel />} />
            <Route path="/community" element={<CommunityPanel />} />
            <Route path="/social" element={<SocialPanel />} />
            <Route path="/marketing" element={<MarketingPanel />} />
            {/* Events moved into the Calendar panel */}
            <Route path="/events" element={<CalendarPanel />} />
            <Route path="/agents" element={<AgentsPanel />} />
            {/* Opportunity Engine folded into Community */}
            <Route path="/opportunity" element={<CommunityPanel />} />
            {/* AI Academy removed */}
            <Route
              path="/insights"
              element={
                <PlaceholderPanel
                  name="Insight Engine"
                  description="AI correlates data across all domains to reveal non-obvious insights and life hacks."
                />
              }
            />
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
            <Route path="/veriton/*" element={<VeritonPanel />} />
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
      </BrowserRouter>
    </DefaultProviders>
  );
}
