"""Arranca el servidor local en un puerto de pruebas y envía el correo de prueba real.

Nunca imprime contraseñas; solo códigos de estado y mensajes de la API.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "local-server" / "server.py"
CREDENTIALS = ROOT / "local-server" / "private" / "admin.json"
PORT = int(os.environ.get("HEMSA_TEST_PORT", "5196"))
BASE = f"http://127.0.0.1:{PORT}"


def call(path: str, method: str = "GET", body: dict | None = None, token: str | None = None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = Request(
        f"{BASE}{path}", method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
    )
    try:
        with urlopen(request, timeout=40) as response:
            return response.status, json.loads(response.read() or b"null")
    except HTTPError as error:
        try:
            payload = json.loads(error.read() or b"null")
        except json.JSONDecodeError:
            payload = None
        return error.code, payload


def main() -> int:
    with socket.socket() as probe:
        if probe.connect_ex(("127.0.0.1", PORT)) == 0:
            print(f"El puerto {PORT} está ocupado; define HEMSA_TEST_PORT con otro valor.", file=sys.stderr)
            return 2

    environment = os.environ.copy()
    environment["PORT"] = str(PORT)
    process = subprocess.Popen(
        [sys.executable, str(BACKEND)], cwd=ROOT, env=environment,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        deadline = time.monotonic() + 30
        while time.monotonic() < deadline:
            if process.poll() is not None:
                print("El servidor terminó antes de iniciar.", file=sys.stderr)
                return 2
            try:
                with urlopen(f"{BASE}/api/health", timeout=1) as response:
                    if response.status == 200:
                        break
            except Exception:
                time.sleep(0.2)
        else:
            print("El servidor no respondió a tiempo.", file=sys.stderr)
            return 2

        credentials = json.loads(CREDENTIALS.read_text(encoding="utf-8"))
        status, data = call("/api/auth/login", "POST", {"email": credentials["email"], "password": credentials["password"]})
        if status != 200:
            print(f"Login fallido: {status}", file=sys.stderr)
            return 1
        token = data["token"]

        status, data = call("/api/admin/mail-settings", token=token)
        settings = (data or {}).get("settings", {})
        print(f"GET mail-settings -> {status}; activado={settings.get('enabled')}, contraseñaGuardada={settings.get('passwordSet')}, destinatario={settings.get('recipient')}")
        if status != 200 or not settings.get("enabled") or not settings.get("passwordSet"):
            print("La configuración guardada no está completa.", file=sys.stderr)
            return 1

        status, data = call("/api/admin/mail-settings/test", "POST", token=token)
        if status == 200:
            print(f"CORREO DE PRUEBA ENVIADO a {data.get('recipient')} (referencia {data.get('reference')}).")
            return 0
        error = (data or {}).get("error", {})
        print(f"EL ENVÍO FALLÓ: {status} {error.get('code')}: {error.get('message')}", file=sys.stderr)
        return 1
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()


if __name__ == "__main__":
    raise SystemExit(main())
