"""Mic in → faster-whisper → router → brain → Kokoro out."""

from __future__ import annotations

import threading
import time

from ..brain import Brain
from ..events import EventBus
from .audio import VoiceService
from .wake import strip_wake, wake_pattern

FOLLOW_UP_S = 8.0  # after a reply, no wake word needed for this long


class VoiceLoop:
    def __init__(self, cfg: dict, brain: Brain, bus: EventBus, service: VoiceService) -> None:
        from .stt import Ears
        from .tts import Mouth

        self.cfg, self.brain, self.bus = cfg, brain, bus
        self.ears = Ears(cfg, bus, service.stt)
        if service.tts is None:
            raise ImportError("kokoro", name="kokoro")
        self.mouth = Mouth(cfg, bus, service.tts)
        self.wake = wake_pattern(cfg["brand"].get("wake_words", []))
        self.stop_event = threading.Event()
        self._open_until = 0.0
        q = bus.subscribe()
        threading.Thread(target=self._watch_stop, args=(q,), daemon=True).start()

    def _watch_stop(self, q) -> None:
        while True:
            if q.get().get("kind") == "stop":
                self.mouth.stop()

    def _strip_wake(self, text: str) -> str | None:
        return strip_wake(text, self.wake, required=time.monotonic() >= self._open_until)

    def run(self) -> None:
        self.bus.publish("voice", state="online", stt=self.cfg["voice"]["stt_model"],
                         tts=self.cfg["voice"]["tts_voice"])
        for audio in self.ears.utterances(self.stop_event):
            text = self.ears.transcribe(audio)
            if not text:
                continue
            self.bus.publish("transcript", text=text)
            command = self._strip_wake(text)
            if command is None:
                continue  # not addressed to us
            if not command.strip():
                self._open_until = time.monotonic() + FOLLOW_UP_S
                self._speak(f"Yes, {self.cfg['brand']['owner']}?")
                continue
            reply = self.brain.handle(command, source="voice")
            self._speak(reply.text)
            self._open_until = time.monotonic() + FOLLOW_UP_S

    def _speak(self, text: str) -> None:
        self.ears.muted.set()  # half-duplex: don't transcribe our own voice
        try:
            self.mouth.say(text)
        finally:
            self.ears.muted.clear()

    def stop(self) -> None:
        self.stop_event.set()
