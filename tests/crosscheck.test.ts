// Rules revised after cross-checking against the 全書's own 定局 definitions, the Renhuai123/ziwei-doushu
// pattern engine (MIT) and a public case list (mingli.study/famous). See docs/CROSS-CHECK.md.
import { describe, expect, it } from 'vitest';
import { evaluatePatterns } from '../src/analysis/evaluate';
import { BRANCHES, type Brightness, type ChartM, type Mut, type PalaceM, type PalaceName } from '../src/analysis/model';
import { Ctx } from '../src/analysis/predicates';
import { analyse } from '../src/analysis/evaluate';
import { toModel } from '../src/analysis/model';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';

type StarSpec = string | [name: string, brightness?: Brightness, mutagen?: Mut];
const NAMES: PalaceName[] = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母'];
const MAJORS = new Set(['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍']);
const MINORS = new Set(['左輔', '右弼', '文昌', '文曲', '天魁', '天鉞', '祿存', '天馬', '擎羊', '陀羅', '火星', '鈴星', '地空', '地劫']);
function mk(ming: string, stars: Record<string, StarSpec[]>, body = ming): ChartM {
  const mi = BRANCHES.indexOf(ming as (typeof BRANCHES)[number]);
  const bi = BRANCHES.indexOf(body as (typeof BRANCHES)[number]);
  const palaces: PalaceM[] = BRANCHES.map((branch, index) => {
    const specs = (stars[branch] ?? []).map((s) => (typeof s === 'string' ? [s] : s) as [string, Brightness?, Mut?]);
    const st = ([name, brightness, mutagen]: [string, Brightness?, Mut?]) => ({ name, brightness, mutagen });
    return {
      index, branch, stem: '甲', name: NAMES[(mi - index + 12) % 12],
      major: specs.filter(([n]) => MAJORS.has(n)).map(st), minor: specs.filter(([n]) => MINORS.has(n)).map(st),
      adjective: specs.filter(([n]) => !MAJORS.has(n) && !MINORS.has(n)).map(([n]) => n), isBody: index === bi, decade: [2, 11],
    };
  });
  return { palaces, gender: 'male', yearStem: '甲', yearBranch: '子', timeIndex: 6 };
}
const ids = (c: ChartM) => evaluatePatterns(new Ctx(c)).map((p) => p.id);

describe('revised against the 全書 定局 definitions', () => {
  it('君臣慶會 needs 左輔 and 右弼 in the Life palace with 紫微 (紫微左右同守命)', () => {
    expect(ids(mk('丑', { 丑: ['紫微', '破軍', '左輔', '右弼'] }))).toContain('ge.junchen-qinghui');
    expect(ids(mk('子', { 子: ['紫微', '文昌'], 辰: ['文曲'] }))).not.toContain('ge.junchen-qinghui');
  });
  it('輔弼拱主: 紫微 with 左右 in the 三方四正 or flanking', () => {
    expect(ids(mk('子', { 子: ['紫微'], 辰: ['左輔'], 申: ['右弼'] }))).toContain('ge.fubi-gongzhu');
    expect(ids(mk('子', { 子: ['紫微'], 亥: ['左輔'], 丑: ['右弼'] }))).toContain('ge.fubi-gongzhu');
  });
  it('府相朝垣 includes 天府 in the Life palace with 天相 in a trine', () => {
    expect(ids(mk('酉', { 酉: ['天府'], 丑: ['天相'] }))).toContain('ge.fuxiang-chaoyuan');
  });
  it('紫府朝垣 needs 紫微 and 天府 in different palaces', () => {
    expect(ids(mk('寅', { 寅: ['七殺'], 申: ['紫微', '天府'] }))).not.toContain('ge.zifu-chaoyuan');
    expect(ids(mk('寅', { 寅: ['武曲', '天相'], 午: ['紫微'], 戌: ['天府'] }))).toContain('ge.zifu-chaoyuan');
  });
  it('月生滄海 also forms with 太陰 in 子 as the Property palace (全書 form)', () => {
    // 命 at 酉 → 田宅 is 子 (palaces run counter-clockwise: 酉 命, 申 兄弟 … 子 田宅).
    expect(ids(mk('酉', { 子: ['太陰'] }))).toContain('ge.yuesheng-canghai');
  });
  it('馬頭帶劍 (全書): 天馬 with 擎羊 in the Life palace, not the 午 pattern', () => {
    expect(ids(mk('寅', { 寅: ['天馬', '擎羊'] }))).toContain('ge.matou-daijian-ma');
  });
  it('刑囚夾印 forms with 天刑 and 廉貞 in the Body palace', () => {
    expect(ids(mk('子', { 寅: ['廉貞', '天刑'] }, '寅'))).toContain('ge.xingqiu-jiayin');
  });
  it('財蔭夾印: 天相 flanked by 天梁 and a 祿 star', () => {
    expect(ids(mk('午', { 午: ['廉貞', '天相'], 未: ['天梁'], 巳: ['巨門', '祿存'] }))).toContain('ge.caiyin-jiayin');
    expect(ids(mk('午', { 午: ['廉貞', '天相'], 未: ['天梁', '祿存'], 巳: ['巨門'] }))).not.toContain('ge.caiyin-jiayin');
  });
  it('財印夾祿: 祿存 flanked by 武曲 and 天相', () => {
    expect(ids(mk('子', { 子: ['祿存'], 亥: ['武曲'], 丑: ['天相'] }))).toContain('ge.caiyin-jialu');
  });
  it('金輿扶駕: 紫微 flanked by 太陽 and 太陰', () => {
    expect(ids(mk('子', { 子: ['紫微'], 亥: ['太陽'], 丑: ['太陰'] }))).toContain('ge.jinyu-fujia');
  });
  it('生不逢時: 廉貞 with a void star in the Life palace', () => {
    expect(ids(mk('寅', { 寅: ['廉貞', '旬空'] }))).toContain('ge.sheng-bu-feng-shi');
  });
  it('殺破狼 structure whenever 七殺, 破軍 or 貪狼 holds the Life palace', () => {
    expect(ids(mk('子', { 子: ['破軍'] }))).toContain('st.sha-po-lang');
  });
  it('極居卯酉 is named whenever 紫貪 sit in 卯 or 酉', () => {
    expect(ids(mk('卯', { 卯: ['紫微', '貪狼', '右弼'] }))).toContain('ge.jiju-maoyou');
  });
});

describe('the 全書 literal 夾 definitions are structurally impossible (textual issue)', () => {
  it('天相 is never flanked by 武曲 and 天梁; 祿存 is never flanked by 天梁 and 天相', () => {
    let literalA = 0, literalB = 0;
    for (let w = 0; w < 120; w++) {
      const ds = new Date(Date.UTC(1950, 0, 3) + w * 86400000 * 113).toISOString().slice(0, 10);
      for (let t = 0; t < 12; t++) {
        const P = buildChart(ds, t, 'male', DEFAULT_SETTINGS).palaces;
        const has = (i: number, s: string) => [...P[(i + 12) % 12].majorStars, ...P[(i + 12) % 12].minorStars].some((x) => x.name === s);
        for (let i = 0; i < 12; i++) {
          const fl = (a: string, b: string) => (has(i - 1, a) && has(i + 1, b)) || (has(i - 1, b) && has(i + 1, a));
          if (has(i, '天相') && fl('武曲', '天梁')) literalA++;
          if (has(i, '祿存') && fl('天梁', '天相')) literalB++;
        }
      }
    }
    expect(literalA).toBe(0);
    expect(literalB).toBe(0);
  }, 60_000);
});

// Charts that reproduce the Life palace published for public figures on mingli.study/famous. The 時辰
// here is the one that reproduces that Life palace, not a claim about the person's real birth time.
const AGREE: [string, string, 'male' | 'female', number, string[]][] = [
  ['梅西', '1987-06-24', 'male', 3, ['ge.riyue-bingming', 'ge.rizhao-leimen', 'ge.yangliang-changlu']],
  ['曼德拉', '1918-07-18', 'male', 1, ['ge.caiyin-jiayin', 'ge.fuxiang-chaoyuan', 'ge.xingqiu-jiayin']],
  ['若望保祿二世', '1920-05-18', 'male', 11, ['ge.qisha-chaodou', 'st.sha-po-lang']],
  ['馬斯克', '1971-06-28', 'male', 3, ['ge.jiju-maoyou', 'st.sha-po-lang']],
  ['李連杰', '1963-04-26', 'male', 3, ['ge.zifu-tonggong', 'ge.fuxiang-chaoyuan']],
  ['雷軍', '1969-12-16', 'male', 3, ['ge.fuxiang-chaoyuan', 'ge.wu-zhengyao']],
  ['陳奕迅', '1974-07-27', 'male', 3, ['ge.fuxiang-chaoyuan', 'ge.sanqi-jiahui']],
  ['周杰倫', '1979-01-18', 'male', 3, ['ge.jiyue-tongliang']],
];
describe('agreement with an independent public case list', () => {
  it.each(AGREE)('%s', (_name, date, g, t, expected) => {
    const found = analyse(toModel(buildChart(date, t, g, DEFAULT_SETTINGS), g, t)).patterns.map((p) => p.id);
    for (const id of expected) expect(found).toContain(id);
  });
});
