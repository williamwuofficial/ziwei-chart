// 小限 (age palace): placement by the 全書's 安小限訣, checked against iztro's own 小限 ages and
// against two teachers' worked cases.
import { describe, expect, it } from 'vitest';
import { astro } from 'iztro';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { toModel } from '../src/analysis/model';
import { xiaoxianIndex } from '../src/analysis/xiaoxian';
import { readDecades } from '../src/analysis/decades';
import { readYear, readYears } from '../src/analysis/years';
import sources from './fixtures/sources.json';

const model = (d: string, t: number, g: 'male' | 'female') => toModel(buildChart(d, t, g, DEFAULT_SETTINGS), g, t);
const verified = new Set((sources as { verse: string }[]).map((s) => s.verse));

describe('小限 placement (全書 安小限訣)', () => {
  it('matches iztro’s 小限 ages for every birth-year branch and both genders', () => {
    for (let y = 1960; y < 1972; y++)
      for (const g of ['male', 'female'] as const) {
        const date = `${y}-07-15`;
        const a = astro.withOptions({ type: 'solar', dateStr: `${y}-7-15`, timeIndex: 5, gender: g, language: 'zh-TW' });
        const m = model(date, 5, g);
        for (let age = 1; age <= 24; age++) {
          const want = a.palaces.findIndex((p) => p.ages.includes(age));
          expect(xiaoxianIndex(m, age), `${y} ${g} age ${age}`).toBe(want);
        }
      }
  });
  it('quotes verified 全書 lines', () => {
    const m = model('1955-03-07', 8, 'female');
    for (const d of readDecades(m))
      for (const y of readYears(m, d.index))
        for (const f of y.findings.filter((f) => f.id.includes('.xiaoxian')))
          for (const s of f.sources) if (s.verse) expect(verified.has(s.verse), s.verse).toBe(true);
  });
});

describe('倪海廈 命例實批2 (1955-03-07 申時, 陰女): 「民國80年…流年運在遷移」', () => {
  const m = model('1955-03-07', 8, 'female');
  it('at 37 sui (1991) the 小限 is the 遷移 palace with 武曲 貪狼, while the 流年 palace is the Life palace', () => {
    const d = readDecades(m).find((x) => x.range[0] <= 37 && 37 <= x.range[1])!;
    const y = readYear(m, d.index, 1991);
    expect(y.age).toBe(37);
    expect(y.xiaoxianName).toBe('遷移');
    expect(y.palaceName).toBe('命宮');
    expect(m.palaces[y.xiaoxian].major.map((s) => s.name).sort()).toEqual(['武曲', '貪狼'].sort());
  });
});

describe('范振木 論命實務一 (女命, 民國55年農曆7月2日戌時): 民國91年 (壬午)', () => {
  const solar = astro.withOptions({ type: 'lunar', dateStr: '1966-7-2', timeIndex: 10, gender: 'female', language: 'zh-TW' }).solarDate;
  const m = model(solar, 10, 'female');
  it('「小限走本命遷移宮」, with the 太歲 on the 財福 line', () => {
    const d = readDecades(m).find((x) => x.range[0] <= 37 && 37 <= x.range[1])!;
    const y = readYear(m, d.index, 2002);
    expect(y.xiaoxianName).toBe('遷移');
    expect(['財帛', '福德']).toContain(y.palaceName);
  });
});

describe('scoring', () => {
  it('a 小限 on the birth 化忌 counts against the year, citing 「小限逢之一年不足」', () => {
    const m = model('1955-03-07', 8, 'female'); // birth 化忌: 太陰 in 僕役 (子)
    const ji = m.palaces.findIndex((p) => p.major.some((s) => s.mutagen === '忌'));
    let seen = 0;
    for (const d of readDecades(m))
      for (const y of readYears(m, d.index)) {
        const f = y.findings.find((x) => x.id.endsWith('.xiaoxian.ji'));
        expect(!!f, `${y.year}`).toBe(y.xiaoxian === ji);
        if (f) {
          seen++;
          expect(f.sources[0].verse).toBe('小限逢之一年不足');
          expect(y.scoreParts.join(' ')).toMatch(/小限 meets the birth 化忌/);
        }
      }
    expect(seen).toBeGreaterThan(3);
  });
});
