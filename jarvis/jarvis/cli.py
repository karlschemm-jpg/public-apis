"""Command line: `python -m jarvis <command>`."""

from __future__ import annotations

import argparse
import json
import re
import sys
import threading
import webbrowser
from pathlib import Path

from .config import load_config
from .events import bus


def cmd_run(cfg: dict, args) -> None:
    from .brain import Brain
    from .hud.server import serve

    brain = Brain(cfg, bus=bus)
    speak = None
    if cfg["voice"].get("enabled") and not args.no_voice:
        try:
            from .voice.loop import VoiceLoop

            loop = VoiceLoop(cfg, brain, bus)
            speak = loop._speak
            threading.Thread(target=loop.run, daemon=True, name="voice").start()
            print(f"🎙  voice online — say \"{(cfg['brand'].get('wake_words') or ['…'])[0]}, …\"")
        except ImportError as exc:
            print(f"voice disabled (missing dependency: {exc.name}); run `pip install -r requirements-voice.txt`")
        except Exception as exc:  # no mic, no model download, etc.
            print(f"voice disabled: {exc}")
    httpd = serve(cfg, brain, bus, speak=speak)
    url = f"http://{cfg['hud']['host']}:{cfg['hud']['port']}/"
    print(f"🖥  {cfg['brand']['name']} HUD → {url}")
    if args.open:
        webbrowser.open(url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nshutting down")


def cmd_ask(cfg: dict, args) -> None:
    from .brain import Brain

    reply = Brain(cfg, bus=bus).handle(" ".join(args.text), source="cli", skill=args.skill)
    print(reply.text)
    print(f"  ↳ {reply.route.target} via {reply.route.tier} · {reply.ms}ms"
          + (f" · report: {reply.report}" if reply.report else ""), file=sys.stderr)


def cmd_route(cfg: dict, args) -> None:
    from .router import Router
    from .skills import SkillTree

    if args.offline:
        cfg["router"]["local_model_enabled"] = cfg["router"]["haiku_enabled"] = False
    r = Router(cfg, SkillTree(cfg["paths"]["skills"])).route(" ".join(args.text))
    print(json.dumps(r.to_dict(), indent=2))


def cmd_skills(cfg: dict, args) -> None:
    from .skills import SkillTree

    tree = SkillTree(cfg["paths"]["skills"])
    if args.action == "sync":
        links = tree.sync_claude_code(cfg["paths"]["root"])
        idx = tree.write_vault_index(cfg["paths"]["vault"])
        print(f"linked {len(links)} skills into .claude/skills/, wrote {idx.relative_to(cfg['paths']['root'])}")
        return
    for branch, skills in sorted(tree.branches().items()):
        print(f"{branch}/")
        for s in skills:
            print(f"  {s.id:<28} {s.description}")


def cmd_new_skill(cfg: dict, args) -> None:
    if not re.fullmatch(r"[a-z0-9-]+/[a-z0-9-]+", args.id):
        sys.exit("skill id must look like branch/skill-name (lowercase, hyphens)")
    branch, slug = args.id.split("/")
    dest = Path(cfg["paths"]["skills"]) / branch / slug / "SKILL.md"
    if dest.exists():
        sys.exit(f"{dest} already exists")
    template = (Path(cfg["paths"]["skills"]) / "_template" / "SKILL.md").read_text(encoding="utf-8")
    text = (template.replace("BRANCH-SKILL", f"{branch}-{slug}")
                    .replace("ONE-LINE DESCRIPTION", args.description or f"TODO: describe {slug}"))
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(text, encoding="utf-8")
    print(f"created {dest.relative_to(cfg['paths']['root'])} — edit it, then `python -m jarvis skills sync`")


def main(argv: list[str] | None = None) -> None:
    p = argparse.ArgumentParser(prog="jarvis", description="Your Own Jarvis — voice-driven AI command center")
    p.add_argument("--config", help="path to config.toml (default: ./config.toml or $JARVIS_CONFIG)")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("run", help="start the HUD (and voice loop)")
    r.add_argument("--no-voice", action="store_true")
    r.add_argument("--open", action="store_true", help="open the HUD in a browser")
    r.set_defaults(fn=cmd_run)

    a = sub.add_parser("ask", help="one-shot text command")
    a.add_argument("text", nargs="+")
    a.add_argument("--skill", help="force a skill id, skipping the router")
    a.set_defaults(fn=cmd_ask)

    ro = sub.add_parser("route", help="show how a line would be routed")
    ro.add_argument("text", nargs="+")
    ro.add_argument("--offline", action="store_true", help="regex tier only")
    ro.set_defaults(fn=cmd_route)

    s = sub.add_parser("skills", help="list skills or sync them into Claude Code")
    s.add_argument("action", nargs="?", choices=["list", "sync"], default="list")
    s.set_defaults(fn=cmd_skills)

    n = sub.add_parser("new-skill", help="scaffold skills/<branch>/<skill>/SKILL.md")
    n.add_argument("id", help="branch/skill-name")
    n.add_argument("description", nargs="?")
    n.set_defaults(fn=cmd_new_skill)

    args = p.parse_args(argv)
    args.fn(load_config(args.config), args)


if __name__ == "__main__":
    main()
