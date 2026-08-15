#!/usr/bin/env python3
"""Ad-hoc verification for LifeOS hermes/config.yaml (not bun test)."""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

import yaml

CONFIG = Path(r"C:/dev/LifeOS1/hermes/config.yaml")


def main() -> int:
    d = yaml.safe_load(CONFIG.read_text(encoding="utf-8"))
    assert d["model"]["provider"] == "ollama-local"
    assert d["model"]["base_url"].rstrip("/") == "http://localhost:11434/v1"
    assert d["agent"]["reasoning_effort"] == "none"
    assert len(d["fallback_providers"]) == 3
    for e in d["fallback_providers"]:
        assert isinstance(e, dict) and e.get("provider") and e.get("model")
    r = urllib.request.urlopen("http://127.0.0.1:11434/v1/models", timeout=5)
    ids = {m["id"] for m in json.loads(r.read())["data"]}
    for m in (d["model"]["default"], "qwen-coder:latest", "qwen2.5-coder:7b"):
        assert m in ids, m
    print("PASS lifeos hermes config + ollama")
    return 0


if __name__ == "__main__":
    sys.exit(main())