import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5188';
const output = 'test-output/parcels-check';
const report = { consoleErrors: [], failedResponses: [], documentResponses: {}, checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5188, strictPort: true } });
let browser;

const expectedParcels = [
  ['M1.2', '58.468', '3.203,94 m²', '3.844,73 m²', '557.773,91 €', '16.733,22 €'],
  ['M2.3', '58.471', '3.368,70 m²', '4.042,44 m²', '586.456,98 €', '17.593,71 €'],
  ['M3.1', '58.472', '1.625,79 m²', '1.950,95 m²', '283.033,78 €', '8.491,01 €'],
  ['M4.4', '58.477', '1.570,61 m²', '1.884,73 m²', '273.427,49 €', '8.202,82 €'],
  ['M8.3', '58.490', '1.857,30 m²', '2.228,76 m²', '195.953,21 €', '5.878,60 €'],
];

async function inspect(page, name) {
  await page.goto(`${base}/servicios#locales`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const section = page.locator('#locales');
  const cards = section.locator('.parcel-card');
  const cardChecks = [];
  for (let index = 0; index < expectedParcels.length; index += 1) {
    const text = await cards.nth(index).innerText();
    cardChecks.push(expectedParcels[index].every((value) => text.includes(value)));
  }
  const text = await section.innerText();
  report.checks[name] = {
    pageTitle: await page.locator('.page-hero h1').textContent(),
    menuLabel: await page.locator('a[href="/servicios#locales"]').first().textContent(),
    cards: await cards.count(),
    cardChecks,
    specialNotes: text.includes('cable de alta tensión') && text.includes('60,6033 %'),
    conditions: text.includes('precio es el único criterio de valoración') && text.includes('Entrada mínima del 15 %, IVA incluido'),
    deadline: text.includes('5 de noviembre de 2026 a las 13:30 h'),
    documents: await section.locator('.parcels-documents a').count(),
    imageReady: await section.locator('.parcels-photo img').evaluate((image) => image.complete && image.naturalWidth > 0),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  };
  const path = `${output}/${name}-parcels.jpg`;
  await section.screenshot({ path, type: 'jpeg', quality: 88 });
  report.screenshots.push(path);
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await inspect(page, 'desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await inspect(page, 'mobile');

  for (const href of [
    '/documents/otros/pliego-venta-julio-2026.pdf',
    '/documents/otros/2026-06-30-plano-de-venta.pdf',
    '/documents/otros/anuncio-licitacion-fadricas-ii-e31544ac.pdf',
  ]) {
    const response = await page.request.get(`${base}${href}`);
    report.documentResponses[href] = { status: response.status(), contentType: response.headers()['content-type'] };
  }

  report.checks.passed = ['desktop', 'mobile'].every((viewport) => {
    const check = report.checks[viewport];
    return check.pageTitle === 'Parcelas en Fadricas II' && check.menuLabel.trim() === 'Parcelas en Fadricas II'
      && check.cards === 5 && check.cardChecks.every(Boolean)
      && check.specialNotes && check.conditions && check.deadline
      && check.documents === 3 && check.imageReady && !check.overflow;
  }) && Object.values(report.documentResponses).every((response) => response.status === 200 && response.contentType.includes('pdf'))
    && report.consoleErrors.length === 0 && report.failedResponses.length === 0;
} catch (error) {
  report.executionError = error.stack || error.message;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
if (report.executionError || !report.checks.passed) process.exitCode = 1;
