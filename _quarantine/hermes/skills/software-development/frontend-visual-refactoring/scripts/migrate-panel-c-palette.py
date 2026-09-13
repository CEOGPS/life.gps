#!/usr/bin/env python3
"""Replace top-level `const C = { ... }` in LifeOS panel JSX with lifeosUi import.

Run from repo root: python path/to/migrate-panel-c-palette.py
Or copy into C:/dev/LifeOS1 and: python scripts/migrate-panel-c-palette.py

Skips blocks inside functions (e.g. DarkCardGame inner `const card`).
"""
from __future__ import annotations

import re
from pathlib import Path

IMPORT = 'import { C } from "@/lib/lifeosUi";\n'
REPO = Path(__file__).resolve().parents[4] if "skills" in str(Path(__file__)) else Path.cwd()
PANEL_DIRS = [
    REPO / "src/components/lifeos/panels",
    REPO / "src/components/lifeos/panels/KPIModules",
]


def find_c_block_end(text: str, start: int) -> int | None:
    if not text[start:].startswith("const C"):
        return None
    i = text.find("{", start)
    if i < 0:
        return None
    depth = 0
    j = i
    while j < len(text):
        if text[j] == "{":
            depth += 1
        elif text[j] == "}":
            depth -= 1
            if depth == 0:
                j += 1
                if j < len(text) and text[j] == ";":
                    j += 1
                return j
        j += 1
    return None


def migrate_file(fp: Path) -> bool:
    text = fp.read_text(encoding="utf-8")
    if 'import { C }' in text and "lifeosUi" in text:
        return False
    before_export = text.split("export default")[0]
    start = before_export.find("const C = ")
    if start < 0:
        return False
    end = find_c_block_end(text, start)
    if end is None:
        return False
    new_text = text[:start] + text[end:]
    if 'from "@/lib/lifeosUi"' not in new_text:
        imports = list(re.finditer(r"^import .+;\n", new_text, re.MULTILINE))
        pos = imports[-1].end() if imports else 0
        new_text = new_text[:pos] + IMPORT + new_text[pos:]
    fp.write_text(new_text, encoding="utf-8")
    return True


def main() -> None:
    root = Path.cwd()
    if (root / "src/components/lifeos/panels").is_dir():
        dirs = [root / "src/components/lifeos/panels", root / "src/components/lifeos/panels/KPIModules"]
    else:
        dirs = [d for d in PANEL_DIRS if d.is_dir()]
    changed = []
    for d in dirs:
        if not d.is_dir():
            continue
        for fp in sorted(d.glob("*.jsx")):
            if migrate_file(fp):
                changed.append(fp.relative_to(root if (root / "src").is_dir() else d.parent.parent.parent))
    print(f"migrated {len(changed)} files")
    for p in changed[:30]:
        print(" ", p)
    if len(changed) > 30:
        print(f" ... +{len(changed) - 30} more")


if __name__ == "__main__":
    main()