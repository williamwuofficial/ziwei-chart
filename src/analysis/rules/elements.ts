// Five elements (五行) of the main stars, their traditional colours, and the Chinese zodiac.
// Star elements quote 《紫微斗數全書》 (checked by scripts/verify-sources.mjs). The colours are the
// standard 五行 correspondences (五色), not a 紫微 rule: the 全書 never prescribes colours, so the
// app shows them as cultural background only.

import type { Source } from './types';

export type Element = '木' | '火' | '土' | '金' | '水';

export const ELEMENT_EN: Record<Element, string> = { 木: 'Wood', 火: 'Fire', 土: 'Earth', 金: 'Metal', 水: 'Water' };

/** The 五色: traditional colour of each element. */
export const ELEMENT_COLOUR: Record<Element, { zh: string; en: string; css: string }> = {
  木: { zh: '青', en: 'green / blue-green', css: '#2e8b57' },
  火: { zh: '赤', en: 'red', css: '#c62828' },
  土: { zh: '黃', en: 'yellow / ochre', css: '#c9a227' },
  金: { zh: '白', en: 'white / metallic', css: '#d9d9d9' },
  水: { zh: '黑', en: 'black / dark blue', css: '#1f2a44' },
};

export const COLOUR_BASIS: Source = {
  basis: 'standard 五行 correspondences (五色: 木青, 火赤, 土黃, 金白, 水黑). Cultural background only: 紫微斗數 classics give no colour remedies',
};

/** Element of each main star, with the 全書 line that states it. */
/** `alt` is a second element the 全書 also gives; the app reads the first (`el`) and shows `alt` as a note. */
export const STAR_ELEMENT: Record<string, { el: Element; alt?: Element; note?: string; src: Source }> = {
  紫微: { el: '土', src: { verse: '紫微屬土', work: '紫微斗數全書', section: '問紫微所主若何', basis: '全書 卷一: 紫微 is earth' } },
  天機: { el: '木', src: { verse: '天機屬木', work: '紫微斗數全書', section: '問天機所主如何', basis: '全書 卷一: 天機 is wood' } },
  太陽: { el: '火', src: { verse: '太陽星屬火', work: '紫微斗數全書', section: '問太陽所主若何', basis: '全書 卷一: 太陽 is fire' } },
  武曲: { el: '金', src: { verse: '武曲北斗第六星，屬金', work: '紫微斗數全書', section: '問武曲星所主為何', basis: '全書 卷一: 武曲 is metal' } },
  天同: {
    el: '水',
    alt: '金',
    note: 'the 卷二 star table adds metal (「天同屬水金」); the app uses its first element, water',
    src: { verse: '天同星屬水', work: '紫微斗數全書', section: '問天同星所主若何', basis: '全書 卷一: 天同 is water; the 卷二 star table gives water and metal' },
  },
  廉貞: { el: '火', src: { verse: '廉貞屬火', work: '紫微斗數全書', section: '問廉貞所主若何', basis: '全書 卷一: 廉貞 is fire' } },
  天府: { el: '土', src: { verse: '天府屬土', work: '紫微斗數全書', section: '問天府所主若何', basis: '全書 卷一: 天府 is earth' } },
  太陰: { el: '水', src: { verse: '太陰屬水南北斗化富為財帛田宅主', work: '紫微斗數全書', section: '安身命例', basis: '全書 卷二 star table: 太陰 is water' } },
  貪狼: {
    el: '水',
    alt: '木',
    note: 'its body is water and its qi wood (卷一: 「其氣屬木，體屬水」)',
    src: { verse: '貪狼北斗解厄之神，第一星也。屬水', work: '紫微斗數全書', section: '問貪狼所主若何', basis: '全書 卷一: 貪狼 is water in body; 希夷 adds that its qi is wood' },
  },
  巨門: {
    el: '水',
    alt: '金',
    note: 'the 全書 also gives metal (卷一: 「巨門屬水、金」); the app uses its first element, water',
    src: { verse: '巨門屬水、金', work: '紫微斗數全書', section: '問巨門所主若何', basis: '全書 卷一: 巨門 is water and metal; 卷二 lists water only' },
  },
  天相: { el: '水', src: { verse: '天相屬水', work: '紫微斗數全書', section: '問天相星所主若何', basis: '全書 卷一: 天相 is water' } },
  天梁: { el: '土', src: { verse: '天梁屬土', work: '紫微斗數全書', section: '問天梁星所主若何', basis: '全書 卷一: 天梁 is earth' } },
  七殺: {
    el: '火',
    alt: '金',
    note: 'the 全書 gives fire and metal (「屬火、金」), and many modern books treat it as metal; the app uses its first element, fire',
    src: { verse: '七殺南斗第六星也，屬火、金', work: '紫微斗數全書', section: '問七殺星所主若何', basis: '全書 卷一 and 卷二: 七殺 is fire and metal' },
  },
  破軍: { el: '水', src: { verse: '破軍屬水', work: '紫微斗數全書', section: '問破軍所主若何', basis: '全書 卷一: 破軍 is water' } },
};

/** 五行局 → its element. */
export const JU_ELEMENT: Record<string, Element> = { 水二局: '水', 木三局: '木', 金四局: '金', 土五局: '土', 火六局: '火' };

// ── Chinese zodiac (生肖) ──────────────────────────────────────────────────

export const BRANCH_ANIMAL: Record<string, { zh: string; en: string }> = {
  子: { zh: '鼠', en: 'Rat' },
  丑: { zh: '牛', en: 'Ox' },
  寅: { zh: '虎', en: 'Tiger' },
  卯: { zh: '兔', en: 'Rabbit' },
  辰: { zh: '龍', en: 'Dragon' },
  巳: { zh: '蛇', en: 'Snake' },
  午: { zh: '馬', en: 'Horse' },
  未: { zh: '羊', en: 'Goat' },
  申: { zh: '猴', en: 'Monkey' },
  酉: { zh: '雞', en: 'Rooster' },
  戌: { zh: '狗', en: 'Dog' },
  亥: { zh: '豬', en: 'Pig' },
};

export const BRANCH_ORDER = '子丑寅卯辰巳午未申酉戌亥';
export const clashBranch = (b: string) => BRANCH_ORDER[(BRANCH_ORDER.indexOf(b) + 6) % 12];

const SUOJI_BASIS = '全書 卷三 論大小限星辰過十二宮遇十二支所忌訣, which lists, for each birth-year branch, the years and periods to treat with care';

/** The 全書's own line on a year clashing the birth-year branch (歲君相沖), where it gives one. */
export const CLASH_QUOTE: Partial<Record<string, Source>> = {
  子: { verse: '及忌子午歲限相沖', work: '紫微斗數全書', section: '論大小限星辰過十二宮遇十二支所忌訣', basis: SUOJI_BASIS },
  寅: { verse: '及忌卯酉寅申相沖', work: '紫微斗數全書', section: '論大小限星辰過十二宮遇十二支所忌訣', basis: SUOJI_BASIS },
  卯: { verse: '及忌卯酉寅申相沖', work: '紫微斗數全書', section: '論大小限星辰過十二宮遇十二支所忌訣', basis: SUOJI_BASIS },
  申: { verse: '及忌寅年沖', work: '紫微斗數全書', section: '論大小限星辰過十二宮遇十二支所忌訣', basis: SUOJI_BASIS },
  酉: { verse: '及卯年歲君相沖', work: '紫微斗數全書', section: '論大小限星辰過十二宮遇十二支所忌訣', basis: SUOJI_BASIS },
  戌: { verse: '謂之辰戌相沖不美', work: '紫微斗數全書', section: '論大小限星辰過十二宮遇十二支所忌訣', basis: SUOJI_BASIS },
};

/** The 全書's line on the birth-year branch's own year returning (本命年), where it gives one. */
export const OWN_YEAR_QUOTE: Partial<Record<string, Source>> = {
  辰: { verse: '龍蛇切忌本身臨', work: '紫微斗數全書', section: '論大小限星辰過十二宮遇十二支所忌訣', basis: SUOJI_BASIS },
  巳: { verse: '龍蛇切忌本身臨', work: '紫微斗數全書', section: '論大小限星辰過十二宮遇十二支所忌訣', basis: SUOJI_BASIS },
  丑: { verse: '丑午生人丑午瞋', work: '紫微斗數全書', section: '論大小限星辰過十二宮遇十二支所忌訣', basis: SUOJI_BASIS },
  午: { verse: '丑午生人丑午瞋', work: '紫微斗數全書', section: '論大小限星辰過十二宮遇十二支所忌訣', basis: SUOJI_BASIS },
};

export const CLASH_BASIS: Source = { basis: '六沖: a year whose branch is opposite the birth-year branch clashes with it (沖太歲). The 全書 names such clashes for several branches and reads them together with the year’s stars' };
export const OWN_YEAR_BASIS: Source = { basis: '本命年: the year that repeats the birth-year branch. Widely observed as a year for care; the 全書 names it only for 辰, 巳, 丑 and 午 births' };

/** "⟨七殺⟩ is read as fire; the 全書 also gives metal" for stars with a second element, else undefined. */
export function altElementNote(star: string): string | undefined {
  const e = STAR_ELEMENT[star];
  return e?.alt ? `⟨${star}⟩ is read as ${ELEMENT_EN[e.el].toLowerCase()}; the 全書 also gives ${ELEMENT_EN[e.alt].toLowerCase()}` : undefined;
}
