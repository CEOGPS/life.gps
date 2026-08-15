---
name: assess-and-remove-third-party-dashboard-deps
description: Assess dashboard structure and remove third-party dependencies like Base44 SDK.
version: 0.1.0
author: Hermes
metadata.hermes.tags:
  - Frontend
  - Dashboard
  - Dependency Removal
  - Base44
---

# Assess and Remove Third-Party Dashboard Dependencies

Assess dashboard component structure, identify third-party dependencies (like Base44), and replace them with local implementations.

## When to Use
- When inheriting a dashboard built with third-party platforms (like Base44) that need to be made self-contained.
- When you need to audit dashboard components for external SDK usage.
- When replacing platform-specific APIs with localStorage or custom backend implementations.

## Prerequisites
- Access to the project root directory.
- Ability to search files and read configuration files.
- Node.js/bun environment for checking package.json.
- Text editor for modifying source files.

## How to Run
Invoke through the `terminal` tool for navigation and commands, `search_files` for finding dependencies, `read_file` for inspecting configurations, and `patch`/`write_file` for making changes.

## Quick Reference
- `terminal` tool for directory navigation and running build commands.
- `search_files` for finding third-party references.
- `read_file` for inspecting package.json and config files.
- `patch` for removing dependencies from configuration files.
- `write_file` for replacing API call implementations.

## Procedure
1. **Assess current dashboard structure**:
   - Use `search_files` to locate dashboard components (look for DashboardWidgets.jsx, dashboard-related files).
   - Use `search_files` to find third-party references (search for "base44", SDK names, platform-specific imports).
   - Examine package.json files for third-party dependencies.

2. **Document third-party usage**:
   - Note all files importing or using the third-party SDK.
   - Identify specific API calls being made (data storage, authentication, media processing, etc.).
   - Check for platform-specific configuration files (vite.config.js, webpack.config.js, etc.).

3. **Plan removal strategy**:
   - For each third-party API call, determine local equivalent (localStorage, IndexedDB, custom backend endpoints).
   - Identify configuration that needs removal (plugin imports, SDK initialization).
   - Determine which files need complete replacement vs. modification.

4. **Remove third-party dependencies**:
   - Use `patch` to remove SDK dependencies from package.json files.
   - Use `patch` to remove SDK imports and configuration from build config files (vite.config.js, etc.).
   - For each usage site:
     * Use `read_file` to examine the current implementation
     * Use `write_file` to replace with local alternative
     * Replace data persistence with localStorage/sessionStorage
     * Replace API calls with mock functions or local endpoints
     * Remove platform-specific initialization code

5. **Verify changes**:
   - Use `terminal` to run `bun run build` or equivalent build command.
   - Check for any remaining third-party references.
   - Test dashboard functionality in development mode.

## Pitfalls
- Missing scattered third-party imports in deeply nested components.
- Overlooking indirect dependencies (packages that depend on the SDK).
- Forgetting to remove configuration that initializes the SDK.
- Not properly replacing asynchronous API calls with synchronous local alternatives.
- Overlooking environment variables or build flags specific to the third-party platform.

## Verification
- Run the build command and confirm zero errors related to the removed third-party SDK.
- Search the codebase for any remaining references to the removed SDK/package names.
- Verify dashboard loads and core functionality works without SDK-dependent features.