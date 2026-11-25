from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'public' / 'images' / 'san-fernando-calle-real.jpg'
target = source.with_suffix('.webp')

with Image.open(source) as image:
    image = image.convert('RGB')
    image.thumbnail((1600, 1200), Image.Resampling.LANCZOS)
    image.save(target, 'WEBP', quality=84, method=6)

source.unlink()
print(f'{target.name}: {target.stat().st_size} bytes')
