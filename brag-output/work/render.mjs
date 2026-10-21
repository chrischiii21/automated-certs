// Render every frame of video.html and pipe it into ffmpeg with the mixed audio.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import path from 'node:path';
const require = createRequire(process.env.TOOLS + '/package.json');
const { chromium } = require('playwright-core');
const FF = require('ffmpeg-static');
const FPS = 30, FRAMES = 900;
const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
  '-i', 'mix.wav', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
  '-t', '30', '-af', 'apad,loudnorm=I=-14:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', process.env.OUT || 'raw.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
const closed = new Promise((r) => ff.on('close', r));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: process.env.FORMAT === 'vertical' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
await page.goto('file:///' + path.resolve('video.html').split(path.sep).join('/') + (process.env.FORMAT === 'vertical' ? '?format=vertical' : ''));
await page.evaluate(() => window.ready);
for (let f = 0; f < FRAMES; f++) {
  await page.evaluate((t) => render(t), f / FPS);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 150 === 0) console.log('frame', f);
}
ff.stdin.end();
await browser.close();
await closed;
console.log('done');
