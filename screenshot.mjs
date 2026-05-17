import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

const url = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';

const files = fs.readdirSync(screenshotsDir).filter(f => f.startsWith('screenshot-') && f.endsWith('.png'));
const nums = files.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
const next = nums.length ? Math.max(...nums) + 1 : 1;
const outFile = path.join(screenshotsDir, `screenshot-${next}${label}.png`);

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise(r => setTimeout(r, 1000));
// Disable smooth scroll, then sweep page to trigger IntersectionObserver reveals
await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
const pageHeight = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y <= pageHeight; y += 400) {
  await page.evaluate(scrollY => window.scrollTo({ top: scrollY, behavior: 'instant' }), y);
  await new Promise(r => setTimeout(r, 150));
}
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await new Promise(r => setTimeout(r, 800));
const scrollY = process.argv[4] ? parseInt(process.argv[4]) : null;
if (scrollY !== null) {
  // Disable smooth scrolling so window.scrollTo is instant
  await page.evaluate(y => {
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo({ top: y, behavior: 'instant' });
  }, scrollY);
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: outFile, fullPage: false });
} else {
  await page.screenshot({ path: outFile, fullPage: true });
}
await browser.close();

console.log(`Screenshot saved: ${outFile}`);
