import shutil
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from jarvis.config import load_config  # noqa: E402


@pytest.fixture
def cfg(tmp_path):
    """Real config + skills, but a throwaway copy of the vault and no network tiers."""
    c = load_config(ROOT / "config.toml")
    shutil.copytree(ROOT / "vault", tmp_path / "vault")
    c["paths"]["vault"] = tmp_path / "vault"
    c["router"]["local_model_enabled"] = False
    c["router"]["haiku_enabled"] = False
    return c
