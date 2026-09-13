#!/usr/bin/env python3
"""Ensure panels that use C. import C from lifeosUi.

Run from LifeOS1 repo root:
  python scripts/fix-panel-c-imports.py

Complements migrate-panel-c-palette.py (which only removes const C blocks).
"""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path.cwd()
DIRS = [
    ROOT / "src/components/lifeos/panels",
    ROOT / "src/components/lifeos/panels/KPIModules",
]


def uses_c(text: str) -> bool:
    return bool(re.search(r"\bC\.", text))


def has_c_import(text: str) -> bool:
    return bool(re.search(r"import\s*\{[^}]*\bC\b[^}]*\}\s*from\s*[\"']@/lib/lifeosUi[\"']", text))


def fix_file(fp: Path) -> bool:
    text = fp.read_text(encoding="utf-8")
    if not uses_c(text) or has_c_import(text):
        return False
    if "export const C" in text or re.search(r"^const C = ", text, re.M):
        return False
    new = text
    if 'import { LO_CARD } from "@/lib/lifeosUi"' in new:
        new = new.replace(
            'import { LO_CARD } from "@/lib/lifeosUi"',
            'import { LO_CARD, C } from "@/lib/lifeosUi"',
        )
    elif 'from "@/lib/lifeosUi"' not in new:
        imports = list(re.finditer(r"^import .+;\n", new, re.MULTILINE))
        pos = imports[-1].end() if imports else 0
        new = new[:pos] + 'import { C } from "@/lib/lifeosUi";\n' + new[pos:]
    else:
        # lifeosUi import exists but without C — append C to first lifeosUi import
        new = re.sub(
            r"import\s*\{([^}]+)\}\s*from\s*[\"']@/lib/lifeosUi[\"']",
            lambda m: f'import {{{m.group(1).strip()}, C}} from "@/lib/lifeosUi"'
            if "C" not in m.group(1)
            else m.group(0),
            new,
            count=1,
        )
    if new == text:
        return False
    fp.write_text(new, encoding="utf-8")
    return True


def main() -> None:
    if not (ROOT / "src/components/lifeos/panels").is_dir():
        print("Run from LifeOS1 repo root (src/components/lifeos/panels missing)")
        raise SystemExit(1)
    fixed = []
    for d in DIRS:
        if not d.is_dir():
            continue
        for fp in sorted(d.glob("*.jsx")):
            if fix_file(fp):
                fixed.append(fp.relative_to(ROOT))
    print(f"fixed {len(fixed)} files")
    for p in fixed:
        print(" ", p)


if __name__ == "__main__":
    main()