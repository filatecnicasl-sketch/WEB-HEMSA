import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5178';
const output = 'test-output/home-check';
const report = { consoleErrors: [], failedResponses: [], checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5178, strictPort: true } });
let browser;

async function inspectPage(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete));
  return page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    brokenImages: [...document.images]
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute('src')),
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

  await page.goto(base, { waitUntil: 'networkidle' });
  report.checks.desktop = await inspectPage(page);
  report.checks.desktop.homeSections = await page.locator('.r-home > section').evaluateAll((sections) => sections.map((section) => section.className));
  report.checks.desktop.removedSections = await page.locator('.r-home #historia, .r-home .r-appointment, .r-home .r-assurance').count();
  await shot(page, 'desktop-home');

  await page.locator('.desktop-nav').getByRole('link', { name: 'Sobre nosotros', exact: true }).click();
  await page.waitForURL('**/sobre-nosotros');
  await page.locator('.r-history').waitFor({ state: 'visible' });
  report.checks.about = {
    path: new URL(page.url()).pathname,
    historyVisible: await page.locator('.r-history').isVisible(),
    title: await page.locator('#history-title').textContent(),
    ...(await inspectPage(page)),
  };
  await shot(page, 'desktop-about');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'networkidle' });
  report.checks.mobile = await inspectPage(page);
  report.checks.mobile.homeSections = await page.locator('.r-home > section').evaluateAll((sections) => sections.map((section) => section.className));
  report.checks.mobile.removedSections = await page.locator('.r-home #historia, .r-home .r-appointment, .r-home .r-assurance').count();
  await shot(page, 'mobile-home');

  report.checks.pageWeight = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    return {
      requests: resources.length,
      transferredBytes: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0),
    };
  });

  const expectedSections = ['r-hero', 'container r-registry', 'container r-services'];
  report.checks.passed = ['desktop', 'mobile'].every((viewport) => (
    JSON.stringify(report.checks[viewport].homeSections) === JSON.stringify(expectedSections)
    && report.checks[viewport].removedSections === 0
    && !report.checks[viewport].overflow
    && report.checks[viewport].brokenImages.length === 0
  )) && report.checks.about.path === '/sobre-nosotros'
    && report.checks.about.historyVisible
    && !report.checks.about.overflow
    && report.checks.about.brokenImages.length === 0
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
