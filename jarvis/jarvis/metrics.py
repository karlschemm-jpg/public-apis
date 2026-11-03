"""Lightweight in-process metrics for the HUD."""

from __future__ import annotations

import os
import threading
import time
from collections import Counter, deque


class Metrics:
    def __init__(self) -> None:
        self.started = time.time()
        self.counters: Counter = Counter()
        self.timings: dict[str, deque] = {}
        self.tokens = Counter()
        self._lock = threading.Lock()

    def count(self, key: str, n: int = 1) -> None:
        with self._lock:
            self.counters[key] += n

    def timing(self, key: str, ms: float) -> None:
        with self._lock:
            self.timings.setdefault(key, deque(maxlen=50)).append(ms)

    def add_usage(self, usage) -> None:
        with self._lock:
            for f in ("input_tokens", "output_tokens", "cache_read_input_tokens"):
                self.tokens[f] += getattr(usage, f, 0) or 0

    def snapshot(self) -> dict:
        with self._lock:
            avg = {k: round(sum(v) / len(v)) for k, v in self.timings.items() if v}
            snap = {
                "uptime_s": round(time.time() - self.started),
                "counters": dict(self.counters),
                "avg_ms": avg,
                "tokens": dict(self.tokens),
            }
        try:
            snap["load"] = round(os.getloadavg()[0], 2)
        except (AttributeError, OSError):
            snap["load"] = None
        return snap
