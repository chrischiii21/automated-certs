import 'server-only';
import { z } from 'zod';
import { CERTIFICATE_FONTS, sanitizeLayout } from './certificate';
import type { NameLayout } from './types';

// Groq (free tier) vision model. Override with GROQ_MODEL if Groq renames or retires it.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'qwen/qwen3.8-27b';

export function isAiConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY);
}

const Suggestion = z.object({
  fontFamily: z.string(),
  fontWeight: z.coerce.number(),
  color: z.string(),
  x: z.coerce.number(),
  y: z.coerce.number(),
  maxWidth: z.coerce.number(),
  fontSize: z.coerce.number(),
  reason: z.string().default(''),
});

const fontMenu = CERTIFICATE_FONTS.map((f) => `- ${f.family} (${f.style}; weights ${f.weights.join('/')})`).join('\n');

/**
 * Asks a vision model to look at the certificate design and choose where the
 * recipient's name should go and how it should be styled.
 */
export async function suggestNameStyle(
  templateUrl: string,
  size: { width: number; height: number },
  sampleName: string,
): Promise<{ layout: NameLayout; reason: string }> {
  const prompt = `You are a graphic designer who styles certificates. This certificate template is ${size.width}x${size.height}px.
Names will be drawn centered on the point you choose.

1. Find the space intended for the recipient's name (usually a blank area or line after wording like "presented to" or "certifies that"). Give its center as x and y percentages (0-100) of the image, and a maxWidth percentage that stays clear of borders and other elements.
2. Choose a font from this list that complements the design's existing typography (formal designs suit serifs or scripts; modern or sporty designs suit sans or display faces):
${fontMenu}
3. Choose a fontWeight the font offers, and a color (hex like #1a4d2e) that is readable on the background behind the name and fits the design's palette, often its darkest accent color.
4. Choose a fontSize in pixels for the full-size image so a typical name like "${sampleName}" looks prominent but balanced with the surrounding text.

Reply with only a JSON object with these keys: fontFamily, fontWeight, color, x, y, maxWidth, fontSize, reason (one short sentence for the organizer).`;

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: templateUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Groq responded ${res.status}: ${(await res.text()).slice(0, 300)}`);

  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = body.choices?.[0]?.message?.content ?? '';
  // Some reasoning models prefix their answer with a <think> block; keep only the JSON object.
  const json = content.slice(content.indexOf('{'), content.lastIndexOf('}') + 1);
  const parsed = Suggestion.parse(JSON.parse(json));

  const { reason, ...layout } = parsed;
  // sanitizeLayout clamps numbers and falls back if the model named a font we don't offer.
  return { layout: sanitizeLayout(layout), reason };
}
