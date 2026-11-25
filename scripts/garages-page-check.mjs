import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5186';
const output = 'test-output/garages-page-check';
const report = { consoleErrors: [], failedResponses: [], documentResponses: {}, checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5186, strictPort: true } });
let browser;

async function inspect(page, name) {
  await page.goto(`${base}/garajes-trasteros`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const main = page.locator('main');
  const section = main.locator('#garajes');
  const text = await section.innerText();
  report.checks[name] = {
    title: await section.locator('h1').textContent(),
    sections: await main.locator('section').count(),
    sad: await main.locator('#ayuda-a-domicilio').count(),
    premises: await main.locator('#locales').count(),
    history: await main.locator('.about-history-section').count(),
    hasUnits: text.includes('74') && text.includes('19') && text.includes('4'),
    hasPrices: text.includes('16.153,50 € – 24.838,28 €') && text.includes('4.036,56 € – 13.068,00 €'),
    hasProcess: await section.locator('.garages-process li').count() === 3,
    hasPayment: text.includes('10 % inicial + IVA') && text.includes('6 mensualidades del 5 % + IVA') && text.includes('60 % restante + IVA'),
    hasDeadline: text.includes('24 de febrero de 2026'),
    documents: await section.locator('.garages-documents a').count(),
    imageReady: await section.locator('.garages-photo img').evaluate((image) => image.complete && image.naturalWidth > 0),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  };
  const path = `${output}/${name}-garages-page.jpg`;
  await main.screenshot({ path, type: 'jpeg', quality: 88 });
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
    '/documents/garajes/anuncio.pdf',
    '/documents/garajes/bases-adjudicacion-garajes-y-trasteros-81.pdf',
    '/documents/garajes/plano-venta-garajes.pdf',
  ]) {
    const response = await page.request.get(`${base}${href}`);
    report.documentResponses[href] = { status: response.status(), contentType: response.headers()['content-type'] };
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const homeCard = page.locator('.r-service-garages a');
  report.checks.homeCardHref = await homeCard.getAttribute('href');
  await homeCard.click();
  await page.waitForURL(`${base}/garajes-trasteros`);
  report.checks.homeCardNavigation = page.url();

  await page.goto(`${base}/servicios`, { waitUntil: 'networkidle' });
  report.checks.servicesPage = {
    garages: await page.locator('#garajes').count(),
    premises: await page.locator('#locales').count(),
    sad: await page.locator('#ayuda-a-domicilio').count(),
  };

  report.checks.passed = ['desktop', 'mobile'].every((viewport) => {
    const check = report.checks[viewport];
    return check.title === 'Garajes y trasteros' && check.sections === 1
      && check.sad === 0 && check.premises === 0 && check.history === 0
      && check.hasUnits && check.hasPrices && check.hasProcess && check.hasPayment && check.hasDeadline
      && check.documents === 3 && check.imageReady && !check.overflow;
  }) && Object.values(report.documentResponses).every((response) => response.status === 200 && response.contentType.includes('pdf'))
    && report.checks.homeCardHref === '/garajes-trasteros'
    && report.checks.homeCardNavigation === `${base}/garajes-trasteros`
    && report.checks.servicesPage.garages === 0 && report.checks.servicesPage.premises === 1 && report.checks.servicesPage.sad === 0
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
