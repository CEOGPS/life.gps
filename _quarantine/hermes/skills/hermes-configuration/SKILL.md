---
name: hermes-configuration
description: "Configure Hermes Agent (models, providers, tool_loop_guardrails, compression, display, approvals) for reliability, to prevent tool repetition loops, and to match user preferences for direct/concise behavior."
version: 1.0.0
author: Spencer (from session learning)
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [hermes, configuration, guardrails, anti-stuck, model, compression, reliability]
    related_skills: [hermes-agent, systematic-debugging]
---

# Hermes Configuration

## Core Principle
Configure once for the user's expected behavior. The most common failure mode is "the agent gets stuck repeating tools" — this is preventable via explicit guardrails and defaults. User signal: "I thought we set it up to where you wouldnt get stuck". Treat this as a setup requirement, not an afterthought.

## Tool Loop Guardrails (Anti-Stuck)
These are the primary controls for preventing repetition.

**Recommended production values** (tightened from defaults for early warning + hard stop):

```yaml
tool_loop_guardrails:
  warnings_enabled: true
  hard_stop_enabled: true
  warn_after:
    exact_failure: 2
    same_tool_failure: 2
    idempotent_no_progress: 2
  hard_stop_after:
    exact_failure: 5
    same_tool_failure: 4
    idempotent_no_progress: 5
```

**Apply with config set (preferred for precision):**
```bash
hermes config set tool_loop_guardrails.hard_stop_enabled true
hermes config set tool_loop_guardrails.warn_after.same_tool_failure 2
hermes config set tool_loop_guardrails.hard_stop_after.same_tool_failure 4
# Mirror for other keys as needed
```

**Inspect:**
- `hermes config show` (human-readable)
- Direct read of the config.yaml file for exact nested structure and values

See `references/tool-loop-guardrails.md` for the exact before/after from the session that surfaced the user correction, plus commands and verification steps.

### When to Verify / Apply
- First run after profile creation or model change
- Any report of repetition, "tool loop warning", or the agent continuing identical tool calls
- Before long autonomous runs

## Model & Provider
- Default to capable local models when available (e.g. qwen3.6:latest or equivalent 7B+ coder variants) for better loop recognition and reasoning to pivot.
- Maintain fallback chain with at least one strong local + one cloud option.
- Set via `hermes model` or direct `hermes config set model.default ...`

## Compression & Turn Limits
- `compression.enabled: true` (threshold ~0.5)
- `agent.max_turns: 150` (or tuned per workload)
- Protects against runaway context while preserving recent history.

## Other High-Impact Settings
- `display.personality: concise` (or technical; embed user's direct/substance-over-filler preference)
- `approvals.mode`: smart (or off only in trusted automation)
- `tool_progress: all` for visibility without noise
- Checkpoints enabled for recovery

## Workflow for Changes
1. Use `hermes config set key.subkey value` for atomic, safe edits.
2. Verify with `hermes status`, `hermes doctor`, and direct config file read.
3. Test the change with a prompt that previously triggered the unwanted behavior.
4. Record the rationale in this skill or its references.

## Pitfalls
- Leaving `hard_stop_enabled: false` (allows continuation past warnings).
- Thresholds left at loose defaults (3/8 for same_tool_failure) → user sees the stuck state before the agent self-corrects.
- Relying only on formatted `config show` output when you need precise keys for scripts or comparison.
- Not re-verifying after model/provider switches.
- One-off manual fixes instead of persisting the config change.

## User Preference Embedding
User expects concise, direct responses with substance over filler or politeness theater. Configuration tasks should produce exact commands, before/after snippets, and verification steps — no extra framing. Push back on weak defaults (e.g. guardrails disabled).

This skill governs all Hermes configuration work. Load it when changing models, guardrails, or tuning for reliability.
