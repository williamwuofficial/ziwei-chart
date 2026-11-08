// Cases published by 范振木 (占驗派) on fjm.tw, re-run to check chart placement and readings.
// Birth dates are lunar as published; 論命實務一 is anonymous in the source.
import { describe, expect, it } from 'vitest';
import { astro } from 'iztro';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { analyse } from '../src/analysis/evaluate';
import { toModel } from '../src/analysis/model';

type A = ReturnType<typeof astro.bySolar>;
const lunar = (d: string, t: number, g: 'male' | 'female') => astro.withOptions({ type: 'lunar', dateStr: d, timeIndex: t, gender: g, language: 'zh-TW' }) as A;
const stars = (c: A, name: string) => {
  const p = c.palaces.find((x) => x.name === name)!;
  return [...p.majorStars, ...p.minorStars].map((s) => s.name + (s.mutagen ?? ''));
};
const analysed = (d: string, t: number, g: 'male' | 'female') => {
  const solar = lunar(d, t, g).solarDate;
  return analyse(toModel(buildChart(solar, t, g, DEFAULT_SETTINGS), g, t));
};

describe('地空/地劫 placement matches 范振木’s table for all 12 時辰', () => {
  const T: [number, string, string][] = [[0, '亥', '亥'], [1, '子', '戌'], [2, '丑', '酉'], [3, '寅', '申'], [4, '卯', '未'], [5, '辰', '午'], [6, '巳', '巳'], [7, '午', '辰'], [8, '未', '卯'], [9, '申', '寅'], [10, '酉', '丑'], [11, '戌', '子']];
  it.each(T)('時辰 %i: 地劫 %s, 地空 %s', (t, jie, kong) => {
    const c = astro.withOptions({ dateStr: '1990-6-15', timeIndex: t, gender: 'male', language: 'zh-TW' }) as A;
    const at = (n: string) => c.palaces.find((p) => p.minorStars.some((s) => s.name === n))!.earthlyBranch;
    expect([at('地劫'), at('地空')]).toEqual([jie, kong]);
  });
});

describe('論命實務一 (女命, 民國55年農曆7月2日戌時)', () => {
  const c = lunar('1966-7-2', 10, 'female');
  it('reproduces the published palaces', () => {
    expect(stars(c, '命宮')).toEqual(expect.arrayContaining(['太陽', '左輔']));
    expect(stars(c, '疾厄')).toEqual(expect.arrayContaining(['廉貞忌', '貪狼', '祿存']));
    expect(stars(c, '財帛')).toEqual(expect.arrayContaining(['巨門', '擎羊']));
    expect(c.palaces.find((p) => p.isBodyPalace)!.name).toBe('財帛');
    expect(stars(c, '福德')).toEqual(expect.arrayContaining(['天機權', '文昌科']));
    expect(stars(c, '夫妻')).toEqual(expect.arrayContaining(['天同祿', '天梁', '天馬']));
  });
  it('finds the features 范振木 names', () => {
    const a = analysed('1966-7-2', 10, 'female');
    const ids = a.patterns.map((p) => p.id);
    expect(ids).toEqual(expect.arrayContaining(['ge.guixing-jiaming', 'ge.riyue-canghui', 'st.yi-gen-huan-ye']));
    const notes = (name: string) => a.palaces.find((p) => p.name === name)!.findings.map((f) => f.id.split('.').slice(2).join('.'));
    expect(notes('疾厄')).toEqual(expect.arrayContaining(['yangtuo', 'kongjie'])); // 羊陀夾忌, 空劫拱疾厄
    expect(notes('官祿')).toContain('flank.good'); // 紫府夾官祿
    expect(notes('田宅')).toContain('flank.good'); // 昌曲夾田宅
    expect(notes('福德')).toContain('flank.huoling'); // 火鈴夾福德
  });
});

describe('李小龍 (民國29年農曆11月26日亥時)', () => {
  it('Life palace holds 火星 and 天魁, Body palace 天梁 in 夫妻 flanked by 空劫', () => {
    const c = lunar('1940-11-26', 11, 'male');
    expect(stars(c, '命宮')).toEqual(expect.arrayContaining(['火星', '天魁']));
    const body = c.palaces.find((p) => p.isBodyPalace)!;
    expect(body.name).toBe('夫妻');
    const a = analysed('1940-11-26', 11, 'male');
    expect(a.patterns.map((p) => p.id)).toEqual(expect.arrayContaining(['ge.guixing-jiaming', 'ge.tianyi-gongming']));
    expect(a.palaces.find((p) => p.name === '夫妻')!.findings.some((f) => f.id.endsWith('.kongjie'))).toBe(true);
  });
});

describe('吳火獅 (民國7年農曆12月8日申時)', () => {
  it('紫殺 with 祿存 in a 巳 Life palace; 雙祿 reach it', () => {
    const c = lunar('1918-12-8', 8, 'male');
    expect(ming(c)).toBe('巳');
    expect(stars(c, '命宮')).toEqual(expect.arrayContaining(['紫微', '七殺', '祿存']));
    expect(analysed('1918-12-8', 8, 'male').patterns.map((p) => p.id)).toEqual(expect.arrayContaining(['ge.shuanglu-chaoyuan', 'st.sha-po-lang']));
  });
});
const ming = (c: A) => c.palaces.find((p) => p.name === '命宮')!.earthlyBranch;

describe('天馬 placement: by year (全書) or by month (占驗派, as 范振木 uses)', () => {
  const where = (c: ReturnType<typeof buildChart>) => c.palaces.find((p) => p.minorStars.some((s) => s.name === '天馬'))!;
  it('論命實務一: by month 天馬 sits in 寅, opposite the 申 palace (「對宮有天馬」)', () => {
    const solar = lunar('1966-7-2', 10, 'female').solarDate;
    expect(where(buildChart(solar, 10, 'female', DEFAULT_SETTINGS)).earthlyBranch).toBe('申'); // 全書: 午年 → 申
    expect(where(buildChart(solar, 10, 'female', { ...DEFAULT_SETTINGS, tianma: 'month' })).earthlyBranch).toBe('寅'); // 七月 → 寅
  });
  it('論命實務十 (found by search: lunar 1965 冬月, 巳時): by month 天馬 is in 疾厄, as published', () => {
    const c = buildChart('1965-12-05', 5, 'female', { ...DEFAULT_SETTINGS, tianma: 'month' });
    const p = where(c);
    expect(p.name).toBe('疾厄');
    expect(p.minorStars.map((s) => s.name)).toEqual(expect.arrayContaining(['陀羅', '左輔', '天馬']));
  });
});
