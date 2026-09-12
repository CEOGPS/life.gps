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
- Uploads work but file does not play on relogin. Persistent memory needs to be improved with cross platform use. 

### Contacts
Missing many fields that used to be there. Restore the full field set. Table created. There are three different tables in Supabase for Contacts Panel: Contacts, Contact_List_Members, and Contact_lists.

### CRM
Current layout is a no-go. Must match the previous layout — like HubSpot, or like
Contacts but with more fields for tracking. Layout was fine before; restore it. CRM table in Supabase is listed under crm-contacts

### Email — OK.
### Communications — OK so far.
### Finance
Missing: Crypto and stock live updates, and AI insight area. None of the buttons on the page are wired properly.

### Creator OS1
Was already built; something is wrong. Should be image, video, writing, and
voiceover editing/creation/generation. Matchmaker, AI insights, Publishing do
NOT belong — remove them. None of the buttons are wired.

### VeritonOS1
Should create full music videos using a song + an image + a prompt. Was already
built. Needs everything in CreatorOS1. Should nearly mirror Suno when finished,
plus music-video creation. None of the buttons are wired.

### Community
Open to suggestions on scraping the internet for warm/hot leads.

### SocialLinkOS1 — looked ok; cannot tell until data populates. Data not populating. None of the buttons are wired.

### Marketing — looks fine; nothing works; cannot see all tabs. None of the buttons are wired.

### AgentZero — OK; won't know until populated. None of the buttons are wired.

### Opportunity Engine — needs to be built (then moved under Community).
### Insight Engine — needs to be built. This still needs to he built. 
### OmniSearch — looks great; None of the buttons are wired. 
### Business Command — OK as far as can tell. None of the buttons work or are wired.
### Projects — layout won't work; SAVE FOR LATER.
### Calendar — fine.
### Office — fine. None of the buttons are wired.
### Maps — fine. None of the buttons are wired.
### Family — fine but fields missing. Need to revert to older working state. None of the buttons are wired.
### Health — was more in depth; restore some old features. None of the buttons are wired.
### Journal — fine.
### Life RPG — not built (move to Simulators).
### Life Audit — not built.
### Media Panel — fine; can't tell until media can be added. None of the buttons are wired.
### Legal vs Privacy Vault — THEY ARE MERGED BUT MUST BE SEPARATE: None of the buttons are wired.
- **Legal Panel**: its own thing with the features that are there; AI responses determine content.
- **Privacy Vault**: storage for sensitive info — APIs, passwords, private pics/docs. None of the buttons are wired.

### Terminals
Better way to select the terminal. Integrating/adding VS Code may be easiest. Nothing in this panel is working and most terminal types arent there.

### Simulators — not built (will house Karma, Conflict Resolver, Life RPG). Will save this for last.
### Integrations
Needs multiple API keys for multiple email accounts, and multiple OAuth.
Flow: add the email BEFORE entering OAuth flow (or allow choosing in the flow).
Reference: reuse the connect logic used in Hermes (connects to many services).
Need to optimize and enhance persistent memory to use Supabase, not just local storage for more solid persistent state.

### Conflict Resolver — not built (→ Simulators).
### Karma Credit — not built (→ Simulators).

## Topbar / Global
- **Profile** missing: image, many fields, multiple phone numbers, emails,
  websites, addresses, social accounts, etc.
- **Settings** doesn't go anywhere — verify/route it. This needs to be implemented asap. 
- **Logo** isn't uploadable. This also needs to he implemented asap.

### AI Dock (ErebusDock)
Missing the avatar window for the talking/moving AI avatar. "Looks like an AI
dock from 1920" — needs visual overhaul (BUT within no-theme-change constraint;
treat as layout/component rebuild).
The dock is too large and needs to be about half the size it is now. It currently covers half the page and it follows the user through the dashboard so the page is not useable due to being blocked by the AI Dock. 

## Dashboard Home Page
- **YouTube player**: should be an embedded player that searches + plays videos —
  essentially YouTube in a module. It was set up correctly before; restore. This is already done. Do not change it. 
- **Music player**: ability to add playlists from Music Hub. Not wired. None of the buttons are wired.
- **Calendar**: larger box at bottom highlighting the current day's events. None of the buttons are wired.
- **Social module**: missing platforms; unsure how data shows. Not pulling data.
- **Bottom activity feed**: stretch across the page showing all dashboard actions. Not updating actions on dashboard.

## Priority buckets (proposed)
1. **Bread-and-butter wiring / restore** (Music Hub, Contacts fields, CRM layout,
   Veriton/Creator scoping, Legal/Privacy split, home page modules).
2. **Navigation restructure** (remove AI Academy, move Events/Opportunity/Simulator
   children).
3. **Build new** (Opportunity Engine, Insight Engine, Life Audit).
4. **Integrations / multiple accounts** (email keys + OAuth flow). Persistent memory enhancement. 
5. **Later** (Projects layout, Media ingest).
6. **Global Persistent memory** This needs to be improved site wide to use Supabase and local storage as a fallback, not the other way around. 
