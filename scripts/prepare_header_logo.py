from pathlib import Path
from PIL import Image, ImageChops

root = Path(__file__).resolve().parents[1]
source_path = root / "public/images/hemsa-logo.jpg"
output_path = root / "public/images/hemsa-simbolo.webp"

with Image.open(source_path) as source:
    image = source.convert("RGB")
    symbol_area = image.crop((0, 0, image.width, 300))
    white = Image.new("RGB", symbol_area.size, "white")
    mask = ImageChops.difference(symbol_area, white).convert("L").point(lambda value: 255 if value > 20 else 0)
    bbox = mask.getbbox()
    if not bbox:
        raise RuntimeError("No se ha encontrado el símbolo en el logotipo original")
    margin = 12
    left = max(0, bbox[0] - margin)
    top = max(0, bbox[1] - margin)
    right = min(symbol_area.width, bbox[2] + margin)
    bottom = min(symbol_area.height, bbox[3] + margin)
    symbol = symbol_area.crop((left, top, right, bottom))
    side = max(symbol.size)
    canvas = Image.new("RGB", (side, side), "white")
    canvas.paste(symbol, ((side - symbol.width) // 2, (side - symbol.height) // 2))
    canvas = canvas.resize((320, 320), Image.Resampling.LANCZOS)
    canvas.save(output_path, "WEBP", lossless=True, method=6)

    wordmark_output_path = root / "public/images/hemsa-texto.webp"
    wordmark_area = image.crop((0, 285, image.width, 430))
    white = Image.new("RGB", wordmark_area.size, "white")
    mask = ImageChops.difference(wordmark_area, white).convert("L").point(lambda value: 255 if value > 20 else 0)
    bbox = mask.getbbox()
    if not bbox:
        raise RuntimeError("No se ha encontrado el texto en el logotipo original")
    margin = 5
    left = max(0, bbox[0] - margin)
    top = max(0, bbox[1] - margin)
    right = min(wordmark_area.width, bbox[2] + margin)
    bottom = min(wordmark_area.height, bbox[3] + margin)
    wordmark = wordmark_area.crop((left, top, right, bottom))
    wordmark.save(wordmark_output_path, "WEBP", lossless=True, method=6)

print(f"Símbolo creado: {output_path} ({output_path.stat().st_size:,} bytes)")
print(f"Texto original creado: {wordmark_output_path} ({wordmark_output_path.stat().st_size:,} bytes)")
print("El archivo original no se ha modificado")
