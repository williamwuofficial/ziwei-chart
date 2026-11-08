import { describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS, SIHUA_LABEL, SIHUA_TABLES, type SihuaTable } from '../src/engine/chart';
import { analyse } from '../src/analysis/evaluate';
import { toModel } from '../src/analysis/model';
import { readYears } from '../src/analysis/years';

const natal = (table: SihuaTable, script: 'zh-TW' | 'zh-CN' = 'zh-TW') => {
  const chart = buildChart('1990-06-15', 6, 'male', { ...DEFAULT_SETTINGS, sihua: table, script }); // 庚午 year
  const out: Record<string, string> = {};
  for (const p of chart.palaces) for (const s of [...p.majorStars, ...p.minorStars]) if (s.mutagen) out[s.mutagen] = s.name;
  return out;
};

describe('四化 tables for the disputed stems', () => {
  it('common: 庚 陽武陰同', () => expect(natal('common')).toEqual({ 祿: '太陽', 權: '武曲', 科: '太陰', 忌: '天同' }));
  it('中州派: 庚 陽武府同', () => expect(natal('zhongzhou')).toEqual({ 祿: '太陽', 權: '武曲', 科: '天府', 忌: '天同' }));
  it('北派: 庚 陽武同相', () => expect(natal('beipai')).toEqual({ 祿: '太陽', 權: '武曲', 科: '天同', 忌: '天相' }));
  it('天紀: 庚 陽武同陰', () => expect(natal('tianji')).toEqual({ 祿: '太陽', 權: '武曲', 科: '天同', 忌: '太陰' }));
  it('全書: 庚 as common, 壬 天府化科 (卷二 「壬梁紫府武宿是」)', () => {
    expect(natal('quanshu')).toEqual(natal('common'));
    const ren = (t: SihuaTable) => {
      const c = buildChart('1992-06-15', 6, 'male', { ...DEFAULT_SETTINGS, sihua: t }); // 壬申 year
      return c.palaces.flatMap((p) => [...p.majorStars, ...p.minorStars]).find((s) => s.mutagen === '科')?.name;
    };
    expect(ren('quanshu')).toBe('天府');
    expect(ren('common')).toBe('左輔');
  });
  it('overrides written in Traditional also work for a Simplified chart', () => {
    expect(natal('zhongzhou', 'zh-CN')).toEqual({ 禄: '太阳', 权: '武曲', 科: '天府', 忌: '天同' });
  });
  it('a table does not leak into the next chart', () => {
    natal('beipai');
    expect(natal('common').忌).toBe('天同');
  });

  it('decade 四化 follow the table (戊 decade: 中州派 uses 太陽化科)', () => {
    for (const [table, ke] of [['common', '右弼'], ['zhongzhou', '太陽']] as const) {
      const chart = buildChart('1990-06-15', 6, 'male', { ...DEFAULT_SETTINGS, sihua: table });
      const m = toModel(chart, 'male', 6, { overrides: SIHUA_TABLES[table] });
      const wu = m.palaces.find((p) => p.stem === '戊')!;
      expect(wu.decadeMut?.[2], table).toBe(ke);
    }
  });

  it('year 四化 follow the table (2030 is a 庚 year)', () => {
    const chart = buildChart('1990-06-15', 6, 'male', { ...DEFAULT_SETTINGS, sihua: 'beipai' });
    const m = toModel(chart, 'male', 6, { overrides: SIHUA_TABLES.beipai });
    const i = m.palaces.findIndex((p) => p.decade[0] === 36);
    const y2030 = readYears(m, i).find((y) => y.year === 2030)!;
    expect(y2030.findings.find((f) => f.id.endsWith('.mut.忌'))?.text).toContain('天相');
  });

  it('the overview names the table in its evidence', () => {
    const chart = buildChart('1990-06-15', 6, 'male', { ...DEFAULT_SETTINGS, sihua: 'zhongzhou' });
    const a = analyse(toModel(chart, 'male', 6, { overrides: SIHUA_TABLES.zhongzhou, label: SIHUA_LABEL.zhongzhou }));
    expect(a.overview.find((f) => f.id === 'sihua')?.evidence.join(' ')).toContain('中州派');
  });
});

// 倪海廈 天紀 worked cases (finalhopes.com blog/82, episode 14). One chart per case matching its
// stated year, gender, 局, 紫微 position and 命宮; see docs/CROSS-CHECK.md.
describe('倪海廈 cases decide his 庚 and 壬 tables', () => {
  const pal = (c: ReturnType<typeof buildChart>, name: string) => c.palaces.find((p) => p.name === name)!;
  const muts = (p: { majorStars: { name: string; mutagen?: string }[]; minorStars: { name: string; mutagen?: string }[] }) =>
    [...p.majorStars, ...p.minorStars].filter((s) => s.mutagen);

  it('14-2 (庚子 1960, 水二局): his 「太陰化忌」 needs the 天紀 table', () => {
    const at = (t: SihuaTable) => buildChart('1960-01-28', 6, 'male', { ...DEFAULT_SETTINGS, sihua: t, yearDivide: 'normal' });
    const c = at('tianji');
    expect(c.fiveElementsClass).toBe('水二局');
    expect(pal(c, '命宮').earthlyBranch).toBe('申');
    const ji = (x: ReturnType<typeof buildChart>) => x.palaces.flatMap(muts).find((s) => s.mutagen === '忌')?.name;
    expect(ji(c)).toBe('太陰');
    expect(ji(at('common'))).toBe('天同');
  });

  it('14-3 (壬午 1942, 金四局): his 夫妻 化科 with 日月 is 左輔, not the 全書 天府', () => {
    const at = (t: SihuaTable) => buildChart('1942-11-19', 8, 'female', { ...DEFAULT_SETTINGS, sihua: t, yearDivide: 'normal' });
    const c = at('tianji');
    expect(pal(c, '命宮').earthlyBranch).toBe('卯');
    const fq = pal(c, '夫妻');
    expect(fq.majorStars.map((s) => s.name)).toEqual(expect.arrayContaining(['太陽', '太陰']));
    expect(muts(fq).map((s) => s.name + s.mutagen)).toContain('左輔科');
    expect(muts(pal(at('quanshu'), '夫妻')).some((s) => s.mutagen === '科')).toBe(false);
  });
});
