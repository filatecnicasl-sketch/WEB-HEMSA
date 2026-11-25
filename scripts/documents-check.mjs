import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { documentGroups } from '../src/content/documents.js';

const base = 'http://127.0.0.1:5176';
const documents = [...new Map(documentGroups.flatMap((group) => group.documents).map((document) => [document.url, document])).values()];
const report = {
  uniqueDocuments: documents.length,
  checkedDocuments: 0,
  documentBytes: 0,
  documentFailures: [],
  consoleErrors: [],
  failedResponses: [],
  checks: {},
  screenshots: [],
};

await mkdir('test-output/documents', { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5176, strictPort: true } });
let browser;

async function capture(page, name) {
  const path = `test-output/documents/${name}.jpg`;
  await page.screenshot({ path, type: 'jpeg', quality: 80, fullPage: true });
  report.screenshots.push(path);
}

async function inspectRoute(page, route, name) {
  const response = await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const inspection = {
    status: response.status(),
    heading: await page.locator('h1').innerText(),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    localDocumentLinks: await page.locator('a[href^="/documents/"]').count(),
    brokenImages: await page.locator('img').evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src)),
    pageWeight: await page.evaluate(() => performance.getEntriesByType('resource').reduce((total, resource) => total + (resource.transferSize || 0), 0)),
  };
  report.checks[name] = inspection;
  await capture(page, name);
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  // Se comprueba la versión compilada, no solo los archivos del directorio de trabajo.
  for (let index = 0; index < documents.length; index += 8) {
    const batch = documents.slice(index, index + 8);
    const results = await Promise.all(batch.map(async (document) => {
      try {
        const response = await context.request.get(`${base}${document.url}`);
        const body = await response.body();
        const valid = response.status() === 200 && body.subarray(0, 5).toString() === '%PDF-';
        if (!valid) return { url: document.url, status: response.status(), signature: body.subarray(0, 12).toString() };
        report.checkedDocuments += 1;
        report.documentBytes += body.length;
        return null;
      } catch (error) {
        return { url: document.url, error: error.message };
      }
    }));
    report.documentFailures.push(...results.filter(Boolean));
  }

  await inspectRoute(page, '/transparencia', 'transparency-desktop');
  report.checks.transparencyGroups = await page.locator('.transparency-sources .document-group').count();
  const search = page.getByRole('searchbox', { name: 'Buscar en transparencia' });
  await search.fill('Estatutos');
  const statute = page.locator('.document-link').filter({ hasText: 'Estatutos HEMSA refundidos' });
  await statute.waitFor({ state: 'visible' });
  report.checks.transparencySearchWorks = await statute.getAttribute('href') === '/documents/transparencia/estatutos-hemsa.pdf';
  await capture(page, 'transparency-search-desktop');
  await search.fill('');
  // El primer grupo queda abierto tras la búsqueda; usamos el segundo, inicialmente cerrado.
  const firstSummary = page.locator('.transparency-sources summary').nth(1);
  await firstSummary.focus();
  await firstSummary.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.transparency-sources details')[1]?.open === true);
  report.checks.keyboardOpensDocumentGroup = true;
  await firstSummary.press('Enter');
  await page.waitForFunction(() => document.querySelectorAll('.transparency-sources details')[1]?.open === false);
  report.checks.keyboardClosesDocumentGroup = true;

  await inspectRoute(page, '/empleo', 'employment-desktop');
  report.checks.currentJobDocumentLinks = await page.locator('.job-documents .document-link').count();
  report.checks.archivedJobGroups = await page.locator('.archive-list .document-group').count();
  await page.locator('.archive-list summary').first().click();
  report.checks.archiveOpens = await page.locator('.archive-list .document-group').first().getAttribute('open') !== null;
  report.checks.archiveDocumentsVisible = await page.locator('.archive-list .document-group').first().locator('.document-link:visible').count();

  await inspectRoute(page, '/vivienda', 'housing-desktop');
  report.checks.housingDocumentGroups = await page.locator('.housing-document-groups .document-group').count();
  report.checks.housingRegistryInitiallyOpen = await page.locator('.housing-document-groups .document-group').first().getAttribute('open') !== null;
  report.checks.housingRegistryDocuments = await page.locator('.housing-document-groups .document-group').first().locator('.document-link:visible').count();

  await inspectRoute(page, '/servicios', 'services-desktop');
  report.checks.servicesDocumentLinks = await page.locator('.document-list a[href^="/documents/"]').count();
  report.checks.localPrivacyLink = await page.locator('footer a[href="/documents/otros/politica-privacidad-pagina-web-rgpd-hemsa.pdf"]').count();

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mobileContext.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const mobile = await mobileContext.newPage();
  mobile.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(`mobile: ${message.text()}`); });
  mobile.on('pageerror', (error) => report.consoleErrors.push(`mobile: ${error.message}`));
  mobile.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`mobile: ${response.status()} ${response.url()}`); });
  for (const [route, name] of [['/transparencia', 'transparency-mobile'], ['/empleo', 'employment-mobile'], ['/vivienda', 'housing-mobile'], ['/servicios', 'services-mobile']]) {
    await inspectRoute(mobile, route, name);
  }
  report.checks.mobileTouchTargets = await mobile.locator('.document-list a').evaluateAll((links) => links.every((link) => link.getBoundingClientRect().height >= 44));
  await mobileContext.close();

  report.checks.allDocumentsPass = report.checkedDocuments === 108 && report.documentFailures.length === 0;
  report.checks.noConsoleErrors = report.consoleErrors.length === 0;
  report.checks.noFailedResponses = report.failedResponses.length === 0;
  report.checks.noOverflow = Object.values(report.checks).every((check) => !check || typeof check !== 'object' || check.overflow !== true);
  report.checks.noBrokenImages = Object.values(report.checks).every((check) => !check || typeof check !== 'object' || !check.brokenImages || check.brokenImages.length === 0);
} catch (error) {
  report.executionError = error.stack || error.message;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile('test-output/documents/report.json', JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
if (report.executionError || report.documentFailures.length || report.consoleErrors.length || report.failedResponses.length || Object.entries(report.checks).some(([key, value]) => key.startsWith('no') && value === false)) {
  process.exitCode = 1;
}
