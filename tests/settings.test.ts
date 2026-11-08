import { describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { analyse } from '../src/analysis/evaluate';
import { toModel } from '../src/analysis/model';

const ming = (c: ReturnType<typeof buildChart>) => c.palaces.find((p) => p.name === '命宮')!;

describe('year boundary (yearDivide)', () => {
  // 1990-02-01 is after Lunar New Year (27 Jan) but before 立春 (4 Feb).
  it('Lunar New Year (default) gives a 庚午 year', () => {
    expect(buildChart('1990-02-01', 6, 'male', DEFAULT_SETTINGS).chineseDate.split(' ')[0]).toBe('庚午');
  });
  it('立春 gives the previous 己巳 year, and the analysis follows it', () => {
    const c = buildChart('1990-02-01', 6, 'male', { ...DEFAULT_SETTINGS, yearDivide: 'exact' });
    expect(c.chineseDate.split(' ')[0]).toBe('己巳');
    expect(toModel(c, 'male', 6).yearStem).toBe('己');
  });
  it('makes no difference outside the gap', () => {
    const a = buildChart('1990-06-15', 6, 'male', DEFAULT_SETTINGS);
    const b = buildChart('1990-06-15', 6, 'male', { ...DEFAULT_SETTINGS, yearDivide: 'exact' });
    expect(b.chineseDate).toBe(a.chineseDate);
  });
});

describe('leap-month births (fixLeap)', () => {
  // 2020-06-11 is 閏四月二十: past the 15th, so the two readings differ.
  it('changes the chart for a late leap-month day', () => {
    const a = buildChart('2020-06-11', 6, 'male', DEFAULT_SETTINGS);
    const b = buildChart('2020-06-11', 6, 'male', { ...DEFAULT_SETTINGS, fixLeap: false });
    expect(a.rawDates.lunarDate.isLeap).toBe(true);
    expect(ming(a).majorStars.map((s) => s.name)).not.toEqual(ming(b).majorStars.map((s) => s.name));
  });
});

describe('中州派 chart type (astroType)', () => {
  const zz = { ...DEFAULT_SETTINGS, algorithm: 'zhongzhou' as const };
  it('人盤 moves the Life palace', () => {
    const heaven = buildChart('1990-06-15', 6, 'male', zz);
    const human = buildChart('1990-06-15', 6, 'male', { ...zz, astroType: 'human' });
    expect(ming(human).earthlyBranch).not.toBe(ming(heaven).earthlyBranch);
    // The analysis reads the moved Life palace.
    const a = analyse(toModel(human, 'male', 6));
    expect(a.overview[0].evidence[0]).toContain(ming(human).earthlyBranch);
  });
  it('is ignored for the default placement school', () => {
    const a = buildChart('1990-06-15', 6, 'male', DEFAULT_SETTINGS);
    const b = buildChart('1990-06-15', 6, 'male', { ...DEFAULT_SETTINGS, astroType: 'human' });
    expect(ming(b).earthlyBranch).toBe(ming(a).earthlyBranch);
  });
});
