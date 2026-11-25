from __future__ import annotations

import os
import subprocess
import sys

from test_contact_forms import NODE, ROOT, assert_free, stop, wait_http


def main():
    assert_free(4173)
    assert_free(5174)
    backend = None
    frontend = None
    try:
        backend = subprocess.Popen([sys.executable, str(ROOT / "local-server" / "server.py")], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        frontend = subprocess.Popen([NODE, str(ROOT / "node_modules" / "vite" / "bin" / "vite.js"), "--host", "127.0.0.1", "--port", "4173", "--strictPort"], cwd=ROOT, env={**os.environ, "LOCAL_WEB_URL": "http://127.0.0.1:4173"}, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait_http("http://127.0.0.1:5174/api/health", backend)
        wait_http("http://127.0.0.1:4173", frontend)
        completed = subprocess.run([NODE, str(ROOT / "scripts" / "admin-login-layout-check.mjs")], cwd=ROOT, env={**os.environ, "LOCAL_WEB_URL": "http://127.0.0.1:4173"})
        return completed.returncode
    finally:
        stop(frontend)
        stop(backend)
        print("Servidores temporales detenidos.")


if __name__ == "__main__":
    raise SystemExit(main())
