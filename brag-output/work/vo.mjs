// Generate the voice-over lines with Kokoro (female voice) and report durations.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(process.env.TOOLS + '/package.json');
const { KokoroTTS } = require('kokoro-js');
const voice = process.argv[2] || 'af_heart';
const speed = Number(process.argv[3] || 1);
export const LINES = JSON.parse(fs.readFileSync('vo-lines.json', 'utf8'));
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
fs.mkdirSync('vo', { recursive: true });
for (const [i, l] of LINES.entries()) {
  const audio = await tts.generate(l.text, { voice, speed: l.speed ?? speed });
  audio.save(`vo/${i}.wav`);
  console.log(i, (audio.audio.length / audio.sampling_rate).toFixed(2) + 's', 'slot', l.at, '->', l.end, l.text);
}
