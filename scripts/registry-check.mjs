import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5190';
const output = 'test-output/registry-check';
const report = { consoleErrors: [], failedResponses: [], documentResponses: {}, checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5190, strictPort: true } });
let browser;

const documents = [
  '/documents/vivienda/solicitud-de-inscripcion-registro-de-demandantes-2024-hemsa.pdf',
  '/documents/vivienda/ordenanza-modificada-segun-sugerencias-consejeria.pdf',
  '/documents/vivienda/instancia-hemsa.pdf',
  '/documents/vivienda/instancia-esisa-1-1.pdf',
];

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await page.goto(`${base}/vivienda/registro`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  const secondFaq = page.locator('.registry-faq-list details').nth(1);
  await secondFaq.locator('summary').click();
  report.checks.faqInteraction = await secondFaq.evaluate((element) => element.open);

  report.checks.content = {
    title: await page.locator('h1').textContent(),
    requirementCards: await page.locator('.registry-requirements-grid article').count(),
    steps: await page.locator('.registry-steps li').count(),
    documents: await page.locator('.registry-document-card').count(),
    faqs: await page.locator('.registry-faq-list details').count(),
    registryLinks: await page.locator('a[href="https://hemsa-frontend.onrender.com/login"]').count(),
    adminLinks: await page.locator('.registry-page a[href*="/admin"]').count(),
    renewalContent: await page.locator('.registry-renewal').innerText(),
    selectionContent: await page.locator('.registry-selection-note').innerText(),
  };

  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 1000 : 844 });
    await page.goto(`${base}/vivienda/registro`, { waitUntil: 'networkidle' });
    report.checks[`viewport-${width}`] = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content || '',
    }));
    if (width === 1440 || width === 390) {
      const path = `${output}/${width === 1440 ? 'desktop' : 'mobile'}-registry.jpg`;
      await page.screenshot({ path, fullPage: true, type: 'jpeg', quality: 82 });
      report.screenshots.push(path);
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/vivienda/registro`, { waitUntil: 'networkidle' });
  report.checks.performance = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    return {
      requests: resources.length,
      transferBytes: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0),
      domContentLoadedMs: Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0),
    };
  });

  for (const href of documents) {
    const response = await page.request.get(`${base}${href}`);
    report.documentResponses[href] = { status: response.status(), contentType: response.headers()['content-type'] };
  }

  const content = report.checks.content;
  report.checks.passed = content.title === 'Registro de Demandantes de Vivienda Protegida'
    && content.requirementCards === 4 && content.steps === 4 && content.documents === 4 && content.faqs === 6
    && content.registryLinks >= 3 && content.adminLinks === 0
    && content.renewalContent.includes('Renueva cada tres años') && content.renewalContent.includes('1 de julio')
    && content.selectionContent.includes('dos años de residencia')
    && report.checks.faqInteraction
    && [1440, 1024, 768, 390, 375].every((width) => !report.checks[`viewport-${width}`].overflow && report.checks[`viewport-${width}`].viewportMeta.includes('width=device-width'))
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
