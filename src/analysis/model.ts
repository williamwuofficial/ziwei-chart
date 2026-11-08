// Plain-data chart model for the analysis rules. It is always built from a Traditional-Chinese
// iztro chart, so rules can name stars and palaces in Traditional regardless of display script.
// Tests build these objects by hand.

import * as IZTRO_DATA from 'iztro/lib/data';
import * as ZH_TW_STAR_MODULE from 'iztro/lib/i18n/locales/zh-TW/star';
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
  /** Lunar year of birth (nominal age 1). Optional so hand-built test charts can omit it. */
  lunarYear?: number;
}

export const BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'] as const;

export function toModel(chart: Astrolabe, gender: 'male' | 'female', timeIndex: number): ChartM {
  const [yearPillar] = chart.chineseDate.split(' ');
  return {
    gender,
    timeIndex,
    lunarYear: chart.rawDates.lunarDate.lunarYear,
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
      decadeMut: p.decadal.range[0] <= 95 ? stemMutagens(p.heavenlyStem) : undefined,
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
 * iztro ships CommonJS. Node (Vitest) and Vite's browser pre-bundling wrap its `exports.default`
 * differently (once vs twice), so unwrap `default` until the real object appears.
 */
function unwrap<T>(mod: unknown, has: string): T {
  let m = mod as Record<string, unknown>;
  for (let i = 0; i < 3 && m && !(has in m) && 'default' in m; i++) m = m.default as Record<string, unknown>;
  return m as T;
}
const DATA = unwrap<{ HEAVENLY_STEMS: readonly string[]; heavenlyStems: Record<string, { mutagen: readonly string[] }> }>(IZTRO_DATA, 'heavenlyStems');
const ZH_TW_STARS = unwrap<Record<string, string>>(ZH_TW_STAR_MODULE, 'ziweiMaj');

const STEMS = '甲乙丙丁戊己庚辛壬癸';

/**
 * The decade's 四化 for a palace stem, from iztro's own stem table (instant; calling
 * chart.horoscope per decade costs ~30 ms each). If a per-chart 四化 override setting is added
 * later, apply it here too.
 */
export function stemMutagens(stem: string): PalaceM['decadeMut'] {
  const key = DATA.HEAVENLY_STEMS[STEMS.indexOf(stem)];
  const keys = key ? DATA.heavenlyStems[key]?.mutagen : undefined;
  const names = keys?.map((k) => ZH_TW_STARS[k]);
  return names?.length === 4 && names.every(Boolean) ? (names as [string, string, string, string]) : undefined;
}

// Self-check: the interop above broke once in the browser while tests passed in Node. If the
// table fails to resolve, say so loudly instead of silently dropping every 大限/流年 四化 reading.
if (!stemMutagens('甲')) console.error('ziwei-chart: iztro stem 四化 table did not load; decade and year 四化 readings are missing.');
