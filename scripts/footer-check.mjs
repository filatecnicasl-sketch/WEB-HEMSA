import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5195';
const output = 'test-output/footer-check';
const report = { consoleErrors: [], failedResponses: [], checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5195, strictPort: true } });
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await page.goto(`${base}/sobre-nosotros`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const footer = page.locator('.site-shell .footer');
  report.checks.headings = await footer.locator('h2').allTextContents();
  report.checks.linkCount = await footer.locator('a').count();
  report.checks.serviceLinks = await footer.locator('nav[aria-label="Servicios de HEMSA"] a').allTextContents();
  report.checks.interestLinks = await footer.locator('nav[aria-label="Enlaces de interés"] a').allTextContents();
  report.checks.legacyPills = await footer.locator('.footer-pills').count();
  report.checks.logoLoaded = await footer.locator('.footer-logo img').evaluateAll((images) => images.length === 2 && images.every((image) => image.complete && image.naturalWidth > 0));
  report.checks.emptyHrefs = await footer.locator('a').evaluateAll((links) => links.filter((link) => !link.getAttribute('href') || link.getAttribute('href') === '#').length);
  report.checks.linkFontSizes = await footer.locator('.footer-links a').evaluateAll((links) => [...new Set(links.map((link) => getComputedStyle(link).fontSize))]);

  const localHrefs = await footer.locator('a').evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute('href')).filter((href) => href?.startsWith('/')))]);
  report.checks.localResponses = [];
  for (const href of localHrefs) {
    const response = await page.request.get(`${base}${href}`);
    report.checks.localResponses.push({ href, status: response.status() });
  }

  await footer.locator('a[href="/transparencia"]').click();
  await page.waitForURL('**/transparencia');
  report.checks.transparencyNavigation = new URL(page.url()).pathname;
  await page.goto(`${base}/sobre-nosotros`, { waitUntil: 'networkidle' });
  await footer.locator('a[href="/cita-previa"]').click();
  await page.waitForURL('**/cita-previa');
  report.checks.appointmentNavigation = new URL(page.url()).pathname;

  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 1000 : 844 });
    await page.goto(`${base}/sobre-nosotros`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    report.checks[`viewport-${width}`] = await page.evaluate(() => {
      const currentFooter = document.querySelector('.site-shell .footer');
      const footerLinks = [...currentFooter.querySelectorAll('.footer-links a, .footer-bottom a, .footer-contact > a')];
      const emailSpan = currentFooter.querySelector('a[href^="mailto:"] > span');
      const emailText = [...emailSpan.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
      const range = document.createRange();
      range.selectNodeContents(emailText);
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        columns: getComputedStyle(currentFooter.querySelector('.footer-grid')).gridTemplateColumns.split(' ').length,
        minimumTargetHeight: Math.min(...footerLinks.map((link) => link.getBoundingClientRect().height)),
        emailLineBoxes: range.getClientRects().length,
      };
    });
    if (width === 1440 || width === 390) {
      const path = `${output}/${width === 1440 ? 'desktop' : 'mobile'}-footer.jpg`;
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
      const clip = await footer.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { x: 0, y: rect.top + window.scrollY, width: window.innerWidth, height: rect.height };
      });
      await page.screenshot({ path, fullPage: true, clip, type: 'jpeg', quality: 90 });
      report.screenshots.push(path);
    }
  }

  report.checks.passed = JSON.stringify(report.checks.headings) === JSON.stringify(['Enlaces de interés', 'Contacto'])
    && report.checks.linkCount === 14
    && report.checks.serviceLinks.length === 0
    && report.checks.interestLinks.length === 6
    && report.checks.legacyPills === 0
    && report.checks.logoLoaded
    && report.checks.emptyHrefs === 0
    && report.checks.linkFontSizes.every((size) => parseFloat(size) >= 14)
    && report.checks.localResponses.every((response) => response.status === 200)
    && report.checks.transparencyNavigation === '/transparencia'
    && report.checks.appointmentNavigation === '/cita-previa'
    && report.checks['viewport-1440'].columns === 3
    && report.checks['viewport-1024'].columns === 3
    && report.checks['viewport-768'].columns === 2
    && report.checks['viewport-390'].columns === 1
    && [1440, 1024, 768, 390, 375].every((width) => !report.checks[`viewport-${width}`].overflow)
    && [390, 375].every((width) => report.checks[`viewport-${width}`].minimumTargetHeight >= 44)
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
