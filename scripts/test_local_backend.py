from __future__ import annotations

import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "local-server" / "server.py"
CREDENTIALS = ROOT / "local-server" / "private" / "admin.json"
PORT = int(os.environ.get("HEMSA_TEST_PORT", "5174"))
BASE_URL = f"http://127.0.0.1:{PORT}"


def wait_until_ready(process: subprocess.Popen) -> None:
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"El servidor local terminó antes de iniciar (código {process.returncode}).")
        try:
            with urlopen(f"{BASE_URL}/api/health", timeout=1) as response:
                if response.status == 200 and json.load(response).get("status") == "ok":
                    return
        except Exception:
            time.sleep(0.2)
    raise RuntimeError("El servidor local no respondió correctamente en 30 segundos.")


def main() -> int:
    with socket.socket() as probe:
        if probe.connect_ex(("127.0.0.1", PORT)) == 0:
            print(f"El puerto local {PORT} ya está ocupado; no se ha iniciado otro proceso.", file=sys.stderr)
            return 2

    log_path = ROOT / "integration" / "local-backend-test.log"
    process = None
    try:
        with log_path.open("w", encoding="utf-8") as log:
            server_environment = os.environ.copy()
            server_environment["PORT"] = str(PORT)
            process = subprocess.Popen(
                [sys.executable, str(BACKEND)],
                cwd=ROOT,
                env=server_environment,
                stdout=log,
                stderr=subprocess.STDOUT,
            )
            wait_until_ready(process)
            credentials = json.loads(CREDENTIALS.read_text(encoding="utf-8"))
            environment = os.environ.copy()
            environment.update({
                "BACKEND_URL": BASE_URL,
                "HEMSA_ADMIN_EMAIL": credentials["email"],
                "HEMSA_ADMIN_PASSWORD": credentials["password"],
            })
            results = []
            for suite in ("api-acceptance.mjs", "editorial-api-acceptance.mjs"):
                completed = subprocess.run(
                    [os.environ.get("NODE", "node.CMD" if os.name == "nt" else "node"), str(ROOT / "integration" / suite)],
                    cwd=ROOT,
                    env=environment,
                    text=True,
                )
                results.append(completed.returncode)
                if completed.returncode != 0:
                    break
            return 0 if results == [0, 0] else 1
    finally:
        if process is not None:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
            print(f"Servidor de pruebas detenido (código {process.returncode}). Registro: {log_path}")


if __name__ == "__main__":
    raise SystemExit(main())
