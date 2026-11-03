"""WAV encode/decode (stdlib + numpy) and a lazily-loaded local STT/TTS service.

The browser (e.g. an iPad) sends 16 kHz mono 16-bit WAV; the server transcribes it with
faster-whisper and answers with Kokoro audio as WAV — both on the host machine.
"""

from __future__ import annotations

import io
import threading
import wave

import numpy as np

MAX_UPLOAD_BYTES = 16000 * 2 * 60  # 60 s of 16 kHz 16-bit mono


def decode_wav(data: bytes) -> tuple[np.ndarray, int]:
    try:
        with wave.open(io.BytesIO(data), "rb") as w:
            if w.getsampwidth() != 2:
                raise ValueError("expected 16-bit PCM WAV")
            rate, channels = w.getframerate(), w.getnchannels()
            raw = w.readframes(w.getnframes())
    except (wave.Error, EOFError) as exc:
        raise ValueError(f"not a WAV file ({exc})") from None
    pcm = np.frombuffer(raw[: len(raw) // 2 * 2], dtype="<i2").astype(np.float32) / 32768.0
    if channels > 1:
        pcm = pcm.reshape(-1, channels).mean(axis=1)
    return pcm, rate


def resample(audio: np.ndarray, src: int, dst: int) -> np.ndarray:
    if src == dst or not len(audio):
        return audio
    n = int(round(len(audio) * dst / src))
    return np.interp(np.linspace(0, len(audio) - 1, n), np.arange(len(audio)), audio).astype(np.float32)


def encode_wav(audio: np.ndarray, rate: int) -> bytes:
    pcm = (np.clip(audio, -1.0, 1.0) * 32767).astype("<i2").tobytes()
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)
    return buf.getvalue()


class VoiceService:
    """Loads faster-whisper / Kokoro on first use and shares them across threads."""

    def __init__(self, cfg: dict) -> None:
        self.cfg = cfg
        self._stt = None
        self._tts = None
        self._lock = threading.Lock()

    @property
    def stt(self):
        with self._lock:
            if self._stt is None:
                from .stt import Transcriber
                self._stt = Transcriber(self.cfg)
            return self._stt

    @property
    def tts(self):
        """Kokoro synthesiser, or None if it isn't installed (the browser then speaks on-device)."""
        with self._lock:
            if self._tts is None:
                try:
                    from .tts import Synthesizer
                    self._tts = Synthesizer(self.cfg)
                except ImportError:
                    self._tts = False  # not installed: devices use their built-in voice
                except Exception as exc:  # espeak-ng missing, model download failed…
                    print(f"Kokoro unavailable ({exc}); devices will use their built-in voice")
                    self._tts = False
            return self._tts or None

    def transcribe_wav(self, data: bytes) -> str:
        audio, rate = decode_wav(data)
        return self.stt.transcribe(resample(audio, rate, 16000))

    def speak_wav(self, text: str) -> bytes | None:
        tts = self.tts
        if tts is None or not text.strip():
            return None
        audio = tts.synthesize(text)
        return encode_wav(audio, tts.rate) if len(audio) else None
