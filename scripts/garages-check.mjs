import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5184';
const output = 'test-output/garages-check';
const report = { consoleErrors: [], failedResponses: [], documentResponses: {}, checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5184, strictPort: true } });
let browser;

async function inspect(page, name) {
  const section = page.locator('#garajes');
  await section.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  const text = await section.innerText();
  const documents = await section.locator('.garages-documents a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  const imageReady = await section.locator('.garages-photo img').evaluate((image) => image.complete && image.naturalWidth > 0);
  report.checks[name] = {
    title: await section.locator('h2').textContent(),
    hasUnits: text.includes('74') && text.includes('19') && text.includes('4') && text.includes('plazas con trastero vinculado'),
    hasGaragePrices: text.includes('16.153,50 € – 24.838,28 €') && text.includes('12,43–17,85 m²'),
    hasStoragePrices: text.includes('4.036,56 € – 13.068,00 €') && text.includes('2,78–9,00 m²'),
    hasPayment: text.includes('10 % inicial + IVA') && text.includes('6 mensualidades del 5 % + IVA') && text.includes('60 % restante + IVA'),
    hasAccessibleSpaces: text.includes('41 y 50') && text.includes('33 %'),
    hasDeadlineNotice: text.includes('24 de febrero de 2026') && text.includes('confirma con HEMSA la disponibilidad'),
    hasSteps: await section.locator('.garages-process li').count() === 3,
    documents,
    imageReady,
    contactHref: await section.getByRole('link', { name: 'Consultar disponibilidad' }).getAttribute('href'),
    appointmentHref: await section.getByRole('link', { name: 'Solicitar cita previa' }).getAttribute('href'),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  };
  const path = `${output}/${name}-garages.jpg`;
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

  await page.goto(`${base}/servicios#garajes`, { waitUntil: 'networkidle' });
  for (const href of [
    '/documents/garajes/anuncio.pdf',
    '/documents/garajes/bases-adjudicacion-garajes-y-trasteros-81.pdf',
    '/documents/garajes/plano-venta-garajes.pdf',
  ]) {
    const response = await page.request.get(`${base}${href}`);
    report.documentResponses[href] = { status: response.status(), contentType: response.headers()['content-type'] };
  }

  await inspect(page, 'desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await inspect(page, 'mobile');

  const expectedDocuments = [
    '/documents/garajes/anuncio.pdf',
    '/documents/garajes/bases-adjudicacion-garajes-y-trasteros-81.pdf',
    '/documents/garajes/plano-venta-garajes.pdf',
  ];
  report.checks.passed = ['desktop', 'mobile'].every((viewport) => {
    const check = report.checks[viewport];
    return check.title === 'Garajes y trasteros'
      && check.hasUnits && check.hasGaragePrices && check.hasStoragePrices
      && check.hasPayment && check.hasAccessibleSpaces && check.hasDeadlineNotice && check.hasSteps
      && JSON.stringify(check.documents) === JSON.stringify(expectedDocuments)
      && check.imageReady && check.contactHref === '/contacto' && check.appointmentHref === '/cita-previa'
      && !check.overflow;
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
