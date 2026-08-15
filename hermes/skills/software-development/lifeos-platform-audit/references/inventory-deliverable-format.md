# LifeOS inventory deliverable format (Chris requirement)

When Chris asks for **every panel, module, feature** — this is the required output shape. **Do not** substitute a routed/unrouted list, a synopsis, or Appendix summaries alone.

## Delivery channel (critical)

If the user says **“where is the list”**, **“provide the list”**, or similar frustration:

1. **Put the list in the assistant message** — full markdown tables for completed sections; for gaps, explicit “not yet row-level” per panel name (no hiding behind files).
2. **Second line:** absolute path to `2026-07-13_MASTER-inventory-every-feature.md`.
3. **Do not** offer only the next pass name (“Part 2C”) without pasting content.
4. **Do not** do unrelated work (delegation, Hermes config) until the list is in the reply when that was the ask.

## Mandatory table columns

| Column | Content |
|--------|---------|
| **Feature / Module** | Named UI block, tab, or dead-code state |
| **Purpose** | What it is for the user / product |
| **UI elements** | Tabs, buttons, inputs, toggles, links (explicit labels) |
| **Data / insights shown** | What the user sees (metrics, copy, streams) |
| **Storage / API** | `localStorage` keys, KV keys, worker paths, Ollama, Hermes, ErebusCore |
| **Wired** | `Yes` / `Partial` / `No` / `Dead` (code exists, not in UI) |
| **Notes** | Blockers, mislabels, target vs today |

## Wired legend

- **Yes** — Works when dependencies (Ollama, worker OAuth, keys) are up.
- **Partial** — UI + some persistence; missing live API, sync, or cross-links.
- **No** — Broken or missing backend.
- **Dead** — State/handlers exist; **not rendered** or unreachable.

## Architecture language (use in every audit)

| Role | Name |
|------|------|
| Main operational brain | **Erebus** |
| Assistant to Erebus | **Kranos** |
| Personality skins / lighter workers | Zero, Inferno, Nova, Viper, Rage, Aurora, Breeze, … |
| Separate Hermes stack | **Spencer** (dashboard card + desktop Hermes — not dock) |
| Infra | Cloudflare Workers (`api.lifeos1.ceogps.com`) |
| Target UI | **One agent config panel**; dock = persona switch + toggle Breeze (Telegram) + Spencer; **proactive speech** with on/off |

Do **not** describe the target as “merge all LLMs into one anonymous brain” without the Erebus/Kranos/persona hierarchy.

## Repo artifact paths

- Canon: `C:/dev/LifeOS1/.hermes/plans/2026-07-13_architecture-canon.md`
- Master inventory (living doc): `C:/dev/LifeOS1/.hermes/plans/2026-07-13_MASTER-inventory-every-feature.md`
- Legacy summary: `2026-07-13_panel-inventory-complete.md` (supplement, not substitute for master)
- Chris annotated: `C:/dev/LifeOS1/.hermes/desktop-attachments/LifeOS1 Parts.xlsx` — see `references/chris-parts-spreadsheet.md`

## Pacing

- **No implementation** until Chris signs off the master inventory.
- After “go,” sync between **major chunks** — no long silent build runs.
- Inventory requests: **not brief**. Part 0–1 depth (shell + dashboard row-by-row) is the bar for every panel.

## Delegation

- Subagents for huge scans: pin **`qwen2.5-coder:latest`** — `qwen3.6` OOMs (~9.4 GB) on 4GB GPU hosts.
- If subagent fails, continue **in-session** into the master markdown file.