---
name: remove-base44-from-dashboard
description: Remove Base44 SDK from dashboard components and replace with local alternatives.
version: 0.1.0
author: Hermes
metadata.hermes.tags:
  - Frontend
  - Base44
  - Cleanup
---

# Remove Base44 SDK from Dashboard Components

Remove Base44 SDK dependencies from LifeOS1 dashboard components and replace API calls with local alternatives.

## When to Use
- When you need to remove Base44 SDK from dashboard components.
- When you need to replace Base44 API calls with local alternatives (e.g., localStorage, custom backend).
- When you need to clean up package.json and vite.config.js files.

## Prerequisites
- Access to LifeOS1 project root (C:/dev/LifeOS1).
- Node.js environment with npm or bun installed.
- Ability to edit JSON and JavaScript files.

## How to Run
Invoke through the `terminal` tool to navigate directories, `read_file` to inspect files, `patch` to modify files, and `write_file` to replace API call implementations.

## Quick Reference
- `terminal` tool for directory navigation and running commands.
- `read_file` for inspecting package.json and vite.config.js.
- `patch` for removing dependencies and configuration blocks.
- `write_file` for replacing Base44 API call files with local alternatives.

## Procedure
1. **Discovery**: Search for Base44 references across the entire project root, not just a single panel.
   Use `search_files` with path `C:/dev/LifeOS1` and pattern `base44`.
2. **Dependency Removal**: Remove `@base44/sdk` and `@base44/vite-plugin` from ALL `package.json` and `vite.config.js` files across all affected sub-apps (e.g., CreatorOS1, VeritonOS1, OmniSearchOS1).
3. **Local Client Implementation**: Establish a shared local client (e.g., `src/api/lifeosClient.js`) that wraps existing AI routers (like `ceogpsclient.jsx`) to provide a consistent interface for image/video/LLM generation, matching the expected Base44 SDK shape.
4. **Asset Rewiring**: Identify any external `media.base44.com` URLs in UI components (especially in `AgentDock.jsx`) and replace them with local asset paths (e.g., `/agents/*.png`).
5. **Recursive Purge**: Delete orphaned Base44 directories, `base44Client.js` files, and associated configuration files once they are no longer needed for reference.
6. **Verification**: Run `bun run build` to ensure no imports are broken and all references are resolved.

## Pitfalls
- **Stale Imports**: Forgetting to remove Base44 imports in deep sub-pages (e.g., `Studio.jsx`, `TextTolmage.jsx`).
- **Broken Assets**: Replacing URLs with local paths that don't actually exist in the public directory.
- **Partial Purge**: Removing the SDK but leaving the `vite-plugin` in `vite.config.js`, which can lead to build warnings or failures.
- **C-Import Errors**: Some components may still reference legacy Base44 clients; use `search_files` globally to catch these.

## Verification
- Run `bun run build` and confirm the build completes without Base44-related errors.
- Check that `package.json` no longer contains `@base44/sdk` or `@base44/vite-plugin` entries.
- Verify that dashboard components load in the browser without Base44 error messages in the console.