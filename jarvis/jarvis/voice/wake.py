"""Wake-word handling shared by the host mic loop and the iPad/browser mic."""

from __future__ import annotations

import re


def wake_pattern(words: list[str]) -> re.Pattern | None:
    words = [re.escape(w) for w in words if w.strip()]
    if not words:
        return None
    return re.compile(rf"^\W*(hey\s+|ok(ay)?\s+)?({'|'.join(words)})\b[\s,.!?]*", re.I)


def strip_wake(text: str, pattern: re.Pattern | None, *, required: bool) -> str | None:
    """Return the command without its wake word, or None if a required wake word is missing."""
    if pattern is None:
        return text
    m = pattern.match(text)
    if m:
        return text[m.end():]
    return None if required else text
