import { describe, expect, it } from 'vitest';
import { buildChart, DEFAULT_SETTINGS } from '../src/engine/chart';
import { readDecade, readDecades, stageFor } from '../src/analysis/decades';
import { toModel, type ChartM } from '../src/analysis/model';

const sample = () => toModel(buildChart('1990-06-15', 6, 'male', DEFAULT_SETTINGS), 'male', 6);

describe('life stages', () => {
  it('labels overlapping stages', () => {
    expect(stageFor(6, 15)).toBe('Childhood → Education');
    expect(stageFor(26, 35)).toBe('Early career and relationships → Establishment');
    expect(stageFor(76, 85)).toBe('Later life');
  });
});

describe('decade 四化 in the model', () => {
  it('uses the decade palace stem (戊 → 貪陰弼機)', () => {
    const c = sample();
    const p = c.palaces.find((x) => x.decade[0] === 26)!;
    expect(p.stem).toBe('戊');
    expect(p.decadeMut).toEqual(['貪狼', '太陰', '右弼', '天機']);
  });
  it('matches the standard stem table for every decade', () => {
    const TABLE: Record<string, string[]> = {
      甲: ['廉貞', '破軍', '武曲', '太陽'], 乙: ['天機', '天梁', '紫微', '太陰'], 丙: ['天同', '天機', '文昌', '廉貞'],
      丁: ['太陰', '天同', '天機', '巨門'], 戊: ['貪狼', '太陰', '右弼', '天機'], 己: ['武曲', '貪狼', '天梁', '文曲'],
      庚: ['太陽', '武曲', '太陰', '天同'], 辛: ['巨門', '太陽', '文曲', '文昌'], 壬: ['天梁', '紫微', '左輔', '武曲'],
      癸: ['破軍', '巨門', '太陰', '貪狼'],
    };
    for (const p of sample().palaces) if (p.decadeMut) expect(p.decadeMut, `${p.stem} ${p.decade}`).toEqual(TABLE[p.stem]);
  });
});

describe('decade readings', () => {
  it('reads every decade up to 95 in age order, each finding sourced', () => {
    const ds = readDecades(sample());
    expect(ds.map((d) => d.range[0])).toEqual([6, 16, 26, 36, 46, 56, 66, 76, 86]);
    for (const d of ds) {
      expect(d.findings[0].id).toMatch(/\.focus$/);
      expect(d.scoreParts.length).toBeGreaterThan(0);
      for (const f of d.findings) {
        expect(f.sources.length).toBeGreaterThan(0);
        expect(f.evidence.length).toBeGreaterThan(0);
      }
    }
  });

  it('flags 疊忌 when the decade 化忌 lands on the natal 化忌 palace', () => {
    // Find any real chart/decade where this happens and check it scores down.
    for (let w = 0; w < 200; w++) {
      const ds = new Date(Date.UTC(1950, 0, 3) + w * 86400000 * 97).toISOString().slice(0, 10);
      const c: ChartM = toModel(buildChart(ds, w % 12, 'female', DEFAULT_SETTINGS), 'female', w % 12);
      for (const d of readDecades(c)) {
        const f = d.findings.find((x) => x.id.endsWith('.dieji'));
        if (f) {
          expect(d.scoreParts.some((s) => s.includes('疊忌'))).toBe(true);
          return;
        }
      }
    }
    throw new Error('no 疊忌 found in sample');
  }, 180_000);

  it('tone thresholds follow the score', () => {
    for (const d of readDecades(sample())) {
      if (d.score >= 2) expect(d.tone).toBe('favourable');
      else if (d.score <= -2) expect(d.tone).toBe('challenging');
      else expect(d.tone).toBe('mixed');
    }
  });

  it('prints the sample decades', () => {
    for (const d of readDecades(sample()).slice(0, 4)) {
      console.log(`\n${d.range.join('–')} ${d.natalPalace} ${d.stem} ${d.stage} → ${d.tone} (${d.score})`);
      for (const s of d.scoreParts) console.log('   ', s);
      for (const f of d.findings) console.log(' -', f.text);
      for (const p of d.patterns) console.log(' *', p.rule.zh, p.status);
    }
    expect(readDecade(sample(), 0).index).toBe(0);
  });
});
