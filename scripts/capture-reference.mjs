import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'https://hemsa-rediseno--4eiqsipb.preview.emergentagent.com';
await mkdir('test-output/reference', { recursive: true });
const browser = await chromium.launch({ headless: true });
const report = { pages: [], errors: [] };

async function prepare(page) {
  const accept = page.getByRole('button', { name: 'Aceptar', exact: true });
  if (await accept.count() && await accept.first().isVisible().catch(() => false)) {
    await accept.first().click().catch(() => {});
  }
  await page.evaluate(() => document.fonts.ready);
}

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', (error) => report.errors.push(error.message));
  await page.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await prepare(page);
  await page.screenshot({ path: 'test-output/reference/home-desktop.png', fullPage: true });
  report.styles = await page.evaluate(() => {
    const pick = (selector, props) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const style = getComputedStyle(el);
      return Object.fromEntries(props.map((prop) => [prop, style[prop]]));
    };
    return {
      body: pick('body', ['fontFamily', 'fontSize', 'color', 'backgroundColor']),
      h1: pick('h1', ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color']),
      h2: pick('h2', ['fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'color']),
      header: pick('header', ['position', 'backgroundColor', 'height', 'borderRadius']),
      main: pick('main', ['backgroundColor', 'backgroundImage']),
    };
  });

  for (const route of ['/promociones-vivienda', '/ayuda-domicilio', '/cita-previa']) {
    await page.goto(`${base}${route}`, { waitUntil: 'networkidle', timeout: 60000 });
    await prepare(page);
    const name = route.slice(1);
    await page.screenshot({ path: `test-output/reference/${name}-desktop.png`, fullPage: true });
    report.pages.push({ route, title: await page.title(), h1: await page.locator('h1, h2').first().innerText() });
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(`${base}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await prepare(mobile);
  await mobile.screenshot({ path: 'test-output/reference/home-mobile.png', fullPage: true });
  report.mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
} finally {
  await browser.close();
  await writeFile('test-output/reference/report.json', JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
