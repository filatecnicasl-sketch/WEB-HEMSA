from __future__ import annotations

from email.parser import BytesParser
from email.policy import default
import json
import os
from pathlib import Path
import socket
import socketserver
import subprocess
import sys
import threading
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "test-output" / "contact-forms"
NODE = os.environ.get("NODE", "node.CMD" if os.name == "nt" else "node")


class SMTPCapture(socketserver.StreamRequestHandler):
    def handle(self):
        self.wfile.write(b"220 localhost HEMSA test SMTP\r\n")
        collecting = False
        content = []
        while True:
            line = self.rfile.readline()
            if not line:
                return
            if collecting:
                if line == b".\r\n":
                    with self.server.messages_lock:
                        self.server.messages.append(b"".join(content))
                    content = []
                    collecting = False
                    self.wfile.write(b"250 2.0.0 Message accepted\r\n")
                else:
                    content.append(line)
                continue
            command = line.decode("ascii", errors="replace").strip()
            upper = command.upper()
            if upper.startswith("EHLO") or upper.startswith("HELO"):
                self.wfile.write(b"250-localhost\r\n250 8BITMIME\r\n")
            elif upper.startswith("DATA"):
                collecting = True
                self.wfile.write(b"354 End data with <CR><LF>.<CR><LF>\r\n")
            elif upper.startswith("QUIT"):
                self.wfile.write(b"221 2.0.0 Bye\r\n")
                return
            elif upper.startswith(("MAIL FROM", "RCPT TO", "RSET", "NOOP", "VRFY")):
                self.wfile.write(b"250 2.1.0 OK\r\n")
            else:
                self.wfile.write(b"250 OK\r\n")


class CaptureServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

    def __init__(self):
        super().__init__(("127.0.0.1", 0), SMTPCapture)
        self.messages = []
        self.messages_lock = threading.Lock()


def wait_http(url: str, process: subprocess.Popen):
    deadline = time.monotonic() + 35
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"El proceso terminó antes de iniciar: {process.returncode}")
        try:
            with urlopen(url, timeout=1) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(0.2)
    raise RuntimeError(f"No respondió {url}")


def stop(process):
    if process and process.poll() is None:
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=15)
        else:
            process.terminate()
        try:
            process.wait(timeout=10)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)


def assert_free(port: int):
    with socket.socket() as probe:
        if probe.connect_ex(("127.0.0.1", port)) == 0:
            raise RuntimeError(f"El puerto {port} ya está ocupado")


def post(url: str, payload: dict):
    request = Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urlopen(request, timeout=10) as response:
            return response.status, json.load(response)
    except HTTPError as error:
        return error.code, json.load(error)


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    assert_free(4173)
    assert_free(5174)
    assert_free(5175)
    capture = CaptureServer()
    smtp_thread = threading.Thread(target=capture.serve_forever, daemon=True)
    smtp_thread.start()
    environment = os.environ.copy()
    environment.update({
        "HEMSA_SMTP_ENABLED": "true",
        "HEMSA_SMTP_HOST": "127.0.0.1",
        "HEMSA_SMTP_PORT": str(capture.server_address[1]),
        "HEMSA_SMTP_SECURITY": "none",
        "HEMSA_SMTP_USERNAME": "",
        "HEMSA_SMTP_PASSWORD": "",
        "HEMSA_SMTP_SENDER": "web@hemsa.local",
        "HEMSA_MAIL_RECIPIENT": "correo@hemsasanfernando.es",
        "LOCAL_WEB_URL": "http://127.0.0.1:4173",
    })
    backend = None
    frontend = None
    unconfigured = None
    checks = []
    try:
        backend = subprocess.Popen([sys.executable, str(ROOT / "local-server" / "server.py")], cwd=ROOT, env=environment, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        frontend = subprocess.Popen([NODE, str(ROOT / "node_modules" / "vite" / "bin" / "vite.js"), "--host", "127.0.0.1", "--port", "4173", "--strictPort"], cwd=ROOT, env=environment, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait_http("http://127.0.0.1:5174/api/health", backend)
        wait_http("http://127.0.0.1:4173", frontend)
        completed = subprocess.run([NODE, str(ROOT / "scripts" / "contact-forms-check.mjs")], cwd=ROOT, env=environment)
        if completed.returncode:
            raise RuntimeError("La prueba de navegador ha encontrado errores")
        deadline = time.monotonic() + 5
        while len(capture.messages) < 2 and time.monotonic() < deadline:
            time.sleep(0.1)
        messages = [BytesParser(policy=default).parsebytes(data) for data in capture.messages]
        contact = next((message for message in messages if str(message["Subject"]).startswith("[Web HEMSA]")), None)
        appointment = next((message for message in messages if str(message["Subject"]).startswith("[Cita previa]")), None)
        checks.append({"name": "Contacto llega al servidor SMTP", "passed": contact is not None})
        checks.append({"name": "Cita previa llega al servidor SMTP", "passed": appointment is not None})
        checks.append({"name": "El filtro automático no genera correo", "passed": len(messages) == 2, "messages": len(messages)})
        for label, message, prefix in (("Contacto", contact, "CON-"), ("Cita previa", appointment, "CIT-")):
            if not message:
                continue
            body = message.get_body(preferencelist=("plain",)).get_content()
            checks.extend([
                {"name": f"{label}: destinatario correcto", "passed": message["To"] == "correo@hemsasanfernando.es"},
                {"name": f"{label}: respuesta dirigida al ciudadano", "passed": message["Reply-To"] == "prueba.local@example.org"},
                {"name": f"{label}: referencia y datos incluidos", "passed": str(message["X-HEMSA-Reference"]).startswith(prefix) and "Prueba Local HEMSA" in body and "600 000 000" in body},
            ])
        stop(backend)
        backend = None
        stop(frontend)
        frontend = None
        disabled_environment = environment.copy()
        disabled_environment.update({"HEMSA_LOCAL_API_PORT": "5175", "HEMSA_SMTP_ENABLED": "false"})
        unconfigured = subprocess.Popen([sys.executable, str(ROOT / "local-server" / "server.py")], cwd=ROOT, env=disabled_environment, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        wait_http("http://127.0.0.1:5175/api/health", unconfigured)
        status, data = post("http://127.0.0.1:5175/api/public/contact", {"name": "Prueba Local", "email": "prueba.local@example.org", "phone": "", "subject": "Información general", "message": "Mensaje que no debe enviarse.", "privacy": True, "website": ""})
        checks.append({"name": "Sin contraseña no se finge un envío correcto", "passed": status == 503 and data.get("error", {}).get("code") == "MAIL_NOT_CONFIGURED", "status": status})
        failed = [check for check in checks if not check["passed"]]
        report = {"smtpChecks": checks, "passed": not failed, "messagesInspected": len(messages)}
        (OUTPUT / "smtp-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 1 if failed else 0
    finally:
        stop(unconfigured)
        stop(frontend)
        stop(backend)
        capture.shutdown()
        capture.server_close()
        smtp_thread.join(timeout=5)
        print("Servidores temporales de correo, API y web detenidos.")


if __name__ == "__main__":
    raise SystemExit(main())
