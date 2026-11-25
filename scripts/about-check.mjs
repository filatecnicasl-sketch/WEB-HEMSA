import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:5194';
const output = 'test-output/about-check';
const report = { consoleErrors: [], failedResponses: [], checks: {}, screenshots: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5194, strictPort: true } });
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
  report.checks.h1 = await page.locator('h1').textContent();
  report.checks.metrics = await page.locator('.r-about-metrics > div').allTextContents();
  report.checks.saleItems = await page.locator('.r-sale-card .r-action-list li').count();
  report.checks.rentalItems = await page.locator('.r-rental-card .r-action-list li').count();
  report.checks.programItems = await page.locator('.r-program-card').evaluateAll((cards) => cards.map((card) => card.querySelectorAll('li').length));
  report.checks.singularItems = await page.locator('.r-singular-card .r-action-list li').count();
  report.checks.autonomousItems = await page.locator('#rehabilitacion > .container > .r-rehab-layout > .r-about-card .r-action-list li').count();
  report.checks.rehabNumbers = await page.locator('.r-rehab-numbers article').allTextContents();
  report.checks.cityItems = await page.locator('.r-city-grid > .r-about-card').evaluateAll((cards) => cards.map((card) => card.querySelectorAll('li').length));
  report.checks.rehousingItems = await page.locator('.r-rehousing-card .r-action-list li').count();
  report.checks.award = await page.locator('.r-about-award').innerText();
  report.checks.sectionIds = await page.locator('.r-about > section[id]').evaluateAll((sections) => sections.map((section) => section.id));
  const activeHistoryImage = page.locator('.r-history-carousel-slide.is-active img');
  report.checks.historySlideCount = await page.locator('.r-history-carousel-slide').count();
  report.checks.historyImage = await activeHistoryImage.evaluate((image) => ({
    loaded: image.complete && image.naturalWidth > 0,
    source: image.getAttribute('src'),
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    renderedWidth: image.getBoundingClientRect().width,
    renderedHeight: image.getBoundingClientRect().height,
    objectFit: getComputedStyle(image).objectFit,
  }));
  report.checks.historyCaptionCount = await page.locator('.r-history-titanic-caption').count();
  report.checks.historyLogoCount = await page.locator('.r-history-photo .r-history-logo').count();

  await page.getByRole('button', { name: 'Fotografía siguiente', exact: true }).click();
  await page.waitForTimeout(700);
  report.checks.historyFadeMidpoint = await page.locator('.r-history-carousel-slide').evaluateAll((slides) => slides.map((slide) => ({
    opacity: Number(getComputedStyle(slide).opacity),
    visibility: getComputedStyle(slide).visibility,
    duration: getComputedStyle(slide).transitionDuration,
  })));
  await page.waitForTimeout(1000);
  report.checks.historyNextImage = await activeHistoryImage.evaluate((image) => ({
    loaded: image.complete && image.naturalWidth > 0,
    source: image.getAttribute('src'),
  }));
  await page.getByRole('button', { name: 'Fotografía anterior', exact: true }).click();
  await page.waitForTimeout(1700);
  report.checks.historyPreviousImage = await activeHistoryImage.getAttribute('src');
  await page.getByRole('button', { name: 'Ver vista frontal', exact: true }).click();
  await page.waitForTimeout(1700);
  report.checks.historyDotImage = await activeHistoryImage.getAttribute('src');
  await page.getByRole('button', { name: 'Ver vista lateral', exact: true }).click();
  await page.waitForTimeout(1700);
  report.checks.historyLateralImage = await activeHistoryImage.evaluate((image) => ({
    loaded: image.complete && image.naturalWidth > 0,
    source: image.getAttribute('src'),
  }));
  await page.getByRole('button', { name: 'Pausar reproducción automática', exact: true }).click();
  report.checks.historyPauseLabel = await page.locator('.r-history-carousel-playback').getAttribute('aria-label');

  await page.locator('.r-about-nav a[href="#vivienda"]').click();
  report.checks.shortcutHash = new URL(page.url()).hash;

  for (const width of [1440, 1024, 768, 390, 375]) {
    await page.setViewportSize({ width, height: width >= 1000 ? 1000 : 844 });
    await page.goto(`${base}/sobre-nosotros`, { waitUntil: 'networkidle' });
    report.checks[`viewport-${width}`] = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      minimumShortcutTargetHeight: Math.min(...Array.from(document.querySelectorAll('.r-about-nav a')).map((link) => link.getBoundingClientRect().height)),
      minimumCarouselTarget: Math.min(...Array.from(document.querySelectorAll('.r-history-carousel button')).map((button) => Math.min(button.getBoundingClientRect().width, button.getBoundingClientRect().height))),
    }));
    if (width === 1440 || width === 390) {
      const prefix = width === 1440 ? 'desktop' : 'mobile';
      const path = `${output}/${prefix}-about.jpg`;
      await page.screenshot({ path, fullPage: true, type: 'jpeg', quality: 82 });
      report.screenshots.push(path);
      await page.getByRole('button', { name: 'Fotografía siguiente', exact: true }).click();
      await page.waitForTimeout(1700);
      const frontPath = `${output}/${prefix}-frontal.jpg`;
      await page.locator('.r-history-carousel').screenshot({ path: frontPath, type: 'jpeg', quality: 88 });
      report.screenshots.push(frontPath);
      await page.getByRole('button', { name: 'Fotografía siguiente', exact: true }).click();
      await page.waitForTimeout(1700);
      const lateralPath = `${output}/${prefix}-lateral.jpg`;
      await page.locator('.r-history-carousel').screenshot({ path: lateralPath, type: 'jpeg', quality: 88 });
      report.screenshots.push(lateralPath);
    }
  }

  report.checks.passed = report.checks.h1 === 'Sobre nosotros'
    && report.checks.metrics.length === 4
    && ['741', '323', '131', '21'].every((number, index) => report.checks.metrics[index].includes(number))
    && report.checks.saleItems === 14 && report.checks.rentalItems === 7
    && JSON.stringify(report.checks.programItems) === JSON.stringify([5, 6, 4, 4])
    && report.checks.singularItems === 2 && report.checks.autonomousItems === 4
    && report.checks.rehabNumbers.length === 3
    && ['99', '12', '18'].every((number, index) => report.checks.rehabNumbers[index].includes(number))
    && JSON.stringify(report.checks.cityItems) === JSON.stringify([4, 2, 10])
    && report.checks.rehousingItems === 13
    && report.checks.award.includes('2005') && report.checks.award.includes('Grupo Planner')
    && JSON.stringify(report.checks.sectionIds) === JSON.stringify(['historia', 'vivienda', 'infravivienda', 'rehabilitacion', 'infraestructuras', 'realojos'])
    && report.checks.historyImage.loaded
    && report.checks.historyImage.source === '/images/esisa-titanic-aerea-san-juan-bosco.webp'
    && report.checks.historySlideCount === 3
    && report.checks.historyImage.renderedHeight > report.checks.historyImage.renderedWidth
    && report.checks.historyImage.objectFit === 'cover'
    && report.checks.historyFadeMidpoint.slice(0, 2).every((slide) => slide.opacity > 0 && slide.opacity < 1
      && slide.visibility === 'visible'
      && slide.duration.split(', ').every((duration) => duration === '1.6s'))
    && report.checks.historyNextImage.loaded
    && report.checks.historyNextImage.source === '/images/esisa-titanic-frontal.webp'
    && report.checks.historyPreviousImage === '/images/esisa-titanic-aerea-san-juan-bosco.webp'
    && report.checks.historyDotImage === '/images/esisa-titanic-frontal.webp'
    && report.checks.historyLateralImage.loaded
    && report.checks.historyLateralImage.source === '/images/esisa-titanic-lateral.webp'
    && report.checks.historyPauseLabel === 'Reanudar reproducción automática'
    && report.checks.historyCaptionCount === 0
    && report.checks.historyLogoCount === 0
    && report.checks.shortcutHash === '#vivienda'
    && [1440, 1024, 768, 390, 375].every((width) => !report.checks[`viewport-${width}`].overflow
      && report.checks[`viewport-${width}`].minimumShortcutTargetHeight >= 42
      && report.checks[`viewport-${width}`].minimumCarouselTarget >= 44)
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
