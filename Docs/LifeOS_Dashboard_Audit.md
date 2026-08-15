# LifeOS1 Dashboard — Full Product Audit (2026-08-11)

**HARD CONSTRAINT (do not violate):** NO appearance/theme changes. Only LAYOUT or
TEXT. No color, spacing, font, radius, or style changes. Ever.

## Global
- Pretty much all buttons need to be wired.
- Persistent memory needs to be fixed on everything.
- Nearly all buttons, modules, and integrations need wiring; structure mostly exists.

## Navigation / Sitemap changes
- **Remove AI Academy** from side panel (delete module).
- **Move Events** into the Calendar panel; remove standalone side-panel entry.
- **Opportunity Engine** → move inside Community panel.
- **Karma Credit, Conflict Resolver, Life RPG** → move inside Simulators panel.

## Module-by-module

### Music Hub (rework)
Wrong. Correct purpose:
- Uploading music
- A place for songs created in Veriton to appear
- Create playlists
- Listen to Spotify, Pandora, SoundCloud, Apple Music, Amazon Music
- Playlists feed the home-page music player.

### Contacts
Missing many fields that used to be there. Restore the full field set.

### CRM
Current layout is a no-go. Must match the previous layout — like HubSpot, or like
Contacts but with more fields for tracking. Layout was fine before; restore it.

### Email — OK.
### Communications — OK so far.
### Finance
Missing: Crypto and stock live updates, and AI insight area.

### Creator OS1
Was already built; something is wrong. Should be image, video, writing, and
voiceover editing/creation/generation. Matchmaker, AI insights, Publishing do
NOT belong — remove them.

### VeritonOS1
Should create full music videos using a song + an image + a prompt. Was already
built. Needs everything in CreatorOS1. Should nearly mirror Suno when finished,
plus music-video creation.

### Community
Open to suggestions on scraping the internet for warm/hot leads.

### SocialLinkOS1 — looked ok; cannot tell until data populates.

### Marketing — looks fine; nothing works; cannot see all tabs.

### AgentZero — OK; won't know until populated.

### Opportunity Engine — needs to be built (then moved under Community).
### Insight Engine — needs to be built.
### OmniSearch — looks great; hope it works right.
### Business Command — OK as far as can tell.
### Projects — layout won't work; SAVE FOR LATER.
### Calendar — fine.
### Office — fine.
### Maps — fine.
### Family — fine but fields missing.
### Health — was more in depth; restore some old features.
### Journal — fine.
### Life RPG — not built (move to Simulators).
### Life Audit — not built.
### Media Panel — fine; can't tell until media can be added.
### Legal vs Privacy Vault — THEY ARE MERGED BUT MUST BE SEPARATE:
- **Legal Panel**: its own thing with the features that are there; AI responses determine content.
- **Privacy Vault**: storage for sensitive info — APIs, passwords, private pics/docs.

### Terminals
Better way to select the terminal. Integrating/adding VS Code may be easiest.

### Simulators — not built (will house Karma, Conflict Resolver, Life RPG).
### Integrations
Needs multiple API keys for multiple email accounts, and multiple OAuth.
Flow: add the email BEFORE entering OAuth flow (or allow choosing in the flow).
Reference: reuse the connect logic used in Hermes (connects to many services).

### Conflict Resolver — not built (→ Simulators).
### Karma Credit — not built (→ Simulators).

## Topbar / Global
- **Profile** missing: image, many fields, multiple phone numbers, emails,
  websites, addresses, social accounts, etc.
- **Settings** doesn't go anywhere — verify/route it.
- **Logo** isn't uploadable.

### AI Dock (ErebusDock)
Missing the avatar window for the talking/moving AI avatar. "Looks like an AI
dock from 1920" — needs visual overhaul (BUT within no-theme-change constraint;
treat as layout/component rebuild).

## Dashboard Home Page
- **YouTube player**: should be an embedded player that searches + plays videos —
  essentially YouTube in a module. It was set up correctly before; restore.
- **Music player**: ability to add playlists from Music Hub.
- **Calendar**: larger box at bottom highlighting the current day's events.
- **Social module**: missing platforms; unsure how data shows.
- **Bottom activity feed**: stretch across the page showing all dashboard actions.

## Priority buckets (proposed)
1. **Bread-and-butter wiring / restore** (Music Hub, Contacts fields, CRM layout,
   Veriton/Creator scoping, Legal/Privacy split, home page modules).
2. **Navigation restructure** (remove AI Academy, move Events/Opportunity/Simulator
   children).
3. **Build new** (Opportunity Engine, Insight Engine, Life Audit).
4. **Integrations / multiple accounts** (email keys + OAuth flow).
5. **Later** (Projects layout, Media ingest).
