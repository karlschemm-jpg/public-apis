"""Ears: faster-whisper transcription, plus an energy-gated microphone listener. All on-device."""

from __future__ import annotations

import queue
import threading
import time
from typing import Iterator

import numpy as np

from ..events import EventBus


class Transcriber:
    """faster-whisper model. Used by the host mic loop and by /api/voice (iPad/browser mic)."""

    def __init__(self, cfg: dict) -> None:
        from faster_whisper import WhisperModel  # heavy import, keep lazy

        v = cfg["voice"]
        self.model = WhisperModel(v.get("stt_model", "base.en"),
                                  device=v.get("stt_device", "auto"),
                                  compute_type=v.get("stt_compute", "int8"))
        self._lock = threading.Lock()  # one decode at a time keeps CPU/GPU memory predictable

    def transcribe(self, audio: np.ndarray) -> str:
        with self._lock:
            segments, _ = self.model.transcribe(audio, language="en", vad_filter=True, beam_size=1)
            return " ".join(s.text.strip() for s in segments).strip()


class Ears:
    """Host-machine microphone → utterances, gated on loudness."""

    def __init__(self, cfg: dict, bus: EventBus, transcriber: Transcriber) -> None:
        v = cfg["voice"]
        self.sr = v.get("sample_rate", 16000)
        self.silence_s = v.get("silence_ms", 800) / 1000
        self.threshold = v.get("energy_threshold", 0.012)
        self.max_s = v.get("max_utterance_s", 20)
        self.bus = bus
        self.transcriber = transcriber
        self.muted = threading.Event()  # set while Jarvis is talking (half-duplex, no echo)
        self._frames: queue.Queue = queue.Queue()

    def _callback(self, indata, frames, t, status) -> None:
        self._frames.put(indata[:, 0].copy())

    def utterances(self, stop: threading.Event) -> Iterator[np.ndarray]:
        import sounddevice as sd

        block = int(self.sr * 0.03)  # 30 ms frames
        buf: list[np.ndarray] = []
        speaking, last_voice, started, last_meter = False, 0.0, 0.0, 0.0
        with sd.InputStream(samplerate=self.sr, channels=1, dtype="float32",
                            blocksize=block, callback=self._callback):
            self.bus.publish("listening", state="armed")
            while not stop.is_set():
                try:
                    frame = self._frames.get(timeout=0.2)
                except queue.Empty:
                    continue
                if self.muted.is_set():
                    buf, speaking = [], False
                    continue
                rms = float(np.sqrt(np.mean(frame ** 2)))
                now = time.monotonic()
                if now - last_meter > 0.066:  # ~15 Hz meter for the HUD visualiser
                    self.bus.publish("audio_level", source="mic", level=min(rms * 12, 1.0))
                    last_meter = now
                if rms >= self.threshold:
                    if not speaking:
                        speaking, started = True, now
                        self.bus.publish("listening", state="hearing")
                    last_voice = now
                if speaking:
                    buf.append(frame)
                    if now - last_voice > self.silence_s or now - started > self.max_s:
                        audio = np.concatenate(buf)
                        buf, speaking = [], False
                        self.bus.publish("listening", state="transcribing")
                        if len(audio) > self.sr * 0.3:
                            yield audio
                        self.bus.publish("listening", state="armed")

    def transcribe(self, audio: np.ndarray) -> str:
        return self.transcriber.transcribe(audio)
