import VERSES_RAW from './fixtures/verses.txt?raw';
import SOURCES_JSON from './fixtures/sources.json';
import * as OpenCC from 'opencc-js';
import T2S from '../src/i18n/t2s.json';
import { ZH } from '../src/i18n/zh';
import { GLOSSARY } from '../src/i18n/glossary';
import * as STARS from '../src/analysis/rules/stars';
import { describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { analyse, evaluatePatterns } from '../src/analysis/evaluate';
import { BRANCHES, toModel, type Brightness, type ChartM, type Mut, type PalaceM, type PalaceName } from '../src/analysis/model';
import { anhe, Ctx, sfsz } from '../src/analysis/predicates';
import { ALL_PATTERNS } from '../src/analysis/rules/patterns';

const VERSES = new Set(VERSES_RAW.split('\n').filter(Boolean));
const SOURCES = new Set((SOURCES_JSON as { verse: string; work: string; section: string }[]).map((s) => `${s.verse}|${s.work}|${s.section}`));

describe('rule metadata (requirement: every statement is sourced)', () => {
  it('every pattern has a source with a basis', () => {
    for (const r of ALL_PATTERNS) {
      expect(r.sources.length, r.id).toBeGreaterThan(0);
      for (const s of r.sources) expect(s.basis.length, r.id).toBeGreaterThan(10);
    }
  });
  it('ids are unique', () => {
    expect(new Set(ALL_PATTERNS.map((r) => r.id)).size).toBe(ALL_PATTERNS.length);
  });
  it('every quoted verse is verified: against its work (sources.json) or, if unattributed, the catalogue (verses.txt)', () => {
    const all = [
      ...ALL_PATTERNS.flatMap((r) => r.sources.map((s) => [r.id, s] as const)),
      ...Object.values(STARS.MAJOR_QUOTE).map((s) => ['major', s] as const),
      ...Object.values(STARS.PAIR_QUOTE).map((s) => ['pair', s] as const),
      ...Object.values(STARS.MINOR_QUOTE).map((s) => ['minor', s] as const),
      ...Object.values(STARS.MUT_QUOTE).map((s) => ['mut', s] as const),
      ['body', STARS.BODY_QUOTE] as const,
    ];
    for (const [id, s] of all) {
      if (!s.verse) continue;
      if (s.work) expect(SOURCES.has(`${s.verse}|${s.work}|${s.section}`), `${id}: ${s.verse} (run npm run verify-sources)`).toBe(true);
      else expect(VERSES.has(s.verse), `${id}: ${s.verse}`).toBe(true);
    }
  });
  it('every main star nature, transformation and minor star quotes the original text', () => {
    for (const star of Object.keys(STARS.MAJOR_NATURE)) expect(STARS.MAJOR_QUOTE[star]?.work, star).toBe('紫微斗數全書');
    for (const star of Object.keys(STARS.MINOR_NATURE)) expect(STARS.MINOR_QUOTE[star]?.work, star).toBe('紫微斗數全書');
    for (const m of ['祿', '權', '科', '忌'] as const) expect(STARS.MUT_QUOTE[m].work).toBe('紫微斗數全書');
  });
});

describe('palace geometry', () => {
  it('三方四正 of 子 (index 10) is 子 辰 申 午', () => {
    expect(sfsz(10).map((i) => BRANCHES[i])).toEqual(['子', '辰', '申', '午']);
  });
  it('暗合 pairs follow 六合', () => {
    const pairs = BRANCHES.map((b, i) => b + BRANCHES[anhe(i)]);
    expect(pairs).toEqual(['寅亥', '卯戌', '辰酉', '巳申', '午未', '未午', '申巳', '酉辰', '戌卯', '亥寅', '子丑', '丑子']);
  });
});

// --- Hand-built charts ---------------------------------------------------------------------
type StarSpec = string | [name: string, brightness?: Brightness, mutagen?: Mut];
const NAMES: PalaceName[] = ['命宮', '兄弟', '夫妻', '子女', '財帛', '疾厄', '遷移', '僕役', '官祿', '田宅', '福德', '父母'];
const MAJORS = new Set(['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍']);
const MINORS = new Set(['左輔', '右弼', '文昌', '文曲', '天魁', '天鉞', '祿存', '天馬', '擎羊', '陀羅', '火星', '鈴星', '地空', '地劫']);

function mk(ming: string, stars: Record<string, StarSpec[]>, opts: Partial<ChartM> = {}): ChartM {
  const mi = BRANCHES.indexOf(ming as (typeof BRANCHES)[number]);
  const palaces: PalaceM[] = BRANCHES.map((branch, index) => {
    const specs = (stars[branch] ?? []).map((s) => (typeof s === 'string' ? [s] : s) as [string, Brightness?, Mut?]);
    const toStar = ([name, brightness, mutagen]: [string, Brightness?, Mut?]) => ({ name, brightness, mutagen });
    return {
      index,
      branch,
      stem: '甲',
      name: NAMES[(mi - index + 12) % 12],
      major: specs.filter(([n]) => MAJORS.has(n)).map(toStar),
      minor: specs.filter(([n]) => MINORS.has(n)).map(toStar),
      adjective: specs.filter(([n]) => !MAJORS.has(n) && !MINORS.has(n)).map(([n]) => n),
      isBody: index === mi,
      decade: [2, 11],
    };
  });
  return { palaces, gender: 'male', yearStem: '甲', yearBranch: '子', timeIndex: 6, ...opts };
}
const statusOf = (c: ChartM, id: string) => evaluatePatterns(new Ctx(c)).find((p) => p.id === id)?.status;

describe('pattern status logic', () => {
  it('紫府同宮 with helpers and no malefics is formed', () => {
    expect(statusOf(mk('寅', { 寅: ['紫微', '天府', '左輔'] }), 'ge.zifu-tonggong')).toBe('formed');
  });
  it('紫府同宮 with helpers and 擎羊 in a trine is flawed (破格)', () => {
    expect(statusOf(mk('寅', { 寅: ['紫微', '天府', '左輔'], 午: ['擎羊'] }), 'ge.zifu-tonggong')).toBe('flawed');
  });
  it('紫府同宮 with no helpers and 地劫 opposite is broken', () => {
    expect(statusOf(mk('寅', { 寅: ['紫微', '天府'], 申: ['地劫'] }), 'ge.zifu-tonggong')).toBe('broken');
  });
  it('紫府同宮 alone is bare', () => {
    expect(statusOf(mk('寅', { 寅: ['紫微', '天府'] }), 'ge.zifu-tonggong')).toBe('bare');
  });
  it('紫府同宮 needs 寅 or 申', () => {
    expect(statusOf(mk('子', { 子: ['紫微', '天府'] }), 'ge.zifu-tonggong')).toBeUndefined();
  });
  it('火貪 tolerates 火星 (it is part of the pattern)', () => {
    expect(statusOf(mk('辰', { 辰: ['貪狼', '火星', '文昌'] }), 'ge.huotan')).toBe('formed');
  });
  it('a malefic outside the 三方四正 does not break a pattern', () => {
    expect(statusOf(mk('寅', { 寅: ['紫微', '天府', '左輔'], 卯: ['擎羊'] }), 'ge.zifu-tonggong')).toBe('formed');
  });
});

describe('rare adverse patterns', () => {
  it('一生孤貧: fallen 破軍 in 卯 with no lucky stars', () => {
    expect(statusOf(mk('卯', { 卯: [['破軍', '陷']] }), 'ge.yisheng-gupin')).toBe('present');
    expect(statusOf(mk('卯', { 卯: [['破軍', '陷']], 未: ['文昌'] }), 'ge.yisheng-gupin')).toBeUndefined();
  });
  it('殺拱廉貞: 廉貞+七殺 with two malefics and no lucky stars', () => {
    expect(statusOf(mk('丑', { 丑: ['廉貞', '七殺', '擎羊'], 巳: ['火星'] }), 'ge.shagong-lianzhen')).toBe('present');
  });
  it('天梁拱月: fallen 天梁 meeting 太陰 with malefics', () => {
    expect(statusOf(mk('巳', { 巳: [['天梁', '陷'], '陀羅'], 酉: ['太陰'] }), 'ge.tianliang-gongyue')).toBe('present');
  });
  it('梁馬飄蕩: 天梁 in 亥 with 天馬 and malefics', () => {
    expect(statusOf(mk('亥', { 亥: ['天梁', '天馬', '鈴星'] }), 'ge.liangma-piaodang')).toBe('present');
  });
  it('命無正曜 borrows from the opposite palace', () => {
    const a = analyse(mk('子', { 午: [['太陽', '廟']] }));
    expect(a.patterns.some((p) => p.id === 'ge.wu-zhengyao')).toBe(true);
    expect(a.overview[0].text).toContain('borrowed from');
  });
});

describe('real charts', () => {
  it('evaluates 1,000+ charts without errors and reaches most patterns', () => {
    const seen = new Set<string>();
    for (let w = 0; w < 100; w++) {
      const ds = new Date(Date.UTC(1950, 0, 3) + w * 86400000 * 191).toISOString().slice(0, 10);
      for (let t = 0; t < 12; t++) {
        const g = (w + t) % 2 ? 'male' : 'female';
        const a = analyse(toModel(buildChart(ds, t, g, DEFAULT_SETTINGS), g, t));
        for (const p of a.patterns) seen.add(p.id);
        expect(a.palaces).toHaveLength(12);
        for (const f of [...a.overview, ...a.patterns, ...a.palaces.flatMap((p) => p.findings)]) {
          expect(f.sources.length, f.id).toBeGreaterThan(0);
          expect(f.evidence.length, f.id).toBeGreaterThan(0);
        }
      }
    }
    // Patterns that need very specific placements may not appear in this sample; most must.
    expect(seen.size).toBeGreaterThan(ALL_PATTERNS.length * 0.7);
  }, 180_000);

  it('sample chart: 武曲天府 in 子 forms 將星得地 and 祿馬交馳', () => {
    const a = analyse(toModel(buildChart('1990-06-15', 6, 'male', DEFAULT_SETTINGS), 'male', 6));
    const ids = a.patterns.map((p) => `${p.id}:${p.status}`);
    expect(ids).toContain('ge.jiangxing-dedi:formed');
    expect(ids).toContain('ge.luma-jiaochi:formed');
    expect(a.overview.find((f) => f.id === 'body')?.text).toContain('身命同宮');
  });
});

describe('Simplified display map', () => {
  it('covers every character in rule and glossary text (run `npm run t2s` after editing text)', () => {
    const convert = OpenCC.Converter({ from: 'tw', to: 'cn' });
    const text = JSON.stringify([ALL_PATTERNS.map((r) => [r.zh, r.text, r.sources]), STARS, Object.keys(GLOSSARY), Object.values(ZH)]);
    const map = T2S as Record<string, string>;
    const missing = [...new Set(text.match(/[\u3400-\u9fff]/g))].filter((ch) => convert(ch) !== ch && map[ch] !== convert(ch));
    expect(missing).toEqual([]);
  });
});
