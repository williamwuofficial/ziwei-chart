import { describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { toModel } from '../src/analysis/model';
import { Ctx } from '../src/analysis/predicates';
import { compare, elementRelation, LIMITS, starGroup, starHarmony, zodiacRelation } from '../src/analysis/compat';

const model = (d: string, t: number, g: 'male' | 'female') => toModel(buildChart(d, t, g, DEFAULT_SETTINGS), g, t);
const A = (c: ReturnType<typeof model>) => ({ c, who: 'You', whose: 'Your' });
const B = (c: ReturnType<typeof model>) => ({ c, who: 'Your partner', whose: 'Your partner’s' });

describe('五行 relations', () => {
  it('same, feeding (相生) and checking (相剋)', () => {
    expect(elementRelation('木', '木')).toBe('same');
    expect(elementRelation('木', '火')).toBe('feeds');
    expect(elementRelation('火', '木')).toBe('feeds');
    expect(elementRelation('水', '火')).toBe('checks');
    expect(elementRelation('金', '木')).toBe('checks');
  });
  it('star harmony by the 全書 elements', () => {
    expect(starHarmony(['紫微'], ['天府']).tone).toBe('match'); // 土 土
    expect(starHarmony(['太陽'], ['天同']).tone).toBe('differs'); // 火 水
    expect(starHarmony(['天機', '太陽'], ['天同']).tone).toBe('partial'); // 水生木, 水剋火
    expect(starHarmony([], ['天同']).tone).toBe('none');
  });
});

describe('生肖 relations', () => {
  it('三合, 六合, 六沖, 六害, 刑', () => {
    expect(zodiacRelation('申', '子').good).toContain('三合 (same trine)');
    expect(zodiacRelation('子', '丑').good).toContain('六合 (paired)');
    expect(zodiacRelation('子', '午').bad).toContain('六沖 (opposite signs clash)');
    expect(zodiacRelation('子', '未').bad).toContain('六害 (harm)');
    expect(zodiacRelation('子', '卯').bad).toContain('相刑 (punishment)');
    expect(zodiacRelation('辰', '辰').bad).toContain('自刑 (self-punishment, same sign)');
    expect(zodiacRelation('子', '子')).toEqual({ good: [], bad: [] });
    expect(zodiacRelation('子', '寅')).toEqual({ good: [], bad: [] });
  });
});

describe('star groups (集成全書)', () => {
  it('殺破狼 always meet in one 三方, so any 三方 with one of them is that group (an empty palace may borrow just one)', () => {
    for (const d of ['1955-03-07', '1958-06-27', '1960-01-28', '1942-11-19', '1990-05-05'])
      for (let t = 0; t < 12; t++) {
        const x = new Ctx(model(d, t, 'male'));
        for (let i = 0; i < 12; i++) {
          const g = starGroup(x, i);
          if (g.stars.some((s) => ['七殺', '破軍', '貪狼'].includes(s))) {
            expect(g.group.endsWith('殺破狼')).toBe(true);
          }
        }
      }
  });
  it('倪 case 4 (1958-06-27 亥時 male): 天梁 in 命 at 未, 機月同梁 or 巨日 rather than 殺破狼', () => {
    const x = new Ctx(model('1958-06-27', 11, 'male'));
    expect(starGroup(x, x.ming).group.endsWith('殺破狼')).toBe(false);
  });
});

describe('compare', () => {
  const a = model('1955-03-07', 8, 'female');
  const b = model('1958-06-27', 11, 'male');
  it('gives the layers in order, with the zodiac last and marked folk', () => {
    const r = compare(A(a), B(b), 2026);
    expect(r.sections.map((s) => s.id)).toEqual(['compat.ming', 'compat.groups', 'compat.ju', 'compat.periods', 'compat.zodiac']);
    expect(r.sections.at(-1)!.basis).toBe('folk');
    expect(r.sections.slice(0, -1).every((s) => s.basis === 'modern')).toBe(true);
    expect(r.limits).toBe(LIMITS);
  });
  it('is symmetric in tone when the two people are swapped', () => {
    const ab = compare(A(a), B(b), 2026).sections.map((s) => s.tone);
    const ba = compare(A(b), B(a), 2026).sections.map((s) => s.tone);
    expect(ba).toEqual(ab);
  });
  it('未 (Goat) and 戌 (Dog) years: 相刑', () => {
    const z = compare(A(a), B(b), 2026).sections.find((s) => s.id === 'compat.zodiac')!;
    expect(a.yearBranch + b.yearBranch).toBe('未戌');
    expect(z.tone).toBe('differs');
  });
  it('finds 互垣 when it exists and says so', () => {
    const charts = ['1950', '1962', '1971', '1984', '1993'].flatMap((y) => [0, 3, 6, 9].map((t) => model(`${y}-0${(t % 9) + 1}-15`, t, t % 2 ? 'male' : 'female')));
    let found = 0;
    for (const p of charts)
      for (const q of charts) {
        const g = compare(A(p), B(q), 2026).sections.find((s) => s.id === 'compat.groups')!;
        if (g.tone === 'match') {
          found++;
          expect(g.findings.find((f) => f.id === 'compat.huyuan')!.text).toContain('互垣');
        }
      }
    expect(found).toBeGreaterThan(0);
  });
  it('every finding cites a source and no text is left with a placeholder', () => {
    for (const s of compare(A(a), B(b), 2026).sections)
      for (const f of s.findings) {
        expect(f.sources.length).toBeGreaterThan(0);
        expect(f.text).not.toMatch(/undefined|You’s|\$\{/);
      }
  });
});
