import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5180';
const output = 'test-output/contact-map-check';
const report = { consoleErrors: [], failedResponses: [], checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5180, strictPort: true } });
let browser;

async function inspectMap(page, name) {
  const section = page.locator('.contact-map-section');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(3500);
  const frame = page.frames().find((item) => item !== page.mainFrame() && item.url().includes('google.com/maps'));
  let frameReady = false;
  let mapImageCount = 0;
  if (frame) {
    await frame.waitForFunction(() => document.querySelectorAll('img').length > 3, null, { timeout: 20000 }).catch(() => {});
    frameReady = await frame.locator('body').evaluate((body) => body.getBoundingClientRect().width > 0 && body.children.length > 0).catch(() => false);
    mapImageCount = await frame.locator('img').count();
  }
  report.checks[name] = {
    title: await section.locator('h2').textContent(),
    iframeTitle: await section.locator('iframe').getAttribute('title'),
    iframeSource: await section.locator('iframe').getAttribute('src'),
    frameReady,
    mapImageCount,
    mapHeight: await section.locator('.contact-map-frame').evaluate((element) => Math.round(element.getBoundingClientRect().height)),
    directionsHref: await section.getByRole('link', { name: 'Cómo llegar', exact: true }).getAttribute('href'),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  };
  const path = `${output}/${name}-map.jpg`;
  await section.screenshot({ path, type: 'jpeg', quality: 90 });
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

  await page.goto(`${base}/contacto`, { waitUntil: 'networkidle' });
  await inspectMap(page, 'desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await inspectMap(page, 'mobile');

  report.checks.passed = ['desktop', 'mobile'].every((viewport) => (
    report.checks[viewport].title === 'Mapa de situación'
    && report.checks[viewport].iframeTitle === 'Mapa de situación de las oficinas de HEMSA San Fernando'
    && report.checks[viewport].iframeSource.includes('Avenida%20San%20Juan%20Bosco%2046')
    && report.checks[viewport].frameReady
    && report.checks[viewport].mapImageCount > 3
    && report.checks[viewport].mapHeight >= 300
    && report.checks[viewport].directionsHref.startsWith('https://www.google.com/maps/dir/')
    && !report.checks[viewport].overflow
  )) && report.consoleErrors.length === 0 && report.failedResponses.length === 0;
} catch (error) {
  report.executionError = error.stack || error.message;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
if (report.executionError || !report.checks.passed) process.exitCode = 1;
