import { useState, useMemo } from "react";
import { Plug, Search, Key, RefreshCw, Circle, CheckCircle2 } from "lucide-react";
import PanelLayout from "@/components/layout/PanelLayout.jsx";

const TEAL_LABEL = "oklch(0.75 0.15 175)";

// Demo: track which integrations are "connected"
const CONNECTED_DEFAULTS = new Set(["OpenAI", "GitHub", "Google Analytics", "Stripe", "Gmail (OAuth)"]);

export default function IntegrationsPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [connected, setConnected] = useState(CONNECTED_DEFAULTS);

  const INTEGRATIONS = [
    // LLMs
    { name: "OpenAI", category: "LLMs", icon: "🤖", desc: "GPT-4o, o1, and DALL·E via the OpenAI API." },
    { name: "Anthropic", category: "LLMs", icon: "🧠", desc: "Claude 3.5 Sonnet and Haiku models." },
    { name: "Google AI (Gemini)", category: "LLMs", icon: "✨", desc: "Gemini 1.5 Pro and Flash via Google AI Studio." },
    { name: "Hugging Face", category: "LLMs", icon: "🤗", desc: "Access thousands of open-source models." },
    { name: "Ollama (local)", category: "LLMs", icon: "🦙", desc: "Run LLMs locally on your own machine." },
    { name: "Groq", category: "LLMs", icon: "⚡", desc: "Ultra-fast inference with LPU hardware." },
    { name: "OpenRouter", category: "LLMs", icon: "🔀", desc: "Unified API gateway to 100+ models." },
    { name: "Grok (xAI)", category: "LLMs", icon: "𝕏", desc: "Grok-2 from xAI with real-time web access." },
    { name: "DeepSeek", category: "LLMs", icon: "🔍", desc: "DeepSeek-V3 and R1 reasoning models." },
    { name: "Mistral", category: "LLMs", icon: "🌬️", desc: "Mistral Large 2 and Mixtral series models." },
    { name: "Cohere", category: "LLMs", icon: "🌀", desc: "Command R+ for RAG and enterprise tasks." },
    { name: "Meta LLaMA", category: "LLMs", icon: "🦾", desc: "Llama 3.3 70B and 405B open models." },
    { name: "Gemma", category: "LLMs", icon: "💎", desc: "Google's lightweight open Gemma models." },
    { name: "Qwen", category: "LLMs", icon: "🐉", desc: "Alibaba's Qwen 2.5 multilingual models." },
    { name: "Hermes", category: "LLMs", icon: "🏛️", desc: "Nous Research Hermes fine-tuned models." },
    { name: "Anyscale", category: "LLMs", icon: "📡", desc: "Scalable OSS model endpoints via Anyscale." },
    { name: "NVIDIA NIM", category: "LLMs", icon: "🖥️", desc: "Deploy optimized models on NVIDIA NIM." },
    { name: "Copilot (Microsoft)", category: "LLMs", icon: "🪟", desc: "Microsoft Copilot Studio and Azure OpenAI." },
    { name: "Azure AI", category: "LLMs", icon: "☁️", desc: "Azure AI Foundry model deployments." },

    // Social
    { name: "Instagram", category: "Social", icon: "📸", desc: "Read/post to Instagram via Graph API." },
    { name: "Facebook", category: "Social", icon: "👥", desc: "Pages, groups, and feed management." },
    { name: "Twitter/X", category: "Social", icon: "🐦", desc: "Post tweets, read timelines, and analytics." },
    { name: "LinkedIn", category: "Social", icon: "💼", desc: "Profile data, posts, and company pages." },
    { name: "TikTok", category: "Social", icon: "🎵", desc: "Upload videos and pull TikTok analytics." },
    { name: "YouTube", category: "Social", icon: "▶️", desc: "Upload videos, manage playlists, analytics." },
    { name: "Reddit", category: "Social", icon: "🤖", desc: "Read subreddits, post, and track karma." },
    { name: "Snapchat", category: "Social", icon: "👻", desc: "Snap Kit login and story integrations." },
    { name: "Pinterest", category: "Social", icon: "📌", desc: "Create pins, boards, and track analytics." },
    { name: "Discord", category: "Social", icon: "🎮", desc: "Bot messages, webhooks, and server data." },
    { name: "Threads", category: "Social", icon: "🧵", desc: "Post and read Threads via Meta API." },
    { name: "CEO GPS", category: "Social", icon: "🗺️", desc: "Executive social presence tracking." },
    { name: "WhatsApp", category: "Social", icon: "💬", desc: "Business messaging via WhatsApp Cloud API." },
    { name: "Telegram", category: "Social", icon: "✈️", desc: "Bots, channels, and message automation." },
    { name: "Signal", category: "Social", icon: "🔒", desc: "Encrypted messaging via Signal Protocol." },
    { name: "Nextdoor", category: "Social", icon: "🏘️", desc: "Local community posts and business pages." },

    // Marketing
    { name: "Google Analytics", category: "Marketing", icon: "📊", desc: "GA4 events, audiences, and funnels." },
    { name: "Ahrefs", category: "Marketing", icon: "🔗", desc: "Backlinks, keywords, and SEO audits." },
    { name: "MOZ", category: "Marketing", icon: "🟣", desc: "Domain authority and keyword explorer." },
    { name: "Mailchimp", category: "Marketing", icon: "🐒", desc: "Email campaigns, audiences, and automations." },
    { name: "SendGrid", category: "Marketing", icon: "📧", desc: "Transactional email and marketing campaigns." },
    { name: "Brevo", category: "Marketing", icon: "💌", desc: "CRM, email, and SMS marketing platform." },
    { name: "Klaviyo", category: "Marketing", icon: "📣", desc: "E-commerce email & SMS automation." },
    { name: "HubSpot", category: "Marketing", icon: "🟠", desc: "CRM, marketing hub, and sales pipeline." },
    { name: "Monday.com", category: "Marketing", icon: "📅", desc: "Work OS for campaign and project tracking." },
    { name: "ClickUp", category: "Marketing", icon: "✅", desc: "Tasks, docs, goals, and time tracking." },
    { name: "Jotform", category: "Marketing", icon: "📋", desc: "Forms, surveys, and lead capture." },
    { name: "Postman", category: "Marketing", icon: "📮", desc: "API testing and team collaboration." },
    { name: "Canva", category: "Marketing", icon: "🎨", desc: "Design assets and brand templates." },

    // Finance
    { name: "Stripe", category: "Finance", icon: "💳", desc: "Payments, subscriptions, and billing." },
    { name: "Plaid", category: "Finance", icon: "🏦", desc: "Bank account linking and transaction data." },
    { name: "PayPal", category: "Finance", icon: "🅿️", desc: "Payments, invoices, and dispute management." },
    { name: "Venmo", category: "Finance", icon: "💸", desc: "Peer-to-peer payment tracking." },
    { name: "Cash App", category: "Finance", icon: "💵", desc: "Cash App business payments and payouts." },
    { name: "SoFi", category: "Finance", icon: "🏛️", desc: "SoFi banking and investment accounts." },
    { name: "Chase", category: "Finance", icon: "🔵", desc: "Chase bank data via Plaid integration." },
    { name: "Brex", category: "Finance", icon: "💼", desc: "Corporate cards, expenses, and budgets." },
    { name: "Digits", category: "Finance", icon: "🔢", desc: "Real-time financial analytics and AI CFO." },
    { name: "Crypto.com", category: "Finance", icon: "🪙", desc: "Crypto portfolio and exchange data." },
    { name: "Kraken", category: "Finance", icon: "🦑", desc: "Crypto trading and staking via Kraken API." },
    { name: "DraftKings", category: "Finance", icon: "🏆", desc: "Fantasy sports and betting account data." },
    { name: "Credit Karma", category: "Finance", icon: "📈", desc: "Credit score and financial health tracking." },
    { name: "Experian", category: "Finance", icon: "📉", desc: "Credit reports and identity monitoring." },
    { name: "MorningStar", category: "Finance", icon: "⭐", desc: "Investment research and portfolio ratings." },
    { name: "Mercury", category: "Finance", icon: "🪐", desc: "Mercury business bank accounts and cards." },

    // Communications
    { name: "Twilio", category: "Communications", icon: "📱", desc: "SMS, voice, and video programmable APIs." },
    { name: "Google Voice", category: "Communications", icon: "📞", desc: "Google Voice calls and SMS management." },
    { name: "Nylas", category: "Communications", icon: "✉️", desc: "Email, calendar, and contacts API layer." },
    { name: "Gmail (OAuth)", category: "Communications", icon: "📬", desc: "Read and send Gmail via Google OAuth." },
    { name: "Outlook", category: "Communications", icon: "📫", desc: "Microsoft Outlook email and contacts." },
    { name: "Apple iCloud", category: "Communications", icon: "🍎", desc: "iCloud Mail, contacts, and reminders." },
    { name: "Proton Mail", category: "Communications", icon: "🛡️", desc: "End-to-end encrypted email via Proton API." },
    { name: "Otter.ai", category: "Communications", icon: "🦦", desc: "Meeting transcription and AI summaries." },

    // Dev Tools
    { name: "Cloudflare", category: "Dev Tools", icon: "🌩️", desc: "DNS, CDN, Workers, and R2 storage." },
    { name: "AWS S3", category: "Dev Tools", icon: "🪣", desc: "Object storage and file management." },
    { name: "Azure Storage", category: "Dev Tools", icon: "🔷", desc: "Azure Blob, Queue, and Table storage." },
    { name: "GitHub", category: "Dev Tools", icon: "🐙", desc: "Repos, issues, PRs, and Actions." },
    { name: "GitLab", category: "Dev Tools", icon: "🦊", desc: "CI/CD pipelines and self-hosted repos." },
    { name: "Vercel", category: "Dev Tools", icon: "▲", desc: "Deploy and manage Vercel projects." },
    { name: "Supabase", category: "Dev Tools", icon: "⚡", desc: "Postgres, Auth, and Realtime backend." },
    { name: "Firebase", category: "Dev Tools", icon: "🔥", desc: "Firestore, Auth, and Cloud Functions." },
    { name: "PocketBase", category: "Dev Tools", icon: "🧳", desc: "Lightweight self-hosted backend and DB." },
    { name: "Prisma", category: "Dev Tools", icon: "🔺", desc: "Type-safe ORM and database migrations." },
    { name: "Docker", category: "Dev Tools", icon: "🐳", desc: "Container management and image builds." },
    { name: "VS Code", category: "Dev Tools", icon: "💻", desc: "VS Code settings sync and extensions." },
    { name: "Dropbox", category: "Dev Tools", icon: "📦", desc: "File sync, sharing, and Paper docs." },
    { name: "Browserbase", category: "Dev Tools", icon: "🌐", desc: "Headless browser automation in the cloud." },
    { name: "Replicate", category: "Dev Tools", icon: "🔁", desc: "Run and fine-tune ML models via API." },

    // Business
    { name: "Brilliant Directories", category: "Business", icon: "🗂️", desc: "Member directory and listing management." },
    { name: "WordPress", category: "Business", icon: "📝", desc: "Content management via WP REST API." },
    { name: "GoDaddy", category: "Business", icon: "🌍", desc: "Domain and website management." },
    { name: "Yelp", category: "Business", icon: "⭐", desc: "Business listings and review management." },
    { name: "YP.com", category: "Business", icon: "📖", desc: "Yellow Pages directory listing sync." },
    { name: "ShowMeLocal", category: "Business", icon: "📍", desc: "Local citation and listing management." },
    { name: "Alignable", category: "Business", icon: "🤝", desc: "Small business community networking." },
    { name: "Yahoo", category: "Business", icon: "🟣", desc: "Yahoo Finance and search integrations." },
    { name: "Airtable", category: "Business", icon: "🗃️", desc: "Databases, automations, and views." },
    { name: "Notion", category: "Business", icon: "📒", desc: "Docs, databases, and wikis via Notion API." },
    { name: "Zoominfo", category: "Business", icon: "🔭", desc: "B2B contact and company intelligence." },
    { name: "Linear", category: "Business", icon: "📐", desc: "Issue tracking and engineering workflows." },
    { name: "Plain", category: "Business", icon: "🎫", desc: "Customer support and ticketing platform." },
    { name: "Google Calendar", category: "Business", icon: "🗓️", desc: "Events, reminders, and scheduling." },
    { name: "Outlook Calendar", category: "Business", icon: "📆", desc: "Microsoft calendar events and meetings." },
    { name: "iCloud Calendar", category: "Business", icon: "🍏", desc: "Apple iCloud calendar sync." },

    // AI Media
    { name: "D-ID (avatar)", category: "AI Media", icon: "🧑‍💻", desc: "Realistic AI avatar video generation." },
    { name: "Suno (music)", category: "AI Media", icon: "🎸", desc: "AI-generated songs from text prompts." },
    { name: "ElevenLabs (voice)", category: "AI Media", icon: "🎙️", desc: "Ultra-realistic AI voice synthesis." },
    { name: "Stability AI", category: "AI Media", icon: "🖼️", desc: "Stable Diffusion image and video models." },
    { name: "Fish.Audio", category: "AI Media", icon: "🐟", desc: "Voice cloning and TTS synthesis." },
    { name: "Moondream2", category: "AI Media", icon: "🌙", desc: "Tiny vision-language model for edge." },
    { name: "Wan-AI", category: "AI Media", icon: "🌊", desc: "AI video generation via Wan 2.1." },
    { name: "Krea", category: "AI Media", icon: "🌈", desc: "Real-time AI image and video creation." },
    { name: "Blackforest Labs", category: "AI Media", icon: "🌲", desc: "FLUX image generation models." },
    { name: "Runwav", category: "AI Media", icon: "🎧", desc: "AI audio generation and sound effects." },
    { name: "Kling", category: "AI Media", icon: "🎬", desc: "Kling AI video generation from images." },
    { name: "Tenstrip", category: "AI Media", icon: "🎞️", desc: "AI-powered comic strip and storyboards." },

    // Browsers
    { name: "Opera", category: "Browsers", icon: "🔴", desc: "Opera browser automation and data sync." },
    { name: "Firefox", category: "Browsers", icon: "🦊", desc: "Firefox extension and bookmarks API." },
    { name: "Exa", category: "Browsers", icon: "🔎", desc: "Neural web search and content extraction." },
    { name: "Google Maps", category: "Browsers", icon: "🗺️", desc: "Places, geocoding, and directions API." },
    { name: "Apple Maps", category: "Browsers", icon: "🍎", desc: "MapKit JS and location services." },

    // More
    { name: "Spotify", category: "More", icon: "🎵", desc: "Playback, playlists, and listening history." },
    { name: "Pandora", category: "More", icon: "📻", desc: "Pandora streaming and station data." },
    { name: "Vimeo", category: "More", icon: "🎥", desc: "Video hosting, analytics, and embedding." },
    { name: "Shutterstock", category: "More", icon: "📷", desc: "Stock photo and footage library search." },
    { name: "Genies", category: "More", icon: "🧞", desc: "Avatar and digital identity platform." },
    { name: "Ring", category: "More", icon: "🔔", desc: "Doorbell, camera, and alarm device API." },
    { name: "Temu", category: "More", icon: "🛍️", desc: "Temu marketplace product data and orders." },
    { name: "TikTok Shop", category: "More", icon: "🛒", desc: "TikTok Shop product listings and orders." },
    { name: "LunarCrush", category: "More", icon: "🌕", desc: "Social intelligence for crypto assets." },
    { name: "Malwarebytes", category: "More", icon: "🛡️", desc: "Threat detection and device security." },
    { name: "Trivago", category: "More", icon: "🏨", desc: "Hotel and travel price comparison." },
    { name: "Cron", category: "More", icon: "⏱️", desc: "Calendar and scheduling productivity app." },
    { name: "Alibaba", category: "More", icon: "🏪", desc: "Alibaba.com wholesale marketplace API." },
    { name: "Make (Integromat)", category: "More", icon: "⚙️", desc: "Visual automation workflows and scenarios." },
    { name: "Gumloop", category: "More", icon: "🔄", desc: "No-code AI workflow automation." },
    { name: "Antigravity", category: "More", icon: "🚀", desc: "AI-powered business growth platform." },
    { name: "Lumin", category: "More", icon: "💡", desc: "Document collaboration and PDF editing." },
    { name: "Luma", category: "More", icon: "🌟", desc: "NeRF and 3D scene capture platform." },
    { name: "Slack", category: "More", icon: "💬", desc: "Team messaging, bots, and workflows." },
    { name: "Hercules", category: "More", icon: "⚡", desc: "Hercules platform API and app services." },
    { name: "Base44", category: "More", icon: "🔧", desc: "No-code app builder and data platform." },
    { name: "QuarkAI", category: "More", icon: "⚛️", desc: "AI-native productivity and knowledge hub." }
  ];

  const CATEGORIES = [
    "All", "LLMs", "Social", "Marketing", "Finance",
    "Communications", "Dev Tools", "Business", "AI Media",
    "Productivity", "Browsers", "More",
  ];

  const filtered = useMemo(() => {
    return INTEGRATIONS.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const toggleConnected = (name) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <PanelLayout
      title="Integrations"
      subtitle={`${INTEGRATIONS.length} integrations available · ${connected.size} connected`}
      icon={<Plug size={16} />}
    >
      {/* Toolbar */}
      <div className="shrink-0 flex flex-col gap-2">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: "oklch(0.12 0.04 20 / 60%)",
            border: "1px solid oklch(0.55 0.22 20 / 25%)",
          }}
        >
          <Search size={14} className="text-white/40 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations…"
            className="bg-transparent outline-none text-white/80 placeholder:text-white/30 text-xs w-full font-display tracking-wide"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="shrink-0 px-3 py-1 rounded-md text-[10px] font-display tracking-widest uppercase transition-all cursor-pointer"
                style={{
                  background: isActive
                    ? "oklch(0.55 0.22 20 / 30%)"
                    : "oklch(0.12 0.04 20 / 40%)",
                  border: isActive
                    ? "1px solid oklch(0.55 0.22 20 / 60%)"
                    : "1px solid oklch(0.55 0.22 20 / 15%)",
                  color: isActive ? "oklch(0.75 0.22 20)" : "oklch(0.6 0.05 20)",
                  boxShadow: isActive ? "0 0 8px oklch(0.55 0.22 20 / 30%)" : "none",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="shrink-0 text-[10px] font-display tracking-widest" style={{ color: TEAL_LABEL }}>
        {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        {activeCategory !== "All" && ` in ${activeCategory}`}
        {search && ` for "${search}"`}
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/30 text-xs font-display tracking-widest">
            No integrations found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((integration) => {
              const isConnected = connected.has(integration.name);
              return (
                <IntegrationCard
                  key={integration.name}
                  integration={integration}
                  isConnected={isConnected}
                  onToggleConnect={() => toggleConnected(integration.name)}
                />
              );
            })}
          </div>
        )}
      </div>
    </PanelLayout>
  );
}

function IntegrationCard({ integration, isConnected, onToggleConnect }) {
  return (
    <div
      className="glass-crimson rounded-xl p-3 flex flex-col gap-2.5 group transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: "oklch(0.1 0.04 20 / 55%)",
        border: "1px solid oklch(0.55 0.22 20 / 20%)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Top row: icon, name, connected dot */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{integration.icon}</span>
          <div>
            <p className="text-white/80 text-xs font-display tracking-wide leading-tight">
              {integration.name}
            </p>
            <span
              className="text-[9px] font-display tracking-widest uppercase"
              style={{ color: "oklch(0.75 0.15 175)" }}
            >
              {integration.category}
            </span>
          </div>
        </div>
        {/* Connected status indicator */}
        <button
          onClick={onToggleConnect}
          title={isConnected ? "Connected — click to disconnect" : "Not connected — click to connect"}
          className="mt-0.5 shrink-0 cursor-pointer"
        >
          {isConnected ? (
            <CheckCircle2
              size={14}
              style={{ color: "oklch(0.72 0.18 145)", filter: "drop-shadow(0 0 4px oklch(0.72 0.18 145 / 70%))" }}
            />
          ) : (
            <Circle size={14} className="text-white/20" />
          )}
        </button>
      </div>

      {/* Description */}
      <p className="text-white/50 text-[10px] leading-relaxed font-display tracking-wide line-clamp-2">
        {integration.desc}
      </p>

      {/* Action buttons */}
      <div className="flex gap-1.5 mt-auto">
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-display tracking-widest uppercase transition-all cursor-pointer hover:brightness-110 active:scale-95"
          style={{
            background: "oklch(0.55 0.22 20 / 18%)",
            border: "1px solid oklch(0.55 0.22 20 / 35%)",
            color: "oklch(0.78 0.18 20)",
          }}
        >
          <Key size={9} />
          API KEY
        </button>
        <button
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-display tracking-widest uppercase transition-all cursor-pointer hover:brightness-110 active:scale-95"
          style={{
            background: "oklch(0.75 0.15 175 / 12%)",
            border: "1px solid oklch(0.75 0.15 175 / 30%)",
            color: "oklch(0.75 0.15 175)",
          }}
        >
          <RefreshCw size={9} />
          OAUTH
        </button>
      </div>
    </div>
  );
}