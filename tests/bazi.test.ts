import { describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { baziCompat, branchRelation, HIDDEN, parsePillars, readBazi, stemRelation, tenGod } from '../src/analysis/bazi';

const pillars = (d: string, t: number, dayDivide: 'forward' | 'current' = 'forward') =>
  parsePillars(buildChart(d, t, 'male', { ...DEFAULT_SETTINGS, yearDivide: 'exact', dayDivide }).chineseDate);
const str = (p: ReturnType<typeof pillars>) => [p.year, p.month, p.day, p.hour].map((x) => x.stem + x.branch).join(' ');

describe('pillars', () => {
  it('2000-01-01 noon: 己卯 丙子 戊午 戊午', () => expect(str(pillars('2000-01-01', 6))).toBe('己卯 丙子 戊午 戊午'));
  it('year and month change at 立春 (2024-02-04), not Lunar New Year (2024-02-10)', () => {
    expect(str(pillars('2024-02-03', 6)).slice(0, 5)).toBe('癸卯 乙丑');
    expect(str(pillars('2024-02-05', 6)).slice(0, 5)).toBe('甲辰 丙寅');
  });
  it('month changes at 驚蟄 (2024-03-05)', () => {
    expect(pillars('2024-03-04', 6).month).toEqual({ stem: '丙', branch: '寅' });
    expect(pillars('2024-03-06', 6).month).toEqual({ stem: '丁', branch: '卯' });
  });
  it('late 子 hour follows the setting', () => {
    expect(pillars('2000-01-01', 12, 'forward').day.stem + pillars('2000-01-01', 12, 'forward').day.branch).toBe('己未');
    expect(pillars('2000-01-01', 12, 'current').day.stem + pillars('2000-01-01', 12, 'current').day.branch).toBe('戊午');
  });
});

describe('Ten Gods match the 淵海子平 table', () => {
  it('甲 day', () => {
    expect([...'甲乙丙丁戊己庚辛壬癸'].map((s) => tenGod('甲', s))).toEqual(['比肩', '劫財', '食神', '傷官', '偏財', '正財', '七殺', '正官', '偏印', '正印']);
  });
  it('乙 day', () => {
    expect([...'甲乙丙丁戊己庚辛壬癸'].map((s) => tenGod('乙', s))).toEqual(['劫財', '比肩', '傷官', '食神', '正財', '偏財', '正官', '七殺', '正印', '偏印']);
  });
  it('hidden stems: every branch, main qi first, matching its element', () => {
    expect(Object.keys(HIDDEN).length).toBe(12);
    expect(HIDDEN['寅'][0]).toBe('甲');
    expect(HIDDEN['丑']).toEqual(['己', '癸', '辛']);
  });
});

describe('readBazi', () => {
  const r = readBazi(pillars('2000-01-01', 6), 'male');
  it('counts eight characters', () => expect(Object.values(r.counts).reduce((a, b) => a + b)).toBe(8));
  it('has the Day Master, elements, Ten Gods and spouse findings, all cited', () => {
    expect(r.findings.map((f) => f.id)).toEqual(['bazi.daymaster', 'bazi.elements', 'bazi.cycle', 'bazi.tengods', 'bazi.spouse']);
    for (const f of r.findings) expect(f.sources.length).toBeGreaterThan(0);
    expect(r.findings[0].text).toContain('⟨戊⟩');
  });
  it('spouse star: 正財 for a man, 正官 for a woman', () => {
    expect(r.findings.find((f) => f.id === 'bazi.spouse')!.text).toContain('⟨正財⟩');
    expect(readBazi(pillars('2000-01-01', 6), 'female').findings.find((f) => f.id === 'bazi.spouse')!.text).toContain('⟨正官⟩');
  });
});

describe('element roles', () => {
  it('from an Earth Day Master: Metal output, Water wealth, Wood officer, Fire resource', async () => {
    const { elementRole } = await import('../src/analysis/bazi');
    expect(['土', '金', '水', '木', '火'].map((e) => elementRole('土', e as never))).toEqual(['self', 'output', 'wealth', 'officer', 'resource']);
  });
});

describe('八字 matching', () => {
  it('stem combinations and clashes', () => {
    expect(stemRelation('甲', '己')).toMatchObject({ kind: 'he', name: '中正之合' });
    expect(stemRelation('癸', '戊')).toMatchObject({ kind: 'he', name: '無情之合' });
    expect(stemRelation('甲', '庚').kind).toBe('clash');
    expect(stemRelation('甲', '乙').kind).toBe('none');
  });
  it('branch relations', () => {
    expect(branchRelation('子', '午').kinds).toEqual(['六沖']);
    expect(branchRelation('寅', '巳').kinds.sort()).toEqual(['六害', '刑'].sort());
  });
  it('is symmetric', () => {
    const a = pillars('1955-03-07', 8);
    const b = pillars('1958-06-27', 11);
    const ab = baziCompat(a, b);
    const ba = baziCompat(b, a);
    expect([ab.good, ab.bad]).toEqual([ba.good, ba.bad]);
  });
});
