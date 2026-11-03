"""The Face: V.A.U.L.T. HUD. Stdlib-only HTTP server + Server-Sent Events."""

from __future__ import annotations

import json
import mimetypes
import queue
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from ..brain import Brain
from ..events import EventBus

STATIC = Path(__file__).parent / "static"


def make_handler(cfg: dict, brain: Brain, bus: EventBus):
    class Handler(BaseHTTPRequestHandler):
        server_version = "VAULT/0.1"

        def log_message(self, *args) -> None:  # quiet
            pass

        # ── helpers ──────────────────────────────────────────────────────
        def _json(self, obj, status: int = 200) -> None:
            data = json.dumps(obj, default=str).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _body(self) -> dict:
            n = int(self.headers.get("Content-Length") or 0)
            if not n:
                return {}
            try:
                return json.loads(self.rfile.read(n))
            except json.JSONDecodeError:
                return {}

        def _static(self, rel: str) -> None:
            path = (STATIC / rel).resolve()
            if not path.is_file() or STATIC.resolve() not in path.parents:
                self.send_error(404)
                return
            data = path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", mimetypes.guess_type(path.name)[0] or "application/octet-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        # ── routes ───────────────────────────────────────────────────────
        def do_GET(self) -> None:
            p = self.path.split("?", 1)[0]
            if p == "/":
                return self._static("index.html")
            if p.startswith("/static/"):
                return self._static(p[len("/static/"):])
            if p == "/api/state":
                return self._json(state(cfg, brain, bus))
            if p == "/api/graph":
                return self._json(brain.vault.graph())
            if p == "/api/events":
                return self._sse()
            self.send_error(404)

        def do_POST(self) -> None:
            p = self.path.split("?", 1)[0]
            body = self._body()
            if p == "/api/command":
                text = (body.get("text") or "").strip()
                if not text:
                    return self._json({"error": "empty command"}, 400)
                reply = brain.handle(text, source="hud", skill=body.get("skill"))
                if body.get("speak") and getattr(self.server, "speak", None):
                    threading.Thread(target=self.server.speak, args=(reply.text,), daemon=True).start()
                return self._json(reply.to_dict())
            if p == "/api/skills/sync":
                brain.skills.reload()
                links = brain.skills.sync_claude_code(cfg["paths"]["root"])
                brain.skills.write_vault_index(cfg["paths"]["vault"])
                return self._json({"synced": len(links)})
            if p == "/api/stop":
                bus.publish("stop")
                return self._json({"ok": True})
            self.send_error(404)

        def _sse(self) -> None:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            q = bus.subscribe()
            try:
                while True:
                    try:
                        ev = q.get(timeout=15)
                        self.wfile.write(f"data: {json.dumps(ev, default=str)}\n\n".encode())
                    except queue.Empty:
                        self.wfile.write(b": ping\n\n")
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
            finally:
                bus.unsubscribe(q)

    return Handler


def state(cfg: dict, brain: Brain, bus: EventBus) -> dict:
    vault = brain.vault
    notes = vault.notes()
    reports = sorted((n for n in notes.values() if n.path.parts[0] == vault.reports_dir),
                     key=lambda n: n.path.name, reverse=True)[:12]
    return {
        "brand": cfg["brand"],
        "brain": {"backend": cfg["brain"]["backend"], "model": cfg["brain"]["model"]},
        "router": {"local": cfg["router"].get("local_model") if cfg["router"].get("local_model_enabled") else None,
                   "haiku": cfg["router"].get("haiku_model") if cfg["router"].get("haiku_enabled") else None},
        "voice": {"stt": cfg["voice"]["stt_model"], "tts": cfg["voice"]["tts_voice"]},
        "skills": {b: [s.summary() for s in ss] for b, ss in sorted(brain.skills.branches().items())},
        "vault": vault.stats(),
        "reports": [{"title": n.title, "path": n.rel, "skill": n.meta.get("skill")} for n in reports],
        "metrics": brain.metrics.snapshot(),
        "history": list(bus.history)[-60:],
    }


def serve(cfg: dict, brain: Brain, bus: EventBus, speak=None) -> ThreadingHTTPServer:
    host, port = cfg["hud"].get("host", "127.0.0.1"), cfg["hud"].get("port", 8765)
    httpd = ThreadingHTTPServer((host, port), make_handler(cfg, brain, bus))
    httpd.daemon_threads = True
    httpd.speak = speak
    return httpd
