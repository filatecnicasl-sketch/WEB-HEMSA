from pathlib import Path
import shutil
import subprocess
import sys

root = Path(__file__).resolve().parent
chat_id = "1a2101dc-b6d2-83bc-8000-09fe5a9c4c69"
requirements = (root / "backend-requirements.md").read_text(encoding="utf-8")
openapi = (root / "openapi.yaml").read_text(encoding="utf-8")
prompt = (
    "The upload pipeline failed twice, so below are the COMPLETE contents of both contract documents directly in this message. "
    "Do not rebuild the frontend. Implement the backend exactly to this contract with real durable storage, authentication, authorization, CORS and every acceptance case. "
    "Save a publishable version, return its version ID and required configuration names, and do not publish it yourself.\n\n"
    "===== backend-requirements.md =====\n" + requirements +
    "\n\n===== openapi.yaml =====\n" + openapi +
    "\n\n===== END OF COMPLETE CONTRACT =====\n"
)
executable = shutil.which("kimix")
if not executable:
    raise SystemExit("No se encontro kimix en PATH")
process = subprocess.Popen(
    [executable, "chat", "send", chat_id, prompt],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    encoding="utf-8",
    errors="replace",
    bufsize=1,
)
with (root / "chat-send-contract.log").open("w", encoding="utf-8") as log:
    for line in process.stdout:
        print(line, end="", flush=True)
        log.write(line)
        log.flush()
raise SystemExit(process.wait())
