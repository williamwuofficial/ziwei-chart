// 八字 (Four Pillars): the year, month, day and hour as stem-branch pairs, read the 子平 way from
// the Day Master (日主). Quotes are checked against the public-domain 八字 classics on Wikisource
// (scripts/verify-sources.mjs): 《滴天髓》 (天干論), 《三命通會》 (萬民英, 明) and 《淵海子平》.
//
// The pillars come from iztro with the year counted from 立春 and months from the solar terms
// (節氣), which is the 八字 convention whatever the 斗數 year setting is.
//
// Deliberately left out: judging whether the Day Master is strong or weak (身強/身弱) and its useful
// element (用神), where schools disagree most, and the luck pillars (大運).

import type { Finding } from './evaluate';
import { ELEMENT_EN, type Element } from './rules/elements';
import type { Source } from './rules/types';

export const STEMS = '甲乙丙丁戊己庚辛壬癸';
export const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

export const STEM_EL: Record<string, Element> = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
export const isYang = (stem: string) => STEMS.indexOf(stem) % 2 === 0;
/** Main element of each branch. */
export const BRANCH_EL: Record<string, Element> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水',
};
/** Hidden stems (藏干), main one first, per 淵海子平 又地支藏遁歌. */
export const HIDDEN: Record<string, string[]> = {
  子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'], 辰: ['戊', '乙', '癸'], 巳: ['丙', '庚', '戊'],
  午: ['丁', '己'], 未: ['己', '丁', '乙'], 申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲'],
};
export const HIDDEN_SRC: Source[] = [
  { verse: '子宮癸水在其中，丑癸辛金己土同；寅宮甲木兼丙戊，卯宮乙木獨相逢', work: '淵海子平', section: '又地支藏遁歌', basis: '淵海子平: the stems hidden in each branch (藏干)' },
  { verse: '辰藏乙戊三分癸，巳中庚金丙戊叢；午宮丁火並己土，未宮乙己丁共宗', work: '淵海子平', section: '又地支藏遁歌', basis: '淵海子平: hidden stems, continued' },
  { verse: '申位庚金壬水戊，酉宮辛金獨豐隆；戌宮辛金及丁戊，亥藏壬甲是真蹤', work: '淵海子平', section: '又地支藏遁歌', basis: '淵海子平: hidden stems, continued' },
];

export type PillarKey = 'year' | 'month' | 'day' | 'hour';
export type Pillars = Record<PillarKey, { stem: string; branch: string }>;
export const PILLAR_ORDER: PillarKey[] = ['hour', 'day', 'month', 'year']; // traditional right-to-left order, written left to right
export const PILLAR_LABEL: Record<PillarKey, { zh: string; en: string }> = {
  year: { zh: '年柱', en: 'Year' },
  month: { zh: '月柱', en: 'Month' },
  day: { zh: '日柱', en: 'Day' },
  hour: { zh: '時柱', en: 'Hour' },
};

/** Parse iztro's chineseDate ("甲子 乙丑 丙寅 丁卯"). */
export function parsePillars(chineseDate: string): Pillars {
  const [y, m, d, h] = chineseDate.split(' ');
  const p = (s: string) => ({ stem: s[0], branch: s[1] });
  return { year: p(y), month: p(m), day: p(d), hour: p(h) };
}

// ── Ten Gods (十神) ────────────────────────────────────────────────────────

export type TenGod = '比肩' | '劫財' | '食神' | '傷官' | '偏財' | '正財' | '七殺' | '正官' | '偏印' | '正印';

const GEN: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const CTRL: Record<Element, Element> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };

/** The Ten God of `other` seen from the Day Master `dm`. */
export function tenGod(dm: string, other: string): TenGod {
  const a = STEM_EL[dm];
  const b = STEM_EL[other];
  const same = isYang(dm) === isYang(other);
  if (a === b) return same ? '比肩' : '劫財';
  if (GEN[a] === b) return same ? '食神' : '傷官';
  if (CTRL[a] === b) return same ? '偏財' : '正財';
  if (CTRL[b] === a) return same ? '七殺' : '正官';
  return same ? '偏印' : '正印';
}

export const TEN_GOD: Record<TenGod, { en: string; text: string; src: Source }> = {
  比肩: {
    en: 'Companion',
    text: 'same element and polarity as you: peers, siblings, independence and self-reliance',
    src: { verse: '五曰同類之陰陽，曰劫財、曰陽刃，甲乙見甲乙是也', work: '淵海子平', section: '論日為主', basis: '淵海子平: the stems of your own element are the fifth class, your peers' },
  },
  劫財: {
    en: 'Rob Wealth',
    text: 'same element, opposite polarity: rivals and allies, competitiveness, sharing or contesting resources',
    src: { verse: '五曰同類之陰陽，曰劫財、曰陽刃，甲乙見甲乙是也', work: '淵海子平', section: '論日為主', basis: '淵海子平: the stems of your own element are the fifth class, your peers' },
  },
  食神: {
    en: 'Eating God',
    text: 'what you produce, same polarity: talent, ease, enjoyment and output that flows naturally',
    src: { verse: '食神者，日干所生順數第三位，乃甲食丙、乙食丁之例', work: '三命通會', section: '論食神', basis: '三命通會 卷六: 食神 is the stem the Day Master produces, of the same polarity' },
  },
  傷官: {
    en: 'Hurting Officer',
    text: 'what you produce, opposite polarity: expression, cleverness, performance and a challenge to authority',
    src: { verse: '傷官者，我生彼之謂，乃甲見丁、乙見丙之類', work: '三命通會', section: '論傷官', basis: '三命通會 卷六: 傷官 is the stem the Day Master produces, of the opposite polarity' },
  },
  偏財: {
    en: 'Indirect Wealth',
    text: 'what you control, same polarity: windfalls, trade, generosity and money that moves',
    src: { verse: '何謂偏財？乃甲見戊、乙見己之例', work: '三命通會', section: '論偏財', basis: '三命通會 卷六: 偏財 is the stem the Day Master controls, of the same polarity' },
  },
  正財: {
    en: 'Direct Wealth',
    text: 'what you control, opposite polarity: steady earnings, thrift and what you work for',
    src: { verse: '正財者，乃甲見己、乙見戊之例', work: '三命通會', section: '論正財', basis: '三命通會 卷六: 正財 is the stem the Day Master controls, of the opposite polarity' },
  },
  七殺: {
    en: 'Seven Killings',
    text: 'what controls you, same polarity: pressure, drive, risk and authority that pushes hard',
    src: { verse: '偏官者，乃甲見庚、乙見辛之例', work: '三命通會', section: '論偏官', basis: '三命通會 卷五: 偏官 (七殺) is the stem that controls the Day Master, of the same polarity' },
  },
  正官: {
    en: 'Direct Officer',
    text: 'what controls you, opposite polarity: rules, status, responsibility and fair authority',
    src: { verse: '正官者，乃甲見辛、乙見庚之例', work: '三命通會', section: '論正官', basis: '三命通會 卷五: 正官 is the stem that controls the Day Master, of the opposite polarity' },
  },
  偏印: {
    en: 'Indirect Resource',
    text: 'what feeds you, same polarity: unusual learning, intuition and solitary study',
    src: { verse: '三曰生氣之陰陽，曰印綬、曰倒食，甲乙見壬癸是也', work: '淵海子平', section: '論日為主', basis: '淵海子平: the stems that produce the Day Master are the third class, 印綬 and 倒食 (偏印)' },
  },
  正印: {
    en: 'Direct Resource',
    text: 'what feeds you, opposite polarity: support, mentors, learning and protection',
    src: { verse: '印綬者，乃五行生我之名', work: '三命通會', section: '論印綬', basis: '三命通會 卷六: 印綬 is the element that produces the Day Master' },
  },
};

// ── Day Master (日主) ──────────────────────────────────────────────────────

export const DAY_MASTER: Record<string, { en: string; text: string; src: Source }> = {
  甲: {
    en: 'Yang Wood, the tall tree',
    text: 'upright, ambitious and steady, growing straight up. It needs warmth (Fire) to flourish and does best where the ground stays moist and calm.',
    src: { verse: '甲木參天，脱胎要火，春不容金，秋不容土', work: '滴天髓', section: '甲木', basis: '滴天髓 天干論: 甲 is the towering tree, which needs fire to grow' },
  },
  乙: {
    en: 'Yin Wood, flowers and vines',
    text: 'soft but resilient, adaptable and resourceful. Like a vine on a tree it thrives by leaning on support, in any season.',
    src: { verse: '乙木雖柔，刲羊解牛，懷丁抱丙，跨雞乘猴', work: '滴天髓', section: '乙木', basis: '滴天髓 天干論: 乙 is soft wood that still overcomes, and clings to support' },
  },
  丙: {
    en: 'Yang Fire, the sun',
    text: 'bright, warm, open and fearless, unbothered by cold. Generous towards those it supports.',
    src: { verse: '丙火猛烈，欺霜侮雪，能煆庚金', work: '滴天髓', section: '丙火', basis: '滴天髓 天干論: 丙 is fierce fire that scorns frost and snow' },
  },
  丁: {
    en: 'Yin Fire, the lamp',
    text: 'gentle outside and bright within, loyal and steady. Never blazing, but never going out.',
    src: { verse: '丁火柔中，內性昭融，抱乙而考，合壬而忠，旺而不烈，衰而不窮', work: '滴天髓', section: '丁火', basis: '滴天髓 天干論: 丁 is mild fire, bright within, strong without fierceness' },
  },
  戊: {
    en: 'Yang Earth, the mountain',
    text: 'solid, central and dependable, the ground that holds everything. Prefers stillness to upheaval.',
    src: { verse: '戊土固重，既中且正，靜翕動闢，萬物司命', work: '滴天髓', section: '戊土', basis: '滴天髓 天干論: 戊 is heavy, central earth on which all things depend' },
  },
  己: {
    en: 'Yin Earth, the field',
    text: 'modest, nurturing and receptive, storing and growing what is planted in it. Does best with help.',
    src: { verse: '己土卑濕，中正蓄藏，不愁木盛，不畏水旺', work: '滴天髓', section: '己土', basis: '滴天髓 天干論: 己 is low, moist earth that holds and nurtures' },
  },
  庚: {
    en: 'Yang Metal, the blade',
    text: 'strong, decisive and direct. Water makes it clear and fire sharpens it.',
    src: { verse: '庚金帶煞，剛強為最，得水而清，得火而銳', work: '滴天髓', section: '庚金', basis: '滴天髓 天干論: 庚 is the hardest metal, cleared by water and sharpened by fire' },
  },
  辛: {
    en: 'Yin Metal, the jewel',
    text: 'refined, gentle and clear, at its best when polished by water. Quietly helpful to others.',
    src: { verse: '辛金軟弱，溫潤而清，畏土之疊，樂水之盈', work: '滴天髓', section: '辛金', basis: '滴天髓 天干論: 辛 is soft, lustrous metal that delights in water' },
  },
  壬: {
    en: 'Yang Water, the river and sea',
    text: 'vast, energetic and always moving, strong at heart and never stuck.',
    src: { verse: '壬水汪洋，能洩金氣，剛中之德，周流不滯', work: '滴天髓', section: '壬水', basis: '滴天髓 天干論: 壬 is the ocean, strong within and flowing without pause' },
  },
  癸: {
    en: 'Yin Water, rain and dew',
    text: 'gentle and quiet, but reaching everywhere. Small in form, wide in effect.',
    src: { verse: '癸水至弱，達於天津，龍德而運，功化斯神', work: '滴天髓', section: '癸水', basis: '滴天髓 天干論: 癸 is the weakest water, which yet reaches the heavens' },
  },
};

const DAY_RULE: Source = { verse: '以日為主，年為本，月為提綱，時為輔佐', work: '淵海子平', section: '論日為主', basis: '淵海子平: the day stem is the person; the year is the root, the month the main guide and the hour support' };
const COUNT_SRC: Source = {
  verse: '以日為主，大要看日加臨於甚度，或身旺？或身弱？又看地支有何格局？金木水火土之數',
  work: '淵海子平',
  section: '論日為主',
  basis: '淵海子平: after the Day Master, look at how strong it is and count the five elements. This app counts the elements but does not judge strength, where schools disagree',
};
export const SPOUSE_PALACE: Source = { verse: '年為祖上，月為父母伯叔兄弟門戶，日為妻妾己身', work: '淵海子平', section: '六親總篇', basis: '淵海子平: the day pillar stands for yourself and your spouse; its branch is read as the spouse palace' };
const WIFE_STAR: Source = { verse: '正財為正妻，偏財妾也', work: '淵海子平', section: '論妻妾', basis: '淵海子平: in a man’s chart the spouse star is 正財' };
const HUSBAND_STAR: Source = { verse: '婦人命取六親，與男命不同：取官星為夫星', work: '淵海子平', section: '六親總篇', basis: '淵海子平: in a woman’s chart the spouse star is 正官' };

// ── Reading ────────────────────────────────────────────────────────────────

export interface PillarView {
  key: PillarKey;
  stem: string;
  branch: string;
  /** Ten God of the stem (undefined for the Day Master itself). */
  god?: TenGod;
  hidden: { stem: string; god: TenGod }[];
}

export interface BaziReading {
  pillars: PillarView[];
  dayMaster: string;
  /** Element counts over the eight characters (stems and branch main elements). */
  counts: Record<Element, number>;
  /** Element counts including every hidden stem. */
  countsHidden: Record<Element, number>;
  findings: Finding[];
}

const EL_ORDER: Element[] = ['木', '火', '土', '金', '水'];
const zero = (): Record<Element, number> => ({ 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 });

export function readBazi(p: Pillars, gender: 'male' | 'female'): BaziReading {
  const dm = p.day.stem;
  const pillars: PillarView[] = PILLAR_ORDER.map((key) => ({
    key,
    stem: p[key].stem,
    branch: p[key].branch,
    god: key === 'day' ? undefined : tenGod(dm, p[key].stem),
    hidden: HIDDEN[p[key].branch].map((s) => ({ stem: s, god: tenGod(dm, s) })),
  }));
  const counts = zero();
  const countsHidden = zero();
  for (const k of PILLAR_ORDER) {
    counts[STEM_EL[p[k].stem]]++;
    counts[BRANCH_EL[p[k].branch]]++;
    countsHidden[STEM_EL[p[k].stem]]++;
    for (const s of HIDDEN[p[k].branch]) countsHidden[STEM_EL[s]]++;
  }

  const findings: Finding[] = [];
  const d = DAY_MASTER[dm];
  const el = STEM_EL[dm];
  findings.push({
    id: 'bazi.daymaster',
    text: `Your Day Master (日主) is ⟨${dm}⟩, ${d.en}: ${d.text} In 八字 the day stem stands for you, and everything else in the chart is read in relation to it.`,
    evidence: [`day pillar ⟨${p.day.stem}${p.day.branch}⟩`, `${dm} is ${isYang(dm) ? 'yang' : 'yin'} ${ELEMENT_EN[el]}`],
    sources: [d.src, DAY_RULE],
  });

  const fmt = (c: Record<Element, number>) => EL_ORDER.map((e) => `${ELEMENT_EN[e]} ${c[e]}`).join(', ');
  const missing = EL_ORDER.filter((e) => counts[e] === 0);
  const missingHidden = EL_ORDER.filter((e) => countsHidden[e] === 0);
  const most = EL_ORDER.filter((e) => counts[e] === Math.max(...EL_ORDER.map((x) => counts[x])));
  findings.push({
    id: 'bazi.elements',
    text:
      `Across the eight characters: ${fmt(counts)}. ${most.map((e) => ELEMENT_EN[e]).join(' and ')} ${most.length > 1 ? 'are' : 'is'} the most common.` +
      (missing.length
        ? ` ${missing.map((e) => ELEMENT_EN[e]).join(' and ')} ${missing.length > 1 ? 'are' : 'is'} missing from the visible characters${missingHidden.length < missing.length ? `, though ${missing.filter((e) => !missingHidden.includes(e)).map((e) => ELEMENT_EN[e]).join(' and ')} ${missing.length - missingHidden.length > 1 ? 'appear' : 'appears'} among the hidden stems` : ''}.`
        : ' Every element is present.') +
      ' The classics go on to judge whether the Day Master is strong or weak and which element it needs; schools disagree on how, so this app leaves that out.',
    evidence: [`eight characters: ${fmt(counts)}`, `with hidden stems: ${fmt(countsHidden)}`],
    sources: [COUNT_SRC, ...HIDDEN_SRC],
  });

  // The Ten Gods that show in the stems.
  const visible = pillars.filter((x) => x.god).map((x) => `${PILLAR_LABEL[x.key].en.toLowerCase()} stem ⟨${x.stem}⟩ is ⟨${x.god}⟩ (${TEN_GOD[x.god!].en})`);
  const gods = [...new Set(pillars.filter((x) => x.god).map((x) => x.god!))];
  findings.push({
    id: 'bazi.tengods',
    text: `Seen from your Day Master, the other three stems are ${gods.map((g) => `⟨${g}⟩ (${TEN_GOD[g].en}), ${TEN_GOD[g].text.split(': ')[1]}`).join('; ')}. The month pillar weighs most: the classics call the month the main guide (提綱).`,
    evidence: visible,
    sources: [...gods.map((g) => TEN_GOD[g].src), DAY_RULE],
  });

  // Spouse palace and spouse star.
  const starGod: TenGod = gender === 'male' ? '正財' : '正官';
  const where = pillars.flatMap((x) => [
    ...(x.god === starGod ? [`the ${PILLAR_LABEL[x.key].en.toLowerCase()} stem`] : []),
    ...x.hidden.filter((h) => h.god === starGod).map(() => `the ${PILLAR_LABEL[x.key].en.toLowerCase()} branch (hidden)`),
  ]);
  const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0]);
  findings.push({
    id: 'bazi.spouse',
    text:
      `Your spouse palace, the day branch, is ⟨${p.day.branch}⟩ (${ELEMENT_EN[BRANCH_EL[p.day.branch]]}). ` +
      `By the classics’ rule the spouse star in a ${gender === 'male' ? 'man' : 'woman'}’s chart is ⟨${starGod}⟩ (${TEN_GOD[starGod].en}), here ⟨${STEMS.split('').find((s) => tenGod(dm, s) === starGod)}⟩: ` +
      (where.length ? `it appears in ${list(where)}.` : 'it is not among the stems or hidden stems, so the classics read the spouse through the day branch alone.'),
    evidence: [`day branch ⟨${p.day.branch}⟩`, `spouse star ${starGod}: ${where.join(', ') || 'absent'}`],
    sources: [SPOUSE_PALACE, gender === 'male' ? WIFE_STAR : HUSBAND_STAR],
  });

  return { pillars, dayMaster: dm, counts, countsHidden, findings };
}

// ── Compatibility (合婚) by the pillars ─────────────────────────────────────

const STEM_HE: Record<string, { name: string; en: string }> = {
  甲己: { name: '中正之合', en: 'the “upright” combination: steady, generous and fair-minded' },
  乙庚: { name: '仁義之合', en: 'the “kindness and duty” combination: soft and firm balancing each other' },
  丙辛: { name: '威制之合', en: 'the “authority” combination: a dignified, commanding pair' },
  丁壬: { name: '淫慝之合', en: 'the “passion” combination: warm and quickly moved. The book’s name for it is unflattering, but it describes strong attraction' },
  戊癸: { name: '無情之合', en: 'the “cool” combination: it binds without much warmth, and the book links it to a gap in age' },
};
export const STEM_HE_SRC: Source = { verse: '唯陰見陽，陽見陰為合，亦如男女相合而成夫婦之道', work: '三命通會', section: '論十干合', basis: '三命通會 卷二: a yin and a yang stem combine, like man and wife' };
const STEM_CLASH_SRC: Source = { verse: '地支取七位為沖，猶天干取七位為煞之義', work: '三命通會', section: '論沖擊', basis: '三命通會 卷二: a stem seven places on (甲 and 庚) attacks, as a branch seven places on clashes' };

const BRANCH_SRC: Record<string, Source> = {
  六合: { verse: '一陰一陽和而謂之合', work: '三命通會', section: '論支元六合', basis: '三命通會 卷二: a yin and a yang branch pair up (六合)' },
  三合: { verse: '精氣神全而不散之為合', work: '三命通會', section: '論支元三合', basis: '三命通會 卷二: three branches a third of the circle apart combine (三合)' },
  六沖: { verse: '相沖者，十二支戰擊之神，大概為凶', work: '三命通會', section: '論沖擊', basis: '三命通會 卷二: opposite branches clash (六沖)' },
  六害: { verse: '六害者，十二支凌戰之辰也', work: '三命通會', section: '論六害', basis: '三命通會 卷二: the six harms, branches that encroach on each other' },
  刑: { verse: '合中生刑，猶人夫婦相合而反致刑傷', work: '三命通會', section: '論三刑', basis: '三命通會 卷二: the punishments (刑), friction arising inside a union' },
};

const SANHE = ['申子辰', '亥卯未', '寅午戌', '巳酉丑'];
const LIUHE = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'];
const LIUHAI = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌'];
const XING = ['寅巳', '巳申', '寅申', '丑戌', '戌未', '丑未', '子卯'];
const SELF_XING = '辰午酉亥';
const pairIn = (list: string[], a: string, b: string) => a !== b && list.some((p) => p.includes(a) && p.includes(b));

export interface BranchRelation {
  good: string[];
  bad: string[];
  /** Keys into BRANCH_SRC. */
  kinds: string[];
}
export function branchRelation(a: string, b: string): BranchRelation {
  const good: string[] = [];
  const bad: string[] = [];
  const kinds: string[] = [];
  if (pairIn(SANHE, a, b)) (good.push('三合 (same trine)'), kinds.push('三合'));
  if (pairIn(LIUHE, a, b)) (good.push('六合 (paired)'), kinds.push('六合'));
  if ((BRANCHES.indexOf(a) + 6) % 12 === BRANCHES.indexOf(b)) (bad.push('六沖 (clash)'), kinds.push('六沖'));
  if (pairIn(LIUHAI, a, b)) (bad.push('六害 (harm)'), kinds.push('六害'));
  if (pairIn(XING, a, b)) (bad.push('相刑 (punishment)'), kinds.push('刑'));
  if (a === b && SELF_XING.includes(a)) (bad.push('自刑 (self-punishment)'), kinds.push('刑'));
  return { good, bad, kinds: [...new Set(kinds)] };
}

export type StemRelation = { kind: 'he'; name: string; en: string } | { kind: 'clash' } | { kind: 'none' };
export function stemRelation(a: string, b: string): StemRelation {
  const key = [a, b].sort((x, y) => STEMS.indexOf(x) - STEMS.indexOf(y)).join('');
  const he = STEM_HE[key];
  if (he) return { kind: 'he', ...he };
  // 七殺 relation: same polarity, one controlling the other (甲庚, 乙辛, 丙壬, 丁癸, 戊甲, 己乙 …).
  if (isYang(a) === isYang(b) && (CTRL[STEM_EL[a]] === STEM_EL[b] || CTRL[STEM_EL[b]] === STEM_EL[a])) return { kind: 'clash' };
  return { kind: 'none' };
}

export interface BaziMatch {
  good: number;
  bad: number;
  findings: Finding[];
}

/** Day stems, day branches (spouse palaces) and year branches, weighted in that spirit. */
export function baziCompat(a: Pillars, b: Pillars, whoA = 'You', whoB = 'Your partner'): BaziMatch {
  const findings: Finding[] = [];
  let good = 0;
  let bad = 0;

  const s = stemRelation(a.day.stem, b.day.stem);
  if (s.kind === 'he') good += 2;
  if (s.kind === 'clash') bad += 1;
  findings.push({
    id: 'compat.bazi.daystem',
    text:
      s.kind === 'he'
        ? `Your Day Masters ⟨${a.day.stem}⟩ and ⟨${b.day.stem}⟩ combine (天干合, ${s.name}): ${s.en}. The classics liken a stem combination to a marriage.`
        : s.kind === 'clash'
          ? `Your Day Masters ⟨${a.day.stem}⟩ and ⟨${b.day.stem}⟩ are the same polarity and one checks the other (the 七殺 relation): two strong wills that need room.`
          : `Your Day Masters ⟨${a.day.stem}⟩ (${ELEMENT_EN[STEM_EL[a.day.stem]]}) and ⟨${b.day.stem}⟩ (${ELEMENT_EN[STEM_EL[b.day.stem]]}) neither combine nor clash.`,
    evidence: [`${whoA}: day stem ⟨${a.day.stem}⟩`, `${whoB}: day stem ⟨${b.day.stem}⟩`],
    sources: s.kind === 'clash' ? [STEM_CLASH_SRC] : [STEM_HE_SRC],
  });

  const branchFinding = (id: string, x: string, y: string, what: string, weight: number, extra: Source[]) => {
    const r = branchRelation(x, y);
    good += r.good.length * weight;
    bad += r.bad.length * weight;
    findings.push({
      id,
      text:
        r.good.length && !r.bad.length
          ? `${what} ⟨${x}⟩ and ⟨${y}⟩ are in harmony: ${r.good.join(' and ')}.`
          : r.bad.length && !r.good.length
            ? `${what} ⟨${x}⟩ and ⟨${y}⟩ meet with friction: ${r.bad.join(' and ')}. The classics advise care, not avoidance.`
            : r.bad.length
              ? `${what} ⟨${x}⟩ and ⟨${y}⟩ are both in harmony (${r.good.join(', ')}) and in friction (${r.bad.join(', ')}).`
              : `${what} ⟨${x}⟩ and ⟨${y}⟩ have no special relation.`,
      evidence: [`${whoA}: ⟨${x}⟩`, `${whoB}: ⟨${y}⟩`, ...r.good, ...r.bad],
      sources: [...extra, ...(r.kinds.length ? r.kinds.map((k) => BRANCH_SRC[k]) : [BRANCH_SRC['六合']])],
    });
  };
  branchFinding('compat.bazi.daybranch', a.day.branch, b.day.branch, 'Your spouse palaces (day branches)', 2, [SPOUSE_PALACE]);
  branchFinding('compat.bazi.year', a.year.branch, b.year.branch, 'Your birth-year signs', 1, []);
  return { good, bad, findings };
}
