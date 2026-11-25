import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('test-output/redesign', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5175, strictPort: true } });
let browser;
const report = { consoleErrors: [], checks: {}, routes: [] };

async function acceptCookies(page) {
  const button = page.locator('.cookie-banner').getByRole('button', { name: 'Aceptar', exact: true });
  if (await button.count()) await button.click();
}

async function inspect(page, route, name) {
  const response = await page.goto(`http://127.0.0.1:5175${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await acceptCookies(page);
  await page.screenshot({ path: `test-output/redesign/${name}.png`, fullPage: true });
  return {
    route,
    status: response.status(),
    heading: await page.locator('h1, h2').first().innerText(),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    brokenImages: await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src)),
  };
}

try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  report.checks.desktopHome = await inspect(page, '/', 'home-desktop');
  report.checks.serviceCards = await page.locator('.r-service-card').count();
  report.checks.historyItems = await page.locator('.r-timeline li').count();
  report.checks.appointmentForm = await page.locator('.r-appointment-form').count();
  report.checks.registryLinks = await page.locator(`a[href="https://hemsa-frontend.onrender.com/admin"]`).count();
  report.checks.citaPage = await inspect(page, '/cita-previa', 'appointment-desktop');
  report.checks.formFields = await page.locator('.r-appointment-form input, .r-appointment-form select, .r-appointment-form textarea').count();

  for (const route of ['/vivienda', '/servicios#ayuda-a-domicilio', '/servicios#garajes', '/vivienda#compra', '/area-sad']) {
    const response = await page.goto(`http://127.0.0.1:5175${route}`, { waitUntil: 'networkidle' });
    report.routes.push({ route, status: response?.status() || 200, mainVisible: await page.locator('main').isVisible() });
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(`mobile: ${message.text()}`); });
  mobile.on('pageerror', (error) => report.consoleErrors.push(`mobile: ${error.message}`));
  report.checks.mobileHome = await inspect(mobile, '/', 'home-mobile');
  await mobile.getByRole('button', { name: 'Abrir menú' }).click();
  report.checks.mobileMenuVisible = await mobile.locator('#mobile-menu').isVisible();
  await mobile.screenshot({ path: 'test-output/redesign/mobile-menu.png', fullPage: false });
  await mobile.locator('#mobile-menu').getByRole('link', { name: 'Ayuda a domicilio' }).click();
  await mobile.waitForURL('**/servicios#ayuda-a-domicilio');
  await mobile.locator('#mobile-menu').waitFor({ state: 'detached' });
  report.checks.mobileMenuNavigation = new URL(mobile.url()).pathname + new URL(mobile.url()).hash;
  report.checks.mobileMenuCloses = await mobile.locator('#mobile-menu').count() === 0;
} finally {
  if (browser) await browser.close();
  await server.close();
  await writeFile('test-output/redesign/report.json', JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
