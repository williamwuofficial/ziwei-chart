import { describe, expect, it } from 'vitest';
import SOURCES_JSON from './fixtures/sources.json';
import { JUAN2, MING_SECTION, MING_TABLE } from '../src/analysis/rules/juan2';
import { readMingTable } from '../src/analysis/juan2Read';
import { analyse } from '../src/analysis/evaluate';
import { toModel } from '../src/analysis/model';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';

const VERIFIED = new Set((SOURCES_JSON as { verse: string; work: string; section: string }[]).map((s) => `${s.verse}|${s.work}|${s.section}`));
const MAJORS = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍'];

describe('全書 卷二 data', () => {
  it('every palace line and pair line is verified against its own section (npm run verify-sources)', () => {
    for (const [palace, t] of Object.entries(JUAN2)) {
      for (const [star, [verse, en, pairs]] of Object.entries(t.stars)) {
        expect(VERIFIED.has(`${verse}|紫微斗數全書|${t.section}`), `${palace} ${star}: ${verse}`).toBe(true);
        expect(en.length, `${palace} ${star}`).toBeGreaterThan(3);
        for (const [partner, [pv, pen]] of Object.entries(pairs ?? {})) {
          expect(VERIFIED.has(`${pv}|紫微斗數全書|${t.section}`), `${palace} ${star}+${partner}: ${pv}`).toBe(true);
          expect(pen.length).toBeGreaterThan(3);
          expect(MAJORS).toContain(partner);
          expect(pv, `${palace} ${star}+${partner} should mention its partner`).toMatch(new RegExp(partner + '|' + partner.slice(1)));
        }
      }
    }
  });
  it('each star line belongs to its star (mentions it)', () => {
    for (const [palace, t] of Object.entries(JUAN2)) {
      for (const [star, [verse]] of Object.entries(t.stars)) expect(verse, `${palace} ${star}`).toContain(star);
    }
  });
  it('every 命宮 table line is verified', () => {
    for (const [star, lines] of Object.entries(MING_TABLE)) {
      for (const l of lines) expect(VERIFIED.has(`${l}|紫微斗數全書|${MING_SECTION}`), `${star}: ${l}`).toBe(true);
    }
    expect(Object.keys(MING_TABLE)).toEqual(MAJORS);
  });
});

describe('命宮 table reader', () => {
  it('names the year stem when listed (紫微 at 子, 丁 year → 貴格)', () => {
    expect(readMingTable('紫微', '子', '丁')?.text).toContain('貴格');
  });
  it('reports a negative verdict for the stem (紫微 at 子, 壬 year → does not last)', () => {
    expect(readMingTable('紫微', '子', '壬')?.text).toContain('do not last');
  });
  it('says when the stem is not listed (紫微 at 子, 甲 year)', () => {
    expect(readMingTable('紫微', '子', '甲')?.text).toContain('not among them');
  });
  it('reads multi-branch lines (武曲 at 丑, 戊 year → highly honoured)', () => {
    expect(readMingTable('武曲', '丑', '戊')?.text).toContain('highly honoured');
  });
  it('reads general lines with no stems (太陽 at 巳 → 財官格)', () => {
    expect(readMingTable('太陽', '巳', '甲')?.text).toContain('財官格');
  });
});

describe('analysis integration', () => {
  it('sample chart: 命 武曲天府 in 子 (庚 year) gets table verdicts; palace cards quote 卷二', () => {
    const a = analyse(toModel(buildChart('1990-06-15', 6, 'male', DEFAULT_SETTINGS), 'male', 6));
    const table = a.overview.filter((f) => f.id.startsWith('ming.table.'));
    expect(table.length).toBe(2);
    expect(table.find((f) => f.id === 'ming.table.武曲')?.text).toContain('庚 years');
    const cai = a.palaces.find((p) => p.name === '財帛')!;
    const j = cai.findings.find((f) => f.id.endsWith('.juan2'))!;
    expect(j.sources[0].section).toBe('五財帛');
    expect(j.text).toContain('廉貞');
  });
});
