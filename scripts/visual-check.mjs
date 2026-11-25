import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('test-output', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: true } });
let browser;
const report = { routes: [], consoleErrors: [], checks: {} };

try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('console', (message) => {
    if (message.type() === 'error') report.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-output/home-desktop.png', fullPage: true });
  report.checks.desktopTitle = await page.locator('h1').innerText();
  report.checks.brokenImages = await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
  report.checks.horizontalOverflowDesktop = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

  for (const route of ['/vivienda', '/servicios', '/transparencia', '/empleo', '/contacto', '/cita-previa', '/gestor']) {
    const response = await page.goto(`http://127.0.0.1:5173${route}`, { waitUntil: 'networkidle' });
    report.routes.push({ route, status: response.status(), h1: await page.locator('h1').first().innerText() });
  }

  await page.goto('http://127.0.0.1:5173/transparencia', { waitUntil: 'networkidle' });
  await page.getByPlaceholder('Buscar documento o apartado…').fill('cuentas');
  report.checks.transparencySearch = await page.locator('.transparency-card').count();

  await page.goto('http://127.0.0.1:5173/gestor', { waitUntil: 'networkidle' });
  const testTitle = 'Titular de prueba del gestor HEMSA';
  await page.locator('#contenido-general textarea').first().fill(testTitle);
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  report.checks.adminSaved = (await page.locator('h1').innerText()) === testTitle;
  await page.evaluate(() => localStorage.removeItem('hemsa-content-preview-v1'));
  await page.reload({ waitUntil: 'networkidle' });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await mobile.screenshot({ path: 'test-output/home-mobile.png', fullPage: true });
  report.checks.horizontalOverflowMobile = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  await mobile.getByRole('button', { name: 'Abrir menú' }).click();
  report.checks.mobileMenuOpens = await mobile.locator('#mobile-menu').isVisible();
  report.checks.mobileMenuFirstLink = await mobile.locator('#mobile-menu .nav-link').first().innerText();
  report.checks.mobileMenuFirstLinkVisible = await mobile.locator('#mobile-menu .nav-link').first().isVisible();
  await mobile.screenshot({ path: 'test-output/mobile-menu.png', fullPage: false });
  await mobile.close();

  await page.goto('http://127.0.0.1:5173/vivienda', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-output/housing-desktop.png', fullPage: true });
} finally {
  if (browser) await browser.close();
  await server.close();
  await writeFile('test-output/report.json', JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
