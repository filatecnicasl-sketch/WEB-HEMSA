import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const routes = [
  { path: '/alternativas', name: 'gallery' },
  { path: '/propuesta-1', name: 'proposal-1' },
  { path: '/propuesta-2', name: 'proposal-2' },
  { path: '/propuesta-3', name: 'proposal-3' },
  { path: '/propuesta-4', name: 'proposal-4' },
];

await mkdir('test-output/designs', { recursive: true });
const server = await createServer({ server: { host: '127.0.0.1', port: 5174, strictPort: true } });
let browser;
const report = { desktop: [], mobile: [], consoleErrors: [], checks: {} };

async function inspect(page, route, viewport) {
  const response = await page.goto(`http://127.0.0.1:5174${route.path}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const result = {
    route: route.path,
    status: response.status(),
    title: await page.title(),
    h1: await page.locator('h1').first().innerText(),
    horizontalOverflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    brokenImages: await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src)),
    mainVisible: await page.locator('main').isVisible(),
  };
  await page.screenshot({ path: `test-output/designs/${route.name}-${viewport}.png`, fullPage: true });
  return result;
}

try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  desktop.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(`desktop: ${message.text()}`); });
  desktop.on('pageerror', (error) => report.consoleErrors.push(`desktop: ${error.message}`));
  for (const route of routes) report.desktop.push(await inspect(desktop, route, 'desktop'));

  await desktop.goto('http://127.0.0.1:5174/propuesta-1', { waitUntil: 'networkidle' });
  await desktop.locator('.design-switcher-item').nth(1).click();
  await desktop.waitForURL('**/propuesta-2');
  report.checks.switcherNavigation = new URL(desktop.url()).pathname;
  await desktop.locator('.design-switcher-all').click();
  await desktop.waitForURL('**/alternativas');
  report.checks.galleryNavigation = new URL(desktop.url()).pathname;
  await desktop.locator('.gallery-card-link').nth(2).click();
  await desktop.waitForURL('**/propuesta-3');
  report.checks.galleryCardNavigation = new URL(desktop.url()).pathname;

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(`mobile: ${message.text()}`); });
  mobile.on('pageerror', (error) => report.consoleErrors.push(`mobile: ${error.message}`));
  for (const route of routes) report.mobile.push(await inspect(mobile, route, 'mobile'));

  await mobile.goto('http://127.0.0.1:5174/propuesta-1', { waitUntil: 'networkidle' });
  await mobile.getByRole('button', { name: 'Abrir menú' }).click();
  report.checks.mobileMenuVisible = await mobile.locator('#design-mobile-menu').isVisible();
  await mobile.screenshot({ path: 'test-output/designs/mobile-menu.png', fullPage: false });
  await mobile.locator('#design-mobile-menu a').filter({ hasText: 'Vivienda' }).click();
  await mobile.waitForURL('**/vivienda');
  await mobile.locator('#design-mobile-menu').waitFor({ state: 'detached' });
  report.checks.mobileMenuNavigation = new URL(mobile.url()).pathname;
  report.checks.menuClosesAfterNavigation = await mobile.locator('#design-mobile-menu').count() === 0;
} finally {
  if (browser) await browser.close();
  await server.close();
  await writeFile('test-output/designs/report.json', JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
