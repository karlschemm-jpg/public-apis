"""Load config.toml into a plain dict with resolved paths."""

from __future__ import annotations

import os
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_config(path: str | os.PathLike | None = None) -> dict:
    cfg_path = Path(path or os.environ.get("JARVIS_CONFIG", ROOT / "config.toml"))
    with open(cfg_path, "rb") as fh:
        cfg = tomllib.load(fh)
    base = cfg_path.resolve().parent
    paths = cfg.setdefault("paths", {})
    paths["root"] = base
    paths["skills"] = (base / paths.get("skills", "skills")).resolve()
    paths["vault"] = (base / paths.get("vault", "vault")).resolve()
    return cfg
