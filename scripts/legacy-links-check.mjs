import { preview } from 'vite';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { transparencyGroups, currentJobs, archivedJobs } from '../src/content/site.js';

const base = 'http://127.0.0.1:5190';
const output = 'test-output/legacy-links-check';
const entries = [
  ...transparencyGroups.flatMap((group) => group.links.map((link) => ({ label: link.label, url: link.url }))),
  ...currentJobs.map((job) => ({ label: job.title, url: job.url })),
  ...archivedJobs.map((job) => ({ label: job.title, url: job.url })),
];
const report = { targets: [], oldDomainReferences: [], visibleOldDomainLinks: [], errors: [] };
await mkdir(output, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5190, strictPort: true } });
let browser;

try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => localStorage.setItem('hemsa-cookie-choice', 'accepted'));
  page.on('pageerror', (error) => report.errors.push(error.message));

  for (const entry of entries) {
    if (/^https?:\/\/(?:www\.)?hemsasanfernando\.es/.test(entry.url)) report.oldDomainReferences.push(entry);
    if (!entry.url.startsWith('/')) {
      report.targets.push({ ...entry, type: 'external', ok: true });
      continue;
    }
    if (entry.url.endsWith('.pdf')) {
      const response = await fetch(`${base}${entry.url}`);
      const signature = Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString();
      report.targets.push({ ...entry, type: 'pdf', status: response.status, ok: response.ok && signature === '%PDF-' });
      continue;
    }
    const response = await page.goto(`${base}${entry.url}`, { waitUntil: 'domcontentloaded' });
    const url = new URL(entry.url, base);
    const hash = decodeURIComponent(url.hash.slice(1));
    const anchorExists = hash ? await page.evaluate((id) => document.getElementById(id) !== null, hash) : true;
    const notFound = await page.locator('text=No hemos encontrado esta página').count() > 0;
    const navigationOk = response ? response.ok() : true;
    report.targets.push({ ...entry, type: 'page', status: response?.status() || 200, anchorExists, notFound, ok: navigationOk && anchorExists && !notFound });
  }

  await page.goto(`${base}/`, { waitUntil: 'networkidle' });
  report.visibleOldDomainLinks = await page.locator('a[href^="http"][href*="hemsasanfernando.es"]').evaluateAll((anchors) => [...new Set(anchors.map((anchor) => anchor.href))]);
  report.passed = report.oldDomainReferences.length === 0
    && report.targets.every((target) => target.ok)
    && report.visibleOldDomainLinks.length === 0
    && report.errors.length === 0;
} catch (error) {
  report.executionError = error.stack || error.message;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile(`${output}/report.json`, JSON.stringify(report, null, 2));
}

console.log(JSON.stringify(report, null, 2));
if (report.executionError || !report.passed) process.exitCode = 1;
