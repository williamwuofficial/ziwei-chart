import { describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { analyse } from '../src/analysis/evaluate';
import { toModel } from '../src/analysis/model';
import { readDecades } from '../src/analysis/decades';
import { readYears } from '../src/analysis/years';
import { MAJOR_ORDER } from '../src/analysis/rules/stars';
import { BRANCH_ANIMAL, BRANCH_ORDER, CLASH_QUOTE, clashBranch, OWN_YEAR_QUOTE, STAR_ELEMENT } from '../src/analysis/rules/elements';
import sources from './fixtures/sources.json';

const verified = new Set((sources as { verse: string }[]).map((s) => s.verse));

describe('star elements (全書)', () => {
  it('every main star has an element with a verified 全書 line', () => {
    for (const s of MAJOR_ORDER) {
      const e = STAR_ELEMENT[s];
      expect(e, s).toBeDefined();
      expect(verified.has(e.src.verse!), e.src.verse).toBe(true);
      expect(e.src.verse).toContain(`屬${e.el}`);
    }
  });
  it('zodiac quotes are verified', () => {
    for (const q of [...Object.values(CLASH_QUOTE), ...Object.values(OWN_YEAR_QUOTE)]) expect(verified.has(q!.verse!), q!.verse).toBe(true);
  });
});

describe('zodiac', () => {
  it('maps 12 branches to 12 animals and clashes are mutual', () => {
    expect(Object.keys(BRANCH_ANIMAL).sort()).toEqual([...BRANCH_ORDER].sort());
    for (const b of BRANCH_ORDER) expect(clashBranch(clashBranch(b))).toBe(b);
    expect(clashBranch('子')).toBe('午');
  });

  // 1990-06-15 is a 庚午 (Horse) year.
  const m = toModel(buildChart('1990-06-15', 6, 'male', DEFAULT_SETTINGS), 'male', 6);
  it('the overview names the zodiac, element class and its colour', () => {
    const f = analyse(m).overview.find((x) => x.id === 'elements')!;
    expect(f.text).toContain('午 (馬 Horse)');
    expect(f.text).toContain(m.ju);
    expect(f.text).toMatch(/cultural background/);
  });
  it('本命年 and clash years are noted exactly on 午 and 子 years, without changing the rating', () => {
    for (const d of readDecades(m))
      for (const y of readYears(m, d.index)) {
        const own = y.findings.some((f) => f.id.endsWith('.zodiac.own'));
        const clash = y.findings.some((f) => f.id.endsWith('.zodiac.clash'));
        expect(own, `${y.year}`).toBe(y.branch === '午');
        expect(clash, `${y.year}`).toBe(y.branch === '子');
      }
    const y2020 = readYears(m, readDecades(m).find((d) => d.range[0] <= 31 && 31 <= d.range[1])!.index).find((y) => y.year === 2020)!;
    expect(y2020.scoreParts.join(' ')).not.toMatch(/沖|zodiac/);
  });
});
