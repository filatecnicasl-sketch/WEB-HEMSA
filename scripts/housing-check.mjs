import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('test-output', { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 4173, strictPort: true } });
let browser;
const report = {
  consoleErrors: [],
  notFound: [],
  checks: {},
  initialMediaRequests: [],
};

try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on('console', (message) => {
    if (message.type() === 'error') report.consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() === 404) report.notFound.push(response.url());
  });

  await page.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  await page.goto('http://127.0.0.1:4173/vivienda', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(() => Array.from(document.images).filter((image) => image.loading !== 'lazy').every((image) => image.complete && image.naturalWidth > 0));
  report.checks.title = await page.locator('h1').innerText();
  report.checks.promotionTitles = await page.locator('.promotion-heading h3').allInnerTexts();
  report.checks.thumbnailCount = await page.locator('.promotion-thumbnails button').count();
  report.checks.videoCount = await page.locator('.promotion-video video').count();
  report.checks.brokenImages = await page.locator('img').evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src));
  report.checks.horizontalOverflowDesktop = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  report.initialMediaRequests = await page.locator('video').evaluateAll((videos) => videos.map((video) => ({ src: video.currentSrc, readyState: video.readyState })));

  const firstPromotion = page.locator('#la-marina');
  await firstPromotion.getByRole('button', { name: 'Ver entrada', exact: true }).click();
  report.checks.galleryChanges = await firstPromotion.locator('.promotion-gallery > img').getAttribute('src');
  report.checks.galleryButtonPressed = await firstPromotion.getByRole('button', { name: 'Ver entrada', exact: true }).getAttribute('aria-pressed');
  await firstPromotion.getByRole('button', { name: 'Ver fachada principal', exact: true }).click();
  await firstPromotion.screenshot({ path: 'test-output/housing-la-marina-desktop.png' });
  await page.locator('#ronda-estero-81').screenshot({ path: 'test-output/housing-ronda-estero-desktop.png' });
  await page.screenshot({ path: 'test-output/housing-promotions-desktop.png', fullPage: true });

  await firstPromotion.getByRole('link', { name: 'Consultar información y registro', exact: true }).click();
  await page.waitForURL('**/vivienda/registro');
  await page.locator('h1').filter({ hasText: 'Registro de Demandantes de Vivienda Protegida' }).waitFor();
  report.checks.laMarinaRegistryDestination = new URL(page.url()).pathname;
  report.checks.laMarinaRegistryHeading = await page.locator('h1').innerText();
  await page.goto('http://127.0.0.1:4173/vivienda', { waitUntil: 'networkidle' });

  report.checks.videos = [];
  const videos = page.locator('.promotion-video video');
  for (let index = 0; index < await videos.count(); index += 1) {
    const video = videos.nth(index);
    await video.evaluate((element) => {
      element.muted = true;
      element.load();
    });
    await video.evaluate((element) => new Promise((resolve, reject) => {
      if (element.readyState >= 1) resolve();
      else {
        element.addEventListener('loadedmetadata', resolve, { once: true });
        element.addEventListener('error', () => reject(new Error('Error al cargar el vídeo')), { once: true });
      }
    }));
    await video.evaluate((element) => element.play());
    await page.waitForTimeout(900);
    const state = await video.evaluate((element) => ({
      src: element.currentSrc,
      duration: element.duration,
      currentTime: element.currentTime,
      paused: element.paused,
      width: element.videoWidth,
      height: element.videoHeight,
    }));
    await video.evaluate((element) => element.pause());
    await video.screenshot({ path: `test-output/housing-video-${index + 1}.png` });
    report.checks.videos.push(state);
  }

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on('console', (message) => {
    if (message.type() === 'error') report.consoleErrors.push(`Móvil: ${message.text()}`);
  });
  mobile.on('pageerror', (error) => report.consoleErrors.push(`Móvil: ${error.message}`));
  mobile.on('response', (response) => {
    if (response.status() === 404) report.notFound.push(`Móvil: ${response.url()}`);
  });
  await mobile.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  await mobile.goto('http://127.0.0.1:4173/vivienda', { waitUntil: 'networkidle' });
  await mobile.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo(0, 0);
  });
  await mobile.waitForLoadState('networkidle');
  await mobile.waitForFunction(() => Array.from(document.images).filter((image) => image.loading !== 'lazy').every((image) => image.complete && image.naturalWidth > 0));
  report.checks.horizontalOverflowMobile = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  report.checks.mobileBrokenImages = await mobile.locator('img').evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src));
  await mobile.locator('#la-marina').getByRole('button', { name: 'Ver patio', exact: true }).click();
  report.checks.mobileGalleryChanges = await mobile.locator('#la-marina .promotion-gallery > img').getAttribute('src');
  await mobile.locator('#la-marina').getByRole('button', { name: 'Ver fachada principal', exact: true }).click();
  await mobile.screenshot({ path: 'test-output/housing-promotions-mobile.png', fullPage: true });
  await mobile.locator('#la-marina').screenshot({ path: 'test-output/housing-la-marina-mobile.png' });
  await mobile.close();
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile('test-output/housing-report.json', JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
