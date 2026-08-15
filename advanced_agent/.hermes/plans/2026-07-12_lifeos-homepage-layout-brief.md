# LifeOS Homepage Layout — Planning Brief (v2)

> **Mode:** Plan only. Implement when Chris says **execute the plan**.

**Goal:** Homepage matches `Untitled design (9).png` — asymmetrical glass grid, **all modules kept**, wiring unchanged.

**Single implementation file:** `src/components/lifeos/panels/DashboardPanel.jsx`

---

## Phase A — Confirm spec (you, ~2 min)

Compare mockup to this wireframe. Reply with **OK** or **edits** (module moves only).

```
┌──────────────────────────────────────────────────────────── max 1280px ────┐
│ [ optional banner / profile strip — full width ]                            │
├──────────┬──────────────────────────────┬───────────────────────────────┤
│ LEFT 3   │ CENTER 6                     │ RIGHT 3                        │
│ Time&Wx  │ ┌──────────────────────────┐ │ Notifications                  │
│ TASKS    │ │ YouTube (tall embed)     │ │ Finance (snapshot)             │
│ LINKS    │ └──────────────────────────┘ │ LEADS                          │
│          │ Spencer (Hermes)             │                                │
├──────────┴──────────────────────────────┴───────────────────────────────┤
│ Product Revenue (5) │ Financial Balances (4) │ Credit Score (3)         │
├─────────────────────┴──────────────────────┴────────────────────────────┤
│ Money Tips daily (6)              │ Life Hacks daily (6)               │
├───────────────────────────────────┴────────────────────────────────────┤
│ NOTES (4) │ Social Hub (2) │ Music Hub (2) │ Budget Tracker (4)         │
└──────────────────────────────────────────────────────────────────────────┘
```

**Open slot:** If mock puts NOTES on the right rail, swap: right rail = Notifications, Finance, **NOTES**; move LEADS to row 4.

---

## Phase B — What’s already in code

| Done | Pending |
|------|---------|
| `RailColumn` helper | Reorder JSX into rails + rows |
| `YouTubePlayer({ tall })` | Use `tall` in center column |
| `GridCard` + `gridColumn={false}` in rails | Remove flat 12-col card order |
| All handlers / storage keys | Banner visible when `bannerPic` set |

---

## Phase C — Implementation tasks (bite-sized)

| # | Task | Minutes | Done when |
|---|------|---------|-----------|
| C1 | `dashboardGridStyle` constant | 2 | One grid style object |
| C2 | Row 1 left `RailColumn` span 3 | 5 | Time → Tasks → Links stacked |
| C3 | Row 1 center span 6 | 6 | YouTube tall + Spencer |
| C4 | Row 1 right span 3 | 5 | Notifications, Finance, Leads |
| C5 | Row 2 finance | 5 | 5 + 4 + 3 spans |
| C6 | Row 3 tips | 4 | Money + Life 6+6 |
| C7 | Row 4 misc | 6 | Notes, Social, Music, Budget |
| C8 | Banner row | 4 | `bannerPic` renders |
| C9 | Visual pass | 5 | Glass, red edge hover, gap 10 |
| C10 | Ad-hoc verify script | 3 | All module titles present in source |

**Do not run** `lint` / `typecheck` until Chris approves look (your UI workflow).

---

## Phase D — Module inventory (must all remain)

1. Time & Weather  
2. TASKS, LINKS, LEADS, NOTES  
3. Spencer (Hermes), Notifications, Finance snapshot  
4. Product Revenue, Financial Balances, Credit Score, Budget Tracker  
5. Social Hub, YouTube, Music Hub  
6. Money Tips (daily), Life Hacks (daily)  

Supabase todos / AI tips / activity — if still in file, keep or document removal (currently secondary; not on wireframe).

---

## Phase E — Verification

**Ad-hoc (pre-commit):**
```bash
python %TEMP%\hermes-verify-dashboard-modules.py
# asserts RailColumn + 16 module title strings in DashboardPanel.jsx
```

**After visual OK:**
```bash
cd C:/dev/LifeOS1 && npm run lint && npm run typecheck
```

---

## Phase F — Out of scope (this plan)

- Hermes / Ollama / Copilot setup  
- New modules or panel routes  
- Responsive mobile breakpoints (unless mock is mobile-only — then add Task C11)

---

## Next action

1. You: **OK wireframe** or list moves (especially **NOTES** placement).  
2. Me: **execute the plan** → C1–C10 in one pass.  
3. You: eyeball `npm run dev` → approve → lint.

**Plans on disk:**
- `2026-07-12_lifeos-homepage-layout.md` — full task detail + code snippets  
- `2026-07-12_lifeos-homepage-layout-brief.md` — this brief  