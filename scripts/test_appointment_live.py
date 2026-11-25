"""Envía una solicitud real de prueba por /api/public/appointments contra el servidor local.

Arranca el servidor en un puerto libre, publica una cita marcada como PRUEBA
y muestra solo el estado y la referencia devuelta.
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
PORT = int(os.environ.get("HEMSA_TEST_PORT", "5198"))
BASE = f"http://127.0.0.1:{PORT}"


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

        payload = {
            "name": "Prueba de la web (Kimi)",
            "email": "notificaciones@hemsasanfernando.es",
            "phone": "956945001",
            "service": "Información general",
            "date": "",
            "notes": "Solicitud de PRUEBA del formulario de cita previa de la nueva web. Puede borrarse: confirma que el registro de entrada y el acuse de recibo funcionan correctamente.",
            "privacy": True,
            "website": "",
        }
        request = Request(
            f"{BASE}/api/public/appointments", method="POST",
            data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"},
        )
        try:
            with urlopen(request, timeout=40) as response:
                data = json.loads(response.read() or b"null")
                print(f"CITA ACEPTADA: estado {response.status}, referencia {data.get('reference')}")
                return 0
        except HTTPError as error:
            try:
                detail = json.loads(error.read() or b"null")
            except json.JSONDecodeError:
                detail = None
            print(f"LA CITA FALLÓ: {error.code} {detail}", file=sys.stderr)
            return 1
    finally:
        process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()


if __name__ == "__main__":
    raise SystemExit(main())
