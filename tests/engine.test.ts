import { describe, expect, it } from 'vitest';
import { astro } from 'iztro';
import { buildChart, decadeOverlay, DEFAULT_SETTINGS } from '../src/engine/chart';

// Anchors for the default (全書) tables the analysis will rely on. If an iztro upgrade changes
// these, the rule database needs reviewing, so fail loudly.
describe('iztro default tables', () => {
  it('庚 year uses 陽武陰同 for 祿權科忌', () => {
    const chart = astro.bySolar('1990-6-15', 6, 'male', true, 'zh-TW'); // 庚午 year
    const byMutagen = new Map<string, string>();
    for (const p of chart.palaces) for (const s of [...p.majorStars, ...p.minorStars]) if (s.mutagen) byMutagen.set(s.mutagen, s.name);
    expect(byMutagen.get('祿')).toBe('太陽');
    expect(byMutagen.get('權')).toBe('武曲');
    expect(byMutagen.get('科')).toBe('太陰');
    expect(byMutagen.get('忌')).toBe('天同');
  });

  it('places the sample chart consistently', () => {
    const chart = astro.bySolar('1990-6-15', 6, 'male', true, 'zh-TW');
    const ming = chart.palaces.find((p) => p.name === '命宮')!;
    expect(ming.heavenlyStem + ming.earthlyBranch).toBe('戊子');
    expect(ming.majorStars.map((s) => s.name)).toEqual(['武曲', '天府']);
    expect(chart.fiveElementsClass).toBe('火六局');
  });
});

describe('late 子 hour handling', () => {
  const sig = (dateStr: string, timeIndex: number, dayDivide: 'forward' | 'current') =>
    buildChart(dateStr, timeIndex, 'male', { ...DEFAULT_SETTINGS, dayDivide })
      .palaces.map((p) => [...p.majorStars, ...p.minorStars, ...p.adjectiveStars].map((s) => s.name).join(''))
      .join('|');
  it("'forward' places stars as the next day's early 子", () => {
    expect(sig('1990-06-15', 12, 'forward')).toBe(sig('1990-06-16', 0, 'forward'));
  });
  it("'current' places stars as the same day's early 子", () => {
    expect(sig('1990-06-15', 12, 'current')).toBe(sig('1990-06-15', 0, 'current'));
  });
});

describe('decade overlay', () => {
  it('uses the decade palace stem for its 四化 (戊: 貪陰弼機)', () => {
    const chart = buildChart('1990-06-15', 6, 'male', DEFAULT_SETTINGS);
    const idx = chart.palaces.findIndex((p) => p.decadal.range[0] === 26);
    const d = decadeOverlay(chart, idx, 6);
    expect(d.stem).toBe('戊');
    expect([...d.mutagens.entries()]).toEqual([['貪狼', 'lu'], ['太陰', 'quan'], ['右弼', 'ke'], ['天機', 'ji']]);
    expect(d.palaceNames[idx]).toBe('命宮');
  });
});
