# Hermes Tool Loop Guardrails

**Session context:** 2026-07-13 conversation on Hermes. User explicit signal: "I thought we set it up to where you wouldnt get stuck".

## Pre-fix (the gap)
```yaml
tool_loop_guardrails:
  warnings_enabled: true
  hard_stop_enabled: false
  warn_after:
    exact_failure: 2
    same_tool_failure: 3
    idempotent_no_progress: 2
  hard_stop_after:
    exact_failure: 5
    same_tool_failure: 8
    idempotent_no_progress: 5
```

## Fix applied in session
```bash
hermes config set tool_loop_guardrails.hard_stop_enabled true
hermes config set tool_loop_guardrails.warn_after.same_tool_failure 2
hermes config set tool_loop_guardrails.hard_stop_after.same_tool_failure 4
```

Resulting values (verified via direct yaml read + config show):
- hard_stop_enabled: true
- same_tool_failure warn=2 / hard=4 (and mirrored for related keys)

Also set model.default to stronger local (qwen3.6:latest) for improved reasoning on when to stop/pivot.

## Commands & verification used
- hermes config set ...
- hermes config show | inspection
- Direct cat/read of C:\Users\chris\AppData\Local\hermes\config.yaml (or equivalent path)
- hermes status / doctor for overall health

## Captured lesson
User treats non-stuck tool behavior as a baseline expectation. Guardrails must be explicitly enabled and tightened; do not rely on defaults. Direct file inspection is reliable for exact config. Persist via this skill so every future session starts with the protection already in place.

Update this reference with any new experiments, model-specific behaviors, or additional keys.
