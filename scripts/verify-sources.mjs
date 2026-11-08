// Verifies every classical quote the rules attribute to a work (《紫微斗數全書》 or 《紫微斗數》)
// against the public-domain transcription on Chinese Wikisource, then writes the verified list to
// tests/fixtures/sources.json. Tests fail if a rule quotes something not in that list.
//
//   npm run verify-sources          (downloads once into .cache/sources/, then reuses it)
//
// The transcription mixes Traditional and Simplified characters, so both sides are compared after
// converting to Simplified, with punctuation removed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as OpenCC from 'opencc-js';

const root = new URL('..', import.meta.url).pathname;
const cache = join(root, '.cache/sources');
mkdirSync(cache, { recursive: true });

const PAGES = [
  ['紫微斗數全書', '紫微斗數全書/卷一'],
  ['紫微斗數全書', '紫微斗數全書/卷二'],
  ['紫微斗數全書', '紫微斗數全書/卷三'],
  ['紫微斗數', '紫微斗數'],
];

const toS = OpenCC.Converter({ from: 'tw', to: 'cn' });
// Variant characters the transcription and OpenCC disagree on.
const VARIANTS = { 锺: '钟', 衆: '众', 爲: '为' };
const norm = (s) => [...toS(s).replace(/[\s，。、：；（）「」！？,.·…—\-\[\]【】]/g, '')].map((c) => VARIANTS[c] ?? c).join('');

async function page(title) {
  const file = join(cache, title.replace(/\//g, '_') + '.txt');
  if (!existsSync(file)) {
    const url = `https://zh.wikisource.org/w/index.php?title=${encodeURIComponent(title)}&action=raw`;
    const res = await fetch(url, { headers: { 'User-Agent': 'ziwei-chart source verifier' } });
    if (!res.ok) throw new Error(`${title}: HTTP ${res.status}`);
    writeFileSync(file, await res.text());
  }
  return readFileSync(file, 'utf8');
}

/** Split wikitext into { work, section, text } using its == headings. */
async function sections() {
  const out = [];
  for (const [work, title] of PAGES) {
    let path = [];
    let buf = [];
    const flush = () => {
      if (buf.length) out.push({ work, path: path.filter(Boolean).map(norm), text: norm(buf.join('')) });
      buf = [];
    };
    for (const line of (await page(title)).split('\n')) {
      const m = line.match(/^(=+)\s*(.+?)\s*=+\s*$/);
      if (m) {
        flush();
        const lvl = m[1].length - 2;
        path = path.slice(0, lvl);
        path[lvl] = m[2];
        continue;
      }
      buf.push(line);
    }
    flush();
  }
  return out;
}

// Collect quotes from the rule sources: { verse, work, section } objects in src/analysis.
const files = ['src/analysis/rules/patterns.ts', 'src/analysis/rules/stars.ts', 'src/analysis/decades.ts', 'src/analysis/years.ts', 'src/analysis/advice.ts'];
const quotes = [];
for (const f of files) {
  const src = readFileSync(join(root, f), 'utf8');
  for (const m of src.matchAll(/verse:\s*'([^']+)',\s*work:\s*'([^']+)',\s*section:\s*'([^']+)'/g)) {
    quotes.push({ verse: m[1], work: m[2], section: m[3], file: f });
  }
}

// 卷二 tables (src/analysis/rules/juan2.ts): every star line and pair line, plus the 命宮 branch tables.
const juan2 = await import(join(root, 'src/analysis/rules/juan2.ts'));
for (const [, t] of Object.entries(juan2.JUAN2)) {
  for (const [, [verse, , pairs]] of Object.entries(t.stars)) {
    quotes.push({ verse, work: '紫微斗數全書', section: t.section, file: 'juan2.ts' });
    for (const [, [pv]] of Object.entries(pairs ?? {})) quotes.push({ verse: pv, work: '紫微斗數全書', section: t.section, file: 'juan2.ts' });
  }
}
for (const lines of Object.values(juan2.MING_TABLE)) for (const verse of lines) quotes.push({ verse, work: '紫微斗數全書', section: juan2.MING_SECTION, file: 'juan2.ts' });

const secs = await sections();
const verified = [];
let bad = 0;
for (const q of quotes) {
  const v = norm(q.verse);
  const s = norm(q.section);
  // Prefer an exact heading match (e.g. 二兄弟 must not match 十二父母), then containment.
  const inSec = (x) => x.path.some((p) => p === s) || (!secs.some((y) => y.path.some((p) => p === s)) && x.path.some((p) => p.includes(s) || s.includes(p)));
  const hit = secs.find((x) => x.work === q.work && inSec(x) && x.text.includes(v));
  if (hit) verified.push({ verse: q.verse, work: q.work, section: q.section });
  else {
    bad++;
    const elsewhere = secs.find((x) => x.text.includes(v));
    console.error(`NOT FOUND in ${q.work} / ${q.section}: ${q.verse}${elsewhere ? `  (found in ${elsewhere.work} / ${elsewhere.path.join(' / ')})` : ''}  [${q.file}]`);
  }
}
const uniq = [...new Map(verified.map((v) => [`${v.verse}|${v.work}|${v.section}`, v])).values()];
writeFileSync(join(root, 'tests/fixtures/sources.json'), JSON.stringify(uniq, null, 1) + '\n');
console.log(`${quotes.length} attributed quotes, ${uniq.length} unique verified, ${bad} not found`);
process.exit(bad ? 1 : 0);
