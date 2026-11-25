import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5185';
const output = 'test-output/home-care-check';
const report = { consoleErrors: [], failedResponses: [], checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5185, strictPort: true } });
let browser;

async function inspect(page, name) {
  await page.goto(`${base}/ayuda-a-domicilio`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const main = page.locator('main');
  report.checks[name] = {
    heroTitle: await main.locator('h1').textContent(),
    serviceTitle: await main.locator('#ayuda-a-domicilio h2').textContent(),
    sectionCount: await main.locator('section').count(),
    articles: await main.locator('.sad-care-articles article').count(),
    garages: await main.locator('#garajes').count(),
    premises: await main.locator('#locales').count(),
    history: await main.locator('.about-history-section').count(),
    imageReady: await main.locator('.sad-illustration img').evaluate((image) => image.complete && image.naturalWidth > 0),
    phone: await main.locator('.sad-direct-phone').getAttribute('href'),
    areaLinks: await main.locator('a[href="/area-sad"]').count(),
    appointmentLink: await main.locator('a[href="/cita-previa"]').count(),
    overflow: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
  };
  const path = `${output}/${name}-home-care.jpg`;
  await main.screenshot({ path, type: 'jpeg', quality: 88 });
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

  await inspect(page, 'desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await inspect(page, 'mobile');

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  const homeCard = page.locator('.r-service-sad a');
  report.checks.homeCardHref = await homeCard.getAttribute('href');
  await homeCard.click();
  await page.waitForURL(`${base}/ayuda-a-domicilio`);
  report.checks.homeCardNavigation = page.url();

  await page.goto(`${base}/servicios`, { waitUntil: 'networkidle' });
  report.checks.servicesPage = {
    sadSections: await page.locator('#ayuda-a-domicilio').count(),
    garages: await page.locator('#garajes').count(),
    premises: await page.locator('#locales').count(),
  };

  await page.goto(`${base}/area-sad`, { waitUntil: 'networkidle' });
  const backLink = page.getByRole('link', { name: 'Volver a Ayuda a Domicilio' });
  report.checks.portalBackHref = await backLink.getAttribute('href');
  await backLink.click();
  await page.waitForURL(`${base}/ayuda-a-domicilio`);
  report.checks.portalBackNavigation = page.url();

  const indexResponse = await page.request.get(`${base}/`);
  report.checks.viewportMeta = (await indexResponse.text()).includes('name="viewport"');

  report.checks.passed = ['desktop', 'mobile'].every((viewport) => {
    const check = report.checks[viewport];
    return check.heroTitle === 'Ayuda a domicilio'
      && check.serviceTitle === 'Servicio Municipal de Ayuda a Domicilio'
      && check.sectionCount === 2 && check.articles === 3
      && check.garages === 0 && check.premises === 0 && check.history === 0
      && check.imageReady && check.phone === 'tel:956945001'
      && check.areaLinks === 2 && check.appointmentLink === 1 && !check.overflow;
  }) && report.checks.homeCardHref === '/ayuda-a-domicilio'
    && report.checks.homeCardNavigation === `${base}/ayuda-a-domicilio`
    && report.checks.servicesPage.sadSections === 0
    && report.checks.servicesPage.garages === 1 && report.checks.servicesPage.premises === 1
    && report.checks.portalBackHref === '/ayuda-a-domicilio'
    && report.checks.portalBackNavigation === `${base}/ayuda-a-domicilio`
    && report.checks.viewportMeta
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
