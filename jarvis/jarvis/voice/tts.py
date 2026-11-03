"""Mouth: Kokoro TTS, generated locally. `Synthesizer` makes audio; `Mouth` plays it on the host."""

from __future__ import annotations

import threading

import numpy as np

from ..events import EventBus

KOKORO_SR = 24000


class Synthesizer:
    rate = KOKORO_SR

    def __init__(self, cfg: dict) -> None:
        from kokoro import KPipeline  # heavy import, keep lazy

        v = cfg["voice"]
        self.voice = v.get("tts_voice", "af_heart")
        self.speed = v.get("tts_speed", 1.0)
        self.pipeline = KPipeline(lang_code=v.get("tts_lang", "a"))
        self._lock = threading.Lock()

    def chunks(self, text: str):
        with self._lock:
            for _, _, audio in self.pipeline(text, voice=self.voice, speed=self.speed):
                yield np.asarray(audio, dtype=np.float32)

    def synthesize(self, text: str) -> np.ndarray:
        parts = list(self.chunks(text))
        return np.concatenate(parts) if parts else np.zeros(0, dtype=np.float32)


class Mouth:
    """Plays speech through the host machine's speakers."""

    def __init__(self, cfg: dict, bus: EventBus, synth: Synthesizer) -> None:
        self.synth = synth
        self.bus = bus
        self._interrupt = threading.Event()

    def stop(self) -> None:
        import sounddevice as sd

        self._interrupt.set()
        sd.stop()

    def say(self, text: str) -> None:
        import sounddevice as sd

        if not text.strip():
            return
        self._interrupt.clear()
        self.bus.publish("speaking", state="start", text=text)
        try:
            for audio in self.synth.chunks(text):
                if self._interrupt.is_set():
                    break
                self._meter(audio)
                sd.play(audio, KOKORO_SR)
                sd.wait()
        finally:
            self.bus.publish("speaking", state="end")

    def _meter(self, audio: np.ndarray) -> None:
        """Send a coarse loudness envelope so the HUD orb pulses with the voice."""
        hop = KOKORO_SR // 15
        env = [float(np.sqrt(np.mean(audio[i:i + hop] ** 2))) for i in range(0, len(audio), hop)]
        self.bus.publish("tts_envelope", fps=15, levels=[round(min(e * 6, 1.0), 3) for e in env])
