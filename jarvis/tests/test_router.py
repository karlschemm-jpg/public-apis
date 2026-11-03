import pytest

from jarvis.router import Router
from jarvis.skills import SkillTree


@pytest.mark.parametrize("line,action", [
    ("what time is it", "builtin:time"),
    ("give me my morning briefing", "skill:ops/daily-brief"),
    ("brief me", "skill:ops/daily-brief"),
    ("note that the launch moved to May", "skill:memory/capture"),
    ("what do we know about Acme", "skill:memory/recall"),
    ("research solid state batteries", "skill:research/web-brief"),
    ("write the client report", "skill:clients/client-report"),
    ("stop", "builtin:stop"),
])
def test_regex_tier(cfg, line, action):
    r = Router(cfg, SkillTree(cfg["paths"]["skills"])).route(line)
    assert (r.action, r.tier) == (action, "regex")


def test_falls_back_to_default(cfg):
    r = Router(cfg, SkillTree(cfg["paths"]["skills"])).route("tell me a joke about otters")
    assert r.action == "skill:general" and r.tier == "default"


def test_local_tier_rejects_low_confidence(cfg):
    router = Router(cfg, SkillTree(cfg["paths"]["skills"]))
    assert router._accept({"skill": "ops/daily-brief", "confidence": 0.3}, "local", 0.7) is None
    assert router._accept({"skill": "made/up", "confidence": 0.99}, "local", 0.7) is None
    assert router._accept({"skill": "ops/daily-brief", "confidence": 0.9}, "local", 0.7).tier == "local"
