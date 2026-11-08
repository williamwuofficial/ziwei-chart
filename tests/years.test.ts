import { describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { toModel } from '../src/analysis/model';
import { readYears, yearGanZhi } from '../src/analysis/years';

const chart = () => buildChart('1990-06-15', 6, 'male', DEFAULT_SETTINGS);

describe('year pillars', () => {
  it.each([
    [1984, '甲子'], [1990, '庚午'], [2000, '庚辰'], [2026, '丙午'], [2027, '丁未'],
  ])('%i → %s', (y, gz) => {
    const { stem, branch } = yearGanZhi(y);
    expect(stem + branch).toBe(gz);
  });
});

describe('year-by-year readings', () => {
  it('covers each nominal age of the decade', () => {
    const c = toModel(chart(), 'male', 6);
    const i = c.palaces.findIndex((p) => p.decade[0] === 36);
    const ys = readYears(c, i);
    expect(ys.map((y) => y.age)).toEqual([36, 37, 38, 39, 40, 41, 42, 43, 44, 45]);
    expect(ys[0].year).toBe(2025); // born lunar 1990, nominal age 36
    for (const y of ys) {
      expect(c.palaces[y.palace].branch).toBe(y.branch);
      for (const f of y.findings) expect(f.sources.length).toBeGreaterThan(0);
    }
  });

  it("the year's palace matches iztro's own 流年 palace", () => {
    const a = chart();
    const c = toModel(a, 'male', 6);
    const i = c.palaces.findIndex((p) => p.decade[0] === 36);
    for (const y of readYears(c, i)) {
      expect(a.horoscope(`${y.year}-7-1`, 6).yearly.index, String(y.year)).toBe(y.palace);
    }
  });

  it('the year 四化 matches iztro for the same year', () => {
    const a = chart();
    const c = toModel(a, 'male', 6);
    const i = c.palaces.findIndex((p) => p.decade[0] === 36);
    for (const y of readYears(c, i)) {
      const lu = y.findings.find((f) => f.id.endsWith('.mut.祿'));
      const expected = a.horoscope(`${y.year}-7-1`, 6).yearly.mutagen[0];
      expect(lu?.text, String(y.year)).toContain(expected);
    }
  });
});
