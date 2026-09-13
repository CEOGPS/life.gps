---
name: react-jsx-debugging
description: "Diagnose React/JSX parse-time TypeScript errors (TS1128/TS1109/TS1005/TS2657) caused by structural brace/paren/tag imbalance, and verify with bun run typecheck."
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [debugging, react, jsx, typescript, frontend, syntax-errors]
    related_skills: [systematic-debugging, test-driven-development]
---

# React / JSX Parse-Time Debugging

## When to use
You get a TypeScript error like:
- `TS1128: Declaration or statement expected`
- `TS1109: Expression expected`
- `TS1005: ')' expected` / `')' expected`
- `TS2657: JSX expressions must have one parent element`

These are almost always **structural** (brace / paren / tag imbalance), NOT a missing
import or bad variable. The compiler points at the line where parsing first became
illegal — the real defect is **upstream**.

## Tight feedback loop (verify after every edit)
```
bun run typecheck        # = tsc -p ./jsconfig.json  (LifeOS1 / Vite + bun projects)
```
It reports ALL broken files at once. Read the whole list: separate siblings you didn't
touch (pre-existing) from the one you're fixing.

## Config blocker (fix before triaging code)
If `tsc` itself dies with:
```
error TS5103: Invalid value for '--ignoreDeprecations'
```
that is a BAD VALUE in `jsconfig.json` (e.g. `"6.0"`) masking every real error. Remove or
correct the option so the compiler runs, THEN triage the actual error list.

## Four recurring shapes + fixes
1. **Duplicate `return (...)`** — a stub `return` (often with an empty `/* placeholder */`
   comment) closes the component early; the REAL JSX then sits outside any function body →
   orphaned code → "missing declaration or statement".
   FIX: delete the stub `return` + its JSX. Keep exactly ONE `return ( ...real tree... );`.
2. **Stray `</div>`** — an extra `</div>` prematurely closes the root element, orphaning
   everything after it; the final `</div>` + `);` then has no open element → "Declaration or
   statement expected".
   FIX: remove the one surplus `</div>`. Recount: the root `<div>` opens once and must close
   once at the very end.
3. **Empty `&& ( )`** — `{(cond) && ( )}` with nothing between the parens is a syntax error.
   FIX: put a real element/expression inside, or delete the `&& (...)`. If it was meant to
   render a badge/indicator, fill it (e.g. a `<span>` showing derived state).
4. **Truncated `forwardRef`** — `React.forwardRef((props, ref) => (` opens but the file cuts
   off mid-component: missing the closing `)` + `);` + `.displayName = ...`.
   FIX: complete it by mirroring a sibling component in the same file (same
   `className={cn(...)}` + `{...props} />` shape), then close with `))` and a displayName.

## Workflow
1. `search_files` for the error's file; confirm whether siblings are also broken.
2. `read_file` the EXACT region around the reported line AND the function's opening `return (`.
3. Identify the shape by reading open/close balance — do NOT guess from the error line alone.
4. `patch` the precise block; re-run typecheck to confirm the error is gone AND no new ones
   appeared.
5. If multiple files are broken, fix all, then run typecheck once at the end — do not stop at
   the first green file.

## Notes
- This is a specialized frontend companion to `systematic-debugging`. The root-cause principle
  still applies: read the structure, reproduce via `bun run typecheck`, fix the imbalance,
  verify.
- These are syntax/parse errors — fixing them does NOT mean the codebase is fully type-clean.
  A green typecheck on the touched files may still leave deeper TS2322/TS2307 errors elsewhere
  (e.g. vendored `_core` libs, unrelated component prop typing). Scope your claim.

## Additional Pattern: Misplaced JSX Attribute as Child Text
If you see a JSX element where an attribute like `className`, `onClick`, etc. appears as a
child text node (e.g., `<span>\n  className={`...`}\n>`), the parser will treat it as
invalid JSX and often report errors like "Unterminated regular expression" or "Unexpected
token" on the following line. This happens because the attribute is not recognized as
such and the JSX element lacks a proper closing `>` or has unexpected content.

Fix: Move the attribute inside the opening tag, e.g.,
`<span className={`...`}>`.

