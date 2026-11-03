"""The Brain: a tree of skills, one folder + SKILL.md each.

    skills/<branch>/<skill>/SKILL.md

Only the frontmatter (name, description, triggers) of every skill is kept in
memory. The full SKILL.md body is read *only* when the router picks that skill,
so each request carries just the context that moment needs.
"""

from __future__ import annotations

import os
import re
import shutil
from dataclasses import dataclass, field
from pathlib import Path

FRONTMATTER = re.compile(r"\A---\s*\n(.*?)\n---\s*\n?(.*)\Z", re.S)
LIST_ITEM = re.compile(r"""\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^']|'')*)'|([^,]+?))\s*(?:,|$)""")


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Minimal YAML-subset parser: `key: value`, `key: [a, b]` and `- item` lists."""
    m = FRONTMATTER.match(text)
    if not m:
        return {}, text
    meta: dict = {}
    last_key = None
    for raw in m.group(1).splitlines():
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if line.lstrip().startswith("- ") and last_key:
            meta.setdefault(last_key, [])
            if not isinstance(meta[last_key], list):
                meta[last_key] = [meta[last_key]] if meta[last_key] else []
            meta[last_key].append(_scalar(line.lstrip()[2:]))
            continue
        if ":" in line:
            key, _, val = line.partition(":")
            key, val = key.strip(), val.strip()
            last_key = key
            if val.startswith("[") and val.endswith("]"):
                meta[key] = _list(val[1:-1])
            else:
                meta[key] = _scalar(val) if val else ""
    return meta, m.group(2)


def _scalar(v: str) -> str:
    v = v.strip()
    if len(v) >= 2 and v[0] == v[-1] == '"':
        return _unescape(v[1:-1])
    if len(v) >= 2 and v[0] == v[-1] == "'":
        return v[1:-1].replace("''", "'")
    return v


def _unescape(v: str) -> str:
    """YAML double-quoted escapes we care about: \\ and \"."""
    return re.sub(r'\\([\\"])', r"\1", v)


def _list(inner: str) -> list[str]:
    out = []
    for dq, sq, bare in LIST_ITEM.findall(inner):
        if dq:
            out.append(_unescape(dq))
        elif sq:
            out.append(sq.replace("''", "'"))
        elif bare.strip():
            out.append(bare.strip())
    return out


@dataclass
class Skill:
    id: str               # "ops/daily-brief"
    branch: str           # "ops"
    name: str             # "ops-daily-brief"
    description: str
    path: Path
    triggers: list[str] = field(default_factory=list)

    def body(self) -> str:
        """Full instructions — loaded lazily, only when this skill runs."""
        _, body = parse_frontmatter(self.path.read_text(encoding="utf-8"))
        return body.strip()

    def summary(self) -> dict:
        return {"id": self.id, "branch": self.branch, "name": self.name,
                "description": self.description, "triggers": self.triggers}


class SkillTree:
    def __init__(self, root: Path) -> None:
        self.root = Path(root)
        self.skills: dict[str, Skill] = {}
        self.reload()

    def reload(self) -> None:
        self.skills.clear()
        for md in sorted(self.root.glob("*/*/SKILL.md")):
            branch, slug = md.parent.parent.name, md.parent.name
            if branch.startswith("_"):
                continue  # _template etc.
            meta, _ = parse_frontmatter(md.read_text(encoding="utf-8"))
            sid = f"{branch}/{slug}"
            triggers = meta.get("triggers") or []
            if isinstance(triggers, str):
                triggers = [triggers]
            self.skills[sid] = Skill(
                id=sid, branch=branch, name=meta.get("name", f"{branch}-{slug}"),
                description=meta.get("description", ""), path=md, triggers=triggers,
            )

    def get(self, sid: str) -> Skill | None:
        return self.skills.get(sid)

    def branches(self) -> dict[str, list[Skill]]:
        out: dict[str, list[Skill]] = {}
        for s in self.skills.values():
            out.setdefault(s.branch, []).append(s)
        return out

    def catalog(self) -> str:
        """One line per skill — this is all the router ever sees."""
        return "\n".join(f"- {s.id}: {s.description}" for s in self.skills.values())

    # ── Claude Code integration ──────────────────────────────────────────
    def sync_claude_code(self, project_root: Path) -> list[Path]:
        """Expose the tree to Claude Code as .claude/skills/<branch>-<skill>/.

        Claude Code reads only each skill's name+description up front and pulls
        in the body on demand, matching the lean-context design here.
        """
        target = Path(project_root) / ".claude" / "skills"
        target.mkdir(parents=True, exist_ok=True)
        made = []
        for s in self.skills.values():
            link = target / s.name
            if link.is_symlink() or link.is_file():
                link.unlink()
            elif link.is_dir():
                shutil.rmtree(link)
            try:
                os.symlink(os.path.relpath(s.path.parent, target), link, target_is_directory=True)
            except OSError:  # e.g. Windows without dev mode
                shutil.copytree(s.path.parent, link)
            made.append(link)
        return made

    def write_vault_index(self, vault: Path) -> Path:
        """Mirror the skill tree into the vault so it shows up in Obsidian's graph."""
        out = Path(vault) / "Skills" / "Skill Map.md"
        out.parent.mkdir(parents=True, exist_ok=True)
        lines = ["---", "type: index", "tags: [jarvis/skills]", "---", "",
                 "# Skill Map", "", "Auto-generated by `jarvis skills sync`. Links: [[Home]]", ""]
        for branch, skills in sorted(self.branches().items()):
            lines.append(f"## {branch}")
            for s in skills:
                lines.append(f"- **{s.id}** — {s.description}")
            lines.append("")
        out.write_text("\n".join(lines), encoding="utf-8")
        return out
