---
name: lifeos-electron-build
description: Use when packaging LifeOS1 as Electron desktop app (ELECTRON=true build + electron-builder → dist-electron/).
version: 1.0.0
author: Chris Green (imported from Claude Build skills)
license: MIT
metadata:
  hermes:
    tags: [chris-claude, lifeos, imported]
    related_skills: []
    source: C:/dev/.claude/skills/electron-build
---

Build the Electron desktop app using the ELECTRON=true flag (required for relative base paths under the file:// protocol):

On Windows (PowerShell):
```
$env:ELECTRON="true"; bun run build; electron-builder
```

On Mac/Linux:
```
ELECTRON=true bun run build && electron-builder
```

Output goes to `dist-electron/`.

Targets:
- Windows: NSIS installer
- Mac: .dmg
- Linux: AppImage

For dev mode (hot reload with Electron window): `bun run electron:dev`
