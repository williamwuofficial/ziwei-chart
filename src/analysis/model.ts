// Plain-data chart model for the analysis rules. It is always built from a Traditional-Chinese
// iztro chart, so rules can name stars and palaces in Traditional regardless of display script.
// Tests build these objects by hand.

import type { Astrolabe } from '../engine/chart';

export type Mut = '祿' | '權' | '科' | '忌';
export type Brightness = '廟' | '旺' | '得' | '利' | '平' | '不' | '陷';

export interface StarM {
  name: string;
  brightness?: Brightness;
  /** Birth-year transformation. */
  mutagen?: Mut;
}

/** Palace role names as iztro prints them in Traditional. */
export type PalaceName =
  | '命宮' | '兄弟' | '夫妻' | '子女' | '財帛' | '疾厄' | '遷移' | '僕役' | '官祿' | '田宅' | '福德' | '父母';

export interface PalaceM {
  /** 0–11, iztro order: branches 寅卯辰巳午未申酉戌亥子丑. */
  index: number;
  branch: string;
  stem: string;
  name: PalaceName;
  major: StarM[];
  minor: StarM[];
  adjective: string[];
  isBody: boolean;
  decade: [number, number];
  /** Stars transformed by this palace's stem when it is the 大限 palace, in 祿權科忌 order. */
  decadeMut?: [string, string, string, string];
}

export interface ChartM {
  palaces: PalaceM[];
  gender: 'male' | 'female';
  yearStem: string;
  yearBranch: string;
  /** iztro 時辰 index 0–12. */
  timeIndex: number;
}

export const BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const;

export function toModel(chart: Astrolabe, gender: 'male' | 'female', timeIndex: number): ChartM {
  const [yearPillar] = chart.chineseDate.split(' ');
  return {
    gender,
    timeIndex,
    yearStem: yearPillar[0],
    yearBranch: yearPillar[1],
    palaces: chart.palaces.map((p) => ({
      index: p.index,
      branch: p.earthlyBranch,
      stem: p.heavenlyStem,
      name: p.name as PalaceName,
      major: p.majorStars.map(star),
      minor: p.minorStars.map(star),
      adjective: p.adjectiveStars.map((s) => s.name),
      isBody: p.isBodyPalace,
      decade: [p.decadal.range[0], p.decadal.range[1]],
      decadeMut: decadeMutagens(chart, p.decadal.range[0], timeIndex),
    })),
  };
}

function star(s: { name: string; brightness?: string; mutagen?: string }): StarM {
  return {
    name: s.name,
    brightness: (s.brightness || undefined) as Brightness | undefined,
    mutagen: (s.mutagen || undefined) as Mut | undefined,
  };
}

/**
 * The decade's 四化 from iztro's horoscope (so chart-level config such as a different school's
 * table carries through). Nominal age n falls in lunar year birthYear + n − 1; mid-year avoids the
 * New Year boundary. Decades past the calendar's range return undefined.
 */
function decadeMutagens(chart: Astrolabe, fromAge: number, timeIndex: number): PalaceM['decadeMut'] {
  if (fromAge > 95) return undefined;
  try {
    const year = chart.rawDates.lunarDate.lunarYear + fromAge - 1;
    const m = chart.horoscope(`${year}-7-1`, timeIndex).decadal.mutagen;
    return m.length === 4 ? (m as [string, string, string, string]) : undefined;
  } catch {
    return undefined;
  }
}
