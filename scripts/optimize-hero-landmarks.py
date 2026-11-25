from pathlib import Path
from PIL import Image

images_dir = Path(__file__).resolve().parents[1] / 'public' / 'images'
images = [
    ('san-fernando-ayuntamiento.jpg', 'san-fernando-ayuntamiento.webp'),
    ('san-fernando-teatro-cortes-fachada.jpg', 'san-fernando-teatro-cortes.webp'),
]

for source_name, target_name in images:
    source = images_dir / source_name
    target = images_dir / target_name
    with Image.open(source) as image:
        image = image.convert('RGB')
        image.thumbnail((1600, 1200), Image.Resampling.LANCZOS)
        image.save(target, 'WEBP', quality=82, method=6)
    source.unlink()
    print(f'{target.name}: {target.stat().st_size} bytes')

(images_dir / 'san-fernando-teatro-cortes.jpg').unlink(missing_ok=True)
(images_dir / 'san-fernando-teatro-cortes-principal.jpg').unlink(missing_ok=True)
