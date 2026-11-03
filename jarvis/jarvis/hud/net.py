"""Network helpers for opening the HUD on another device (iPad): LAN address, HTTPS cert, access key."""

from __future__ import annotations

import ipaddress
import secrets
import shutil
import socket
import subprocess
from pathlib import Path


def lan_ip() -> str:
    """Best guess at this machine's address on the local network (no packets are sent)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


def is_loopback(host: str) -> bool:
    if host in ("localhost", ""):
        return host == "localhost"
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def access_key(state_dir: Path, configured: str = "") -> str:
    """The HUD password. Uses config if set, else a random key saved so the iPad stays logged in."""
    if configured:
        return configured
    path = state_dir / "access_key"
    if path.exists():
        key = path.read_text().strip()
        if key:
            return key
    state_dir.mkdir(parents=True, exist_ok=True)
    key = secrets.token_urlsafe(12)
    path.write_text(key)
    path.chmod(0o600)
    return key


def ensure_cert(state_dir: Path, ips: list[str]) -> tuple[Path, Path]:
    """Create (once) a self-signed certificate for this machine's LAN address.

    iPad Safari only grants microphone access to HTTPS pages, so iPad mode needs this.
    The cert is regenerated if the LAN address changes.
    """
    cert, key, stamp = state_dir / "hud-cert.pem", state_dir / "hud-key.pem", state_dir / "hud-cert.ips"
    wanted = ",".join(sorted(set(ips)))
    if cert.exists() and key.exists() and stamp.exists() and stamp.read_text() == wanted:
        return cert, key
    if not shutil.which("openssl"):
        raise RuntimeError("openssl is needed to create the HTTPS certificate for iPad mode "
                           "(macOS and most Linux distros include it; on Windows, install Git for Windows)")
    state_dir.mkdir(parents=True, exist_ok=True)
    host = socket.gethostname()
    san = ",".join([f"IP:{ip}" for ip in sorted(set(ips))] + ["DNS:localhost", f"DNS:{host}"]
                   + ([f"DNS:{host}.local"] if not host.endswith(".local") else []))
    subprocess.run(
        ["openssl", "req", "-x509", "-newkey", "rsa:2048", "-sha256", "-nodes", "-days", "800",
         "-keyout", str(key), "-out", str(cert), "-subj", "/CN=VAULT HUD",
         "-addext", f"subjectAltName={san}"],
        check=True, capture_output=True,
    )
    key.chmod(0o600)
    stamp.write_text(wanted)
    return cert, key


def print_qr(url: str) -> None:
    """Show a scannable QR code in the terminal if the optional `qrcode` package is installed."""
    try:
        import qrcode
    except ImportError:
        return
    qr = qrcode.QRCode(border=1)
    qr.add_data(url)
    qr.print_ascii(invert=True)
