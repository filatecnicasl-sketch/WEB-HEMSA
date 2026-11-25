import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5193';
const output = 'test-output/employment-check';
const report = { consoleErrors: [], failedResponses: [], documentResponses: {}, checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5193, strictPort: true } });
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await page.goto(`${base}/empleo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  report.checks.h1 = await page.locator('h1').textContent();
  report.checks.currentGroups = await page.locator('.job-card-documents').count();
  report.checks.archiveGroups = await page.locator('.job-archive-item').count();
  report.checks.currentDocumentCounts = await page.locator('.job-card-documents').evaluateAll((groups) => groups.map((group) => group.querySelectorAll('.job-document-list li').length));
  report.checks.archiveDocumentCounts = await page.locator('.job-archive-item').evaluateAll((groups) => groups.map((group) => group.querySelectorAll('.job-archive-documents li').length));
  report.checks.documentHrefs = await page.locator('.job-document-list a, .job-archive-documents a').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  report.checks.oldWebLinks = await page.locator('.jobs-section a[href*="hemsasanfernando.es"], .archive-section a[href*="hemsasanfernando.es"]').count();
  report.checks.detailsInitiallyClosed = await page.locator('.job-archive-item:not([open])').count();

  const firstArchive = page.locator('.job-archive-item').first();
  await firstArchive.locator('summary').click();
  report.checks.firstArchiveOpens = await firstArchive.evaluate((item) => item.open) && await firstArchive.locator('.job-archive-documents a').first().isVisible();
  await firstArchive.locator('summary').click();
  report.checks.firstArchiveCloses = !(await firstArchive.evaluate((item) => item.open));

  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 1000 : 844 });
    await page.goto(`${base}/empleo`, { waitUntil: 'networkidle' });
    await page.locator('.job-archive-item').evaluateAll((items) => items.forEach((item) => { item.open = true; }));
    report.checks[`viewport-${width}`] = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      minimumDocumentTargetHeight: Math.min(...Array.from(document.querySelectorAll('.job-document-list a, .job-archive-documents a')).map((link) => link.getBoundingClientRect().height)),
    }));
    if (width === 1440 || width === 390) {
      const path = `${output}/${width === 1440 ? 'desktop' : 'mobile'}-employment.jpg`;
      await page.screenshot({ path, fullPage: true, type: 'jpeg', quality: 82 });
      report.screenshots.push(path);
    }
  }

  for (const href of new Set(report.checks.documentHrefs)) {
    const response = await page.request.get(`${base}${href}`);
    report.documentResponses[href] = { status: response.status(), contentType: response.headers()['content-type'] };
  }

  report.checks.passed = report.checks.h1 === 'Empleo'
    && report.checks.currentGroups === 2 && report.checks.archiveGroups === 5
    && JSON.stringify(report.checks.currentDocumentCounts) === JSON.stringify([4, 3])
    && JSON.stringify(report.checks.archiveDocumentCounts) === JSON.stringify([7, 7, 15, 9, 4])
    && report.checks.documentHrefs.length === 49 && new Set(report.checks.documentHrefs).size === 47
    && report.checks.documentHrefs.every((href) => href.startsWith('/documents/empleo/') && href.endsWith('.pdf'))
    && report.checks.oldWebLinks === 0 && report.checks.detailsInitiallyClosed === 5
    && report.checks.firstArchiveOpens && report.checks.firstArchiveCloses
    && [1440, 1024, 768, 390, 375].every((width) => !report.checks[`viewport-${width}`].overflow
      && report.checks[`viewport-${width}`].minimumDocumentTargetHeight >= 44)
    && Object.values(report.documentResponses).every((response) => response.status === 200 && response.contentType.includes('pdf'))
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
