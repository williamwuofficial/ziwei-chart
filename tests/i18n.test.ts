// The Chinese modes: every fixed English string in the rule data has a Chinese version, and the
// analysis of a sweep of real charts comes out with no English left in it.

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS, SIHUA_LABEL } from '../src/engine/chart';
import { toModel } from '../src/analysis/model';
import { analyse, type Finding } from '../src/analysis/evaluate';
import { readDecades } from '../src/analysis/decades';
import { readYears } from '../src/analysis/years';
import { compare, GROUP_EN, LIMITS } from '../src/analysis/compat';
import { DAY_MASTER, parsePillars, readBazi, TEN_GOD } from '../src/analysis/bazi';
import { ALL_PATTERNS } from '../src/analysis/rules/patterns';
import { BODY_TEXT, MAJOR_NATURE, MINOR_NATURE, PAIR_NOTES, PALACE_DOMAIN } from '../src/analysis/rules/stars';
import { JUAN2 } from '../src/analysis/rules/juan2';
import type { Source } from '../src/analysis/rules/types';
import { MISSING, setLang, tr } from '../src/i18n/lang';
import { ZH } from '../src/i18n/zh';

/** English words that may stay: site names in citations and the engine's name. */
const ALLOWED = /\b[a-z0-9.-]+\.(?:tw|com|org|net)\b|\biztro\b/gi;
const english = (s: string) => s.replace(ALLOWED, '').match(/[A-Za-z]{3,}(?:\s+[A-Za-z]{2,})*/g) ?? [];

/** Every fixed English string the rule data holds. */
function staticStrings(): string[] {
  const out: string[] = [];
  const src = (s: Source) => out.push(s.basis);
  for (const r of ALL_PATTERNS) {
    out.push(r.text);
    r.sources.forEach(src);
  }
  for (const n of Object.values(MAJOR_NATURE)) out.push(n.text, n.bright, n.fallen);
  out.push(...Object.values(PAIR_NOTES), ...Object.values(MINOR_NATURE).map((n) => n.text));
  out.push(...Object.values(PALACE_DOMAIN).map((d) => d.domain), ...Object.values(BODY_TEXT).filter((t): t is string => !!t));
  for (const t of Object.values(JUAN2))
    for (const [, en, pairs] of Object.values(t.stars)) {
      out.push(en);
      for (const [, pen] of Object.values(pairs ?? {})) out.push(pen);
    }
  for (const g of Object.values(TEN_GOD)) (out.push(g.text), src(g.src));
  for (const d of Object.values(DAY_MASTER)) (out.push(d.en, d.text), src(d.src));
  out.push(...Object.values(GROUP_EN), ...LIMITS, ...Object.values(SIHUA_LABEL));
  return [...new Set(out)].filter(Boolean);
}

describe('zh dictionary', () => {
  it('covers every fixed English string in the rule data', () => {
    const missing = staticStrings().filter((s) => ZH[s] === undefined);
    expect(missing).toEqual([]);
  });
  it('has no English left in its Chinese', () => {
    const bad = Object.entries(ZH).filter(([, zh]) => english(zh).length);
    expect(bad).toEqual([]);
  });
});

describe('analysis in Chinese', () => {
  beforeAll(() => {
    setLang('zh-TW');
    MISSING.clear();
  });
  afterAll(() => setLang('en'));

  it('a sweep of charts reads with no English left', () => {
    const leftovers = new Map<string, string>();
    const check = (f: Finding) => {
      for (const s of [f.text, ...f.evidence, ...f.sources.map((x) => tr(x.basis))]) for (const w of english(s)) leftovers.set(w, s);
    };
    const g = (k: number) => (k % 2 ? 'female' : 'male') as 'male' | 'female';
    for (let k = 0; k < 120; k++) {
      const date = new Date(Date.UTC(1950 + ((k * 7) % 60), (k * 5) % 12, 1 + ((k * 11) % 28))).toISOString().slice(0, 10);
      const t = k % 12;
      const c = toModel(buildChart(date, t, g(k), DEFAULT_SETTINGS), g(k), t);
      const a = analyse(c);
      [...a.overview, ...a.patterns, ...a.palaces.flatMap((p) => p.findings)].forEach(check);
      const decades = readDecades(c);
      for (const d of decades) {
        [...d.findings, ...d.patterns].forEach(check);
        d.scoreParts.forEach((s) => english(s).forEach((w) => leftovers.set(w, s)));
      }
      const d = decades[3];
      for (const y of readYears(c, d.index).slice(0, 3)) [...y.findings].forEach(check);
      const pillars = parsePillars(buildChart(date, t, g(k), { ...DEFAULT_SETTINGS, yearDivide: 'exact' }).chineseDate);
      readBazi(pillars, g(k)).findings.forEach(check);
      if (k % 4 === 0) {
        const other = toModel(buildChart('1988-03-09', 4, 'female', DEFAULT_SETTINGS), 'female', 4);
        const cmp = compare({ c, who: '你', whose: '你的', pillars }, { c: other, who: '對方', whose: '對方的', pillars: parsePillars(buildChart('1988-03-09', 4, 'female', DEFAULT_SETTINGS).chineseDate) }, 2026);
        for (const s of cmp.sections) (s.findings.forEach(check), english(s.title).forEach((w) => leftovers.set(w, s.title)));
      }
    }
    expect([...MISSING]).toEqual([]);
    expect([...leftovers.entries()].slice(0, 30)).toEqual([]);
  }, 180_000);
});
