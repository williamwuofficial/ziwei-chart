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
  /** Show the miscellaneous stars (雜曜) in each palace. */
  showAdjective: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  useSolar: true,
  dayDivide: 'forward',
  algorithm: 'default',
  script: 'zh-TW',
  showAdjective: true,
};

export type Gender = 'male' | 'female';

export function buildChart(dateStr: string, timeIndex: number, gender: Gender, s: Settings): Astrolabe {
  return astro.withOptions({
    type: 'solar',
    dateStr,
    timeIndex,
    gender,
    fixLeap: true,
    language: s.script,
    config: { algorithm: s.algorithm, dayDivide: s.dayDivide },
  });
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
