import { astro } from 'iztro';

export type Astrolabe = ReturnType<typeof astro.bySolar>;
export type Script = 'zh-TW' | 'zh-CN';

export interface Settings {
  /** Use true solar time (longitude + equation of time) instead of clock time. */
  useSolar: boolean;
  /** Late 子 hour (23:00–24:00): 'forward' counts it as the next day, 'current' as the same day. */
  dayDivide: 'forward' | 'current';
  /** Star placement: 'default' follows 紫微斗數全書, 'zhongzhou' follows 中州派 (王亭之). */
  algorithm: 'default' | 'zhongzhou';
  script: Script;
  /**
   * Show the third level of detail: star brightness, the miscellaneous stars (雜曜) and the 長生
   * stages. Off by default, so the chart shows only the 14 main stars and the 14 minor stars.
   */
  showDetails: boolean;
  /** Which four-transformation table to use for the disputed stems (戊, 庚, 壬). */
  sihua: SihuaTable;
  /** Year boundary: 'normal' = Lunar New Year (usual for 紫微斗數), 'exact' = 立春 (usual for 八字). */
  yearDivide: 'normal' | 'exact';
  /** Leap-month births: true splits the month at the 15th (later days count as the next month); false counts the whole leap month as the previous month. */
  fixLeap: boolean;
  /** 中州派 only: 天盤 (heaven, standard), 地盤 (earth) or 人盤 (human). Ignored for other placement schools. */
  astroType: 'heaven' | 'earth' | 'human';
  /** 天馬 placement: by birth-year branch (全書 「安天馬星訣 論本生年支」) or by birth month (占驗派, e.g. 范振木). */
  tianma: 'year' | 'month';
}

export type SihuaTable = 'common' | 'quanshu' | 'zhongzhou' | 'beipai' | 'tianji';

/**
 * Overrides for the disputed stems, as [祿, 權, 科, 忌]. Every other stem uses the common modern
 * table, which is iztro's default (戊 貪陰弼機, 庚 陽武陰同, 壬 梁紫輔武).
 * - 全書 卷二 「安祿權科忌四星變化訣」: 「壬梁紫府武宿是」, so 壬 化科 is 天府 (戊 and 庚 as common).
 * - 中州派 (王亭之): 左輔 and 右弼 never transform, so 戊 化科 is 太陽 and 壬 化科 is 天府; 庚 is 陽武府同.
 * - 北派 (河洛) and the old 鐵版神算 text: 庚 is 陽武同相 (天同化科, 天相化忌).
 * - 倪海廈 天紀: 庚 is 陽武同陰 (天同化科, 太陰化忌); 壬 uses 左輔. Inferred from his worked cases
 *   (docs/CROSS-CHECK.md), not from a published table.
 */
export const SIHUA_TABLES: Record<SihuaTable, Partial<Record<string, [string, string, string, string]>>> = {
  common: {},
  quanshu: {
    壬: ['天梁', '紫微', '天府', '武曲'],
  },
  zhongzhou: {
    戊: ['貪狼', '太陰', '太陽', '天機'],
    庚: ['太陽', '武曲', '天府', '天同'],
    壬: ['天梁', '紫微', '天府', '武曲'],
  },
  beipai: {
    庚: ['太陽', '武曲', '天同', '天相'],
  },
  tianji: {
    庚: ['太陽', '武曲', '天同', '太陰'],
  },
};

export const SIHUA_LABEL: Record<SihuaTable, string> = {
  common: 'Common modern table',
  quanshu: '全書 table (壬 天府化科)',
  zhongzhou: '中州派 (Wang Ting Zhi)',
  beipai: '北派 (He Luo)',
  tianji: '天紀 (Ni Haixia)',
};

export const DEFAULT_SETTINGS: Settings = {
  useSolar: true,
  dayDivide: 'forward',
  algorithm: 'default',
  script: 'zh-TW',
  showDetails: false,
  sihua: 'common',
  yearDivide: 'normal',
  fixLeap: true,
  astroType: 'heaven',
  tianma: 'year',
};

export type Gender = 'male' | 'female';

export function buildChart(dateStr: string, timeIndex: number, gender: Gender, s: Settings): Astrolabe {
  const chart = astro.withOptions({
    type: 'solar',
    dateStr,
    timeIndex,
    gender,
    fixLeap: s.fixLeap,
    language: s.script,
    astroType: s.algorithm === 'zhongzhou' ? s.astroType : 'heaven',
    config: {
      algorithm: s.algorithm,
      dayDivide: s.dayDivide,
      yearDivide: s.yearDivide,
      // Keep yearly periods on the same boundary as the birth year.
      horoscopeDivide: s.yearDivide,
      mutagens: SIHUA_TABLES[s.sihua] as never,
    },
  }) as Astrolabe;
  if (s.tianma === 'month') moveTianmaByMonth(chart, s.fixLeap);
  return chart;
}

const BRANCH_ORDER = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];

/**
 * 月馬: place 天馬 by the lunar birth month instead of the year. Month branches 寅午戌 → 申,
 * 申子辰 → 寅, 巳酉丑 → 亥, 亥卯未 → 巳 (month 1 is 寅). A leap month past the 15th counts as
 * the next month when fixLeap is on, matching how iztro places the other month stars.
 */
export function tianmaMonthBranch(lunarMonth: number, isLeap: boolean, lunarDay: number, fixLeap: boolean): string {
  let m = lunarMonth + (isLeap && fixLeap && lunarDay > 15 ? 1 : 0);
  if (m > 12) m -= 12;
  const monthBranch = BRANCH_ORDER[(m - 1) % 12];
  if ('寅午戌'.includes(monthBranch)) return '申';
  if ('申子辰'.includes(monthBranch)) return '寅';
  if ('巳酉丑'.includes(monthBranch)) return '亥';
  return '巳';
}

function moveTianmaByMonth(chart: Astrolabe, fixLeap: boolean): void {
  const ld = chart.rawDates.lunarDate;
  const target = tianmaMonthBranch(ld.lunarMonth, ld.isLeap, ld.lunarDay, fixLeap);
  const from = chart.palaces.find((p) => p.minorStars.some((st) => st.type === 'tianma'));
  const to = chart.palaces.find((p) => p.earthlyBranch === target);
  if (!from || !to || from === to) return;
  const i = from.minorStars.findIndex((st) => st.type === 'tianma');
  const [star] = from.minorStars.splice(i, 1);
  to.minorStars.push(star);
}

export type MutagenKind = 'lu' | 'quan' | 'ke' | 'ji';
export const MUTAGEN_ORDER: MutagenKind[] = ['lu', 'quan', 'ke', 'ji'];
const MUTAGEN_KIND: Record<string, MutagenKind> = { 祿: 'lu', 禄: 'lu', 權: 'quan', 权: 'quan', 科: 'ke', 忌: 'ji' };
export const mutagenKind = (zh: string | undefined): MutagenKind | undefined => (zh ? MUTAGEN_KIND[zh] : undefined);
export const MUTAGEN_EN: Record<MutagenKind, string> = { lu: 'Prosperity', quan: 'Power', ke: 'Fame', ji: 'Obstacle' };

export interface DecadeOverlay {
  /** Index into astrolabe.palaces of the decade's 命宮. */
  palaceIndex: number;
  range: [number, number];
  stem: string;
  /** Decade palace name for each palace index. */
  palaceNames: string[];
  /** Star name → decade transformation. */
  mutagens: Map<string, MutagenKind>;
}

/** The decade (大限) overlay, using iztro's horoscope for a date inside the decade. */
export function decadeOverlay(chart: Astrolabe, palaceIndex: number, timeIndex: number): DecadeOverlay {
  const palace = chart.palaces[palaceIndex];
  const [from, to] = palace.decadal.range;
  // Nominal age (虛歲) n falls in lunar year birthYear + n − 1; mid-year avoids the New Year boundary.
  const year = chart.rawDates.lunarDate.lunarYear + from - 1;
  const h = chart.horoscope(`${year}-7-1`, timeIndex);
  const mutagens = new Map<string, MutagenKind>();
  h.decadal.mutagen.forEach((star, i) => mutagens.set(star, MUTAGEN_ORDER[i]));
  return { palaceIndex, range: [from, to], stem: h.decadal.heavenlyStem, palaceNames: h.decadal.palaceNames, mutagens };
}

/** Palace indices of the 三方四正 for a palace: itself, the two trines and the opposite palace. */
export function sanFangSiZheng(index: number): { self: number; trines: [number, number]; opposite: number } {
  return { self: index, trines: [(index + 4) % 12, (index + 8) % 12], opposite: (index + 6) % 12 };
}

export const FIVE_ELEMENT_EN: Record<string, string> = {
  水二局: 'Water 2', 木三局: 'Wood 3', 金四局: 'Metal 4', 土五局: 'Earth 5', 火六局: 'Fire 6',
};
