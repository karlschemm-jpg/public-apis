"""Three-tier intent router: regex → local model → Haiku.

Every transcribed line goes through the cheapest tier that can decide it.
Most commands never leave the machine; only ambiguous ones hit the cloud.
"""

from __future__ import annotations

import json
import re
import time
import urllib.request
from dataclasses import dataclass, asdict

from .skills import SkillTree


@dataclass
class Route:
    action: str          # "skill:ops/daily-brief" | "builtin:time" | "skill:general"
    tier: str            # "regex" | "local" | "haiku" | "default"
    confidence: float
    ms: float = 0.0

    @property
    def kind(self) -> str:
        return self.action.split(":", 1)[0]

    @property
    def target(self) -> str:
        return self.action.split(":", 1)[1]

    def to_dict(self) -> dict:
        return asdict(self) | {"type": self.kind, "target": self.target}


ROUTER_PROMPT = """You are the intent router for a voice assistant.
Pick the single best skill id for the user's line from this catalog:
{catalog}
- general: anything else (open conversation, questions, tasks no skill covers)

Reply with JSON only: {{"skill": "<id>", "confidence": <0..1>}}"""


class Router:
    def __init__(self, cfg: dict, skills: SkillTree) -> None:
        self.cfg = cfg["router"]
        self.skills = skills
        self.rules = [(re.compile(r["pattern"], re.I), r["action"]) for r in self.cfg.get("rules", [])]
        self._haiku = None

    @property
    def choices(self) -> list[str]:
        return [*self.skills.skills.keys(), "general"]

    def route(self, text: str) -> Route:
        t0 = time.perf_counter()
        line = text.strip()
        r = (self._regex(line)
             or (self.cfg.get("local_model_enabled") and self._local(line))
             or (self.cfg.get("haiku_enabled") and self._haiku_route(line))
             or Route(f"skill:{self.cfg.get('default_skill', 'general')}", "default", 0.0))
        r.ms = round((time.perf_counter() - t0) * 1000, 1)
        return r

    # ── tier 1 ──────────────────────────────────────────────────────────
    def _regex(self, line: str) -> Route | None:
        for rx, action in self.rules:
            if rx.search(line):
                return Route(action, "regex", 1.0)
        for s in self.skills.skills.values():  # per-skill `triggers:` from SKILL.md
            for trig in s.triggers:
                if re.search(trig, line, re.I):
                    return Route(f"skill:{s.id}", "regex", 0.95)
        return None

    # ── tier 2 ──────────────────────────────────────────────────────────
    def _local(self, line: str) -> Route | None:
        body = {
            "model": self.cfg["local_model"],
            "stream": False,
            "format": {
                "type": "object",
                "properties": {"skill": {"type": "string", "enum": self.choices},
                               "confidence": {"type": "number"}},
                "required": ["skill", "confidence"],
            },
            "options": {"temperature": 0},
            "messages": [
                {"role": "system", "content": ROUTER_PROMPT.format(catalog=self.skills.catalog())},
                {"role": "user", "content": line},
            ],
        }
        try:
            req = urllib.request.Request(
                self.cfg["ollama_url"].rstrip("/") + "/api/chat",
                data=json.dumps(body).encode(), headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(json.loads(resp.read())["message"]["content"])
        except Exception:
            return None  # Ollama not running → fall through
        return self._accept(data, "local", self.cfg.get("local_min_confidence", 0.7))

    # ── tier 3 ──────────────────────────────────────────────────────────
    def _haiku_route(self, line: str) -> Route | None:
        try:
            import anthropic
        except ImportError:
            return None
        try:
            self._haiku = self._haiku or anthropic.Anthropic()
            resp = self._haiku.messages.create(
                model=self.cfg.get("haiku_model", "claude-haiku-5-5"),
                max_tokens=256,
                output_config={
                    "effort": "low",
                    "format": {
                        "type": "json_schema",
                        "schema": {
                            "type": "object",
                            "properties": {"skill": {"type": "string", "enum": self.choices},
                                           "confidence": {"type": "number"}},
                            "required": ["skill", "confidence"],
                            "additionalProperties": False,
                        },
                    },
                },
                system=ROUTER_PROMPT.format(catalog=self.skills.catalog()),
                messages=[{"role": "user", "content": line}],
            )
            if resp.stop_reason != "end_turn":
                return None
            text = next(b.text for b in resp.content if b.type == "text")
            return self._accept(json.loads(text), "haiku", 0.0)
        except anthropic.APIConnectionError:
            return None
        except anthropic.APIStatusError:
            return None
        except (StopIteration, json.JSONDecodeError):
            return None

    def _accept(self, data: dict, tier: str, min_conf: float) -> Route | None:
        skill = data.get("skill")
        conf = float(data.get("confidence", 0))
        if skill not in self.choices or conf < min_conf:
            return None
        return Route(f"skill:{skill}", tier, conf)
