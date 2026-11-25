import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5192';
const output = 'test-output/legal-pages-check';
const pagesToCheck = [
  { route: '/aviso-legal', slug: 'aviso-legal', heading: 'Aviso legal', sections: 8 },
  { route: '/cookies', slug: 'cookies', heading: 'Política de cookies', sections: 6 },
];
const viewports = [1440, 390, 375];
const report = { checks: [], navigation: [], consoleErrors: [], failedResponses: [], screenshots: [] };

await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5192, strictPort: true } });
let browser;

try {
  browser = await chromium.launch({ headless: true });

  for (const width of viewports) {
    const context = await browser.newContext({
      viewport: { width, height: width > 1000 ? 1000 : 844 },
      reducedMotion: 'reduce',
    });
    await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
    const page = await context.newPage();
    let currentRoute = '';
    page.on('console', (message) => {
      if (message.type() === 'error') report.consoleErrors.push({ route: currentRoute, viewport: width, text: message.text() });
    });
    page.on('pageerror', (error) => report.consoleErrors.push({ route: currentRoute, viewport: width, text: error.message }));
    page.on('response', (response) => {
      if (response.status() >= 400) report.failedResponses.push({ route: currentRoute, viewport: width, status: response.status(), url: response.url() });
    });

    for (const item of pagesToCheck) {
      currentRoute = item.route;
      const response = await page.goto(`${base}${item.route}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const initial = await page.evaluate(() => ({
        heading: document.querySelector('main h1')?.textContent.trim(),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        brokenImages: [...document.images].filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src),
        missingAnchors: [...document.querySelectorAll('.legal-index a')]
          .map((anchor) => anchor.getAttribute('href'))
          .filter((href) => !href?.startsWith('#') || !document.getElementById(href.slice(1))),
        placeholders: [...document.querySelectorAll('main a')]
          .map((anchor) => anchor.getAttribute('href'))
          .filter((href) => href === '#'),
      }));

      const anchorLinks = page.locator('.legal-index a');
      const anchorResults = [];
      for (let index = 0; index < await anchorLinks.count(); index += 1) {
        const link = anchorLinks.nth(index);
        const hash = await link.getAttribute('href');
        await link.click();
        await page.waitForTimeout(180);
        anchorResults.push({ hash, reached: new URL(page.url()).hash === hash });
      }

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(100);
      if (width !== 375) {
        const screenshot = `${output}/${item.slug}-${width}.jpg`;
        await page.screenshot({ path: screenshot, fullPage: true, type: 'jpeg', quality: 82 });
        report.screenshots.push(screenshot);
      }

      const bodyText = await page.locator('main').innerText();
      const contentOk = item.route === '/aviso-legal'
        ? bodyText.includes('A11376548') && bodyText.includes('Juzgados y Tribunales de San Fernando')
        : ['hemsa-cookie-choice', 'hemsa-large-text', 'hemsa-content-preview-v1', 'Google Maps']
          .every((text) => bodyText.includes(text)) && !bodyText.includes('Google Analytics');

      report.checks.push({
        route: item.route,
        viewport: width,
        status: response?.status() || 0,
        ...initial,
        sectionCount: await page.locator('.legal-document > section').count(),
        expectedSections: item.sections,
        contentOk,
        anchorResults,
        passed: response?.status() === 200
          && initial.heading === item.heading
          && !initial.overflow
          && initial.brokenImages.length === 0
          && initial.missingAnchors.length === 0
          && initial.placeholders.length === 0
          && await page.locator('.legal-document > section').count() === item.sections
          && contentOk
          && anchorResults.every((anchor) => anchor.reached),
      });
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  report.oldDomainLinks = await page.locator('a[href^="http"][href*="hemsasanfernando.es"]').evaluateAll((anchors) => anchors.map((anchor) => anchor.href));

  for (const item of pagesToCheck) {
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    await page.locator(`.footer-legal a[href="${item.route}"]`).click();
    await page.waitForURL(`**${item.route}`);
    await page.waitForFunction((heading) => document.querySelector('main h1')?.textContent.trim() === heading, item.heading);
    report.navigation.push({
      from: 'pie',
      route: item.route,
      heading: await page.locator('main h1').innerText(),
      passed: new URL(page.url()).pathname === item.route && await page.locator('main h1').innerText() === item.heading,
    });
  }

  const privacyResponse = await page.request.get(`${base}/documents/otros/politica-privacidad-pagina-web-rgpd-hemsa.pdf`);
  const privacySignature = (await privacyResponse.body()).subarray(0, 5).toString();
  report.privacyPdf = { status: privacyResponse.status(), signature: privacySignature, passed: privacyResponse.ok() && privacySignature === '%PDF-' };
  await context.close();

  const cleanContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const cleanPage = await cleanContext.newPage();
  await cleanPage.goto(`${base}/`, { waitUntil: 'networkidle' });
  const banner = cleanPage.locator('.cookie-banner');
  const bannerVisible = await banner.isVisible();
  await banner.locator('a[href="/cookies"]').click();
  await cleanPage.waitForURL('**/cookies');
  await cleanPage.waitForFunction(() => document.querySelector('main h1')?.textContent.trim() === 'Política de cookies');
  report.navigation.push({
    from: 'aviso de cookies',
    route: '/cookies',
    bannerVisible,
    heading: await cleanPage.locator('main h1').innerText(),
    passed: bannerVisible && new URL(cleanPage.url()).pathname === '/cookies' && await cleanPage.locator('main h1').innerText() === 'Política de cookies',
  });
  report.oldDomainLinksInCleanVisit = await cleanPage.locator('a[href^="http"][href*="hemsasanfernando.es"]').evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
  await cleanContext.close();

  report.passed = report.checks.every((check) => check.passed)
    && report.navigation.every((check) => check.passed)
    && report.privacyPdf.passed
    && report.oldDomainLinks.length === 0
    && report.oldDomainLinksInCleanVisit.length === 0
    && report.consoleErrors.length === 0
    && report.failedResponses.length === 0;
} catch (error) {
  report.executionError = error.stack || error.message;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({
  passed: report.passed,
  checkedViews: report.checks.length,
  navigation: report.navigation,
  oldDomainLinks: report.oldDomainLinks,
  oldDomainLinksInCleanVisit: report.oldDomainLinksInCleanVisit,
  consoleErrors: report.consoleErrors,
  failedResponses: report.failedResponses,
  privacyPdf: report.privacyPdf,
  screenshots: report.screenshots,
  executionError: report.executionError,
}, null, 2));
if (report.executionError || !report.passed) process.exitCode = 1;
