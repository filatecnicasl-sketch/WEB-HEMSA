from __future__ import annotations

import json
import os
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = 8090
BASE = f"http://127.0.0.1:{PORT}"


def request(path: str, method: str = "GET"):
    req = urllib.request.Request(BASE + path, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.status, dict(response.headers), response.read()
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read()


def port_free() -> bool:
    with socket.socket() as sock:
        return sock.connect_ex(("127.0.0.1", PORT)) != 0


def main() -> int:
    if not port_free():
        raise RuntimeError(f"El puerto {PORT} está ocupado")
    env = os.environ.copy()
    env.update(
        {
            "PORT": str(PORT),
            "HEMSA_HOST": "127.0.0.1",
            "HEMSA_DATA_DIR": str(ROOT / "local-server" / "data"),
            "HEMSA_PRIVATE_DIR": str(ROOT / "local-server" / "private"),
        }
    )
    process = subprocess.Popen(
        [sys.executable, str(ROOT / "local-server" / "server.py")],
        cwd=ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        deadline = time.time() + 15
        while time.time() < deadline:
            if process.poll() is not None:
                stdout, stderr = process.communicate()
                raise RuntimeError(f"El servidor no arrancó.\nSTDOUT:\n{stdout}\nSTDERR:\n{stderr}")
            try:
                status, _, body = request("/api/health")
                if status == 200 and json.loads(body) == {"status": "ok"}:
                    break
            except (OSError, json.JSONDecodeError):
                time.sleep(0.25)
        else:
            raise RuntimeError("El servidor no respondió a tiempo")

        checks = []
        status, headers, body = request("/")
        checks.append((status == 200, "la portada responde 200"))
        checks.append(("text/html" in headers.get("Content-Type", ""), "la portada usa HTML"))
        checks.append((b'<div id="root">' in body, "la portada contiene la aplicación"))

        status, headers, body = request("/", "HEAD")
        checks.append((status == 200 and not body, "HEAD de la portada responde sin cuerpo"))

        status, headers, body = request("/gestor")
        checks.append((status == 200 and b'<div id="root">' in body, "las rutas internas cargan la aplicación"))

        status, headers, body = request("/api/health")
        checks.append((status == 200 and json.loads(body) == {"status": "ok"}, "la API responde correctamente"))

        status, _, index = request("/")
        asset = None
        marker = b'src="/assets/'
        if marker in index:
            asset = index.split(marker, 1)[1].split(b'"', 1)[0].decode("ascii")
        checks.append((asset is not None, "la portada referencia un JS compilado"))
        if asset:
            status, headers, body = request(f"/assets/{asset}")
            checks.append((status == 200 and len(body) > 1000, "el JS compilado se sirve correctamente"))
            checks.append(("javascript" in headers.get("Content-Type", ""), "el JS usa el tipo MIME correcto"))
            checks.append(("immutable" in headers.get("Cache-Control", ""), "los assets usan caché duradera"))

        status, _, body = request("/%2e%2e/package.json")
        checks.append((status == 404, "no se puede salir de la carpeta pública"))

        status, _, body = request("/documento-que-no-existe.pdf")
        checks.append((status == 404, "un archivo inexistente devuelve 404"))

        failed = [label for ok, label in checks if not ok]
        for ok, label in checks:
            print(f"{'OK' if ok else 'FALLO'}: {label}")
        if failed:
            raise RuntimeError("Fallaron comprobaciones: " + ", ".join(failed))
        print(f"RESULTADO: {len(checks)} comprobaciones de producción superadas")
        return 0
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=10)
        stdout, stderr = process.communicate()
        if stderr.strip():
            print("Registro del servidor:")
            print(stderr.strip())


if __name__ == "__main__":
    raise SystemExit(main())
