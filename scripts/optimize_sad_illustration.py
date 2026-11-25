from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'public/images/ayuda-domicilio-ilustracion.png'
target = root / 'public/images/ayuda-domicilio-ilustracion.webp'

with Image.open(source) as image:
    image = image.convert('RGB')
    image.thumbnail((1200, 800), Image.Resampling.LANCZOS)
    image.save(target, 'WEBP', quality=86, method=6)

print(f'{target} ({target.stat().st_size} bytes)')
