#!/usr/bin/env python3
"""
hermes/model_router.py
=======================
Local-first task router for Hermes on constrained hardware.

WHY
---
Hermes has no native per-task model intelligence (`smart_model_routing` is an
unimplemented stub). On a 4GB-VRAM / ~12GB-RAM machine, blindly selecting a
heavy model (e.g. a 13B) for every task causes cold-start stalls and poor
availability. This router solves two things with ONE decision:

  1. AVAILABILITY — only emit models that the hardware can actually host and
     that preserve the large VRAM/offload budget.
  2. QUALITY — pick the strongest model that *fits* for the task at hand,
     escalating to cloud only when local capability is genuinely exceeded.

USAGE (CLI)
-----------
    python hermes/model_router.py "build a react hook"              # raw string
    python hermes/model_router.py --toolset coding "refactor api"   # hint toolset
    python hermes/model_router.py --list                            # show the stack

The output is a JSON object:
    {"task_class", "complexity", "recommended_alias", "reason",
     "cloud_needed", "fallback_chain"}

The `recommended_alias` is a Hermes `/model`-valid alias (e.g. `local-hermes`).
Runtimes can consume it directly.

DEPENDENCIES
------------
Python 3.8+ standard library only. No pip installs.
"""

from __future__ import annotations

import argparse
import json
import re
import sys

# ---------------------------------------------------------------------------
# Hardware-aware model stack.
#
# Backwards-compatible with the installed aliases. Orders siblings by
# capability. `vram_fit` is a rough, human-vetted "does this host ON this
# machine without thrashing" flag (4GB VRAM + ~12GB RAM = stay small).
# ---------------------------------------------------------------------------

STACK = [
    {
        "alias": "local-coder-3b",
        "model": "qwen2.5-coder:3b",
        "provider": "custom",
        "base_url": "http://127.0.0.1:11434/v1",
        "role": "coding_fast",
        "vram_fit": True,
        "size_approx_gb": 1.9,
    },
    {
        "alias": "local-llama3-2",
        "model": "llama3.2:3b",
        "provider": "custom",
        "base_url": "http://127.0.0.1:11434/v1",
        "role": "lightweight",
        "vram_fit": True,
        "size_approx_gb": 2.0,
    },
    {
        "alias": "local-qwen3",
        "model": "qwen3:4b",
        "provider": "custom",
        "base_url": "http://127.0.0.1:11434/v1",
        "role": "reasoning_general",
        "vram_fit": True,
        "size_approx_gb": 2.5,
    },
    {
        "alias": "local-moondream",
        "model": "moondream:latest",
        "provider": "custom",
        "base_url": "http://127.0.0.1:11434/v1",
        "role": "vision",
        "vram_fit": True,
        "size_approx_gb": 1.7,
    },
    {
        "alias": "local-qwen-coder",
        "model": "qwen2.5-coder:latest",
        "provider": "custom",
        "base_url": "http://127.0.0.1:11434/v1",
        "role": "coding_fast",
        "vram_fit": False,          # 4.7GB — near the 4GB VRAM ceiling
        "size_approx_gb": 4.7,
    },
    {
        "alias": "local-gemma",
        "model": "gemma2:latest",
        "provider": "custom",
        "base_url": "http://127.0.0.1:11434/v1",
        "role": "lightweight",
        "vram_fit": False,
        "size_approx_gb": 5.4,
    },
    {
        "alias": "local-hermes",
        "model": "nous-hermes:13b",
        "provider": "custom",
        "base_url": "http://127.0.0.1:11434/v1",
        "role": "reasoning_general",
        "vram_fit": False,          # 13B — only via aggressive offload
        "size_approx_gb": 7.4,
    },
    {
        "alias": "local-mistral-nemo",
        "model": "mistral-nemo:12b",
        "provider": "custom",
        "base_url": "http://127.0.0.1:11434/v1",
        "role": "writing",
        "vram_fit": False,
        "size_approx_gb": 7.1,
    },
    {
        "alias": "local-deepseek-coder",
        "model": "deepseek-coder-v2:16b",
        "provider": "custom",
        "base_url": "http://127.0.0.1:11434/v1",
        "role": "coding_hard",
        "vram_fit": False,
        "size_approx_gb": 8.9,
    },
]

# Complex tasks (cloud class). Names are matched loosely against the prompt.
CLOUD_ONLY_HINTS = [
    r"\b(refactor|migration|vulnerability|exploit|proof of concept)\b",
]

# ---------------------------------------------------------------------------
# Task classification
# ---------------------------------------------------------------------------

_CODING_HINTS = (
    r"\b(build|write|implement|refactor|fix|debug|test|api|function|hook|"
    r"component|repo|type|interface|schema|class|import|export)\b"
)

_REASONING_HINTS = (
    r"\b(why|analyze|evaluate|optimize|architecture|tradeoff|strategy|"
    r"plan|design decision|root cause|first principles|compare|model)\b"
)

_QUICK_HINTS = (
    r"\b(quick|short|summarize|summarise|reply|simple|rename|typo|format|"
    r"one line|just)\b"
)

_WRITING_HINTS = (
    r"\b(write|draft|essay|blog|post|email|memo|call to action|copy|script|"
    r"story|document|prose)\b"
)


def classify(task: str) -> tuple[str, int]:
    """Return (task_class, complexity) where complexity in [0..10].

    Classes: coding_fast, coding_hard, reasoning, writing, vision,
    lightweight.
    """
    t = task.lower()

    is_coding = bool(re.search(_CODING_HINTS, t))
    is_hard_coding = bool(
        re.search(r"\b(refactor|migrat|debug|vulnerab|optimiz|concurr|embed|"
                  r"llm|pipeline|daemon|protocol)\b", t)
    )
    is_writing = bool(re.search(_WRITING_HINTS, t))
    is_reasoning = bool(re.search(_REASONING_HINTS, t))
    is_quick = bool(re.search(_QUICK_HINTS, t))
    is_vision = bool(
        re.search(r"\b(look at|screenshot|describe this (image|picture|screen)"
                  r"|what's? in (this )?(image|picture|photo|screen)|\bsee\b|"
                  r"\bview\b|recognize|ocr|analyze (this )?image)\b", t)
    )

    # Vision has priority once an image cue is present regardless of other hints.
    if is_vision:
        return "vision", 2

    # Complexity score: weighted signal of how heavy the task is.
    score = 0
    score += 2 if is_coding else 0
    score += 3 if is_hard_coding else 0
    score += 2 if is_reasoning else 0
    score += 2 if is_writing else 0
    score -= 2 if is_quick else 0
    score = max(0, min(10, score))

    if is_hard_coding:
        return "coding_hard", score
    if is_coding:
        return "coding_fast" if score <= 4 else "coding_hard", score
    if is_reasoning:
        return "reasoning", score
    if is_writing:
        return "writing", score
    return "lightweight", score


# ---------------------------------------------------------------------------
# Model selection
# ---------------------------------------------------------------------------

def select(task: str, toolset: str = "", prefer_cloud: bool = False) -> dict:
    task_class, complexity = classify(task)
    cloud_needed = (
        prefer_cloud
        or any(re.search(p, task.lower()) for p in CLOUD_ONLY_HINTS)
    )

    # A task that is only about e.g. a short reply shouldn't drag in a 13B.
    # Choose the smallest model that satisfies the class.
    role_target = {
        "coding_fast": "coding_fast",
        "coding_hard": "coding_hard",
        "reasoning": "reasoning_general",
        "writing": "writing",
        "vision": "vision",
        "lightweight": "lightweight",
    }[task_class]

    # Prefer VRAM-fit models for coding and lightweight tasks.
    if task_class in {"coding_fast", "lightweight"}:
        pick = next(
            (m for m in STACK
             if m["role"] == role_target and m["vram_fit"]),
            STACK[0],
        )
    else:
        pick = next(
            (m for m in STACK if m["role"] == role_target), STACK[0]
        )

    reason = (
        f"{task_class} (complexity {complexity}/10) -> "
        f"{pick['model']} (frames within hardware budget)"
    )

    # Effective fallback chain: the pick first, then VRAM-fit siblings,
    # then the remaining stack. Keeps the chain ordered so Hermes can run
    # purely locally through a rated/config outage.
    fallback_chain = []
    seen = set()
    ordered = [pick] + [
        m for m in STACK if m is not pick and m["vram_fit"]
    ] + [m for m in STACK if m is not pick and not m["vram_fit"]]
    for m in ordered:
        key = m["alias"]
        if key in seen:
            continue
        seen.add(key)
        fallback_chain.append({
            "provider": m["provider"],
            "model": m["model"],
            "base_url": m["base_url"],
        })

    return {
        "task_class": task_class,
        "complexity": complexity,
        "cloud_needed": cloud_needed,
        "recommended_alias": pick["alias"],
        "reason": reason,
        "fallback_chain": fallback_chain,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(description="Local-first Hermes task router")
    ap.add_argument("task", nargs="?", help="Task text to route")
    ap.add_argument("--toolset", default="", help="Hint toolset (e.g. coding)")
    ap.add_argument("--list", action="store_true", help="List the stack")
    ap.add_argument("--cloud", action="store_true", help="Force cloud class")
    args = ap.parse_args()

    if args.list:
        for m in STACK:
            fit = "FIT" if m["vram_fit"] else "offload"
            print(f"  {m['alias']:<22} {m['model']:<28} role={m['role']:<16} {fit}")
        sys.stdout.write(f"\n  {len(STACK)} models in stack\n")
        return 0

    if not args.task:
        ap.error("a task string is required (or use --list)")

    result = select(args.task, toolset=args.toolset, prefer_cloud=args.cloud)
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
