import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:4174';
const output = 'test-output/housing-sections-check';
const report = { consoleErrors: [], failedResponses: [], checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4174, strictPort: true } });
let browser;

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
}

async function inspect(page) {
  await settle(page);
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    brokenImages: [...document.images].filter((image) => image.naturalWidth === 0).map((image) => image.getAttribute('src')),
  }));
}

async function shot(page, name) {
  const path = `${output}/${name}.jpg`;
  await page.screenshot({ path, type: 'jpeg', quality: 88, fullPage: true });
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

  await page.goto(`${base}/vivienda`, { waitUntil: 'networkidle' });
  report.checks.desktop = {
    title: await page.locator('main h1').textContent(),
    titleFontSize: await page.locator('main h1').evaluate((element) => getComputedStyle(element).fontSize),
    gapToFirstPromotion: await page.evaluate(() => Math.round(document.querySelector('.promotion-heading').getBoundingClientRect().top - document.querySelector('.page-hero').getBoundingClientRect().bottom)),
    topLevelSections: await page.locator('.housing-page > section').evaluateAll((sections) => sections.map((section) => ({ id: section.id, className: section.className }))),
    promotions: await page.locator('.promotion-detail').count(),
    futurePromotion: await page.locator('.future-promotion').count(),
    removedSections: await page.locator('main #registro, main #compra, main .related-services').count(),
    thumbnails: await page.locator('.promotion-thumbnails button').count(),
    videos: await page.locator('.promotion-video video').count(),
    ...(await inspect(page)),
  };
  await shot(page, 'desktop-housing');

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Cómo inscribirse', exact: true }).click();
  await page.waitForURL('**/vivienda/registro');
  await page.locator('#registro').waitFor({ state: 'visible' });
  report.checks.registry = {
    path: new URL(page.url()).pathname,
    visible: await page.locator('#registro').isVisible(),
    ...(await inspect(page)),
  };
  await shot(page, 'desktop-registry');

  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('.r-service-purchase').getByRole('link', { name: 'Más información' }).click();
  await page.waitForURL('**/vivienda/compra');
  await page.locator('#compra').waitFor({ state: 'visible' });
  report.checks.purchase = {
    path: new URL(page.url()).pathname,
    visible: await page.locator('#compra').isVisible(),
    ...(await inspect(page)),
  };
  await shot(page, 'desktop-purchase');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/vivienda`, { waitUntil: 'networkidle' });
  report.checks.mobile = {
    promotions: await page.locator('.promotion-detail').count(),
    removedSections: await page.locator('main #registro, main #compra, main .related-services').count(),
    ...(await inspect(page)),
  };
  await shot(page, 'mobile-housing');
  await page.screenshot({ path: `${output}/mobile-housing-viewport.jpg`, type: 'jpeg', quality: 90, fullPage: false });
  report.screenshots.push(`${output}/mobile-housing-viewport.jpg`);
  report.checks.mobile.skipLink = await page.locator('.skip-link').evaluate((element) => ({
    top: element.getBoundingClientRect().top,
    bottom: element.getBoundingClientRect().bottom,
    focused: document.activeElement === element,
  }));

  report.checks.passed = report.checks.desktop.title === 'Conoce cada promoción'
    && Number.parseFloat(report.checks.desktop.titleFontSize) <= 44
    && report.checks.desktop.gapToFirstPromotion <= 50
    && report.checks.desktop.promotions === 2
    && report.checks.desktop.futurePromotion === 1
    && report.checks.desktop.removedSections === 0
    && report.checks.desktop.thumbnails === 9
    && report.checks.desktop.videos === 2
    && !report.checks.desktop.overflow
    && report.checks.desktop.brokenImages.length === 0
    && report.checks.mobile.promotions === 2
    && report.checks.mobile.removedSections === 0
    && !report.checks.mobile.overflow
    && report.checks.mobile.brokenImages.length === 0
    && report.checks.registry.path === '/vivienda/registro'
    && report.checks.registry.visible
    && report.checks.purchase.path === '/vivienda/compra'
    && report.checks.purchase.visible
    && report.consoleErrors.length === 0
    && report.failedResponses.length === 0;
} catch (error) {
  report.executionError = error.stack || error.message;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
if (report.executionError || !report.checks.passed) process.exitCode = 1;
