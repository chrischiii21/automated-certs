// Capture stills at given times, plus a contact sheet.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
const require = createRequire(process.env.TOOLS + '/package.json');
const { chromium } = require('playwright-core');
const times = process.argv.slice(2).map(Number);
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: process.env.FORMAT === 'vertical' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
await page.goto('file:///' + path.resolve('video.html').split(path.sep).join('/') + (process.env.FORMAT === 'vertical' ? '?format=vertical' : ''));
await page.evaluate(() => window.ready);
fs.mkdirSync('stills', { recursive: true });
for (const t of times) {
  await page.evaluate((t) => render(t), t);
  await page.screenshot({ path: `stills/t${t.toFixed(2)}.png` });
}
await browser.close();
