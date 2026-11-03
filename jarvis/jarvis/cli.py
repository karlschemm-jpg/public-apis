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
    from .hud.net import access_key, ensure_cert, is_loopback, lan_ip, print_qr
    from .hud.server import serve
    from .voice.audio import VoiceService

    hud = cfg["hud"]
    if args.ipad:
        hud["host"], hud["https"] = "0.0.0.0", True
    exposed = not is_loopback(hud["host"])
    state_dir = Path(cfg["paths"]["root"]) / ".jarvis"
    key = access_key(state_dir, hud.get("access_key", "")) if exposed or hud.get("access_key") else None
    ip = lan_ip()
    cert = ensure_cert(state_dir, [ip, "127.0.0.1"]) if hud.get("https") else None

    brain = Brain(cfg, bus=bus)
    voice = VoiceService(cfg)
    host_mic = cfg["voice"].get("enabled") and not args.no_voice and not args.ipad
    if host_mic:
        try:
            from .voice.loop import VoiceLoop

            loop = VoiceLoop(cfg, brain, bus, voice)
            threading.Thread(target=loop.run, daemon=True, name="voice").start()
            print(f"🎙  voice online — say \"{(cfg['brand'].get('wake_words') or ['…'])[0]}, …\"")
        except ImportError as exc:
            print(f"voice disabled (missing dependency: {exc.name}); run `pip install -r requirements-voice.txt`")
        except Exception as exc:  # no mic, no model download, etc.
            print(f"voice disabled: {exc}")
    elif args.ipad:
        threading.Thread(target=_warm_voice, args=(voice,), daemon=True, name="voice-warmup").start()

    httpd = serve(cfg, brain, bus, voice=voice, key=key, cert=cert)
    scheme = "https" if cert else "http"
    local = f"{scheme}://127.0.0.1:{hud['port']}/"
    print(f"🖥  {cfg['brand']['name']} HUD on this computer → {local}")
    if exposed:
        remote = f"{scheme}://{ip}:{hud['port']}/?key={key}"
        print(f"📱 On your iPad (same Wi-Fi), open → {remote}")
        print(f"🔑 Access key: {key}")
        if cert:
            print("   Safari will warn that the certificate isn't trusted (it was made on this computer):")
            print("   tap “Show Details” → “visit this website” → “Visit Website”. Then tap 🎙 to talk.")
        print_qr(remote)
    if args.open:
        webbrowser.open(local + (f"?key={key}" if key else ""))
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nshutting down")


def _warm_voice(voice) -> None:
    """Load the speech models in the background so the first iPad request is quick."""
    try:
        voice.stt
        print("🎙  speech recognition ready (faster-whisper)")
    except ImportError as exc:
        print(f"⚠️  iPad voice needs speech recognition on this computer: pip install -r requirements-voice.txt ({exc.name} missing)")
        return
    except Exception as exc:
        print(f"⚠️  couldn't load speech recognition: {exc}")
        return
    try:
        print("🔊 Kokoro voice ready" if voice.tts else "🔊 Kokoro not installed — the iPad's built-in voice will speak replies")
    except Exception as exc:
        print(f"⚠️  couldn't load Kokoro ({exc}); the iPad's built-in voice will speak replies")


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
    r.add_argument("--no-voice", action="store_true", help="don't listen on this computer's mic")
    r.add_argument("--ipad", action="store_true",
                   help="open the HUD to your Wi-Fi over HTTPS with a password, using the iPad's mic and speaker")
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
