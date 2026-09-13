# Appearance-First + Daily/Vibrant Modules Patterns (from dashboard stabilization session)

## Core Rule
When user says: "First lets get the appearance of the dashboard taken care of. I dont want to get things working, then make changes to the look and it break something" — **complete all visual work (sizes, gaps, hover, glass, casts, module additions, accents) before any data/API wiring**.

## Specific Techniques Captured
- **Smaller tiles + small gaps**: 
  - minHeight: 110px
  - padding: '8px 10px 4px 10px' (asymmetric, less bottom)
  - gap: 6
  - Update gridAutoRows and container padding accordingly.

- **Edge-only hover (less red)**: 
  - Replace full spotlight + dot grid with thin border glow:
    `border: isHovered ? '1px solid #00ff9d' : '1px solid rgba(255,255,255,0.1)'`
  - Reduce opacity on any remaining red layers.

- **Thin notifications module** (top row, above Leads):
  - Small minHeight (~70px)
  - Vibrant border for noticeability.

- **Vibrant leads / dynamic items**:
  - Add `style={{ borderLeft: '3px solid #00ff9d' }}` (or full thin border) on LEADS or new-content cards.

- **Daily non-repeating 10-item lists** (Life Hacks, Money Tips):
  - Master list of ~20 items.
  - Date-seeded: `const day = new Date().getDate() + new Date().getMonth()*31; const start = day % (list.length-10); return list.slice(start, start+10);`
  - Per-item `+` button:
    - Saves to localStorage (key: 'savedLifeHacks' / 'savedMoneyTips')
    - `alert('Saved — will sync to spreadsheet via worker later.')`
  - Footer note: "10 daily • no repeats • + → spreadsheet"

- **Finance panel**: Simple static summary card (balances, revenue, credit) with note for full integration.

- **Media (YouTube / Music Hub)**: Keep minimal embeds. Add comment: "Move player to main shell or Erebus for persistence when leaving the page / follow-you-around."

- **Blue haze removal (after every geometry change)**:
  - Force in .liquid-glass (CSS):
    ```
    background: linear-gradient(to bottom, #050505, #0a0a0a, #0f0f0f, #0a0a0a, #050505) !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.03) !important;
    ```
  - Inline on glass div: `background: 'transparent'`
  - Recovery pass is mandatory after any size/padding/span change.

## Post-Edit Syntax Recovery (Critical for Visual Batches)
After heavy sed/patch/inserts for visuals (new cards, daily lists, input rows, comments):

**Immediate mandatory steps:**
1. `perl -i -pe 's/[\x80-\xFF]//g' DashboardPanel.jsx` (and any other edited .jsx)
2. Use `sed -n 'N,Np' file | cat -A` to expose mojibake (M-bM-^ etc.) or extra `)` / missing `</div>`.
3. Targeted fixes:
   - Extra `)` on useState: `sed` or patch to `useState(load(...));` or `useState({});` (plain for parser safety).
   - Garbled alert: `alert(\`Saved "${item}" will sync...\`);`
   - Missing child closer (e.g. TASKS input row div): insert `</div>` before `</GridCard>`.
   - Orphan fragments (e.g. stray `icon=...` `gridColumn=...` after LEADS `</GridCard>`): remove entire block with python re or precise sed so LEADS flows directly to next card.
4. Re-inspect exact error lines (the reminder will cite 692 for casts, 1113 for helpers).
5. For JSDoc casts triggering `')' expected`: simplify the suspect one(s) to `useState({});` (keep others if they parse).

**esbuild vs tsc difference**: `as any` often passes loose tsc but fails esbuild transform during `vite build` with "Expected ) but found as". Prefer plain objects or clean JSDoc.

**GridCard balancing after additions**:
- New modules (Notifications, Finance) or daily content can leave unclosed inner divs or attribute-only fragments.
- Always re-read the affected GridCard block + previous/next sibling after edits.
- Count opens/closes in the grid section as quick sanity.

## Verification on Creative/UI Work
- Browser vision + snapshot is the oracle.
- System may force `bun run typecheck` or `npx vite build` after edits even when guideline says hold off until user likes the result.
- Always: strip bytes + read the exact failing lines (cat -A) + targeted repair, then report current state without claiming "fully verified" on visuals.
- Do not use passing tsc as evidence the *look* is good.

## Related
See main SKILL.md for base workflow, glass destruction pitfalls, and browser loop. See vertical-compactness-and-bottom-padding.md for padding patterns.
