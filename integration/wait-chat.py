from pathlib import Path
import shutil
import subprocess
import time

chat_id = "1a2101dc-b6d2-83bc-8000-09fe5a9c4c69"
executable = shutil.which("kimix")
if not executable:
    raise SystemExit("No se encontro kimix en PATH")
log_path = Path(__file__).resolve().parent / "chat-wait.log"
deadline = time.monotonic() + 40 * 60
last_state = None
with log_path.open("w", encoding="utf-8") as log:
    while time.monotonic() < deadline:
        result = subprocess.run(
            [executable, "chat", "status", chat_id],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=60,
        )
        output = result.stdout
        generating = "MESSAGE_STATUS_GENERATING" in output
        state = "generating" if generating else "finished"
        if state != last_state:
            line = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {state}\n"
            print(line, end="", flush=True)
            log.write(line)
            log.flush()
            last_state = state
        if not generating:
            tail = output[-12000:]
            print(tail, flush=True)
            log.write(tail)
            log.flush()
            raise SystemExit(result.returncode)
        time.sleep(30)
raise SystemExit("Tiempo de espera agotado; el desarrollo remoto sigue procesando")
