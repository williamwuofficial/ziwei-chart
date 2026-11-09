// 倪海廈 天紀 lecture 9: the two worked cases published with a birth date (students' notes,
// 「天紀--紫微斗數聽課筆記」 2022 edition). Both are anonymous in the source. The notes' palace-by-palace
// description is checked against our placement, with the default settings.
import { describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { toModel } from '../src/analysis/model';
import { readDecades } from '../src/analysis/decades';

const model = (d: string, t: number, g: 'male' | 'female') => toModel(buildChart(d, t, g, DEFAULT_SETTINGS), g, t);
type M = ReturnType<typeof model>;
const pal = (m: M, name: string) => m.palaces.find((p) => p.name === name)!;
const majors = (m: M, name: string) => pal(m, name).major.map((s) => s.name);
const all = (m: M, name: string) => [...pal(m, name).major, ...pal(m, name).minor].map((s) => s.name + (s.mutagen ? `化${s.mutagen}` : ''));

describe('命例實批2: 民國44年二月十四日申時 (1955-03-07), 陰女, 木三局', () => {
  const m = model('1955-03-07', 8, 'female');
  it('命宮 at 未, empty but for 地劫 (「命宮無主，地劫單星」)', () => {
    expect(pal(m, '命宮').branch).toBe('未');
    expect(majors(m, '命宮')).toEqual([]);
    expect(all(m, '命宮')).toContain('地劫');
  });
  it('the palaces he names', () => {
    expect(majors(m, '夫妻').sort()).toEqual(['七殺', '紫微'].sort()); // 紫微七殺: 先生是老板
    expect(majors(m, '福德').sort()).toEqual(['廉貞', '破軍'].sort()); // 廉破在內
    expect(majors(m, '遷移').sort()).toEqual(['武曲', '貪狼'].sort()); // 武曲貪狼
    expect(all(m, '財帛')).toEqual(expect.arrayContaining(['天相', '祿存', '地空'])); // 天相陷、祿存、地空
    expect(majors(m, '官祿')).toEqual(['天府']); // 府相會命
    expect(all(m, '僕役')).toContain('太陰化忌'); // 朋友化忌
    expect(all(m, '子女')).toEqual(expect.arrayContaining(['天梁化權', '天機化祿'])); // 天梁化權, 天機
    expect(all(m, '兄弟')).toContain('鈴星'); // 鈴星入廟
    expect(pal(m, '父母').adjective).toContain('紅鸞'); // 紅鸞星在父母宮
  });
  it('13–22 runs through 父母, where 紅鸞 sits (「青年時奉父母之命成婚」)', () => {
    const d = readDecades(m).find((x) => x.range[0] === 13)!;
    expect(d.natalPalace).toBe('父母');
  });
});

describe('命例實批4: 1958-06-27, 陽男, 火六局, 命宮在未, 紫微在寅 (亥時 is the only hour that fits)', () => {
  const m = model('1958-06-27', 11, 'male');
  it('天梁 in 命, 天機化忌 clashing from 遷移, 日月反背', () => {
    expect(pal(m, '命宮').branch).toBe('未');
    expect(majors(m, '命宮')).toEqual(['天梁']);
    expect(all(m, '遷移')).toContain('天機化忌');
    expect(all(m, '命宮').concat(all(m, '遷移'))).toEqual(expect.arrayContaining(['天鉞', '天魁'])); // 鉞魁相會
    const sun = m.palaces.find((p) => p.major.some((s) => s.name === '太陽'))!.major.find((s) => s.name === '太陽')!;
    const moon = m.palaces.find((p) => p.major.some((s) => s.name === '太陰'))!.major.find((s) => s.name === '太陰')!;
    expect([sun.brightness, moon.brightness]).toEqual(['陷', '陷']);
  });
  it('財帛 has 權 but no 祿; 子女 貪狼化祿; 紫府 at 寅', () => {
    expect(all(m, '財帛')).toContain('太陰化權');
    expect(all(m, '財帛').some((s) => s.endsWith('化祿') || s === '祿存')).toBe(false);
    expect(all(m, '子女')).toContain('貪狼化祿');
    const zf = m.palaces.find((p) => p.branch === '寅')!;
    expect(zf.major.map((s) => s.name).sort()).toEqual(['天府', '紫微'].sort());
  });
  it('his four decades: 父母 七殺 天馬, 福德 天同, 田宅 武曲 地劫, 官祿 太陽陷', () => {
    const ds = readDecades(m);
    const at = (a: number) => ds.find((d) => d.range[0] === a)!.natalPalace;
    expect([at(16), at(26), at(36), at(46)]).toEqual(['父母', '福德', '田宅', '官祿']);
    expect(all(m, '父母')).toEqual(expect.arrayContaining(['七殺', '左輔']));
    expect(pal(m, '父母').minor.map((s) => s.name).concat(pal(m, '父母').adjective)).toContain('天馬');
    expect(majors(m, '福德')).toEqual(['天同']);
    expect(all(m, '田宅')).toEqual(expect.arrayContaining(['武曲', '地劫']));
    expect(majors(m, '官祿')).toEqual(['太陽']);
  });
});
