from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path('test-output/full-site-audit')
routes = [
    'inicio', 'sobre-nosotros', 'vivienda', 'vivienda-registro',
    'vivienda-compra', 'ayudas-subvenciones', 'servicios', 'ayuda-domicilio',
    'garajes-trasteros', 'transparencia', 'empleo', 'contacto', 'cita-previa',
    'area-sad', 'gestor', 'alternativas', 'propuesta-1', 'propuesta-2',
    'propuesta-3', 'propuesta-4',
]

def make_sheet(width, columns, cell_size, output_name):
    cell_w, cell_h = cell_size
    label_h = 34
    rows = (len(routes) + columns - 1) // columns
    sheet = Image.new('RGB', (columns * cell_w, rows * (cell_h + label_h)), '#e9eef2')
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=18)
    for index, route in enumerate(routes):
        source = root / f'{route}-{width}.jpg'
        with Image.open(source) as image:
            image = image.convert('RGB')
            image.thumbnail((cell_w - 12, cell_h - 12), Image.Resampling.LANCZOS)
            x = (index % columns) * cell_w
            y = (index // columns) * (cell_h + label_h)
            image_x = x + (cell_w - image.width) // 2
            sheet.paste(image, (image_x, y + 6))
            draw.text((x + 10, y + cell_h + 6), route, fill='#132b3a', font=font)
    sheet.save(root / output_name, quality=82, optimize=True)
    print(root / output_name, (root / output_name).stat().st_size)

make_sheet(1440, 4, (350, 520), 'contact-sheet-desktop.jpg')
make_sheet(390, 5, (240, 600), 'contact-sheet-mobile.jpg')
