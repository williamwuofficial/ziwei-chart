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
