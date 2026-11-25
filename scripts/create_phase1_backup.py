from __future__ import annotations

import hashlib
import json
import shutil
import zipfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = Path(r"C:\Users\fbmagp\Desktop\web hemsa vivienda")
MEDIA_NAMES = [
    "132ViviendasVPO_Hemsa_mods.mp4",
    "1_Exterior.png",
    "2_Plaza.png",
    "3_Plaza.png",
    "4_Plaza.png",
    "Entrada_M02.jpg",
    "Interior_M02.jpg",
    "PatioContra_M02.jpg",
    "Plaza_M02.jpg",
    "Rotonda_M02.jpg",
]

created = datetime.now().astimezone()
backup_dir = ROOT / "backups" / created.strftime("fase-1-%Y%m%d-%H%M%S")
originals_dir = backup_dir / "archivos-originales"
originals_dir.mkdir(parents=True, exist_ok=False)
archive_path = backup_dir / "hemsa-proyecto-completo.zip"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


source_files = sorted(
    path for path in ROOT.rglob("*")
    if path.is_file() and path.relative_to(ROOT).parts[0] != "backups"
)

with zipfile.ZipFile(archive_path, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=1) as archive:
    for path in source_files:
        archive.write(path, Path("HEMSA") / path.relative_to(ROOT))

with zipfile.ZipFile(archive_path, "r") as archive:
    corrupt_entry = archive.testzip()
    archived_files = [entry for entry in archive.infolist() if not entry.is_dir()]

media_manifest = []
for name in MEDIA_NAMES:
    source = SOURCE_DIR / name
    if not source.is_file():
        raise FileNotFoundError(f"No se encuentra el archivo original: {source}")
    destination = originals_dir / name
    shutil.copy2(source, destination)
    source_hash = sha256(source)
    copied_hash = sha256(destination)
    if source_hash != copied_hash or source.stat().st_size != destination.stat().st_size:
        raise RuntimeError(f"La copia no coincide con el original: {name}")
    media_manifest.append({
        "name": name,
        "bytes": destination.stat().st_size,
        "sha256": copied_hash,
        "backup_path": str(destination),
        "verified": True,
    })

manifest = {
    "phase": "Fase 1 — copia de seguridad",
    "created_at": created.isoformat(),
    "project_root": str(ROOT),
    "project_archive": {
        "path": str(archive_path),
        "files": len(archived_files),
        "source_files": len(source_files),
        "bytes": archive_path.stat().st_size,
        "sha256": sha256(archive_path),
        "zip_integrity": "ok" if corrupt_entry is None else f"error: {corrupt_entry}",
        "excluded": "Solo se excluye la carpeta backups para evitar incluir la copia dentro de sí misma.",
    },
    "original_media": media_manifest,
    "original_media_count": len(media_manifest),
    "web_files_modified_by_this_process": False,
}

if corrupt_entry is not None or len(archived_files) != len(source_files):
    raise RuntimeError("La verificación del archivo ZIP no es correcta")

manifest_path = backup_dir / "manifest.json"
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({
    "backup_dir": str(backup_dir),
    "archive": str(archive_path),
    "archive_bytes": archive_path.stat().st_size,
    "project_files": len(archived_files),
    "source_files": len(source_files),
    "zip_integrity": manifest["project_archive"]["zip_integrity"],
    "media_verified": len(media_manifest),
    "manifest": str(manifest_path),
}, ensure_ascii=False, indent=2))
