// Published worked charts from other teachers, used to check placement and to calibrate palace tone.
// kunde.org.tw 「淑真的廉貞故事」 (農曆68年5月26日辰時, 陰女) prints a full chart; 范振木's 論命實務一 (fjm.tw)
// judges several palaces. Both cases are anonymous in their sources.
import { describe, expect, it } from 'vitest';
import { astro } from 'iztro';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { analyse } from '../src/analysis/evaluate';
import { toModel } from '../src/analysis/model';

type A = ReturnType<typeof astro.bySolar>;

describe('kunde.org.tw printed chart (農曆68年5月26日辰時, 陰女)', () => {
  const a = astro.withOptions({ type: 'lunar', dateStr: '1979-5-26', timeIndex: 4, gender: 'female', language: 'zh-TW' }) as A;
  // Their printout, palace by branch: stars with brightness as printed (祿存 brightness and the second
  // 旬空 are conventions iztro does not follow; iztro also adds 年解, 天德 and 月德).
  const K: Record<string, string> = {
    巳: '天同廟 天姚 天馬 陀羅陷 天巫 八座 天壽', 午: '武曲旺 天府旺 文昌陷 右弼 陰煞 祿存 封誥 恩光',
    未: '太陽得 太陰不 地空 天月 擎羊廟 天傷 華蓋', 申: '貪狼平 文曲得 左輔 天鉞 紅鸞 天廚 截路 孤辰 天空 天貴',
    辰: '破軍旺 寡宿', 酉: '天機旺 巨門廟 天使 天官 空亡 三台 天才', 卯: '地劫 鳳閣 蜚廉', 戌: '紫微得 天相得 台輔',
    寅: '廉貞廟 鈴星廟 天喜 天福', 丑: '火星得 天刑 天虛 破碎 旬空', 子: '七殺旺 天魁 解神 咸池', 亥: '天梁陷 天哭 龍池',
  };
  it.each(Object.entries(K))('palace %s matches the printout', (branch, list) => {
    const p = a.palaces.find((x) => x.earthlyBranch === branch)!;
    const ours = new Map<string, string>([...p.majorStars, ...p.minorStars, ...p.adjectiveStars].map((s) => [s.name, s.brightness || '']));
    for (const tok of list.split(' ')) {
      const [, name, b] = tok.match(/^(.+?)(廟|旺|得|利|平|不|陷)?$/)!;
      expect(ours.has(name), `${branch}: ${name}`).toBe(true);
      if (b) expect(ours.get(name), `${branch}: ${name} brightness`).toBe(b);
    }
  });
  it('matches the header: 火六局, 命主 祿存, 身主 天相, Body palace in 財帛', () => {
    expect([a.fiveElementsClass, a.soul, a.body, a.palaces.find((p) => p.isBodyPalace)!.name]).toEqual(['火六局', '祿存', '天相', '財帛']);
  });
});

describe('palace tone against published ratings', () => {
  const rank = { supported: 1, mixed: 0, pressured: -1, neutral: 0 } as const;
  const want = { good: 1, mixed: 0, bad: -1 } as const;
  const cases: [string, number, 'male' | 'female', Record<string, keyof typeof want>][] = [
    ['1979-06-20', 4, 'female', { 田宅: 'good', 官祿: 'good', 疾厄: 'good', 財帛: 'good', 父母: 'bad', 僕役: 'bad', 子女: 'bad', 兄弟: 'bad', 命宮: 'mixed', 福德: 'mixed', 遷移: 'mixed', 夫妻: 'mixed' }],
    ['1966-08-17', 10, 'female', { 疾厄: 'bad', 遷移: 'bad', 田宅: 'bad', 兄弟: 'bad', 財帛: 'bad', 官祿: 'good', 子女: 'mixed', 福德: 'mixed' }],
  ];
  it('matches at least half exactly and never calls a palace the opposite', () => {
    let exact = 0, opposite = 0, total = 0;
    for (const [d, t, g, exp] of cases) {
      for (const p of analyse(toModel(buildChart(d, t, g, DEFAULT_SETTINGS), g, t)).palaces) {
        const w = exp[p.name];
        if (!w) continue;
        total++;
        const ours = rank[p.tone];
        if (ours === want[w]) exact++;
        if (ours * want[w] === -1) opposite++;
      }
    }
    expect(opposite).toBe(0);
    expect(exact).toBeGreaterThanOrEqual(total / 2);
  });
});

describe('范振木 cases with no birth data are reproducible', () => {
  it('論命實務十一: 太陰化祿 in 辰, Body palace in an empty 夫妻 with 截路, periods 甲辰 → 癸丑', () => {
    const a = astro.withOptions({ dateStr: '1967-03-15', timeIndex: 11, gender: 'male', language: 'zh-TW' }) as A;
    const ming = a.palaces.find((p) => p.name === '命宮')!;
    expect(ming.earthlyBranch).toBe('辰');
    expect(ming.majorStars.map((s) => s.name + (s.mutagen ?? ''))).toEqual(['太陰祿']);
    const body = a.palaces.find((p) => p.isBodyPalace)!;
    expect(body.name).toBe('夫妻');
    expect(body.majorStars).toHaveLength(0);
    expect(body.adjectiveStars.map((s) => s.name)).toContain('截路');
    const order = [...a.palaces].sort((x, y) => x.decadal.range[0] - y.decadal.range[0]).slice(0, 4).map((p) => p.heavenlyStem + p.earthlyBranch);
    expect(order).toEqual(['甲辰', '癸卯', '壬寅', '癸丑']);
  });
});
