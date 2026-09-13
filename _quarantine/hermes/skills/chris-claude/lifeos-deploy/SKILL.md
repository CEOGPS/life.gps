---
name: lifeos-deploy
description: Use when shipping LifeOS1 to Cloudflare Pages (lifeos1.pages.dev): bun run build then wrangler pages deploy.
version: 1.0.0
author: Chris Green (imported from Claude Build skills)
license: MIT
metadata:
  hermes:
    tags: [chris-claude, lifeos, imported]
    related_skills: []
    source: C:/dev/.claude/skills/deploy
---

Run the following commands in sequence:

1. Build the project:
   ```
   bun run build
   ```

2. Deploy to Cloudflare Pages:
   ```
   npx wrangler pages deploy dist --project-name=lifeos1
   ```

If wrangler prompts for login, run `npx wrangler login` first (opens browser).

After a successful deploy, the changes are live at https://lifeos1.pages.dev.
Report the deployment URL to the user when complete.
