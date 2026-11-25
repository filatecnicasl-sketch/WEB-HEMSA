import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'test-output/housing-watermark';
const routes = [
  ['/vivienda', 'vivienda'],
  ['/vivienda/registro', 'vivienda-registro'],
  ['/ayudas-y-subvenciones', 'ayudas'],
  ['/servicios', 'servicios'],
  ['/ayuda-a-domicilio', 'ayuda-domicilio'],
  ['/transparencia', 'transparencia'],
  ['/empleo', 'empleo'],
  ['/contacto', 'contacto'],
  ['/aviso-legal', 'aviso-legal'],
  ['/cookies', 'cookies'],
];
const screenshotRoutes = new Set(['/vivienda', '/ayudas-y-subvenciones', '/empleo', '/contacto']);
const customRoutes = ['/', '/sobre-nosotros', '/vivienda/compra', '/garajes-trasteros', '/area-sad'];
const report = { checks: [], screenshots: [], consoleErrors: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5194, strictPort: true } });
let browser;

try {
  browser = await chromium.launch({ headless: true });
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
    const page = await context.newPage();
    page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
    page.on('pageerror', (error) => report.consoleErrors.push(error.message));
    for (const [route, slug] of routes) {
      await page.goto(`http://127.0.0.1:5194${route}`, { waitUntil: 'networkidle' });
      const data = await page.locator('.page-hero').evaluate((hero) => {
        const before = getComputedStyle(hero, '::before');
        const after = getComputedStyle(hero, '::after');
        return {
          opacity: Number(before.opacity),
          mask: before.maskImage || before.webkitMaskImage,
          gradient: before.backgroundImage,
          circlesRemoved: after.content === 'none',
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      const expectedOpacity = width === 1440 ? 0.055 : 0.045;
      report.checks.push({ route, viewport: width, ...data, passed: data.opacity === expectedOpacity && data.mask.includes('hemsa-simbolo-transparente.png') && data.gradient.includes('linear-gradient') && data.circlesRemoved && !data.overflow });
      if (screenshotRoutes.has(route)) {
        const screenshot = `${output}/${slug}-${width}.png`;
        await page.locator('.page-hero').screenshot({ path: screenshot });
        report.screenshots.push(screenshot);
      }
    }
    for (const route of customRoutes) {
      await page.goto(`http://127.0.0.1:5194${route}`, { waitUntil: 'networkidle' });
      const count = await page.locator('.page-hero').count();
      report.checks.push({ route, viewport: width, name: 'Cabecera personalizada sin cambios', passed: count === 0 });
    }
    await context.close();
  }
  report.passed = report.checks.every((check) => check.passed) && report.consoleErrors.length === 0;
} catch (error) {
  report.executionError = error.stack || error.message;
  report.passed = false;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, failed: report.checks.filter((check) => !check.passed), screenshots: report.screenshots, consoleErrors: report.consoleErrors, executionError: report.executionError }, null, 2));
if (!report.passed) process.exitCode = 1;
