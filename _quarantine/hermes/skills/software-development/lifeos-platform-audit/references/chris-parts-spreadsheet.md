# Chris annotated inventory — LifeOS1 Parts.xlsx

## Location

- **Primary:** `C:/dev/LifeOS1/.hermes/desktop-attachments/LifeOS1 Parts.xlsx`
- May also appear as a Hermes desktop attachment in chat.

## Structure

Same inventory rows as the master markdown (shell, dock, dashboard modules, 31 routes, nested, unrouted), plus column:

**Instructions on what to do** — per-row build/fix/priority notes from Chris (e.g. wire Erebus immediately, unified Messages inbox, rename KPI → Life Sheets, discard standalone simulators).

## How agents should use it

1. Read with `read_file` on the `.xlsx` path (auto-extracts Sheet1 to text).
2. Treat **Wired** + **Notes** + **Instructions** together as the acceptance spec for that row.
3. When starting implementation, sort by Chris’s P0 language in Instructions (Integrations, Erebus/Kranos, Email, persistence, Notifications).
4. Update `2026-07-13_MASTER-inventory-every-feature.md` when code changes; optionally export/sync back to Excel only if Chris asks.

## Relation to master markdown

| Artifact | Role |
|----------|------|
| `MASTER-inventory-every-feature.md` | Agent-authored truth from code |
| `LifeOS1 Parts.xlsx` | Chris-authored priorities and corrections on top |

Do not implement from spreadsheet alone without reconciling against current `LifeOSShell.jsx` / panel sources.