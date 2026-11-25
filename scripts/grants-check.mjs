import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5191';
const output = 'test-output/grants-check';
const report = { consoleErrors: [], failedResponses: [], documentResponses: {}, checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5191, strictPort: true } });
let browser;

const expectedDates = {
  'accesibilidad-viviendas-2023': ['2023-10-24', '2024-03-04'],
  'ayudas-alquiler-vulnerable-2024': ['2024-06-25', '2024-07-26'],
  'garantia-vivienda-joven': ['2023-09-14', '2024-08-18'],
  'rehabilitacion-eficiencia-2022': ['2022-10-03', '2024-12-26'],
};

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  await page.locator('.desktop-nav a[href="/ayudas-y-subvenciones"]').click();
  await page.waitForURL(`${base}/ayudas-y-subvenciones`);
  await page.evaluate(() => document.fonts.ready);
  report.checks.internalMenuNavigation = page.url() === `${base}/ayudas-y-subvenciones`;
  report.checks.h1 = await page.locator('h1').textContent();
  report.checks.articles = await page.locator('.grants-news-item').count();
  report.checks.documents = await page.locator('.grants-documents li').count();
  report.checks.dates = await page.locator('.grants-news-item').evaluateAll((articles) => Object.fromEntries(articles.map((article) => [
    article.id,
    Array.from(article.querySelectorAll('time')).map((time) => time.dateTime),
  ])));
  report.checks.statuses = await page.locator('.grants-closed').allTextContents();
  report.checks.documentCounts = await page.locator('.grants-news-item').evaluateAll((articles) => Object.fromEntries(articles.map((article) => [article.id, article.querySelectorAll('.grants-documents li').length])));
  report.checks.pdfHrefs = await page.locator('.grants-file-link').evaluateAll((links) => links.map((link) => link.getAttribute('href')));

  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 1000 : 844 });
    await page.goto(`${base}/ayudas-y-subvenciones`, { waitUntil: 'networkidle' });
    report.checks[`viewport-${width}`] = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content || '',
      minimumPdfTargetHeight: Math.min(...Array.from(document.querySelectorAll('.grants-file-link')).map((link) => link.getBoundingClientRect().height)),
    }));
    if (width === 1440 || width === 390) {
      const path = `${output}/${width === 1440 ? 'desktop' : 'mobile'}-grants.jpg`;
      await page.screenshot({ path, fullPage: true, type: 'jpeg', quality: 82 });
      report.screenshots.push(path);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  await page.locator('.mobile-menu-button').click();
  report.checks.mobileMenuExpanded = await page.locator('.mobile-menu-button').getAttribute('aria-expanded');
  await page.locator('#mobile-menu a[href="/ayudas-y-subvenciones"]').click();
  await page.waitForURL(`${base}/ayudas-y-subvenciones`);
  report.checks.mobileMenuNavigation = page.url() === `${base}/ayudas-y-subvenciones`;

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/ayudas-y-subvenciones`, { waitUntil: 'networkidle' });
  report.checks.performance = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    return {
      requests: resources.length,
      transferBytes: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0),
      domContentLoadedMs: Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0),
    };
  });

  for (const href of report.checks.pdfHrefs) {
    const response = await page.request.get(`${base}${href}`);
    report.documentResponses[href] = { status: response.status(), contentType: response.headers()['content-type'] };
  }

  report.checks.passed = report.checks.internalMenuNavigation
    && report.checks.mobileMenuNavigation && report.checks.mobileMenuExpanded === 'true'
    && report.checks.h1 === 'Ayudas y subvenciones' && report.checks.articles === 4 && report.checks.documents === 13
    && Object.entries(expectedDates).every(([id, dates]) => JSON.stringify(report.checks.dates[id]) === JSON.stringify(dates))
    && Object.values(report.checks.documentCounts).reduce((sum, count) => sum + count, 0) === 13
    && report.checks.statuses.length === 4 && report.checks.statuses.every((status) => status === 'Plazo vencido')
    && new Set(report.checks.pdfHrefs).size === 13
    && [1440, 1024, 768, 390, 375].every((width) => !report.checks[`viewport-${width}`].overflow
      && report.checks[`viewport-${width}`].viewportMeta.includes('width=device-width')
      && report.checks[`viewport-${width}`].minimumPdfTargetHeight >= 44)
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
