import { describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { analyse, type Finding } from '../src/analysis/evaluate';
import { toModel } from '../src/analysis/model';
import { Ctx } from '../src/analysis/predicates';
import { readDecades } from '../src/analysis/decades';
import { readYears } from '../src/analysis/years';
import { stemMutagens } from '../src/analysis/model';
import sources from './fixtures/sources.json';

const verified = new Set((sources as { verse: string }[]).map((s) => s.verse));

// A spread of charts: every 時辰, both genders, across several years and months.
const charts = [...Array(48)].map((_, n) => {
  const date = `${1960 + (n % 12) * 3}-${String(1 + (n % 12)).padStart(2, '0')}-${String(3 + (n % 25)).padStart(2, '0')}`;
  const g = n % 2 ? 'female' : 'male';
  const t = n % 12;
  return toModel(buildChart(date, t, g, DEFAULT_SETTINGS), g, t);
});

const all: { f: Finding; where: string }[] = [];
for (const m of charts) {
  const a = analyse(m);
  for (const p of a.palaces) for (const f of p.findings) all.push({ f, where: 'palace' });
  for (const d of readDecades(m)) {
    for (const f of d.findings) all.push({ f, where: 'decade' });
    for (const y of readYears(m, d.index).slice(0, 3)) for (const f of y.findings) all.push({ f, where: 'year' });
  }
}
const advice = all.filter(({ f }) => f.advice);

describe('advice notes (趨吉避凶)', () => {
  it('every note is labelled, evidenced and sourced; quoted verses are verified', () => {
    expect(advice.length).toBeGreaterThan(0);
    for (const { f } of advice) {
      expect(f.text.startsWith('Advice: '), f.id).toBe(true);
      expect(f.evidence.length, f.id).toBeGreaterThan(0);
      expect(f.sources.length, f.id).toBeGreaterThan(0);
      for (const s of f.sources) if (s.verse) expect(verified.has(s.verse), s.verse).toBe(true);
    }
  });

  it('each kind of note occurs somewhere in the sample', () => {
    const kinds = new Set(advice.map(({ f }) => f.id.split('.advice.')[1]));
    for (const k of ['peer-money', 'tuo', 'yinzhi', 'wedding', 'study']) expect(kinds, k).toContain(k);
  });

  it('decade notes match their triggers', () => {
    for (const m of charts) {
      const x = new Ctx(m);
      for (const d of readDecades(m)) {
        const ids = d.findings.filter((f) => f.advice).map((f) => f.id.split('.advice.')[1]);
        expect(ids.includes('tuo'), `decade ${d.range}`).toBe(x.has(d.index, '陀羅'));
        expect(ids.includes('yinzhi')).toBe(d.tone === 'challenging');
        const ji = x.find(m.palaces[d.index].decadeMut![3]);
        expect(ids.includes('peer-money')).toBe(['兄弟', '僕役'].includes(m.palaces[ji].name));
      }
    }
  });

  it('the wedding note follows the year 化忌 into or against the Spouse palace', () => {
    const m = charts[0];
    const x = new Ctx(m);
    for (const d of readDecades(m))
      for (const y of readYears(m, d.index)) {
        const ji = x.find(stemMutagens(y.stem, m.mutOverrides)![3]);
        const has = y.findings.some((f) => f.id.endsWith('.advice.wedding'));
        expect(has, `${y.year}`).toBe(['夫妻', '官祿'].includes(m.palaces[ji].name));
      }
  });

  it('feng shui and life-span remedies are left out', () => {
    for (const { f } of advice) expect(f.text).not.toMatch(/feng shui|direction|bed|desk|death|die/i);
  });
});
