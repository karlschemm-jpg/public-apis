"""The Memory: an Obsidian vault of plain markdown.

No database. Notes link to each other with [[wikilinks]]; this module builds
the link graph on the fly, retrieves relevant notes by keyword score + one hop
of graph traversal, and writes every generated report back as a new note.
"""

from __future__ import annotations

import datetime as dt
import re
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

from .skills import parse_frontmatter

WIKILINK = re.compile(r"\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]")
TAG = re.compile(r"(?<![\w/])#([A-Za-z][\w/-]*)")
WORD = re.compile(r"[a-z0-9][a-z0-9'-]{1,}")
STOP = set("""a an and are as at be but by for from has have how i in is it its me my of on or
that the this to was we what when where which who why will with you your about do does""".split())
UNSAFE = re.compile(r'[\\/:*?"<>|#^\[\]]')


@dataclass
class Note:
    title: str
    path: Path
    meta: dict
    body: str
    links: set[str] = field(default_factory=set)
    tags: set[str] = field(default_factory=set)

    @property
    def rel(self) -> str:
        return self.path.as_posix()


def _tokens(text: str) -> list[str]:
    return [w for w in WORD.findall(text.lower()) if w not in STOP]


def safe_title(title: str) -> str:
    return re.sub(r"\s+", " ", UNSAFE.sub("", title)).strip()[:90] or "Untitled"


class Vault:
    def __init__(self, root: Path, reports_dir: str = "Reports") -> None:
        self.root = Path(root)
        self.reports_dir = reports_dir
        self.root.mkdir(parents=True, exist_ok=True)

    # ── reading ──────────────────────────────────────────────────────────
    def notes(self) -> dict[str, Note]:
        out: dict[str, Note] = {}
        for p in self.root.rglob("*.md"):
            if any(part.startswith(".") for part in p.relative_to(self.root).parts):
                continue
            text = p.read_text(encoding="utf-8", errors="replace")
            meta, body = parse_frontmatter(text)
            tags = set(TAG.findall(body))
            mt = meta.get("tags")
            if isinstance(mt, list):
                tags |= set(mt)
            elif mt:
                tags.add(mt)
            out[p.stem.lower()] = Note(
                title=p.stem, path=p.relative_to(self.root), meta=meta, body=body,
                links={l.strip() for l in WIKILINK.findall(body)}, tags=tags,
            )
        return out

    def graph(self) -> dict:
        notes = self.notes()
        nodes = [{"id": n.title, "path": n.rel, "tags": sorted(n.tags)} for n in notes.values()]
        edges = [{"source": n.title, "target": notes[l.lower()].title}
                 for n in notes.values() for l in n.links if l.lower() in notes]
        return {"nodes": nodes, "edges": edges}

    def backlinks(self, title: str) -> list[str]:
        t = title.lower()
        return sorted(n.title for n in self.notes().values() if t in {l.lower() for l in n.links})

    def search(self, query: str, k: int = 4, hops: int = 1) -> list[Note]:
        """Keyword-rank notes, then walk wikilinks so linked context comes along."""
        notes = self.notes()
        q = Counter(_tokens(query))
        if not q:
            return []
        scored: dict[str, float] = {}
        for key, n in notes.items():
            title_t = set(_tokens(n.title))
            body_t = Counter(_tokens(n.body))
            score = sum(3.0 * (w in title_t) + min(body_t[w], 5) * 0.5 for w in q)
            score += sum(1.0 for t in n.tags if t.split("/")[-1].lower() in q)
            if score:
                scored[key] = score
        # graph traversal: neighbours inherit a share of their linker's score
        for _ in range(hops):
            for key, s in list(scored.items()):
                for l in notes[key].links:
                    lk = l.lower()
                    if lk in notes:
                        scored[lk] = max(scored.get(lk, 0.0), s * 0.4)
        ranked = sorted(scored, key=scored.get, reverse=True)[:k]
        return [notes[r] for r in ranked]

    def context_block(self, query: str, k: int = 4, max_chars: int = 2500) -> str:
        parts = []
        for n in self.search(query, k=k):
            body = n.body.strip()
            if len(body) > max_chars:
                body = body[:max_chars] + "\n…(truncated — open the note for the rest)"
            parts.append(f'<note title="{n.title}" path="{n.rel}">\n{body}\n</note>')
        return "\n".join(parts)

    # ── writing ──────────────────────────────────────────────────────────
    def write_note(self, folder: str, title: str, body: str, *, meta: dict | None = None,
                   links: list[str] | None = None, tags: list[str] | None = None) -> Path:
        now = dt.datetime.now()
        stamp = now.strftime("%Y-%m-%d %H%M")
        name = safe_title(f"{stamp} {title}")
        path = self.root / folder / f"{name}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        fm = {"created": now.isoformat(timespec="seconds"), **(meta or {})}
        fm_lines = ["---"]
        for key, val in fm.items():
            fm_lines.append(f"{key}: {val}")
        if tags:
            fm_lines.append("tags: [" + ", ".join(tags) + "]")
        fm_lines.append("---")
        related = " · ".join(f"[[{l}]]" for l in dict.fromkeys(links or []))
        text = "\n".join(fm_lines) + f"\n\n# {title}\n\n{body.strip()}\n"
        if related:
            text += f"\n---\nRelated: {related}\n"
        path.write_text(text, encoding="utf-8")
        return path

    def write_report(self, title: str, body: str, *, skill: str, query: str,
                     sources: list[str] | None = None) -> Path:
        """Every OS output lands back in the vault so it becomes future memory."""
        links = ["Home", "Skill Map", *(sources or [])]
        return self.write_note(
            self.reports_dir, title, body,
            meta={"type": "report", "skill": skill, "query": f'"{query.replace(chr(34), "")}"'},
            links=links, tags=["jarvis/report", f"skill/{skill.replace('/', '-')}"],
        )

    def capture(self, text: str) -> Path:
        title = " ".join(text.split()[:8])
        return self.write_note("Inbox", title, text, meta={"type": "capture"},
                               links=["Home"], tags=["jarvis/inbox"])

    def stats(self) -> dict:
        notes = self.notes()
        reports = sum(1 for n in notes.values() if n.path.parts[0] == self.reports_dir)
        links = sum(len(n.links) for n in notes.values())
        return {"notes": len(notes), "reports": reports, "links": links}
