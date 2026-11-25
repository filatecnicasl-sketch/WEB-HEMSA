import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5189';
const output = 'test-output/link-fixes-check';
const report = { checks: {}, consoleErrors: [], failedResponses: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5189, strictPort: true } });
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400 && response.url().startsWith(base)) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const ministry = page.locator('.footer-links a[href="https://www.mivau.gob.es/"]');
  report.checks.ministry = {
    count: await ministry.count(),
    text: await ministry.innerText(),
    href: await ministry.getAttribute('href'),
  };
  await page.locator('.footer').screenshot({ path: `${output}/footer-desktop.jpg`, type: 'jpeg', quality: 85 });

  for (const [route, linkName, key] of [
    ['/propuesta-1', { name: /Registro de demandantes/ }, 'proposalOne'],
    ['/propuesta-3', { name: 'Cómo inscribirse', exact: true }, 'proposalThree'],
  ]) {
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    await page.getByRole('link', linkName).click();
    await page.waitForURL('**/vivienda/registro');
    await page.locator('h1').filter({ hasText: 'Registro de Demandantes de Vivienda Protegida' }).waitFor();
    const heading = await page.locator('h1').innerText();
    report.checks[key] = {
      url: new URL(page.url()).pathname,
      heading,
      passed: new URL(page.url()).pathname === '/vivienda/registro' && heading === 'Registro de Demandantes de Vivienda Protegida',
    };
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  await page.locator('.footer').scrollIntoViewIfNeeded();
  report.checks.mobile = {
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ministryVisible: await page.locator('.footer-links a[href="https://www.mivau.gob.es/"]').isVisible(),
  };
  await page.locator('.footer').screenshot({ path: `${output}/footer-mobile.jpg`, type: 'jpeg', quality: 85 });

  report.checks.passed = report.checks.ministry.count === 1
    && report.checks.ministry.text.includes('Ministerio de Vivienda y Agenda Urbana')
    && report.checks.proposalOne.passed
    && report.checks.proposalThree.passed
    && !report.checks.mobile.overflow
    && report.checks.mobile.ministryVisible
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
