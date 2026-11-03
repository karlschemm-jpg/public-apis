"""Glue: route a line → load just that skill + related notes → think → speak → file a report."""

from __future__ import annotations

import datetime as dt
import json
import re
import shutil
import subprocess
import time
from dataclasses import dataclass, field

from .events import EventBus, bus as default_bus
from .memory import Vault
from .metrics import Metrics
from .router import Route, Router
from .skills import SkillTree

PERSONA = """You are {assistant}, the voice of the {brand} command center, working for {owner}.
Your reply is spoken aloud first, so the `spoken` field must be 1–3 short sentences of plain
speech: no markdown, lists, URLs or code. Put anything longer in `report_markdown`, which is
saved to the Obsidian vault; link related notes there with [[Note Title]] wikilinks.
Leave `report_markdown` empty when a spoken answer is enough.
Today is {today}."""

RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "spoken": {"type": "string"},
        "title": {"type": "string"},
        "report_markdown": {"type": "string"},
    },
    "required": ["spoken", "title", "report_markdown"],
    "additionalProperties": False,
}


@dataclass
class Reply:
    text: str
    route: Route
    report: str | None = None
    notes_used: list[str] = field(default_factory=list)
    ms: float = 0.0

    def to_dict(self) -> dict:
        return {"text": self.text, "route": self.route.to_dict(), "report": self.report,
                "notes_used": self.notes_used, "ms": self.ms}


class Brain:
    def __init__(self, cfg: dict, *, bus: EventBus | None = None, metrics: Metrics | None = None):
        self.cfg = cfg
        self.bus = bus or default_bus
        self.metrics = metrics or Metrics()
        self.skills = SkillTree(cfg["paths"]["skills"])
        self.vault = Vault(cfg["paths"]["vault"], cfg["paths"].get("reports_dir", "Reports"))
        self.router = Router(cfg, self.skills)
        self._client = None

    # ── entry point ──────────────────────────────────────────────────────
    def handle(self, text: str, source: str = "text", skill: str | None = None) -> Reply:
        """Process one line. `skill` forces a skill id (HUD buttons) and skips routing."""
        t0 = time.perf_counter()
        self.bus.publish("heard", text=text, source=source)
        if skill and (skill in self.skills.skills or skill == "general"):
            route = Route(f"skill:{skill}", "manual", 1.0)
        else:
            route = self.router.route(text)
        self.bus.publish("routed", **route.to_dict())
        self.metrics.count(f"route.{route.tier}")

        if route.kind == "builtin":
            reply = self._builtin(route, text)
        else:
            skill = self.skills.get(route.target)
            handler = self._skill_meta(skill).get("handler") if skill else None
            if handler == "local:capture":
                path = self.vault.capture(re.sub(r"^(note|remember|capture)( that)?[:,]?\s*", "", text, flags=re.I))
                reply = Reply(f"Noted, {self.cfg['brand']['owner']}.", route, report=path.as_posix())
            else:
                reply = self._think(route, text)
        reply.ms = round((time.perf_counter() - t0) * 1000)
        self.metrics.timing("reply_ms", reply.ms)
        self.bus.publish("reply", **reply.to_dict())
        return reply

    # ── builtins: zero-LLM actions ───────────────────────────────────────
    def _builtin(self, route: Route, text: str) -> Reply:
        if route.target == "time":
            return Reply("It's " + dt.datetime.now().strftime("%I:%M %p").lstrip("0") + ".", route)
        if route.target == "stop":
            self.bus.publish("stop")
            return Reply("", route)
        return Reply(f"I don't have a built-in called {route.target}.", route)

    @staticmethod
    def _skill_meta(skill) -> dict:
        from .skills import parse_frontmatter
        meta, _ = parse_frontmatter(skill.path.read_text(encoding="utf-8"))
        return meta

    # ── LLM path ─────────────────────────────────────────────────────────
    def _context(self, route: Route, text: str) -> tuple[str, str, list[str], bool]:
        b = self.cfg["brand"]
        system = PERSONA.format(assistant=b["assistant"], brand=b["name"], owner=b["owner"],
                                today=dt.date.today().isoformat())
        writes_report = True
        skill = self.skills.get(route.target)
        if skill:  # lazy-load ONLY the routed skill's instructions
            meta = self._skill_meta(skill)
            writes_report = str(meta.get("report", "true")).lower() != "false"
            system += f"\n\n<skill id=\"{skill.id}\">\n{skill.body()}\n</skill>"
        else:
            writes_report = False
        hits = self.vault.search(text, k=self.cfg["brain"].get("memory_notes", 4))
        notes_used = [n.title for n in hits]
        mem = self.vault.context_block(text, k=len(hits)) if hits else ""
        user = (f"<memory>\n{mem}\n</memory>\n\n" if mem else "") + text
        return system, user, notes_used, writes_report

    def _think(self, route: Route, text: str) -> Reply:
        system, user, notes_used, writes_report = self._context(route, text)
        self.bus.publish("thinking", skill=route.target, notes=notes_used)
        backend = self.cfg["brain"].get("backend", "api")
        try:
            if backend == "claude_code":
                data = self._claude_code(route, text)
            else:
                data = self._api(system, user)
        except Exception as exc:  # keep the voice loop alive no matter what
            self.metrics.count("errors")
            self.bus.publish("error", message=str(exc))
            return Reply("Sorry, my brain link failed. Check the HUD log.", route, notes_used=notes_used)

        report_path = None
        body = (data.get("report_markdown") or "").strip()
        if writes_report and body:
            report_path = self.vault.write_report(
                data.get("title") or text[:60], body, skill=route.target, query=text, sources=notes_used,
            ).as_posix()
            self.bus.publish("report", path=report_path, title=data.get("title"))
            self.metrics.count("reports")
        return Reply(data.get("spoken", "").strip(), route, report=report_path, notes_used=notes_used)

    def _api(self, system: str, user: str) -> dict:
        import anthropic

        self._client = self._client or anthropic.Anthropic()
        bc = self.cfg["brain"]
        kwargs = dict(
            model=bc.get("model", "claude-fable-5-1"),
            max_tokens=bc.get("max_tokens", 16000),
            system=system,
            messages=[{"role": "user", "content": user}],
            output_config={"effort": bc.get("effort", "medium"),
                           "format": {"type": "json_schema", "schema": RESPONSE_SCHEMA}},
        )
        if bc.get("refusal_fallback", True):
            kwargs |= {"betas": ["server-side-fallback-2026-07-01"], "fallbacks": "default"}
        with self._client.beta.messages.stream(**kwargs) as stream:
            msg = stream.get_final_message()
        self.metrics.add_usage(msg.usage)
        if msg.stop_reason == "refusal":
            return {"spoken": "I can't help with that one.", "title": "", "report_markdown": ""}
        if msg.stop_reason == "max_tokens":
            return {"spoken": "That answer ran too long; try narrowing the ask.", "title": "", "report_markdown": ""}
        txt = next((b.text for b in msg.content if b.type == "text"), "{}")
        return json.loads(txt)

    def _claude_code(self, route: Route, text: str) -> dict:
        """Let Claude Code be the brain: it discovers .claude/skills/ and CLAUDE.md itself."""
        exe = shutil.which("claude")
        if not exe:
            raise RuntimeError("`claude` CLI not found; install Claude Code or set brain.backend = \"api\"")
        skill = self.skills.get(route.target)
        hint = f"Use the `{skill.name}` skill. " if skill else ""
        prompt = (f"{hint}{text}\n\nReturn ONLY a JSON object with keys spoken (1-3 sentences, plain speech), "
                  f"title, report_markdown (may be empty).")
        out = subprocess.run(
            [exe, "-p", prompt, "--output-format", "json", "--model", self.cfg["brain"].get("model", "claude-fable-5-1")],
            cwd=self.cfg["paths"]["root"], capture_output=True, text=True, timeout=600,
        )
        if out.returncode != 0:
            raise RuntimeError(out.stderr.strip()[:500] or "claude exited non-zero")
        result = json.loads(out.stdout).get("result", "")
        m = re.search(r"\{.*\}", result, re.S)
        try:
            return json.loads(m.group(0)) if m else {"spoken": result, "title": "", "report_markdown": ""}
        except json.JSONDecodeError:
            return {"spoken": result[:300], "title": text[:60], "report_markdown": result}
