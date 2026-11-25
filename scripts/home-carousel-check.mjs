import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5197';
const output = 'test-output/home-carousel-check';
const report = { consoleErrors: [], failedResponses: [], checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5197, strictPort: true } });
let browser;

const activeTitle = (page) => page.locator('.r-hero-slide.is-active h2').textContent();
const selectSlide = async (page, label) => {
  await page.getByRole('button', { name: `Ver ${label}`, exact: true }).click();
  await page.waitForTimeout(1800);
};
const captureHero = async (page, name) => {
  const path = `${output}/${name}.jpg`;
  await page.locator('.r-hero').screenshot({ path, type: 'jpeg', quality: 88 });
  report.screenshots.push(path);
};

try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await context.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => report.consoleErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 400) report.failedResponses.push(`${response.status()} ${response.url()}`); });

  await page.goto(base, { waitUntil: 'networkidle' });
  report.checks.slideCount = await page.locator('.r-hero-slide').count();
  report.checks.initialTitle = await activeTitle(page);
  report.checks.homeSections = await page.locator('.r-home > section').evaluateAll((sections) => sections.map((section) => section.className));
  await page.waitForFunction(() => document.querySelector('.r-hero-slide.is-active h2')?.textContent === 'El corazón de la vida municipal', { timeout: 8500 });
  report.checks.autoplayTitle = await activeTitle(page);

  await page.getByRole('button', { name: 'Pausar reproducción automática' }).click();
  report.checks.pauseLabel = await page.locator('.r-hero-carousel-playback').getAttribute('aria-label');
  const pausedTitle = await activeTitle(page);
  await page.mouse.move(4, 4);
  await page.waitForTimeout(6900);
  report.checks.pausedTitle = await activeTitle(page);
  report.checks.pauseWorked = pausedTitle === report.checks.pausedTitle;

  await page.getByRole('button', { name: 'Ver Teatro de las Cortes', exact: true }).click();
  await page.waitForTimeout(700);
  report.checks.fadeMidpoint = await page.locator('.r-hero-slide').evaluateAll((elements) => elements.slice(0, 3).map((slide, index) => ({
    index,
    opacity: Number(getComputedStyle(slide).opacity),
    visibility: getComputedStyle(slide).visibility,
    duration: getComputedStyle(slide).transitionDuration,
  })));
  await page.waitForTimeout(1000);
  report.checks.fadeComplete = await page.locator('.r-hero-slide').evaluateAll((elements) => elements.slice(0, 3).map((slide, index) => ({
    index,
    opacity: Number(getComputedStyle(slide).opacity),
    visibility: getComputedStyle(slide).visibility,
  })));

  await page.getByRole('button', { name: 'Reanudar reproducción automática' }).click();
  report.checks.resumeLabel = await page.locator('.r-hero-carousel-playback').getAttribute('aria-label');

  const imagePaths = [
    '/images/san-fernando-calle-real.webp',
    '/images/san-fernando-ayuntamiento.webp',
    '/images/san-fernando-teatro-cortes.webp',
    '/images/vivienda/la-marina-132-fachada.webp',
    '/images/hemsa-hero-personas.jpg',
  ];
  report.checks.imageResponses = [];
  for (const path of imagePaths) {
    const response = await page.request.get(`${base}${path}`);
    report.checks.imageResponses.push({ path, status: response.status(), bytes: (await response.body()).length });
  }

  const destinations = [
    { label: 'San Fernando', path: '/sobre-nosotros', pattern: '**/sobre-nosotros' },
    { label: 'Ayuntamiento', path: '/sobre-nosotros', pattern: '**/sobre-nosotros' },
    { label: 'Teatro de las Cortes', path: '/sobre-nosotros', pattern: '**/sobre-nosotros' },
    { label: 'Vivienda', path: '/vivienda#promociones', pattern: '**/vivienda**' },
    { label: 'Ayuda a domicilio', path: '/ayuda-a-domicilio', pattern: '**/ayuda-a-domicilio' },
  ];
  report.checks.navigation = [];
  for (const destination of destinations) {
    await page.goto(base, { waitUntil: 'networkidle' });
    await selectSlide(page, destination.label);
    const href = await page.locator('.r-hero-slide.is-active a').getAttribute('href');
    await page.locator('.r-hero-slide.is-active a').click();
    await page.waitForURL(destination.pattern);
    const current = new URL(page.url());
    report.checks.navigation.push({ label: destination.label, href, actual: `${current.pathname}${current.hash}` });
  }

  await page.goto(base, { waitUntil: 'networkidle' });
  await selectSlide(page, 'San Fernando');
  await page.getByRole('button', { name: 'Imagen siguiente' }).click();
  report.checks.nextTitle = await activeTitle(page);
  await page.getByRole('button', { name: 'Imagen anterior' }).click();
  report.checks.previousTitle = await activeTitle(page);
  await page.getByRole('button', { name: 'Ver San Fernando', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  report.checks.keyboardTitle = await activeTitle(page);

  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 1000 : 844 });
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await selectSlide(page, 'San Fernando');
    await page.mouse.move(3, 3);
    report.checks[`viewport-${width}`] = await page.evaluate(() => {
      const carousel = document.querySelector('.r-hero-carousel');
      const controls = document.querySelector('.r-hero-carousel-controls');
      const carouselRect = carousel.getBoundingClientRect();
      const controlsRect = controls.getBoundingClientRect();
      const interactive = [...carousel.querySelectorAll('button, .r-hero-slide.is-active a')].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== 'hidden';
      });
      return {
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        controlsFit: controlsRect.left >= carouselRect.left - 1 && controlsRect.right <= carouselRect.right + 1,
        minimumTargetHeight: Math.min(...interactive.map((element) => element.getBoundingClientRect().height)),
        minimumTargetWidth: Math.min(...interactive.map((element) => element.getBoundingClientRect().width)),
        activeImageLoaded: carousel.querySelector('.r-hero-slide.is-active img').naturalWidth > 0,
      };
    });

    if (width === 1440 || width === 390) {
      const prefix = width === 1440 ? 'desktop' : 'mobile';
      await captureHero(page, `${prefix}-san-fernando`);
      await selectSlide(page, 'Ayuntamiento');
      await captureHero(page, `${prefix}-ayuntamiento`);
      await selectSlide(page, 'Teatro de las Cortes');
      await captureHero(page, `${prefix}-teatro`);
      await selectSlide(page, 'Vivienda');
      await captureHero(page, `${prefix}-vivienda`);
      await selectSlide(page, 'Ayuda a domicilio');
      await captureHero(page, `${prefix}-ayuda`);
      await selectSlide(page, 'San Fernando');
      const fullPath = `${output}/${prefix}-home.jpg`;
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: fullPath, fullPage: true, type: 'jpeg', quality: 84 });
      report.screenshots.push(fullPath);
    }
  }

  const reducedContext = await browser.newContext({ viewport: { width: 1024, height: 800 }, reducedMotion: 'reduce' });
  await reducedContext.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(base, { waitUntil: 'networkidle' });
  await reducedPage.waitForTimeout(6900);
  report.checks.reducedMotion = {
    title: await activeTitle(reducedPage),
    animation: await reducedPage.locator('.r-hero-slide.is-active img').evaluate((image) => getComputedStyle(image).animationName),
  };
  await reducedContext.close();

  report.checks.passed = report.checks.slideCount === 5
    && report.checks.initialTitle === 'San Fernando es nuestra casa'
    && report.checks.autoplayTitle === 'El corazón de la vida municipal'
    && JSON.stringify(report.checks.homeSections) === JSON.stringify(['r-hero', 'container r-registry', 'container r-services'])
    && report.checks.pauseLabel === 'Reanudar reproducción automática'
    && report.checks.resumeLabel === 'Pausar reproducción automática'
    && report.checks.pauseWorked
    && [1, 2].every((index) => report.checks.fadeMidpoint[index].opacity > 0
      && report.checks.fadeMidpoint[index].opacity < 1
      && report.checks.fadeMidpoint[index].visibility === 'visible'
      && report.checks.fadeMidpoint[index].duration.split(', ').every((duration) => duration === '1.6s'))
    && report.checks.fadeComplete[1].opacity === 0
    && report.checks.fadeComplete[1].visibility === 'hidden'
    && report.checks.fadeComplete[2].opacity === 1
    && report.checks.fadeComplete[2].visibility === 'visible'
    && report.checks.imageResponses.every((response) => response.status === 200 && response.bytes > 0)
    && report.checks.navigation.every((result, index) => result.href === destinations[index].path && result.actual === destinations[index].path)
    && report.checks.nextTitle === 'El corazón de la vida municipal'
    && report.checks.previousTitle === 'San Fernando es nuestra casa'
    && report.checks.keyboardTitle === 'El corazón de la vida municipal'
    && [1440, 1024, 768, 390, 375].every((width) => {
      const result = report.checks[`viewport-${width}`];
      return !result.overflow && result.controlsFit && result.activeImageLoaded;
    })
    && [390, 375].every((width) => report.checks[`viewport-${width}`].minimumTargetHeight >= 44 && report.checks[`viewport-${width}`].minimumTargetWidth >= 44)
    && report.checks.reducedMotion.title === 'San Fernando es nuestra casa'
    && report.checks.reducedMotion.animation === 'none'
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
