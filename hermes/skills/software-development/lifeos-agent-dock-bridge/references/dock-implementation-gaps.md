# Dock implementation gaps (2026-07-13)

- `LifeOSShell` passes `active`/`setActive` to `AgentDock`; `layout/AgentDock.jsx` **ignores props**.
- Unified AI target: Hermes + Ollama spine; persona only — see **`lifeos-platform-audit`**.
- Stubs: follow avatar, openDock from dashboard, Hermes `computer_use` in dock.

Cross-ref: `lifeos-platform-audit/references/not-implemented-checklist.md`