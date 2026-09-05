export type SidebarItem = {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string;
};

export const SIDEBAR_GROUPS = [
  {
    label: "CORE",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: "LayoutDashboard",
        path: "/",
      },
      { id: "music", label: "Music Hub", icon: "Music2", path: "/music" },
      { id: "contacts", label: "Contacts", icon: "Users", path: "/contacts" },
      { id: "crm", label: "CRM", icon: "Briefcase", path: "/crm" },
      { id: "email", label: "Email", icon: "Mail", path: "/email" },
      {
        id: "comms",
        label: "Communications",
        icon: "MessageSquare",
        path: "/communications",
      },
      { id: "finance", label: "Finance", icon: "DollarSign", path: "/finance" },
    ],
  },
  {
    label: "CREATE",
    items: [
      { id: "creator", label: "CreatorOS1", icon: "Wand2", path: "/creator" },
      { id: "veriton", label: "VeritonOS1", icon: "Music4", path: "/veriton" },
      { id: "lucidsystems", label: "Lucid Systems", icon: "Brain", path: "/lucidsystems" },
      {
        id: "community",
        label: "Community",
        icon: "Globe2",
        path: "/community",
      },
      { id: "social", label: "SocialLinkOS1", icon: "Share2", path: "/social" },
      {
        id: "marketing",
        label: "Marketing",
        icon: "Megaphone",
        path: "/marketing",
      },
    ],
  },
  {
    label: "AI",
    items: [
      { id: "agents", label: "AgentZero", icon: "Bot", path: "/agents" },
      {
        id: "insight",
        label: "Insight Engine",
        icon: "Brain",
        path: "/insights",
      },
      { id: "omni", label: "OmniSearch", icon: "Search", path: "/omnisearch" },
    ],
  },
  {
    label: "COMMAND",
    items: [
      {
        id: "biz",
        label: "Business Command",
        icon: "BarChart3",
        path: "/business",
      },
      {
        id: "projects",
        label: "Projects",
        icon: "FolderKanban",
        path: "/projects",
      },
      {
        id: "calendar",
        label: "Calendar",
        icon: "Calendar",
        path: "/calendar",
      },
      {
        id: "office",
        label: "Office",
        icon: "FileSpreadsheet",
        path: "/office",
      },
      { id: "maps", label: "Maps", icon: "MapPin", path: "/maps" },
    ],
  },
  {
    label: "LIFE",
    items: [
      {
        id: "family",
        label: "Family & Friends",
        icon: "Heart",
        path: "/family",
      },
      { id: "health", label: "Health", icon: "Activity", path: "/health" },
      { id: "journal", label: "Journal", icon: "BookOpen", path: "/journal" },
      {
        id: "pulse",
        label: "Life Audit (Pulse)",
        icon: "Pulse",
        path: "/pulse",
      },
    ],
  },
  {
    label: "VAULT",
    items: [
      { id: "media", label: "Media", icon: "Image", path: "/media" },
      { id: "vault", label: "Secure Vault", icon: "Lock", path: "/vault" },
      {
        id: "terminals",
        label: "Terminals",
        icon: "Terminal",
        path: "/terminals",
      },
      { id: "legal", label: "Legal", icon: "Scale", path: "/legal" },
    ],
  },
  {
    label: "MORE",
    items: [
      {
        id: "simulators",
        label: "Simulators",
        icon: "GitBranch",
        path: "/simulators",
      },
      {
        id: "integrations",
        label: "Integrations",
        icon: "Plug",
        path: "/integrations",
      },
    ],
  },
];

// Sub-navigation map for panels with internal tabs
// Used by panel components to show their own tab navigation
export const PANEL_SUB_NAV = {
  community: [
    { id: "scan", label: "Lead Scanner", icon: "Search" },
    { id: "opportunity", label: "Opportunity Engine", icon: "Zap" },
  ],
  simulators: [
    { id: "conflict", label: "Conflict Resolver", icon: "Swords" },
    { id: "karma", label: "Karma Credit", icon: "Star" },
    { id: "liferpg", label: "Life RPG", icon: "Gamepad2" },
    { id: "parallel", label: "Parallel Life", icon: "UserRound" },
  ],
  calendar: [
    { id: "month", label: "Month", icon: "Calendar" },
    { id: "week", label: "Week", icon: "CalendarDays" },
    { id: "agenda", label: "Agenda", icon: "List" },
  ],
} as const;
