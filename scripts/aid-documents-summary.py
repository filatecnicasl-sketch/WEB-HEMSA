import json
import re
from pathlib import Path

root = Path('test-output/ayudas')
for path in sorted(root.glob('*.json')):
    data = json.loads(path.read_text(encoding='utf-8'))['data']
    pages = data['pages']
    print('\n' + '=' * 100)
    print(path.stem, '| páginas:', data['total_pages'])
    print('PRIMERA PÁGINA:')
    print(pages[0]['text'][:2600].replace('\n', ' '))
    print('FECHAS Y PLAZOS:')
    text = '\n'.join(page['text'] for page in pages)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    matches = []
    for index, line in enumerate(lines):
        if re.search(r'(?i)(publicaci[oó]n|plazo|solicitudes|vencimiento|caduc|desistimiento|concesi[oó]n|convocatoria|\b20(?:22|23|24|25|26)\b)', line):
            context = ' '.join(lines[max(0, index - 1):min(len(lines), index + 2)])
            if context not in matches:
                matches.append(context)
    for match in matches[:55]:
        print('-', match)
