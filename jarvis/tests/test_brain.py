import json

from jarvis.brain import Brain
from jarvis.events import EventBus


def test_builtin_and_capture_need_no_llm(cfg):
    bus = EventBus()
    brain = Brain(cfg, bus=bus)
    assert brain.handle("what time is it").text.startswith("It's")
    r = brain.handle("note that Dana prefers email")
    assert r.report and "Inbox" in r.report
    kinds = [e["kind"] for e in bus.history]
    assert kinds[:3] == ["heard", "routed", "reply"]


def test_skill_path_injects_only_routed_skill_and_files_report(cfg, monkeypatch):
    brain = Brain(cfg, bus=EventBus())
    seen = {}

    def fake_api(system, user):
        seen["system"], seen["user"] = system, user
        return {"spoken": "Three things today.", "title": "Daily brief",
                "report_markdown": "## Top 3\n- [ ] Migrate blog [[Example Project]]"}

    monkeypatch.setattr(brain, "_api", fake_api)
    r = brain.handle("brief me on the project launch")
    assert r.route.target == "ops/daily-brief"
    assert 'skill id="ops/daily-brief"' in seen["system"]
    assert "clients/client-report" not in seen["system"]   # other skills stay out of context
    assert "<memory>" in seen["user"] and "Example Project" in seen["user"]
    assert r.report and "Reports" in r.report


def test_brain_failure_is_spoken_not_raised(cfg, monkeypatch):
    brain = Brain(cfg, bus=EventBus())
    monkeypatch.setattr(brain, "_api", lambda s, u: (_ for _ in ()).throw(RuntimeError("boom")))
    assert "failed" in brain.handle("research otters").text
