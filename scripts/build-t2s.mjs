// Generates src/i18n/t2s.json: a Traditional → Simplified character map covering every CJK
// character that appears in the app's own text (rules, glossary, UI). Run after editing rule text:
//   npm run t2s
// A test fails if a character is missing, so the map cannot silently fall behind.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as OpenCC from 'opencc-js';

const root = new URL('..', import.meta.url).pathname;
const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|json)$/.test(f) && !p.endsWith('t2s.json')) files.push(p);
  }
};
walk(join(root, 'src'));

const chars = new Set();
for (const f of files) for (const ch of readFileSync(f, 'utf8')) if (/[㐀-鿿]/.test(ch)) chars.add(ch);

const convert = OpenCC.Converter({ from: 'tw', to: 'cn' });
const map = {};
for (const ch of [...chars].sort()) {
  const s = convert(ch);
  if (s !== ch) map[ch] = s;
}
writeFileSync(join(root, 'src/i18n/t2s.json'), JSON.stringify(map) + '\n');
console.log(`t2s: ${chars.size} characters scanned, ${Object.keys(map).length} differ`);
