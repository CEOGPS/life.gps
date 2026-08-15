# LifeOS Homepage Layout (Mockup) Implementation Plan

> **For Hermes:** Execute task-by-task; user prefers visual approval before heavy lint/tsc on UI.

**Goal:** Match `C:\Users\chris\Downloads\Untitled design (9).png` — asymmetrical glass dashboard with left rail, center hero (YouTube + Spencer), right rail, finance row, daily tips row — while preserving all existing module wiring and data handlers.

**Architecture:** Keep a single `DashboardPanel.jsx` with existing state/handlers. Restructure only the JSX grid: 12-column CSS grid + `RailColumn` vertical stacks. `GridCard` supports `gridColumn={false}` inside rails. No new routes or storage keys.

**Tech Stack:** React 18, inline styles, `liquid-glass` class, existing `load`/`save`/`kvGet`, Hermes `hermesChat`, worker social APIs.

**Reference (image analysis — confirm with Chris):**
- Portrait mock ~1000×1200: full-width top band, then **~18% left rail**, **~38% center**, **~9–12% right widgets**.
- Inferred zones: left = Time, Tasks, Links; center = large YouTube + Spencer; right = Notifications, Finance snapshot, Leads; lower rows = Product Revenue, Balances, Credit, Budget, Social, Music, Money Tips, Life Hacks, Notes.

**Open question (Task 0):** Chris confirms module order per labeled regions in PNG, or approves inferred layout below.

---

## Current state

| Item | Status |
|------|--------|
| `RailColumn`, `YouTubePlayer({ tall })`, `GridCard` `gridColumn={false}` | Done (partial) |
| Grid still **flat** 12-col flow (not rail + hero) | Not done |
| Banner upload (`bannerPic`) | Wired but **not shown** on dashboard |
| Locked rules in file comment (Time first, glass, red edge hover, no blue haze) | Must preserve |

**Primary file:** `C:/dev/LifeOS1/src/components/lifeos/panels/DashboardPanel.jsx`

---

### Task 0: Lock layout spec with user (5 min)

**Objective:** One confirmed wireframe before moving cards.

**Steps:**
1. Open mockup + `npm run dev` side by side.
2. Chris marks: row1–4 module names left→right.
3. Record in this plan’s “Approved layout” subsection (edit plan file).

**Approved layout (fill after confirm):**

```
Row 0: [ Banner span 12 — optional ]
Row 1: [ Left rail 3 ] [ Center 6 ] [ Right rail 3 ]
Row 2: [ Finance strip: Product 5 | Balances 4 | Credit 3 ]
Row 3: [ Money Tips 6 | Life Hacks 6 ]
Row 4: [ Notes 4 | Social 2 | Music 2 | Budget 4 ]  ← adjust per mock
```

---

### Task 1: Extract `dashboardGridStyle` constant (2 min)

**Files:** `DashboardPanel.jsx` (~line 631)

**Change:** Replace duplicate inline grid objects with one constant used by outer wrapper.

```javascript
const dashboardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gap: 10,
  alignItems: "stretch",
  gridAutoRows: "minmax(96px, auto)",
  maxWidth: 1280,
  margin: "0 auto",
};
```

**Verify:** `npm run dev` — no visual change.

---

### Task 2: Row 1 — left rail stack (5 min)

**Objective:** Time & Weather always first; Tasks; Links in one `gridColumn="span 3"` column.

**Files:** `DashboardPanel.jsx` return block (~652–688)

**Pattern:**

```jsx
<RailColumn gridColumn="span 3">
  <GridCard title="Time & Weather" icon={...} gridColumn={false}>...</GridCard>
  <GridCard title="TASKS" ... gridColumn={false}>...</GridCard>
  <GridCard title="LINKS" ... gridColumn={false}>...</GridCard>
</RailColumn>
```

**Verify:** Left column stacks vertically; Time is topmost.

---

### Task 3: Row 1 — center column (6 min)

**Objective:** Hero column `span 6`: YouTube tall + Spencer below.

```jsx
<RailColumn gridColumn="span 6">
  <GridCard title="YouTube" gridColumn={false} style={{ minHeight: 200 }}>
    <YouTubePlayer tall />
  </GridCard>
  <GridCard title="Spencer (Hermes)" gridColumn={false} style={{ minHeight: 120 }}>
    {/* existing Spencer UI */}
  </GridCard>
</RailColumn>
```

**Verify:** YouTube visibly larger than old 52px iframe; Spencer directly under it.

---

### Task 4: Row 1 — right rail stack (5 min)

**Objective:** `span 3`: Notifications, Finance summary, LEADS (order per Task 0).

Move NOTES to row 4 if mock shows it lower.

**Verify:** Right edge aligns with center row height (stretch).

---

### Task 5: Row 2 — finance trio (5 min)

**Objective:** One grid row, edges aligned:

| Module | span |
|--------|------|
| Product Revenue | 5 |
| Financial Balances | 4 |
| Credit Score | 3 |

Keep EDIT/SAVE handlers unchanged.

**Verify:** Three cards same row on 1280px width.

---

### Task 6: Row 3 — daily tips (4 min)

**Objective:** Money Tips `span 6`, Life Hacks `span 6`, keep `getDailyMoneyTips` / `saveToSheet`.

**Verify:** 10 tips each, save `+` still works.

---

### Task 7: Row 4 — remaining modules (6 min)

**Objective:** Place Budget, Social Hub, Music Hub, NOTES without dropping any module:

Default placement (adjust after Task 0):
- Budget `span 4`, Social `span 2`, Music `span 2`, Notes `span 4`

**Verify:** Module inventory checklist (all titles still on page):

- [ ] Time & Weather  
- [ ] TASKS, LINKS, LEADS, NOTES  
- [ ] Spencer, Notifications, Finance snapshot  
- [ ] Product Revenue, Financial Balances, Credit, Budget  
- [ ] Social, YouTube, Music  
- [ ] Money Tips, Life Hacks  

---

### Task 8: Optional banner row (4 min)

**Objective:** If `bannerPic`, full-width row above grid.

```jsx
{bannerPic ? (
  <div style={{ gridColumn: "1 / -1", marginBottom: 10, borderRadius: 14, overflow: "hidden", maxHeight: 120 }}>
    <img src={bannerPic} alt="Banner" style={{ width: "100%", objectFit: "cover" }} />
  </div>
) : null}
```

Wire existing `handleBannerUpload` / shell profile pic if needed.

---

### Task 9: Visual polish pass (5 min)

**Objective:** Match locked appearance rules (comment block ~551–558).

- `gap: 10`, card `minHeight` only where needed (no global bloat).
- Hover: edge-only red glow (already on `GridCard`).
- Scroll: ensure dashboard container uses app scrollbar styles (parent CSS).
- No new blue gradients on cards.

**Verify:** Chris eyeballs in browser — **no `npm run lint` until approved.**

---

### Task 10: Ad-hoc verification script (3 min)

**File:** `%TEMP%\hermes-verify-dashboard-modules.py` (delete after run)

- Read `DashboardPanel.jsx` as text.
- Assert strings: `RailColumn`, `Time & Weather`, `YouTube`, `Money Tips`, `lifeos_dash_` handlers still referenced.

**Not suite green** — no Vitest for layout yet.

---

### Task 11: Post-approval quality (optional)

After Chris says layout matches mock:

```bash
cd C:/dev/LifeOS1
npm run lint
npm run typecheck
```

Fix only issues introduced in `DashboardPanel.jsx`.

---

## Files likely to change

| File | Change |
|------|--------|
| `src/components/lifeos/panels/DashboardPanel.jsx` | Grid restructure only |
| `.hermes/plans/2026-07-12_lifeos-homepage-layout.md` | This plan |

**Unlikely:** `LifeOSShell.jsx`, `hermesChat.js`, CSS files (unless scrollbar/gap tweaks requested).

---

## Risks

| Risk | Mitigation |
|------|------------|
| Mock misread without vision | Task 0 confirm with labeled screenshot |
| Tall YouTube + Spencer overflow on short viewports | `minHeight` + parent scroll |
| Regression in Spencer/Hermes | Don’t touch `askSpencer` / `hermesHealth` |
| Duplicate Finance card (summary + Balances) | Summary stays snapshot; full data in Balances |

---

## Execution handoff

Plan saved. Next step: **Task 0** (you confirm row contents from PNG), then **Tasks 1–9** in one focused edit session.

Say **“execute the plan”** to implement, or reply with corrections to the Approved layout section.