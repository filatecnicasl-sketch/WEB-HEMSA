import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKUP = ROOT / "backups" / "fase-1-20261124-190016"
SOURCE = Path(r"C:\Users\fbmagp\Desktop\web hemsa vivienda\436950 SAN FERNANDO UTE SERROT HERYSAN 2026 ORIGEN CON DRON.mp4")
DESTINATION = BACKUP / "archivos-originales" / SOURCE.name
MANIFEST = BACKUP / "manifest.json"


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(4 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


if not SOURCE.is_file():
    raise FileNotFoundError(SOURCE)
if DESTINATION.exists():
    raise FileExistsError(f"No se sobrescribe ningún archivo: {DESTINATION}")
shutil.copy2(SOURCE, DESTINATION)
source_hash = sha256(SOURCE)
copied_hash = sha256(DESTINATION)
if source_hash != copied_hash or SOURCE.stat().st_size != DESTINATION.stat().st_size:
    raise RuntimeError("La copia del vídeo no coincide con el original")

manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
manifest["original_media"].append({
    "name": SOURCE.name,
    "bytes": DESTINATION.stat().st_size,
    "sha256": copied_hash,
    "backup_path": str(DESTINATION),
    "verified": True,
})
manifest["original_media_count"] = len(manifest["original_media"])
MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({
    "copied_to": str(DESTINATION),
    "bytes": DESTINATION.stat().st_size,
    "sha256": copied_hash,
    "verified": True,
    "original_media_count": manifest["original_media_count"],
}, ensure_ascii=False, indent=2))
