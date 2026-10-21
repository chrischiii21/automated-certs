// Pull the app's lucide icons into plain SVG strings for the video page.
import fs from 'node:fs';
const names = ['award','arrow-right','shield-check','circle-alert','loader-circle','party-popper','download','image-up','list-checks','send','sparkles','check','users','file-text','file-archive','file-up','search','palette','lock','badge-check'];
const out = {};
for (const n of names) {
  const p = `node_modules/lucide-react/dist/esm/icons/${n}.mjs`;
  if (!fs.existsSync(p)) { console.error('missing', n); continue; }
  const src = fs.readFileSync(p, 'utf8');
  const node = eval(src.match(/const __iconNode = (\[[\s\S]*?\]);\nconst/)[1]);
  out[n] = node.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
}
fs.writeFileSync('brag-output/work/icons.js', 'window.ICONS=' + JSON.stringify(out) + ';');
console.log(Object.keys(out).length);
