import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5193';
const output = 'test-output/interior-titles-check';
const routes = [
  ['/vivienda', 'vivienda'],
  ['/vivienda/registro', 'vivienda-registro'],
  ['/vivienda/compra', 'vivienda-compra'],
  ['/ayudas-y-subvenciones', 'ayudas'],
  ['/servicios', 'servicios'],
  ['/ayuda-a-domicilio', 'ayuda-domicilio'],
  ['/garajes-trasteros', 'garajes'],
  ['/transparencia', 'transparencia'],
  ['/empleo', 'empleo'],
  ['/contacto', 'contacto'],
  ['/area-sad', 'area-sad'],
  ['/aviso-legal', 'aviso-legal'],
  ['/cookies', 'cookies'],
  ['/ruta-inexistente', 'error-404'],
];
const screenshotRoutes = new Set(['/vivienda/registro', '/vivienda/compra', '/garajes-trasteros', '/contacto', '/area-sad']);
const viewports = [1440, 390, 375];
const report = { checks: [], homeControls: [], consoleErrors: [], failedResponses: [], screenshots: [] };

await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5193, strictPort: true } });
let browser;

try {
  browser = await chromium.launch({ headless: true });
  for (const width of viewports) {
    const context = await browser.newContext({ viewport: { width, height: width > 1000 ? 1000 : 844 }, reducedMotion: 'reduce' });
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

    currentRoute = '/';
    await page.goto(`${base}/`, { waitUntil: 'networkidle' });
    const homeFontSize = await page.locator('.r-hero-copy h1').evaluate((heading) => parseFloat(getComputedStyle(heading).fontSize));
    const expectedHomeSize = width === 1440 ? 60 : width / 10;
    report.homeControls.push({ viewport: width, fontSize: homeFontSize, expected: expectedHomeSize, passed: Math.abs(homeFontSize - expectedHomeSize) < 0.1 });

    for (const [route, slug] of routes) {
      currentRoute = route;
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
      const data = await page.evaluate(() => {
        const heading = [...document.querySelectorAll('main h1')].find((item) => {
          const style = getComputedStyle(item);
          const rect = item.getBoundingClientRect();
          return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0 && !item.classList.contains('sr-only');
        });
        return {
          heading: heading?.textContent.trim() || '',
          fontSize: heading ? parseFloat(getComputedStyle(heading).fontSize) : null,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      const expected = width === 1440 ? 42.4 : 28.8;
      if (width !== 375 && screenshotRoutes.has(route)) {
        const screenshot = `${output}/${slug}-${width}.jpg`;
        await page.screenshot({ path: screenshot, type: 'jpeg', quality: 84 });
        report.screenshots.push(screenshot);
      }
      report.checks.push({
        route,
        viewport: width,
        ...data,
        expected,
        passed: Boolean(data.heading) && Math.abs(data.fontSize - expected) < 0.1 && !data.overflow,
      });
    }
    await context.close();
  }
  report.passed = report.checks.every((check) => check.passed)
    && report.homeControls.every((check) => check.passed)
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
  failedChecks: report.checks.filter((check) => !check.passed),
  homeControls: report.homeControls,
  consoleErrors: report.consoleErrors,
  failedResponses: report.failedResponses,
  screenshots: report.screenshots,
  executionError: report.executionError,
}, null, 2));
if (report.executionError || !report.passed) process.exitCode = 1;
