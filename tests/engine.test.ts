import { describe, expect, it } from 'vitest';
import { astro } from 'iztro';

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
