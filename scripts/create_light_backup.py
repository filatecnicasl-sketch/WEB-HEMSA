from __future__ import annotations

import hashlib
import json
import zipfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED_DIRS = {"backups", "node_modules", "dist", "test-output", ".tmp", ".git"}

created = datetime.now().astimezone()
BACKUP_DIR = ROOT / "backups" / created.strftime("actualizacion-%Y%m%d-%H%M%S")
BACKUP_DIR.mkdir(parents=True, exist_ok=False)
ARCHIVE_PATH = BACKUP_DIR / "hemsa-proyecto-ligero.zip"
MANIFEST_PATH = BACKUP_DIR / "manifest-ligero.json"
source_files = sorted(
    path for path in ROOT.rglob("*")
    if path.is_file() and not (set(path.relative_to(ROOT).parts) & EXCLUDED_DIRS)
)

with zipfile.ZipFile(ARCHIVE_PATH, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for path in source_files:
        archive.write(path, Path("HEMSA") / path.relative_to(ROOT))

with zipfile.ZipFile(ARCHIVE_PATH, "r") as archive:
    corrupt_entry = archive.testzip()
    archived_files = [entry for entry in archive.infolist() if not entry.is_dir()]
    names = set(archive.namelist())

required = {
    "HEMSA/package.json",
    "HEMSA/package-lock.json",
    "HEMSA/index.html",
    "HEMSA/vite.config.js",
    "HEMSA/src/App.jsx",
    "HEMSA/src/pages/HomeCare.jsx",
    "HEMSA/src/pages/Garages.jsx",
    "HEMSA/src/pages/HousingRegistry.jsx",
    "HEMSA/src/pages/Grants.jsx",
    "HEMSA/public/documents/vivienda/resolucion-definitiva-de-concesion.pdf",
    "HEMSA/public/documents/vivienda/propuesta-provisional-de-resolucion-17.pdf",
    "HEMSA/public/documents/vivienda/boja23-150-7-agosto-2023.pdf",
    "HEMSA/public/documents/vivienda/anexo-ii.pdf",
    "HEMSA/public/documents/vivienda/resolucion-de-desistimiento-3.pdf",
    "HEMSA/public/documents/vivienda/orden-convocatoria-ayudas-al-alquiler-vulnerables-2024.pdf",
    "HEMSA/public/documents/vivienda/extracto-ayudas-al-alquiler-vulnerables-convocatoria-2024.pdf",
    "HEMSA/public/documents/vivienda/bbrr-ayudas-al-alquiler-vulnerables.pdf",
    "HEMSA/public/documents/vivienda/resumen-ayudas-alquiler.pdf",
    "HEMSA/public/documents/vivienda/resolucion-publicidad-entidades-financieras.pdf",
    "HEMSA/public/documents/vivienda/boja22-190-00075-15324-01-00268595.pdf",
    "HEMSA/public/documents/vivienda/boja22-190-00006-15327-01-00268599.pdf",
    "HEMSA/public/documents/vivienda/boja22-113-00086-9866-01-00263152.pdf",
    "HEMSA/public/documents/garajes/anuncio.pdf",
    "HEMSA/public/documents/garajes/bases-adjudicacion-garajes-y-trasteros-81.pdf",
    "HEMSA/public/documents/garajes/plano-venta-garajes.pdf",
}
missing = sorted(required - names)
for forbidden in EXCLUDED_DIRS:
    assert not any(name.startswith(f"HEMSA/{forbidden}/") for name in names), forbidden

if corrupt_entry is not None or missing or len(archived_files) != len(source_files):
    raise RuntimeError(f"Verificación incorrecta: corrupt={corrupt_entry}, missing={missing}")

sha256 = hashlib.sha256()
with ARCHIVE_PATH.open("rb") as handle:
    for chunk in iter(lambda: handle.read(1024 * 1024), b""):
        sha256.update(chunk)

manifest = {
    "created_at": created.isoformat(),
    "archive": str(ARCHIVE_PATH),
    "files": len(archived_files),
    "bytes": ARCHIVE_PATH.stat().st_size,
    "sha256": sha256.hexdigest(),
    "zip_integrity": "ok",
    "required_files_verified": sorted(required),
    "excluded_directories": sorted(EXCLUDED_DIRS),
}
MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(manifest, ensure_ascii=False, indent=2))
