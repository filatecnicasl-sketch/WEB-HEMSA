import json
import re
from pathlib import Path

HISTORY = Path(r"C:\Users\fbmagp\AppData\Roaming\kimi-desktop\daimon-share\daimon\runtime\kimi-code\home\sessions\wd_web-hemsasanfernando.es_b5e0b337f6d8\conv-8ef864ad27efbcb6bf6ff8a3\agents\main\wire.jsonl")
MEDIA = re.compile(r"\.(?:mp4|webm|mov|avi|jpe?g|png|webp)|public/images|public/videos|message-queue-assets", re.I)

print("=== OPERACIONES CON MEDIOS ===")
with HISTORY.open(encoding="utf-8") as handle:
    for number, line in enumerate(handle, 1):
        record = json.loads(line)
        if record.get("type") != "context.append_loop_event":
            continue
        event = record.get("event", {})
        if event.get("type") != "tool.call":
            continue
        args = event.get("args", {})
        serialized = json.dumps(args, ensure_ascii=False)
        if not MEDIA.search(serialized):
            continue
        summary = {}
        for key in ("path", "command", "url", "cwd", "description"):
            if key in args:
                value = str(args[key])
                summary[key] = value[:2400]
        if not summary:
            summary = {"args": serialized[:2400]}
        print(f"LINE {number} | {event.get('name')} | {json.dumps(summary, ensure_ascii=False)}")

print("\n=== ADJUNTOS DE LA CONVERSACIÓN ===")
with HISTORY.open(encoding="utf-8") as handle:
    for number, line in enumerate(handle, 1):
        record = json.loads(line)
        if record.get("type") != "context.append_message":
            continue
        serialized = json.dumps(record, ensure_ascii=False)
        if "message-queue-assets" in serialized or '"type":"file"' in serialized or '"type": "file"' in serialized:
            print(f"LINE {number} | {serialized[:6000]}")
