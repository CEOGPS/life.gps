# Global CSS migration + dead dashboard UI (Chris)

## Global CSS rule
Move layout, card chrome, and palette tokens from per-panel inline `style={{}}` and `const C = {...}` into **`src/index.css`**. Detail: **`references/lifeos-global-panel-css.md`**.

## Inventory delivery
When Chris asks for **the list**, paste the full inventory in the reply immediately (not only file paths or subagent status). Authoritative annotated copy: `LifeOS1 Parts.xlsx` + master markdown under `.hermes/plans/`.

## Before layout rebuild
Load **`lifeos-platform-audit`**. Restore or wire dead dashboard UI: banner, weather, `aiTips`, Supabase block (per inventory).