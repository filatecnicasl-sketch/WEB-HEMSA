import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5196';
const output = 'test-output/purchase-check';
const report = { consoleErrors: [], failedResponses: [], checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5196, strictPort: true } });
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await page.goto(`${base}/vivienda/compra`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  report.checks.h1 = (await page.locator('h1').innerText()).replace(/\s+/g, ' ').trim();
  report.checks.status = await page.locator('.r-purchase-status').innerText();
  report.checks.deadline = await page.locator('.r-purchase-deadline').innerText();
  report.checks.factCount = await page.locator('.r-purchase-facts article').count();
  report.checks.pdfLinks = await page.locator('.r-purchase-page a[href$=".pdf"]').count();
  report.checks.imageLoaded = await page.locator('.r-purchase-visual > img').evaluate((image) => image.complete && image.naturalWidth > 0);
  report.checks.emptyHrefs = await page.locator('.r-purchase-page a').evaluateAll((links) => links.filter((link) => !link.getAttribute('href') || link.getAttribute('href') === '#').length);

  const pdfResponse = await page.request.get(`${base}/documents/vivienda/pliego-adquisicion-viviendas-firmado.pdf`);
  report.checks.pdfResponse = { status: pdfResponse.status(), contentType: pdfResponse.headers()['content-type'], bytes: (await pdfResponse.body()).length };

  await page.locator('.r-purchase-actions a[href="/contacto"]').click();
  await page.waitForURL('**/contacto');
  report.checks.contactNavigation = new URL(page.url()).pathname;

  await page.goto(`${base}/vivienda/compra`, { waitUntil: 'networkidle' });
  await page.locator('.r-purchase-contact-actions a[href="/cita-previa"]').click();
  await page.waitForURL('**/cita-previa');
  report.checks.appointmentNavigation = new URL(page.url()).pathname;

  await page.goto(`${base}/vivienda/compra`, { waitUntil: 'networkidle' });
  await page.locator('.r-purchase-contract-link').click();
  await page.waitForURL('**/transparencia**');
  report.checks.contractNavigation = `${new URL(page.url()).pathname}${new URL(page.url()).hash}`;

  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 1000 : 844 });
    await page.goto(`${base}/vivienda/compra`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    report.checks[`viewport-${width}`] = await page.evaluate(() => {
      const controls = [...document.querySelectorAll('.r-purchase-page a, .r-purchase-page button')].filter((control) => {
        const style = getComputedStyle(control);
        const rect = control.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
      const heights = controls.map((control) => control.getBoundingClientRect().height);
      const widths = controls.map((control) => control.getBoundingClientRect().width);
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        minimumTargetHeight: Math.min(...heights),
        minimumTargetWidth: Math.min(...widths),
      };
    });
    if (width === 1440 || width === 390) {
      const path = `${output}/${width === 1440 ? 'desktop' : 'mobile'}-purchase.jpg`;
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
      await page.screenshot({ path, fullPage: true, type: 'jpeg', quality: 88 });
      report.screenshots.push(path);
    }
  }

  report.checks.passed = report.checks.h1 === 'HEMSA compra viviendas en San Fernando'
    && report.checks.status.includes('Convocatoria finalizada')
    && report.checks.deadline.includes('Finalizó el 29.01.2026')
    && report.checks.factCount === 3
    && report.checks.pdfLinks === 2
    && report.checks.pdfResponse.status === 200
    && report.checks.pdfResponse.contentType?.includes('application/pdf')
    && report.checks.pdfResponse.bytes === 704841
    && report.checks.imageLoaded
    && report.checks.emptyHrefs === 0
    && report.checks.contactNavigation === '/contacto'
    && report.checks.appointmentNavigation === '/cita-previa'
    && report.checks.contractNavigation === '/transparencia#contratacion'
    && [1440, 1024, 768, 390, 375].every((width) => !report.checks[`viewport-${width}`].overflow)
    && [390, 375].every((width) => report.checks[`viewport-${width}`].minimumTargetHeight >= 44 && report.checks[`viewport-${width}`].minimumTargetWidth >= 44)
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
