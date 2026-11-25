from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

import imageio_ffmpeg
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ORIGINALS = ROOT / "backups" / "fase-1-20261124-190016" / "archivos-originales"
OUTPUT = ROOT / "migration" / "media-inventory" / "previews"
OUTPUT.mkdir(parents=True, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

IMAGE_NAMES = [
    "1_Exterior.png", "2_Plaza.png", "3_Plaza.png", "4_Plaza.png",
    "Entrada_M02.jpg", "Interior_M02.jpg", "PatioContra_M02.jpg",
    "Plaza_M02.jpg", "Rotonda_M02.jpg",
]
VIDEO_NAMES = [
    "132ViviendasVPO_Hemsa_mods.mp4",
    "436950 SAN FERNANDO UTE SERROT HERYSAN 2026 ORIGEN CON DRON.mp4",
]

FONT = ImageFont.load_default(size=18)
SMALL_FONT = ImageFont.load_default(size=15)


def fit_image(path: Path, size=(480, 290)):
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        return ImageOps.contain(image, size)


def make_sheet(items, output_path: Path, columns=3, cell_size=(500, 340)):
    rows = (len(items) + columns - 1) // columns
    sheet = Image.new("RGB", (columns * cell_size[0], rows * cell_size[1]), "#eef3f1")
    draw = ImageDraw.Draw(sheet)
    for index, (image, label) in enumerate(items):
        x = (index % columns) * cell_size[0]
        y = (index // columns) * cell_size[1]
        sheet.paste(image, (x + (cell_size[0] - image.width) // 2, y + 8))
        draw.text((x + 12, y + 306), label, fill="#123f35", font=FONT)
    sheet.save(output_path, quality=84, optimize=True)


image_items = [(fit_image(ORIGINALS / name), name) for name in IMAGE_NAMES]
image_sheet = OUTPUT / "fotografias-contacto.jpg"
make_sheet(image_items, image_sheet)


def duration_of(path: Path):
    result = subprocess.run([FFMPEG, "-hide_banner", "-i", str(path)], capture_output=True, text=True)
    match = re.search(r"Duration: (\d+):(\d+):(\d+(?:\.\d+)?)", result.stderr)
    if not match:
        raise RuntimeError(f"No se pudo obtener la duración de {path.name}")
    hours, minutes, seconds = match.groups()
    return int(hours) * 3600 + int(minutes) * 60 + float(seconds)


metadata = {"image_sheet": str(image_sheet), "videos": []}
for video_index, name in enumerate(VIDEO_NAMES, 1):
    path = ORIGINALS / name
    duration = duration_of(path)
    frames_dir = OUTPUT / f"video-{video_index}-frames"
    frames_dir.mkdir(exist_ok=True)
    items = []
    frame_records = []
    for frame_index, fraction in enumerate((0.02, 0.20, 0.40, 0.60, 0.80, 0.96), 1):
        seconds = duration * fraction
        frame_path = frames_dir / f"fotograma-{frame_index}.jpg"
        subprocess.run([
            FFMPEG, "-hide_banner", "-loglevel", "error", "-ss", f"{seconds:.3f}",
            "-i", str(path), "-frames:v", "1", "-vf", "scale=480:-2",
            "-q:v", "4", "-y", str(frame_path),
        ], check=True, capture_output=True)
        minutes = int(seconds // 60)
        remaining = int(seconds % 60)
        label = f"{minutes:02d}:{remaining:02d}"
        items.append((fit_image(frame_path), label))
        frame_records.append({"time_seconds": round(seconds, 3), "path": str(frame_path)})
    sheet_path = OUTPUT / f"video-{video_index}-contacto.jpg"
    make_sheet(items, sheet_path)
    metadata["videos"].append({
        "name": name,
        "duration_seconds": round(duration, 3),
        "contact_sheet": str(sheet_path),
        "frames": frame_records,
    })

metadata_path = OUTPUT.parent / "review-metadata.json"
metadata_path.write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(metadata, ensure_ascii=False, indent=2))
