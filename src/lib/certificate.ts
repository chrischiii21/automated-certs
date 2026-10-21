import type { NameLayout } from './types';

/** Google Fonts offered for the name on the certificate, with the weights each one ships. */
export const CERTIFICATE_FONTS: { family: string; label: string; weights: number[]; style: string }[] = [
  // Formal serifs
  { family: 'Playfair Display', label: 'Playfair Display', weights: [400, 700], style: 'Elegant serif' },
  { family: 'Cormorant Garamond', label: 'Cormorant Garamond', weights: [400, 700], style: 'Classic serif' },
  { family: 'EB Garamond', label: 'EB Garamond', weights: [400, 700], style: 'Classic serif' },
  { family: 'Libre Baskerville', label: 'Libre Baskerville', weights: [400, 700], style: 'Traditional serif' },
  { family: 'Lora', label: 'Lora', weights: [400, 700], style: 'Soft serif' },
  { family: 'Cinzel', label: 'Cinzel', weights: [400, 700], style: 'Engraved capitals' },
  { family: 'Marcellus', label: 'Marcellus', weights: [400], style: 'Roman capitals' },
  // Scripts
  { family: 'Great Vibes', label: 'Great Vibes', weights: [400], style: 'Formal script' },
  { family: 'Pinyon Script', label: 'Pinyon Script', weights: [400], style: 'Calligraphy' },
  { family: 'Alex Brush', label: 'Alex Brush', weights: [400], style: 'Brush script' },
  { family: 'Allura', label: 'Allura', weights: [400], style: 'Flowing script' },
  { family: 'Parisienne', label: 'Parisienne', weights: [400], style: 'Light script' },
  { family: 'Dancing Script', label: 'Dancing Script', weights: [400, 700], style: 'Casual script' },
  // Sans & display
  { family: 'Montserrat', label: 'Montserrat', weights: [400, 700], style: 'Modern sans' },
  { family: 'Poppins', label: 'Poppins', weights: [400, 700], style: 'Geometric sans' },
  { family: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', weights: [400, 700], style: 'Clean sans' },
  { family: 'Raleway', label: 'Raleway', weights: [400, 700], style: 'Elegant sans' },
  { family: 'Josefin Sans', label: 'Josefin Sans', weights: [400, 700], style: 'Vintage geometric' },
  { family: 'Oswald', label: 'Oswald', weights: [400, 700], style: 'Condensed bold' },
  { family: 'Bebas Neue', label: 'Bebas Neue', weights: [400], style: 'Tall display caps' },
  { family: 'Orbitron', label: 'Orbitron', weights: [400, 700], style: 'Futuristic' },
];

export const DEFAULT_LAYOUT: NameLayout = {
  x: 50,
  y: 50,
  maxWidth: 80,
  fontFamily: 'Playfair Display',
  fontWeight: 700,
  fontSize: 64,
  color: '#1c1b18',
};

const fontLoads = new Map<string, Promise<void>>();

/** Loads a certificate font from Google Fonts so canvas text renders in it. */
export function loadFont(family: string, weight: number): Promise<void> {
  const font = CERTIFICATE_FONTS.find((f) => f.family === family);
  if (!font) return Promise.resolve();
  const key = `${family}:${weight}`;
  let pending = fontLoads.get(key);
  if (!pending) {
    const href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${font.weights.join(';')}&display=block`;
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      pending = new Promise<void>((resolve) => {
        link.onload = () => resolve();
        link.onerror = () => resolve();
      });
    } else {
      pending = Promise.resolve();
    }
    pending = pending
      .then(() => document.fonts.load(`${weight} 48px "${family}"`))
      .then(() => undefined, () => undefined);
    fontLoads.set(key, pending);
  }
  return pending;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the certificate template'));
    img.src = src;
  });
}

/** Font size actually used, after shrinking long names to fit maxWidth. */
export function fittedFontSize(ctx: CanvasRenderingContext2D, layout: NameLayout, text: string, width: number): number {
  const maxPx = (layout.maxWidth / 100) * width;
  let size = layout.fontSize;
  ctx.font = `${layout.fontWeight} ${size}px "${layout.fontFamily}", serif`;
  const measured = ctx.measureText(text).width;
  if (measured > maxPx) size = Math.max(8, Math.floor((size * maxPx) / measured));
  return size;
}

/**
 * Draws the template with the name on it. Used by both the admin editor
 * and the claim page so the preview always matches the download.
 */
export function drawCertificate(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  layout: NameLayout,
  text: string,
  options: { guides?: boolean } = {},
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { naturalWidth: w, naturalHeight: h } = img;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const x = (layout.x / 100) * w;
  const y = (layout.y / 100) * h;

  if (options.guides) {
    const boxW = (layout.maxWidth / 100) * w;
    const boxH = layout.fontSize * 1.4;
    const line = Math.max(2, w / 600);
    ctx.save();
    ctx.setLineDash([line * 5, line * 4]);
    ctx.lineWidth = line;
    ctx.strokeStyle = 'rgba(51, 70, 211, 0.9)';
    ctx.fillStyle = 'rgba(51, 70, 211, 0.06)';
    ctx.fillRect(x - boxW / 2, y - boxH / 2, boxW, boxH);
    ctx.strokeRect(x - boxW / 2, y - boxH / 2, boxW, boxH);
    if (Math.abs(layout.x - 50) < 0.05) {
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(219, 39, 119, 0.8)';
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (!text) return;
  const size = fittedFontSize(ctx, layout, text, w);
  ctx.font = `${layout.fontWeight} ${size}px "${layout.fontFamily}", serif`;
  ctx.fillStyle = layout.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

/** Validates a layout coming from the client before it is stored. */
export function sanitizeLayout(input: NameLayout): NameLayout {
  const clamp = (n: number, min: number, max: number, fallback: number) =>
    Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  const font = CERTIFICATE_FONTS.find((f) => f.family === input.fontFamily) ?? CERTIFICATE_FONTS[0];
  return {
    x: clamp(Number(input.x), 0, 100, DEFAULT_LAYOUT.x),
    y: clamp(Number(input.y), 0, 100, DEFAULT_LAYOUT.y),
    maxWidth: clamp(Number(input.maxWidth), 10, 100, DEFAULT_LAYOUT.maxWidth),
    fontFamily: font.family,
    fontWeight: font.weights.includes(Number(input.fontWeight)) ? Number(input.fontWeight) : font.weights.at(-1)!,
    fontSize: Math.round(clamp(Number(input.fontSize), 8, 600, DEFAULT_LAYOUT.fontSize)),
    color: /^#[0-9a-f]{6}$/i.test(input.color) ? input.color : DEFAULT_LAYOUT.color,
  };
}

/** Draws a faint repeated "PREVIEW" across the certificate (used until the name is verified). */
export function drawWatermark(canvas: HTMLCanvasElement, text = 'PREVIEW') {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const { width: w, height: h } = canvas;
  const size = Math.round(w / 14);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 7);
  ctx.font = `700 ${size}px "Plus Jakarta Sans", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(120, 120, 120, 0.16)';
  const stepX = size * 6;
  const stepY = size * 2.6;
  for (let y = -h; y <= h; y += stepY) {
    for (let x = -w; x <= w; x += stepX) ctx.fillText(text, x + ((y / stepY) % 2) * (stepX / 2), y);
  }
  ctx.restore();
}

// ── Color suggestions from the template itself ──────────────────────

function luminance([r, g, b]: number[]): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contrastRatio(a: number[], b: number[]): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
export const hexToRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/**
 * Suggests name colors taken from the design's own palette, keeping only
 * those readable against the background where the name sits.
 */
export function suggestColors(img: HTMLImageElement, layout: Pick<NameLayout, 'x' | 'y' | 'maxWidth'>, count = 6): string[] {
  const W = 160;
  const H = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * W));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(img, 0, 0, W, H);
  let pixels: Uint8ClampedArray;
  try {
    pixels = ctx.getImageData(0, 0, W, H).data;
  } catch {
    return []; // tainted canvas (no CORS)
  }

  // Background behind the name: average of the name box.
  const bx = Math.round(((layout.x - layout.maxWidth / 2) / 100) * W);
  const bw = Math.max(1, Math.round((layout.maxWidth / 100) * W));
  const by = Math.round((layout.y / 100) * H) - 2;
  let sum = [0, 0, 0], n = 0;
  for (let y = Math.max(0, by); y < Math.min(H, by + 5); y++) {
    for (let x = Math.max(0, bx); x < Math.min(W, bx + bw); x++) {
      const i = (y * W + x) * 4;
      sum = [sum[0] + pixels[i], sum[1] + pixels[i + 1], sum[2] + pixels[i + 2]];
      n++;
    }
  }
  const bg = n ? sum.map((v) => v / n) : [255, 255, 255];

  // Bucket the whole design into a coarse palette.
  const buckets = new Map<string, { rgb: number[]; count: number }>();
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 200) continue;
    const key = `${pixels[i] >> 4},${pixels[i + 1] >> 4},${pixels[i + 2] >> 4}`;
    const b = buckets.get(key);
    if (b) {
      b.rgb = b.rgb.map((v, j) => v + pixels[i + j]);
      b.count++;
    } else buckets.set(key, { rgb: [pixels[i], pixels[i + 1], pixels[i + 2]], count: 1 });
  }
  const palette = [...buckets.values()]
    .filter((b) => b.count > 3)
    .map((b) => ({ rgb: b.rgb.map((v) => v / b.count), count: b.count }))
    .filter((c) => contrastRatio(c.rgb, bg) >= 3)
    .map((c) => {
      const [r, g, b] = c.rgb;
      const saturation = (Math.max(r, g, b) - Math.min(r, g, b)) / 255;
      // Favor colors that appear in the design and have some character.
      return { ...c, score: Math.log(c.count + 1) * (0.6 + saturation) * Math.min(contrastRatio(c.rgb, bg), 9) };
    })
    .sort((a, b) => b.score - a.score);

  const picked: number[][] = [];
  for (const c of palette) {
    if (picked.every((p) => Math.hypot(p[0] - c.rgb[0], p[1] - c.rgb[1], p[2] - c.rgb[2]) > 60)) picked.push(c.rgb);
    if (picked.length >= count - 1) break;
  }
  // Always offer a safe high-contrast neutral.
  picked.push(luminance(bg) > 0.4 ? [28, 27, 24] : [255, 255, 255]);
  return [...new Set(picked.map(toHex))];
}
