#!/usr/bin/env python3
"""Smoke-test Erebus advanced_agent on :8000. No secrets printed."""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


def get(path: str, timeout: float = 15) -> dict:
    with urllib.request.urlopen(BASE + path, timeout=timeout) as r:
        return json.loads(r.read().decode())


def post(path: str, body: dict, timeout: float = 90) -> dict:
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


def main() -> int:
    try:
        h = get("/health")
    except Exception as e:
        print("FAIL server_down", e)
        return 2

    checks = {
        "health_online": h.get("status") == "online",
        "not_local_only": h.get("model") not in (None, "", "local"),
        "version3": str(h.get("version", "")).startswith("3"),
        "wake": get("/wake").get("status") == "online",
        "capabilities": bool(get("/capabilities").get("skills")),
        "fs_ls": "notes" in str(post("/execute", {"action": "FS_LS", "path": "/lifeos"}).get("result", "")),
        "chat": bool((post("/chat", {"message": "Reply exactly: OK"}).get("response") or "").strip()),
        "hermes": post("/hermes", {"goal": "Reply exactly: OK", "mode": "chat"}).get("ok") is True,
    }
    print(json.dumps({"base": BASE, "model": h.get("model"), "checks": checks}, indent=2))
    bad = [k for k, v in checks.items() if not v]
    if bad:
        print("FAIL", bad)
        return 1
    print("OK")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except urllib.error.HTTPError as e:
        print("FAIL http", e.code, e.read()[:300])
        raise SystemExit(1)
