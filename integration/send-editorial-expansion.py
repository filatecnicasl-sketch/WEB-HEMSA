from pathlib import Path
import shutil
import subprocess

root = Path(__file__).resolve().parent
chat_id = "1a2101dc-b6d2-83bc-8000-09fe5a9c4c69"
requirements = (root / "backend-requirements.md").read_text(encoding="utf-8")
expansion = "## Ampliacion obligatoria: Ayudas, Empleo y documentos" + requirements.split("## Ampliacion obligatoria: Ayudas, Empleo y documentos", 1)[1]
openapi = (root / "openapi.yaml").read_text(encoding="utf-8")
seed = (root / "editorial-seed.json").read_text(encoding="utf-8")
bundle = (
    "===== EDITORIAL EXPANSION REQUIREMENTS =====\n" + expansion +
    "\n\n===== COMPLETE AMENDED OPENAPI =====\n" + openapi +
    "\n\n===== EDITORIAL SEED JSON =====\n" + seed +
    "\n\n===== END OF EDITORIAL EXPANSION ====="
)
chunk_size = 12000
chunks = [bundle[index:index + chunk_size] for index in range(0, len(bundle), chunk_size)]
executable = shutil.which("kimix")
if not executable:
    raise SystemExit("No se encontro kimix en PATH")

log_path = root / "chat-send-editorial-expansion.log"
with log_path.open("w", encoding="utf-8") as log:
    for index, chunk in enumerate(chunks, 1):
        final = index == len(chunks)
        instruction = (
            f"This is PART {index}/{len(chunks)} and the FINAL part of the expanded HEMSA backend contract. "
            "Reconstruct the complete bundle by concatenating all chunks in order. Implement this expansion together with the original contract, "
            "including durable binary PDF storage, all editorial endpoints and every acceptance case. Use the supplied seed as the published initial data. "
            "Save ONE publishable version containing the complete backend, return its version ID, configuration mechanism and limitations. Do not publish it yourself.\n\n"
            if final else
            f"CONTRACT TRANSFER: PART {index}/{len(chunks)}. Do not implement or create a version yet. "
            "Store this exact chunk and acknowledge only that this part was received; wait for the next part.\n\n"
        )
        message = instruction + chunk
        process = subprocess.Popen(
            [executable, "chat", "send", chat_id, message],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        header = f"\n===== SENT PART {index}/{len(chunks)} =====\n"
        print(header, end="", flush=True)
        log.write(header)
        log.flush()
        for line in process.stdout:
            print(line, end="", flush=True)
            log.write(line)
            log.flush()
        code = process.wait()
        if code:
            raise SystemExit(code)
print(f"Ampliacion enviada en {len(chunks)} partes")
