import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, readdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5176';
const report = { consoleErrors: [], failedResponses: [], checks: {}, pdfCount: 0, screenshots: [] };
await mkdir('test-output/visual-revert', { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5176, strictPort: true } });
let browser;

try {
  report.pdfCount = (await readdir('public/documents', { recursive: true })).filter((file) => file.toLowerCase().endsWith('.pdf')).length;
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  const localPdfs = new Set();
  for (const route of ['/transparencia', '/empleo', '/vivienda', '/servicios']) {
    const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    const name = route.slice(1);
    const screenshot = `test-output/visual-revert/${name}.jpg`;
    await page.screenshot({ path: screenshot, type: 'jpeg', quality: 80, fullPage: true });
    report.screenshots.push(screenshot);
    report.checks[name] = {
      status: response.status(),
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      addedDocumentGroups: await page.locator('.document-group, .housing-document-groups, .job-documents, .transparency-sources').count(),
      localPdfLinks: await page.locator('a[href^="/documents/"]').count(),
    };
    const hrefs = await page.locator('a[href^="/documents/"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    hrefs.forEach((href) => localPdfs.add(href));
  }

  report.checks.transparencyCards = await page.locator('.transparency-card').count();
  await page.goto(`${base}/transparencia`, { waitUntil: 'networkidle' });
  report.checks.transparencyCards = await page.locator('.transparency-card').count();
  report.checks.transparencyOriginalLinks = await page.locator('.transparency-document-list > a').count();
  await page.goto(`${base}/empleo`, { waitUntil: 'networkidle' });
  report.checks.currentJobCards = await page.locator('.jobs-grid .job-card').count();
  report.checks.originalJobLinks = await page.locator('.job-link').count();
  report.checks.originalArchiveLinks = await page.locator('.archive-list > a').count();
  await page.goto(`${base}/vivienda`, { waitUntil: 'networkidle' });
  report.checks.addedHousingSection = await page.locator('#documentacion').count();
  await page.goto(`${base}/servicios`, { waitUntil: 'networkidle' });
  report.checks.originalServiceDocumentLinks = await page.locator('.document-list > a').count();

  report.checkedLocalPdfs = 0;
  report.pdfFailures = [];
  for (const href of localPdfs) {
    const response = await context.request.get(`${base}${href}`);
    const body = await response.body();
    if (response.status() === 200 && body.subarray(0, 5).toString() === '%PDF-') report.checkedLocalPdfs += 1;
    else report.pdfFailures.push({ href, status: response.status() });
  }

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/transparencia', '/empleo', '/vivienda', '/servicios']) {
    await mobile.goto(`${base}${route}`, { waitUntil: 'networkidle' });
    report.checks[`mobile-${route.slice(1)}`] = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  }

  report.checks.noVisualAdditions = Object.values(report.checks).every((check) => !check || typeof check !== 'object' || (check.addedDocumentGroups ?? 0) === 0);
  report.checks.originalLayoutRestored = report.checks.transparencyCards === 3
    && report.checks.transparencyOriginalLinks === 10
    && report.checks.currentJobCards === 2
    && report.checks.originalJobLinks === 2
    && report.checks.originalArchiveLinks === 3
    && report.checks.addedHousingSection === 0
    && report.checks.originalServiceDocumentLinks === 6;
} catch (error) {
  report.executionError = error.stack || error.message;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile('test-output/visual-revert/report.json', JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
if (report.executionError || report.pdfCount !== 108 || report.pdfFailures?.length || report.consoleErrors.length || report.failedResponses.length || report.checks.originalLayoutRestored !== true || report.checks.noVisualAdditions !== true) process.exitCode = 1;
