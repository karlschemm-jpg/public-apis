"""The Face: V.A.U.L.T. HUD. Stdlib-only HTTP(S) server + Server-Sent Events.

Opened on another device (an iPad), the page records with that device's mic and sends
16 kHz WAV to /api/voice. Transcription (faster-whisper) and speech (Kokoro) still run on
this machine, and the reply audio is played back on the device.
"""

from __future__ import annotations

import base64
import hmac
import json
import mimetypes
import queue
import ssl
import threading
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from ..brain import Brain
from ..events import EventBus
from ..voice.audio import MAX_UPLOAD_BYTES, VoiceService
from ..voice.wake import strip_wake, wake_pattern

STATIC = Path(__file__).parent / "static"
COOKIE = "vault_key"

LOGIN_PAGE = """<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>{name} Login</title>
<style>
:root{{--accent:{accent};--bg:#05080d;--text:#d7e7f2;--muted:#6c8296}}
body{{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--text);
font:16px system-ui,-apple-system,sans-serif;padding:16px;box-sizing:border-box}}
form{{width:min(100%,340px);display:grid;gap:12px}}
h1{{font:700 20px ui-monospace,monospace;letter-spacing:.25em;color:var(--accent);margin:0}}
p{{color:var(--muted);margin:0;font-size:14px}}
input,button{{font:inherit;padding:12px 14px;border-radius:8px;border:1px solid #234;background:#0b1520;color:var(--text)}}
button{{background:var(--accent);color:var(--bg);border-color:var(--accent);font-weight:700}}
.err{{color:#f87171}}
</style></head><body><form method="get" action="/">
<h1>{name}</h1><p>Enter the access key shown in the terminal where Jarvis is running.</p>
{error}<input name="key" type="password" autocomplete="current-password" placeholder="Access key" required autofocus>
<button type="submit">Unlock</button></form></body></html>"""


class VaultServer(ThreadingHTTPServer):
    daemon_threads = True
    ssl_context: ssl.SSLContext | None = None

    def get_request(self):
        sock, addr = super().get_request()
        if self.ssl_context:
            # Handshake later, in the handler thread, so one slow client can't stall accept().
            sock = self.ssl_context.wrap_socket(sock, server_side=True, do_handshake_on_connect=False)
        return sock, addr


def make_handler(cfg: dict, brain: Brain, bus: EventBus, voice: VoiceService, key: str | None, https: bool):
    wake = wake_pattern(cfg["brand"].get("wake_words", []))

    class Handler(BaseHTTPRequestHandler):
        server_version = "VAULT/0.2"

        def setup(self) -> None:
            super().setup()
            self._dead = False
            if isinstance(self.connection, ssl.SSLSocket):
                self.connection.settimeout(15)
                try:
                    self.connection.do_handshake()
                    self.connection.settimeout(None)
                except (ssl.SSLError, OSError):
                    self._dead = True  # e.g. Safari before you accept the certificate

        def handle(self) -> None:
            if not self._dead:
                try:
                    super().handle()
                except (ssl.SSLError, ConnectionResetError, BrokenPipeError):
                    pass

        def log_message(self, *args) -> None:  # quiet
            pass

        # ── helpers ──────────────────────────────────────────────────────
        def _send(self, status: int, data: bytes, ctype: str, headers: dict | None = None) -> None:
            self.send_response(status)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            for k, v in (headers or {}).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(data)

        def _json(self, obj, status: int = 200) -> None:
            self._send(status, json.dumps(obj, default=str).encode(), "application/json")

        def _raw(self, limit: int) -> bytes | None:
            n = int(self.headers.get("Content-Length") or 0)
            if n > limit:
                return None
            return self.rfile.read(n) if n else b""

        def _body(self) -> dict:
            raw = self._raw(1_000_000)
            try:
                return json.loads(raw) if raw else {}
            except json.JSONDecodeError:
                return {}

        def _static(self, rel: str) -> None:
            path = (STATIC / rel).resolve()
            if not path.is_file() or STATIC.resolve() not in path.parents:
                self.send_error(404)
                return
            self._send(200, path.read_bytes(), mimetypes.guess_type(path.name)[0] or "application/octet-stream")

        # ── access control ───────────────────────────────────────────────
        def _authorized(self) -> bool:
            if not key:
                return True
            supplied = self.headers.get("X-Vault-Key", "")
            if not supplied:
                morsel = SimpleCookie(self.headers.get("Cookie", "")).get(COOKIE)
                supplied = morsel.value if morsel else ""
            return hmac.compare_digest(supplied.encode(), key.encode())

        def _login(self, query: dict) -> None:
            attempt = (query.get("key") or [""])[0]
            if attempt and hmac.compare_digest(attempt.encode(), key.encode()):
                cookie = f"{COOKIE}={key}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Strict"
                if https:
                    cookie += "; Secure"
                self._send(303, b"", "text/plain", {"Location": "/", "Set-Cookie": cookie})
                return
            b = cfg["brand"]
            error = '<p class="err">That key didn\'t match.</p>' if attempt else ""
            page = LOGIN_PAGE.format(name=b["name"], accent=b.get("accent", "#22d3ee"), error=error)
            self._send(401 if attempt else 200, page.encode(), "text/html; charset=utf-8")

        # ── routes ───────────────────────────────────────────────────────
        def do_GET(self) -> None:
            url = urlsplit(self.path)
            p, query = url.path, parse_qs(url.query)
            if not self._authorized():
                if p == "/":
                    return self._login(query)
                return self._json({"error": "locked"}, 401)
            if p == "/":
                if "key" in query:  # already logged in; drop the key from the address bar
                    return self._send(303, b"", "text/plain", {"Location": "/"})
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
            url = urlsplit(self.path)
            p, query = url.path, parse_qs(url.query)
            if not self._authorized():
                return self._json({"error": "locked"}, 401)
            if p == "/api/voice":
                return self._voice(query)
            if p == "/api/tts":
                return self._tts(self._body().get("text", ""))
            body = self._body()
            if p == "/api/command":
                text = (body.get("text") or "").strip()
                if not text:
                    return self._json({"error": "empty command"}, 400)
                reply = brain.handle(text, source=body.get("source") or "hud", skill=body.get("skill"))
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

        # ── device microphone → local STT → brain → local TTS ────────────
        def _voice(self, query: dict) -> None:
            data = self._raw(MAX_UPLOAD_BYTES)
            if data is None:
                self.close_connection = True  # body left unread
                return self._json({"error": "recording too long (60 s max)"}, 413)
            if not data:
                return self._json({"error": "no audio"}, 400)
            try:
                transcript = voice.transcribe_wav(data)
            except ImportError as exc:
                return self._json({"error": f"Speech recognition isn't installed on the computer "
                                            f"({exc.name}). Run: pip install -r requirements-voice.txt"}, 503)
            except (ValueError, EOFError) as exc:
                return self._json({"error": f"bad audio: {exc}"}, 400)
            out: dict = {"transcript": transcript, "command": None, "reply": None, "audio": None}
            if not transcript:
                return self._json(out)
            bus.publish("transcript", text=transcript, source="device")
            hands_free = (query.get("wake") or ["0"])[0] == "1"
            command = strip_wake(transcript, wake, required=hands_free)
            if command is None:
                out["ignored"] = True  # hands-free mode, wake word not said
                return self._json(out)
            out["command"] = command
            if not command.strip():
                text = f"Yes, {cfg['brand']['owner']}?"
                out["reply"] = {"text": text}
            else:
                reply = brain.handle(command, source="ipad")
                out["reply"] = reply.to_dict()
                text = reply.text
            if (query.get("speak") or ["1"])[0] == "1":
                out["audio"] = _b64(voice.speak_wav(text))
            return self._json(out)

        def _tts(self, text: str) -> None:
            try:
                wav = voice.speak_wav(text)
            except Exception as exc:
                return self._json({"error": str(exc)}, 500)
            if wav is None:
                self.send_response(204)  # no local TTS: the page falls back to on-device speech
                self.end_headers()
                return
            self._send(200, wav, "audio/wav")

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
            except (BrokenPipeError, ConnectionResetError, ssl.SSLError, OSError):
                pass
            finally:
                bus.unsubscribe(q)

    return Handler


def _b64(wav: bytes | None) -> str | None:
    return base64.b64encode(wav).decode() if wav else None


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


def serve(cfg: dict, brain: Brain, bus: EventBus, *, voice: VoiceService | None = None,
          key: str | None = None, cert: tuple[Path, Path] | None = None) -> VaultServer:
    """Build the server. `key` turns on the password gate; `cert` turns on HTTPS."""
    host, port = cfg["hud"].get("host", "127.0.0.1"), cfg["hud"].get("port", 8765)
    voice = voice or VoiceService(cfg)
    httpd = VaultServer((host, port), make_handler(cfg, brain, bus, voice, key, https=cert is not None))
    if cert:
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.minimum_version = ssl.TLSVersion.TLSv1_2
        ctx.load_cert_chain(str(cert[0]), str(cert[1]))
        httpd.ssl_context = ctx
    return httpd
