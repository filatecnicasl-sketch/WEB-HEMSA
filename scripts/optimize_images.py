from pathlib import Path
from PIL import Image

images = Path('public/images')

with Image.open(images / 'ronda-estero.png') as image:
    # Remove the presentation frame from the original architectural render.
    cropped = image.convert('RGB').crop((160, 160, 1760, 920))
    cropped.save(images / 'ronda-estero.webp', 'WEBP', quality=88, method=6)

with Image.open(images / 'fadricas-ii.jpg') as image:
    image.convert('RGB').save(images / 'fadricas-ii.webp', 'WEBP', quality=85, method=6)

for name in ['ronda-estero.webp', 'fadricas-ii.webp']:
    path = images / name
    print(f'{name}: {path.stat().st_size:,} bytes')
