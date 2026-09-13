---
name: api-key-organization
description: Use when user provides a messy credential spreadsheet, list, or dump and needs deduplication (while preserving useful multiples per platform), categorization, free-tier mapping, user-specific rules applied, and dual structured outputs (.md table + .xlsx) plus wiring guidance into a web app (Vite .env + worker secrets + panels).
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [credentials, api-keys, spreadsheet, dedup, integration, env, workers, wiring]
    related_skills: [systematic-debugging, productivity, frontend-visual-refactoring]
---

# API Key Organization & Wiring

## Overview
Users often hand over huge, chaotic credential dumps (e.g. 1800+ row, 77-col .xlsx with mixed keys, code fragments, duplicates, notes). The goal is to turn this into a clean, deduplicated, categorized vault that respects user rules (e.g. "keep valid unique keys even if multiples per platform", specific account grants, "use Meta for leads", no-cost first), produces usable artifacts (.md table + structured .xlsx), and provides concrete wiring steps for the app (.env.local VITE_ entries + worker secrets + panel updates).

Core principle: Never blindly dedupe. Apply user policy per platform. Output dual artifacts. Distinguish client-safe vs secret keys. Always produce actionable next steps for wiring.

## When to Use
- User attaches or points to "API Sheet.xlsx", "keys spreadsheet", "clusterfuck of API keys".
- Task includes "organize and duplicates removed", "categorize", "map to no cost", "create clean .md table ... in a structured Excel".
- Follow-up includes "wire all of the valid keys into the dashboard", "reconfigure workers", "update .env".
- User gives platform-specific rules (e.g. Nylas grant for one email, Meta for lead sourcing).

Don't use for:
- Single known key ("what is my OpenAI key?").
- Pure secret rotation without organization.
- One-off .env edit without spreadsheet source.

## Workflow

1. **Locate and inspect the dump**
   - Confirm path (user often says "Downloads/API Sheet.xlsx").
   - Use the right Python (avoid venv without pip; prefer `py -3.13` or the one with openpyxl/pandas).
   - Install if needed: `py -3.13 -m pip install openpyxl --quiet`.
   - Quick scan: sheet count, rows/cols, non-empty rows, first 20-30 non-empty rows with redacted values (`str(v)[:12]+'***'`).

2. **Targeted extraction (heuristic, not full pandas load for huge files)**
   - Iterate rows.
   - Detect key-like rows by UPPER_SNAKE names in col 0 + long token-like values (prefixes: sk-, gsk-, AIza, xai-, hf_, nyk_, EAAL, cfut_, sb_).
   - Capture service name, value (preview only in logs), label, associated account/email, row number.
   - For wide sheets (dozens of columns), treat columns as "account buckets" — scan all non-empty cells per row.

3. **Apply dedup + user policy**
   - Dedup key: service name + value signature (first 15-20 chars of token).
   - **Do not drop multiples** if they are useful per user policy (different accounts, different grants, active vs backup).
   - Apply explicit user rules immediately:
     - Nylas: promote the specific grant (e.g. cagednreality@icloud.com). Note "forward other emails here".
     - Meta: tag all as "Lead Sourcing" priority.
     - Cloudflare: keep distinct tokens + existing worker URLs.
     - AI: group by free-tier strength.
   - Categorize on the fly (Email & Comms, Social - Meta/Facebook (Leads), Infra - Cloudflare Workers, Infra - Supabase, AI - Free Tier Preferred, etc.).

4. **Produce dual artifacts**
   - `.md` table: human-readable, with policy notes at top, columns: Category | Service | Key Name | Value (redacted) | Account/Notes | Usage Notes.
   - `.xlsx`: structured for further editing, same columns, formatted header.
   - Write both to `docs/` or project root. Include summary stats (total candidates, dups found, key categories).

5. **Wiring guidance (always included)**
   - Client-safe (VITE_ prefix): Supabase anon, public worker URLs, some AI keys.
   - Secrets: Nylas grants, full Meta tokens, CF tokens, service-role keys → worker environment variables only.
   - Update patterns:
     - Append to `.env.local` with comments.
     - Add to worker code (env.XXX or NEW_KEYS map).
     - Panels: reference via `import.meta.env.VITE_...` or worker fetch.
   - Cloudflare-specific: reconfigure existing (list workers, deploy new scripts for scraping/proxy).
   - Persistence note: map Supabase/Pocketbase keys to central store (lifeStore pattern).

6. **AI model routing note (if present)**
   - Group AI keys by no-cost strength.
   - Document user preference order (Groq/Gemini/Deepseek/HF > local Qwen/Ollama > Hermes > Grok/xAI > paid fallbacks).
   - Note that existing MODEL_OPTIONS in ceogpsclient often already support the free ones (qwen, deepseek, groq, gemini).

7. **Verification & handoff**
   - List the kept keys (redacted).
   - Highlight user-specific decisions.
   - Give exact next commands: "paste full values", "set worker secrets", "restart dev", "test EmailPanel with Nylas grant".
   - Flag follow-ups (Supabase table review, new worker routes for Meta lead pull).

## Common Pitfalls
- Treating every duplicate as noise — user often wants "keep valid unique even if multiple per platform".
- Putting full secrets in client .env or hardcoding in JSX.
- Using the wrong Python (Hermes venv often lacks pip/openpyxl; use `py -3.13`).
- Full pandas load on 1800×77 mess — use row-by-row + heuristics + redaction in logs.
- Forgetting the dual output — user specifically asked for both clean .md table and structured Excel.
- Ignoring account context (different Nylas grants per email).
- Skipping the wiring step — the task is rarely "just organize", it's "so we can start seeing what is actually working".

## Quick Reference Commands
```bash
# Inspect
py -3.13 -m pip install openpyxl --quiet
py -3.13 -c 'import openpyxl; wb=...; print(wb.active.max_row, ...)' 

# Extraction + clean artifacts (see session patterns for the heuristic script)
# Then:
cat >> .env.local << 'EOL'
# cleaned keys here (VITE_ for safe, comments for secrets)
EOL

# Worker secrets reminder
# Set in Cloudflare dashboard: NYLAS_GRANT_CAGED, META_USER_ACCESS_TOKEN, etc.
```

## Verification Checklist
- [ ] Spreadsheet path confirmed and structure summarized (rows/cols, non-empty).
- [ ] Extraction captured key candidates with row numbers and accounts.
- [ ] User rules applied (Nylas specific grant, Meta for leads, keep useful multiples).
- [ ] Clean .md table + .xlsx produced in docs/ (or specified location).
- [ ] .env.local and/or worker updated with structure + comments.
- [ ] Wiring next steps listed (which panel, which worker route, which secret).
- [ ] Free-tier mapping and AI routing documented.

## References
- See session transcripts for full extraction heuristics and exact redacted output examples (kept in conversation history, not repeated here).
