import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";
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
import MediaPanel from "./pages/media/page.tsx";
import TerminalsPanel from "./pages/terminals/page.tsx";
import ProjectsPanel from "./pages/projects/page.tsx";
import OfficePanel from "./pages/office/page.tsx";
import MapsPanel from "./pages/maps/page.tsx";
import BusinessCommandPanel from "./pages/business/page.tsx";
import OmniSearchPanel from "./pages/omnisearch/page.tsx";
import LegalVaultPanel from "./pages/legal/page.tsx";
import EventsPanel from "./pages/events/page.tsx";
import OpportunityPanel from "./pages/opportunity/page.tsx";
import AcademyPanel from "./pages/academy/page.tsx";
import ConflictPanel from "./pages/conflict/page.tsx";

export default function App() {
  return (
    <DefaultProviders>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
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
            <Route path="/events" element={<EventsPanel />} />
            <Route path="/agents" element={<AgentsPanel />} />
            <Route path="/opportunity" element={<OpportunityPanel />} />
            <Route path="/academy" element={<AcademyPanel />} />
            <Route path="/insights" element={<PlaceholderPanel name="Insight Engine" description="AI correlates data across all domains to reveal non-obvious insights and life hacks." />} />
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
            <Route path="/liferpg" element={<PlaceholderPanel name="Life RPG Mode" description="Your week as an interactive game with quests, XP, and branching choices." />} />
            <Route path="/pulse" element={<PlaceholderPanel name="Life Audit (Pulse)" description="Weekly 60-second audit correlating calendar, revenue, family time, and spending." />} />
            <Route path="/media" element={<MediaPanel />} />
            <Route path="/vault" element={<LegalVaultPanel />} />
            <Route path="/privacy" element={<LegalVaultPanel />} />
            <Route path="/legal" element={<LegalVaultPanel />} />
            <Route path="/terminals" element={<TerminalsPanel />} />
            <Route path="/simulators" element={<PlaceholderPanel name="Simulators" description="Conflict Resolver, Parallel Life Conductor, EchoPersona Weaver, Shadow Budget Oracle." />} />
            <Route path="/integrations" element={<IntegrationsPanel />} />
            <Route path="/conflict" element={<ConflictPanel />} />
            <Route path="/karma" element={<PlaceholderPanel name="Karma Credit System" description="Private ledger tracking positive actions, converting karma into micro-rewards." />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </DefaultProviders>
  );
}
