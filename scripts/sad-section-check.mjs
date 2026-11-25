import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5179';
const output = 'test-output/sad-section-check';
const report = { consoleErrors: [], failedResponses: [], checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5179, strictPort: true } });
let browser;

async function shot(page, name, locator = null) {
  const path = `${output}/${name}.jpg`;
  const target = locator || page;
  await target.screenshot({ path, type: 'jpeg', quality: 90, fullPage: !locator });
  report.screenshots.push(path);
}

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await page.goto(`${base}/servicios#ayuda-a-domicilio`, { waitUntil: 'networkidle' });
  const section = page.locator('#ayuda-a-domicilio');
  await section.waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.querySelectorAll('#ayuda-a-domicilio img')].every((image) => image.complete));
  report.checks.desktop = {
    title: await section.locator('h2').textContent(),
    articles: await section.locator('.sad-care-articles article').count(),
    phoneText: (await section.locator('.sad-direct-phone').innerText()).replaceAll('\n', ' '),
    phoneHref: await section.locator('.sad-direct-phone').getAttribute('href'),
    illustration: await section.locator('.sad-illustration img').evaluate((image) => ({ loaded: image.complete && image.naturalWidth === 1200, src: image.getAttribute('src'), alt: image.alt })),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    brokenImages: await section.locator('img').evaluateAll((images) => images.filter((image) => image.naturalWidth === 0).map((image) => image.getAttribute('src'))),
  };
  await shot(page, 'desktop-sad-section', section);

  await section.getByRole('link', { name: 'Acceder a mi área SAD', exact: true }).click();
  await page.waitForURL('**/area-sad');
  await page.locator('.sad-access').waitFor({ state: 'visible' });
  report.checks.privateAreaNavigation = new URL(page.url()).pathname;
  await page.goto(`${base}/servicios#ayuda-a-domicilio`, { waitUntil: 'networkidle' });
  await section.getByRole('link', { name: 'Solicitar cita previa', exact: true }).click();
  await page.waitForURL('**/cita-previa');
  report.checks.appointmentNavigation = new URL(page.url()).pathname;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${base}/servicios#ayuda-a-domicilio`, { waitUntil: 'networkidle' });
  await section.waitFor({ state: 'visible' });
  await page.waitForTimeout(250);
  await page.evaluate(() => document.fonts.ready);
  report.checks.mobile = {
    articles: await section.locator('.sad-care-articles article').count(),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    phoneHeight: await section.locator('.sad-direct-phone').evaluate((element) => element.getBoundingClientRect().height),
    buttonsStacked: await section.locator('.sad-intro-copy .button-group').evaluate((element) => getComputedStyle(element).flexDirection === 'column'),
  };
  await shot(page, 'mobile-sad-section', section);
  await page.screenshot({ path: `${output}/mobile-sad-viewport.jpg`, type: 'jpeg', quality: 90, fullPage: false });
  report.screenshots.push(`${output}/mobile-sad-viewport.jpg`);

  report.checks.passed = report.checks.desktop.title === 'Servicio Municipal de Ayuda a Domicilio'
    && report.checks.desktop.articles === 3
    && report.checks.desktop.phoneText.includes('956 945 001')
    && report.checks.desktop.phoneHref === 'tel:956945001'
    && report.checks.desktop.illustration.loaded
    && !report.checks.desktop.overflow
    && report.checks.desktop.brokenImages.length === 0
    && report.checks.privateAreaNavigation === '/area-sad'
    && report.checks.appointmentNavigation === '/cita-previa'
    && report.checks.mobile.articles === 3
    && !report.checks.mobile.overflow
    && report.checks.mobile.phoneHeight >= 44
    && report.checks.mobile.buttonsStacked
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
