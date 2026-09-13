# Extraction & Repair Patterns (from LifeOS API Sheet session)

## Spreadsheet Extraction (messy 1800+ row × 77 col .xlsx)
- Use `py -3.13` (or equivalent with pip) — Hermes venv often lacks openpyxl/pip.
- Install: `py -3.13 -m pip install openpyxl --quiet`
- Scan first: max_row, max_column, count non-empty rows, print first 25-30 non-empty rows with heavy redaction (`str(v)[:12]+'***'`).
- Heuristic row collector (not full DataFrame):
  - Row vals = [str(c).strip() for c if c]
  - Key-like if col0 looks UPPER_SNAKE or contains API/KEY/TOKEN and a long value present.
  - Token detection: re prefixes sk-, gsk-, AIza, xai-, hf_, nyk_, EAAL, cfut_, sb_ etc.
  - Capture row, service guess, value preview, label (often col 2), account/email.
- For wide sheets: columns often act as "account buckets" — scan all non-empty cells.
- Dedup signal: service + first 15-20 chars of token value (or key name + account).
- **Never auto-drop multiples** — keep if user policy says "valid unique even if multiples per platform".

## "Verification status: stale" + Garbled Source Repair
When system says verification stale and lists TS1005/1127/1381 on specific lines (especially 692, 1113 area in DashboardPanel.jsx or DreamForge):

1. Scoped verification (full typecheck often times out):
   ```bash
   bunx tsc --noEmit --skipLibCheck 2>&1 | grep -E "error TS|DashboardPanel|DreamForge" | head -15
   ```

2. Read the exact lines with cat -A (reveals control chars):
   ```bash
   sed -n '1110,1116p' file.jsx | cat -A
   ```

3. Repair sequence that worked:
   - Global high-byte/mojibake strip (from prior bad sed):
     ```bash
     perl -i -pe 's/[\x80-\xFF]//g' file
     ```
   - Excise bad lines by signature:
     ```bash
     grep -v "ROW 1 (TOP): Time & Weather + TASKS + LINKS + LEADS" file > /tmp/f && mv /tmp/f file
     ```
   - Force specific lines:
     ```bash
     awk 'NR==692 { $0 = "  const [productInputs, setProductInputs] = useState(/** @type {InputMap} */ ({}));" } 1' file > /tmp/f && mv
     ```
   - Block rebuild when line corruption has embedded content/newlines:
     ```bash
     LINE_GRID=$(grep -n "div style={grid}" file | head -1 | cut -d: -f1)
     head -n $LINE_GRID file > /tmp/f
     cat >> /tmp/f << 'EOL'
     clean block here
     EOL
     tail -n +$LINE_TASKS file >> /tmp/f && mv /tmp/f file
     ```
   - Phrase line replace as last resort:
     ```bash
     sed -i '/SIGNATURE/s/.*/        clean comment/' file
     ```

After repair: re-run scoped grep verification. Summarize "targeted errors gone".

## Dual Output Pattern
- Human .md table (with policy notes at top).
- Structured .xlsx (same columns, formatted).
- Always include: category, service, key name, redacted value, account/notes, usage notes.
- Top matter: user rules (Nylas grant, Meta for leads, keep useful multiples, free-tier mapping, AI order).

## Wiring Pattern
- VITE_ in .env.local for client-safe.
- Worker env/secrets for anything sensitive (Nylas grants, full Meta tokens, CF tokens, service keys).
- Reference in panels via import.meta.env or worker fetch.
- Existing worker already does proxying — extend the env map or NEW_KEYS section.
- Panels to update: EmailPanel (Nylas), Social/Agents (Meta), CloudflarePanel, Integrations.

These patterns were battle-tested on the LifeOS credential dump + verification enforcement loop.
