from pathlib import Path
import json
import subprocess

import imageio_ffmpeg
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "backups/fase-1-20261124-190016/archivos-originales"
IMAGE_OUTPUT = ROOT / "public/images/vivienda"
VIDEO_OUTPUT = ROOT / "public/videos/vivienda"
IMAGE_OUTPUT.mkdir(parents=True, exist_ok=True)
VIDEO_OUTPUT.mkdir(parents=True, exist_ok=True)
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()

images = {
    "1_Exterior.png": "ronda-estero-81-exterior.webp",
    "2_Plaza.png": "ronda-estero-81-plaza-2.webp",
    "3_Plaza.png": "ronda-estero-81-plaza-3.webp",
    "4_Plaza.png": "ronda-estero-81-plaza-4.webp",
    "Entrada_M02.jpg": "la-marina-132-entrada.webp",
    "Interior_M02.jpg": "la-marina-132-interior.webp",
    "PatioContra_M02.jpg": "la-marina-132-patio.webp",
    "Plaza_M02.jpg": "la-marina-132-fachada.webp",
    "Rotonda_M02.jpg": "la-marina-132-rotonda.webp",
}

videos = {
    "132ViviendasVPO_Hemsa_mods.mp4": "la-marina-132.mp4",
    "436950 SAN FERNANDO UTE SERROT HERYSAN 2026 ORIGEN CON DRON.mp4": "ronda-estero-81-dron.mp4",
}

report = {"images": [], "videos": [], "source_files_untouched": True}
for source_name, output_name in images.items():
    source_path = SOURCE / source_name
    output_path = IMAGE_OUTPUT / output_name
    with Image.open(source_path) as source_image:
        image = ImageOps.exif_transpose(source_image).convert("RGB")
        original_size = image.size
        image.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
        image.save(output_path, "WEBP", quality=86, method=6)
    report["images"].append({
        "source": source_name,
        "output": str(output_path.relative_to(ROOT)),
        "original_dimensions": original_size,
        "web_dimensions": image.size,
        "bytes": output_path.stat().st_size,
    })
    print(f"Imagen preparada: {output_name} ({output_path.stat().st_size:,} bytes)", flush=True)

for source_name, output_name in videos.items():
    source_path = SOURCE / source_name
    output_path = VIDEO_OUTPUT / output_name
    command = [
        FFMPEG, "-hide_banner", "-loglevel", "warning", "-i", str(source_path),
        "-vf", "scale='min(1280,iw)':-2",
        "-c:v", "libx264", "-preset", "medium", "-crf", "27",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart",
        "-y", str(output_path),
    ]
    subprocess.run(command, check=True)
    report["videos"].append({
        "source": source_name,
        "source_bytes": source_path.stat().st_size,
        "output": str(output_path.relative_to(ROOT)),
        "bytes": output_path.stat().st_size,
    })
    print(f"Vídeo preparado: {output_name} ({output_path.stat().st_size:,} bytes)", flush=True)

report_path = ROOT / "migration/media-inventory/web-media-report.json"
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Informe: {report_path}", flush=True)
