import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5192';
const output = 'test-output/transparency-check';
const report = { consoleErrors: [], failedResponses: [], documentResponses: {}, checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5192, strictPort: true } });
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await page.goto(`${base}/transparencia`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  report.checks.h1 = await page.locator('h1').textContent();
  report.checks.sections = await page.locator('.open-transparency-section').count();
  report.checks.collections = await page.locator('.open-transparency-collection').count();
  report.checks.documents = await page.locator('.open-transparency-documents li').count();
  report.checks.resources = await page.locator('.open-transparency-resource').count();
  report.checks.collectionCounts = await page.locator('.open-transparency-collection').evaluateAll((collections) => Object.fromEntries(collections.map((collection) => [collection.id, collection.querySelectorAll('li').length])));
  report.checks.pdfHrefs = await page.locator('.open-transparency-file-link').evaluateAll((links) => links.map((link) => link.getAttribute('href')));
  report.checks.externalLabels = await page.locator('.open-transparency-resource em').allTextContents();
  report.checks.staticResources = await page.locator('.open-transparency-resource-static').allTextContents();
  report.checks.removedOldWebLinks = await page.locator('a[href*="hemsasanfernando.es/control-finaciero-auditorias"], a[href*="hemsasanfernando.es/gastos-publicos-en-publicidad"]').count();

  const search = page.locator('.open-transparency-search input');
  await search.fill('codigo');
  report.checks.accentInsensitiveResults = await page.locator('.open-transparency-documents li').count();
  await search.fill('2026');
  report.checks.yearResults = await page.locator('.open-transparency-documents li').count();
  report.checks.yearResultText = await page.locator('.open-transparency-documents').innerText();
  await search.fill('fiscalización');
  report.checks.auditSearchResults = await page.locator('.open-transparency-resource-static').count();
  await search.fill('campaña de publicidad');
  report.checks.publicitySearchResults = await page.locator('.open-transparency-resource-static').count();
  await search.fill('sin resultados 999999');
  report.checks.emptyState = await page.locator('.open-transparency-empty').isVisible();
  await page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  report.checks.resetResults = await page.locator('.open-transparency-documents li').count();

  await page.locator('.open-transparency-shortcuts a[href="#contratacion"]').click();
  report.checks.shortcutHash = new URL(page.url()).hash;

  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  report.checks.oldBudgetMenuLinks = await page.locator('.desktop-nav a[href="https://www.hemsasanfernando.es/presupuestos"]').count();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.mobile-menu-button').click();
  await page.locator('#mobile-menu a[href="/transparencia#presupuestos"]').click();
  await page.waitForURL(`${base}/transparencia#presupuestos`);
  await page.waitForTimeout(250);
  report.checks.mobileAnchorNavigation = page.url() === `${base}/transparencia#presupuestos` && await page.locator('#presupuestos').count() === 1;

  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 1000 : 844 });
    await page.goto(`${base}/transparencia`, { waitUntil: 'networkidle' });
    report.checks[`viewport-${width}`] = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content || '',
      minimumPdfTargetHeight: Math.min(...Array.from(document.querySelectorAll('.open-transparency-file-link')).map((link) => link.getBoundingClientRect().height)),
    }));
    if (width === 1440 || width === 390) {
      const path = `${output}/${width === 1440 ? 'desktop' : 'mobile'}-transparency.jpg`;
      await page.screenshot({ path, fullPage: true, type: 'jpeg', quality: 82 });
      report.screenshots.push(path);
    }
  }

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/transparencia`, { waitUntil: 'networkidle' });
  report.checks.performance = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource');
    return {
      requests: resources.length,
      transferBytes: resources.reduce((total, resource) => total + (resource.transferSize || 0), 0),
      domContentLoadedMs: Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd || 0),
    };
  });

  report.checks.localPdfHrefs = report.checks.pdfHrefs.filter((href) => href.startsWith('/'));
  report.checks.portalHrefs = report.checks.pdfHrefs.filter((href) => href.startsWith('https://www.rendiciondecuentas.es/'));
  report.checks.portalLabels = await page.locator('.open-transparency-file-copy small').evaluateAll((labels) => labels.filter((label) => label.textContent.includes('Portal oficial')).map((label) => label.textContent));
  for (const href of new Set(report.checks.localPdfHrefs)) {
    const response = await page.request.get(`${base}${href}`);
    report.documentResponses[href] = { status: response.status(), contentType: response.headers()['content-type'] };
  }

  report.checks.passed = report.checks.h1 === 'Transparencia'
    && report.checks.sections === 3 && report.checks.collections === 6 && report.checks.documents === 44 && report.checks.resources === 3
    && JSON.stringify(report.checks.collectionCounts) === JSON.stringify({ 'informacion-organizativa': 10, contratos: 1, 'contratos-menores': 8, convenios: 4, presupuestos: 11, cuentas: 10 })
    && report.checks.accentInsensitiveResults === 1 && report.checks.yearResults === 1 && report.checks.yearResultText.includes('Presupuesto · 2026')
    && report.checks.emptyState && report.checks.resetResults === 44 && report.checks.shortcutHash === '#contratacion'
    && report.checks.oldBudgetMenuLinks === 0 && report.checks.mobileAnchorNavigation
    && report.checks.externalLabels.filter((label) => label === 'Web anterior').length === 0
    && report.checks.staticResources.length === 2 && report.checks.removedOldWebLinks === 0
    && report.checks.staticResources.some((text) => text.includes('La Intervención del Ayuntamiento de San Fernando ejerce el control financiero de HEMSA.') && text.includes('informes de auditoría de cuentas ni de fiscalización de HEMSA.') && text.includes('21 de Mayo de 2025'))
    && report.checks.staticResources.some((text) => text.includes('no se ha realizado ninguna campaña de publicidad') && text.includes('11 de enero de 2024'))
    && report.checks.auditSearchResults === 1 && report.checks.publicitySearchResults === 1
    && new Set(report.checks.localPdfHrefs).size === 36 && report.checks.portalHrefs.length === 7
    && report.checks.portalLabels.length === 7 && report.checks.portalLabels.every((label) => label === 'Portal oficial · Cuenta anual en XML')
    && [2017, 2018, 2019, 2020, 2021, 2022, 2023].every((year) => report.checks.portalHrefs.some((href) => href.includes(`ejercicio=${year}`)))
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
