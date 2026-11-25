from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "public" / "images"
OUTPUT = ROOT / "test-output" / "footer-logo"


def transparent_logo(source: Path, destination: Path) -> None:
    image = Image.open(source).convert("RGB")
    rgb = np.asarray(image, dtype=np.float32)
    flat = rgb.reshape(-1, 3)
    spread = flat.max(axis=1) - flat.min(axis=1)
    lightness = flat.mean(axis=1)

    green_pixels = flat[(flat[:, 1] > flat[:, 0] + 45) & (flat[:, 1] > flat[:, 2] + 25) & (flat[:, 0] < 80)]
    dark_pixels = flat[(spread < 18) & (lightness < 125)]
    light_pixels = flat[(spread < 18) & (lightness >= 125) & (lightness < 215)]
    if not len(green_pixels):
        raise RuntimeError(f"No se pudo identificar el verde de {source.name}")

    palette = [np.median(green_pixels, axis=0)]
    if len(dark_pixels):
        palette.append(np.median(dark_pixels, axis=0))
    if len(light_pixels):
        palette.append(np.median(light_pixels, axis=0))
    palette = np.asarray(palette, dtype=np.float32)

    observed = 255.0 - flat
    best_error = np.full(len(flat), np.inf, dtype=np.float32)
    best_alpha = np.zeros(len(flat), dtype=np.float32)
    best_color = np.zeros((len(flat), 3), dtype=np.uint8)

    for color in palette:
        direction = 255.0 - color
        denominator = float(np.dot(direction, direction))
        alpha = np.clip((observed @ direction) / denominator, 0.0, 1.0)
        reconstructed = 255.0 - alpha[:, None] * direction
        error = ((flat - reconstructed) ** 2).sum(axis=1)
        selected = error < best_error
        best_error[selected] = error[selected]
        best_alpha[selected] = alpha[selected]
        best_color[selected] = color.astype(np.uint8)

    alpha = np.rint(best_alpha * 255).astype(np.uint8)
    alpha[alpha < 4] = 0
    rgba = np.concatenate((best_color, alpha[:, None]), axis=1).reshape(image.height, image.width, 4)
    Image.fromarray(rgba, "RGBA").save(destination, optimize=True)


transparent_logo(IMAGES / "hemsa-simbolo.webp", IMAGES / "hemsa-simbolo-transparente.png")
transparent_logo(IMAGES / "hemsa-texto.webp", IMAGES / "hemsa-texto-transparente.png")

OUTPUT.mkdir(parents=True, exist_ok=True)
preview = Image.new("RGB", (720, 220), "#073b32")
symbol = Image.open(IMAGES / "hemsa-simbolo-transparente.png").convert("RGBA")
wordmark = Image.open(IMAGES / "hemsa-texto-transparente.png").convert("RGBA")
symbol.thumbnail((130, 130), Image.Resampling.LANCZOS)
wordmark.thumbnail((265, 75), Image.Resampling.LANCZOS)
preview.paste(symbol, (55, 45), symbol)
preview.paste(wordmark, (215, 72), wordmark)
preview.save(OUTPUT / "logo-sobre-verde.png", optimize=True)
print(IMAGES / "hemsa-simbolo-transparente.png")
print(IMAGES / "hemsa-texto-transparente.png")
print(OUTPUT / "logo-sobre-verde.png")
