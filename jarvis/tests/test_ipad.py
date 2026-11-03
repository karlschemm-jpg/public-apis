"""iPad mode: password gate, HTTPS, and the device-voice endpoint (models faked)."""

import base64
import http.client
import json
import ssl
import threading

import numpy as np
import pytest

from jarvis.brain import Brain
from jarvis.events import EventBus
from jarvis.hud.net import access_key, ensure_cert, is_loopback
from jarvis.hud.server import serve
from jarvis.voice.audio import decode_wav, encode_wav, resample
from jarvis.voice.wake import strip_wake, wake_pattern


class FakeVoice:
    def __init__(self, transcript="jarvis what time is it", tts=True):
        self.transcript, self.tts_on, self.seen = transcript, tts, []

    def transcribe_wav(self, data):
        audio, rate = decode_wav(data)
        self.seen.append((len(audio), rate))
        return self.transcript

    def speak_wav(self, text):
        return encode_wav(np.zeros(240, dtype=np.float32), 24000) if self.tts_on and text else None


@pytest.fixture
def running(cfg):
    servers = []

    def start(voice=None, key=None, cert=None):
        cfg["hud"]["port"] = 0
        brain = Brain(cfg, bus=EventBus())
        httpd = serve(cfg, brain, brain.bus, voice=voice or FakeVoice(), key=key, cert=cert)
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        servers.append(httpd)
        return httpd.server_address[1]

    yield start
    for s in servers:
        s.shutdown()
        s.server_close()


def request(port, method, path, body=None, headers=None, tls=None):
    conn = (http.client.HTTPSConnection("127.0.0.1", port, context=tls, timeout=10) if tls
            else http.client.HTTPConnection("127.0.0.1", port, timeout=10))
    conn.request(method, path, body=body, headers=headers or {})
    r = conn.getresponse()
    data = r.read()
    conn.close()
    return r, data


def wav_bytes(seconds=0.5, rate=48000):
    t = np.linspace(0, seconds, int(rate * seconds), endpoint=False)
    return encode_wav((0.3 * np.sin(2 * np.pi * 220 * t)).astype(np.float32), rate)


# ── audio helpers ────────────────────────────────────────────────────────
def test_wav_roundtrip_and_resample():
    audio, rate = decode_wav(wav_bytes(1.0, 48000))
    assert rate == 48000 and len(audio) == 48000
    assert abs(float(np.max(audio)) - 0.3) < 0.01
    assert len(resample(audio, 48000, 16000)) == 16000


def test_wake_words():
    p = wake_pattern(["jarvis", "vault"])
    assert strip_wake("Hey Jarvis, what time is it?", p, required=True) == "what time is it?"
    assert strip_wake("what time is it", p, required=True) is None
    assert strip_wake("what time is it", p, required=False) == "what time is it"
    assert strip_wake("anything", wake_pattern([]), required=True) == "anything"


# ── access control ───────────────────────────────────────────────────────
def test_loopback_detection():
    assert is_loopback("127.0.0.1") and is_loopback("localhost")
    assert not is_loopback("0.0.0.0") and not is_loopback("192.168.1.5")


def test_access_key_is_persisted(tmp_path):
    k = access_key(tmp_path)
    assert len(k) >= 12 and access_key(tmp_path) == k
    assert access_key(tmp_path, "configured") == "configured"


def test_locked_without_key(running):
    port = running(key="s3cret")
    r, body = request(port, "GET", "/")
    assert r.status == 200 and b"Access key" in body and b"V.A.U.L.T." in body  # login page, not the HUD
    assert request(port, "GET", "/api/state")[0].status == 401
    assert request(port, "POST", "/api/voice", wav_bytes())[0].status == 401
    assert request(port, "GET", "/?key=wrong")[0].status == 401


def test_login_sets_cookie_and_unlocks(running):
    port = running(key="s3cret")
    r, _ = request(port, "GET", "/?key=s3cret")
    assert r.status == 303 and r.getheader("Location") == "/"
    cookie = r.getheader("Set-Cookie")
    assert "vault_key=s3cret" in cookie and "HttpOnly" in cookie and "SameSite=Strict" in cookie
    r, body = request(port, "GET", "/api/state", headers={"Cookie": "vault_key=s3cret"})
    assert r.status == 200 and "skills" in json.loads(body)
    r, body = request(port, "GET", "/", headers={"Cookie": "vault_key=s3cret"})
    assert b'id="micBtn"' in body


def test_open_when_no_key(running):
    assert request(running(), "GET", "/api/state")[0].status == 200


# ── device voice ─────────────────────────────────────────────────────────
def test_voice_tap_mode_runs_command_and_returns_audio(running):
    voice = FakeVoice("what time is it")
    port = running(voice=voice)
    r, body = request(port, "POST", "/api/voice?wake=0&speak=1", wav_bytes(), {"Content-Type": "audio/wav"})
    data = json.loads(body)
    assert r.status == 200
    assert data["command"] == "what time is it"
    assert data["reply"]["text"].startswith("It's")
    assert data["reply"]["route"]["target"] == "time"
    assert decode_wav(base64.b64decode(data["audio"]))[1] == 24000
    assert voice.seen == [(24000, 48000)]


def test_voice_hands_free_requires_wake_word(running):
    port = running(voice=FakeVoice("what time is it"))
    data = json.loads(request(port, "POST", "/api/voice?wake=1", wav_bytes())[1])
    assert data["ignored"] is True and data["reply"] is None

    port = running(voice=FakeVoice("Jarvis, what time is it"))
    data = json.loads(request(port, "POST", "/api/voice?wake=1", wav_bytes())[1])
    assert data["command"] == "what time is it" and data["reply"]["text"].startswith("It's")


def test_voice_wake_word_alone_gets_acknowledged(running):
    port = running(voice=FakeVoice("Jarvis"))
    data = json.loads(request(port, "POST", "/api/voice?wake=1", wav_bytes())[1])
    assert data["reply"]["text"] == "Yes, Boss?"


def test_voice_without_kokoro_returns_text_only(running):
    port = running(voice=FakeVoice("what time is it", tts=False))
    data = json.loads(request(port, "POST", "/api/voice", wav_bytes())[1])
    assert data["audio"] is None and data["reply"]["text"]
    assert request(port, "POST", "/api/tts", b'{"text": "hi"}')[0].status == 204


def test_voice_rejects_bad_and_oversized_audio(running):
    port = running()
    assert request(port, "POST", "/api/voice", b"not a wav")[0].status == 400
    assert request(port, "POST", "/api/voice", b"")[0].status == 400
    # Declares 61 s of audio: refused from the header alone, before anything is read.
    conn = http.client.HTTPConnection("127.0.0.1", port, timeout=10)
    conn.putrequest("POST", "/api/voice")
    conn.putheader("Content-Length", str(16000 * 2 * 61))
    conn.endheaders()
    assert conn.getresponse().status == 413
    conn.close()


def test_tts_endpoint_returns_wav(running):
    r, body = request(running(), "POST", "/api/tts", b'{"text": "hello"}')
    assert r.status == 200 and r.getheader("Content-Type") == "audio/wav" and body[:4] == b"RIFF"


# ── HTTPS (needs openssl) ────────────────────────────────────────────────
def test_https_with_generated_cert(running, tmp_path):
    pytest.importorskip("ssl")
    import shutil
    if not shutil.which("openssl"):
        pytest.skip("openssl not installed")
    cert, key = ensure_cert(tmp_path, ["127.0.0.1"])
    assert ensure_cert(tmp_path, ["127.0.0.1"]) == (cert, key)  # reused, not regenerated
    port = running(key="k", cert=(cert, key))
    tls = ssl.create_default_context(cafile=str(cert))  # verify against our own cert, IP SAN included
    r, _ = request(port, "GET", "/?key=k", tls=tls)
    assert r.status == 303 and "Secure" in r.getheader("Set-Cookie")
    # a client that rejects the cert (like Safari before you accept it) mustn't break the server
    with pytest.raises(ssl.SSLError):
        request(port, "GET", "/", tls=ssl.create_default_context())
    assert request(port, "GET", "/api/state", headers={"Cookie": "vault_key=k"}, tls=tls)[0].status == 200
