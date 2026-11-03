"""Tiny thread-safe pub/sub bus. The voice loop, brain and HUD all talk through it."""

from __future__ import annotations

import queue
import threading
import time
from collections import deque


class EventBus:
    def __init__(self, history: int = 200) -> None:
        self._subs: list[queue.Queue] = []
        self._lock = threading.Lock()
        self.history: deque[dict] = deque(maxlen=history)

    def publish(self, kind: str, **data) -> dict:
        event = {"kind": kind, "ts": time.time(), **data}
        if kind != "audio_level":  # don't flood history with meter ticks
            self.history.append(event)
        with self._lock:
            subs = list(self._subs)
        for q in subs:
            try:
                q.put_nowait(event)
            except queue.Full:
                pass
        return event

    def subscribe(self) -> queue.Queue:
        q: queue.Queue = queue.Queue(maxsize=500)
        with self._lock:
            self._subs.append(q)
        return q

    def unsubscribe(self, q: queue.Queue) -> None:
        with self._lock:
            if q in self._subs:
                self._subs.remove(q)


bus = EventBus()
