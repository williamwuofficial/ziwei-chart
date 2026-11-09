// Compatibility (合婚) between two charts.
//
// The 紫微斗數全書 has no method for comparing two people: it reads marriage from one chart only. The
// steps here follow a modern Taiwanese compilation, the 紫微斗數集成全書 (section 紫微斗數論合婚與夫妻關係大全),
// paraphrased, not quoted, since it is a modern work:
//   1. compare the main stars of both Life palaces, then of the current 大限 and 小限;
//   2. sort stars into groups (殺破狼, 機月同梁, 紫府 with 殺破狼, 巨日). The match is closest when one
//      person's 夫妻 palace group is the other's Life or Body palace group, best both ways (互垣);
//   3. compare the two 五行局.
// A last, separate layer is folk 生肖 matching from the 地支 relations, which belongs to the 八字
// tradition, not to 斗數.
//
// The book never says when two sets of stars "get on" (和合) or "harm each other" (克害). This module
// reads that through the 全書's own star elements and the 五行 生克 cycle, and says so in the text.

import type { Finding } from './evaluate';
import type { ChartM, PalaceName } from './model';
import { xiaoxianIndex } from './xiaoxian';
import { Ctx, trines } from './predicates';
import { BRANCH_ANIMAL, ELEMENT_EN, JU_ELEMENT, STAR_ELEMENT, type Element } from './rules/elements';
import type { Source } from './rules/types';

export type Layer = 'match' | 'partial' | 'differs' | 'none';

export interface CompatSection {
  id: string;
  title: string;
  /** Which source this layer rests on, shown as a small label. */
  basis: 'modern' | 'folk';
  tone: Layer;
  findings: Finding[];
}

export interface Compat {
  sections: CompatSection[];
  /** What this comparison cannot tell you, shown with every result. */
  limits: string[];
}

// ── Sources ────────────────────────────────────────────────────────────────

const JICHENG = '紫微斗數集成全書 (modern compilation), 紫微斗數論合婚與夫妻關係大全';
const STARS_SRC: Source = {
  basis: `${JICHENG}: first compare the main stars of the two Life palaces; stars that get on mean similar temperaments and an easy bond, stars that harm each other mean friction`,
};
const ELEMENT_SRC: Source = {
  basis: 'The book does not say when stars “get on”. This app reads it through each star’s element in the 全書 (卷一, e.g. 紫微屬土) and the 五行 cycle: the same element or one feeding the other (相生) counts as getting on; one checking the other (相剋) counts as friction',
};
const PERIOD_SRC: Source = { basis: `${JICHENG}: next compare the main stars of the two people’s 大限 and 小限 palaces in the same way` };
const GROUP_SRC: Source = {
  basis: `${JICHENG}: sort the stars of the 夫妻 palace’s 三方 and of the partner’s Life and Body palaces’ 三方 into groups. When one person’s 夫妻 group is the other’s Life or Body group they understand each other; when it works both ways (互垣) it is the best match. Different groups do not rule a couple out: it then depends on one giving way`,
};
const GROUP_KIND_SRC: Source = {
  basis: `${JICHENG}, 合婚與結婚年秘斷: 殺破狼 in the Life or Body 三方 is bold and changeable; 機月同梁 careful and steady; 紫微 or 天府 with 殺破狼 between the two; 巨門 with 太陽 steady and firm`,
};
const STAR_DIRECT_SRC: Source = {
  basis: `${JICHENG}, simple rule: a close match when the stars of one person’s 夫妻 palace are the main stars of the other’s Life or Body palace, and the other’s Life or Body stars also sit in the first person’s Life-palace 三合`,
};
const JU_SRC: Source = {
  basis: `${JICHENG}: beyond the star groups, note whether the two 五行局 are the same. 水二局 quick-witted and changeable, 木三局 cheerful and orderly, 金四局 blunt and sharp, 土五局 practical and easy-going, 火六局 active and forceful`,
};
const ZODIAC_SRC: Source = {
  basis: 'Folk 生肖 matching from the 地支 relations (三合, 六合, 六沖, 六害, 相刑) as set out in 《三命通會》 (明, 萬民英) 卷二. This belongs to 八字 and almanac practice, not to 紫微斗數, and it applies to everyone born in the same year',
};

// ── Star elements and groups ───────────────────────────────────────────────

const GEN: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }; // 相生
const CTRL: Record<Element, Element> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }; // 相剋

export type ElementRelation = 'same' | 'feeds' | 'checks';
export function elementRelation(a: Element, b: Element): ElementRelation {
  if (a === b) return 'same';
  if (GEN[a] === b || GEN[b] === a) return 'feeds';
  return 'checks';
}

/** Main stars of a palace, borrowed from the opposite palace when it has none. */
function mainStars(x: Ctx, i: number): { stars: string[]; borrowed: boolean } {
  if (!x.noMain(i)) return { stars: x.majors(i), borrowed: false };
  return { stars: x.majors((i + 6) % 12), borrowed: true };
}

/** Compare two sets of main stars by element, pair by pair. */
export function starHarmony(a: string[], b: string[]): { tone: Layer; pairs: string[] } {
  const pairs: string[] = [];
  let good = 0;
  let bad = 0;
  for (const s of a)
    for (const t of b) {
      const ea = STAR_ELEMENT[s]?.el;
      const eb = STAR_ELEMENT[t]?.el;
      if (!ea || !eb) continue;
      const r = elementRelation(ea, eb);
      if (r === 'checks') bad++;
      else good++;
      const word = r === 'same' ? 'same element' : r === 'feeds' ? `${GEN[ea] === eb ? ELEMENT_EN[ea] + ' feeds ' + ELEMENT_EN[eb] : ELEMENT_EN[eb] + ' feeds ' + ELEMENT_EN[ea]}` : `${CTRL[ea] === eb ? ELEMENT_EN[ea] + ' checks ' + ELEMENT_EN[eb] : ELEMENT_EN[eb] + ' checks ' + ELEMENT_EN[ea]}`;
      pairs.push(`⟨${s}⟩ ${ELEMENT_EN[ea]} · ⟨${t}⟩ ${ELEMENT_EN[eb]}: ${word}`);
    }
  if (!pairs.length) return { tone: 'none', pairs };
  return { tone: bad === 0 ? 'match' : good === 0 ? 'differs' : 'partial', pairs };
}

export type StarGroup = '殺破狼' | '紫府殺破狼' | '機月同梁' | '巨日' | '紫府廉武相';
export const GROUP_EN: Record<StarGroup, string> = {
  殺破狼: 'bold and changeable, drawn to change and new ventures',
  紫府殺破狼: 'between reform and caution, with a taste for leading',
  機月同梁: 'careful and steady, a planner who prefers security',
  巨日: 'steady and firm, holds to its views',
  紫府廉武相: 'not one of the book’s four types, so the book gives no description',
};

/** The star group of a palace's 三方 (the palace and its two trines), per the 集成全書 types. */
export function starGroup(x: Ctx, i: number): { group: StarGroup; stars: string[] } {
  const set = [i, ...trines(i)];
  const stars = [...new Set(set.flatMap((k) => mainStars(x, k).stars))];
  const has = (...n: string[]) => n.some((s) => stars.includes(s));
  let group: StarGroup;
  if (has('七殺', '破軍', '貪狼')) group = has('紫微', '天府') ? '紫府殺破狼' : '殺破狼';
  else if (set.some((k) => x.has(k, '太陽', '巨門'))) group = '巨日';
  else if (stars.filter((s) => ['天機', '太陰', '天同', '天梁'].includes(s)).length >= 2) group = '機月同梁';
  else group = '紫府廉武相';
  return { group, stars };
}

/** 紫府殺破狼 counts as meeting 殺破狼: it is that group with 紫微 or 天府 added. */
const sameFamily = (a: StarGroup, b: StarGroup) => a === b || (a.endsWith('殺破狼') && b.endsWith('殺破狼'));

// ── Zodiac ─────────────────────────────────────────────────────────────────

const SANHE = ['申子辰', '亥卯未', '寅午戌', '巳酉丑'];
const LIUHE = ['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未'];
const LIUHAI = ['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌'];
const XING = ['寅巳', '巳申', '寅申', '丑戌', '戌未', '丑未', '子卯'];
const SELF_XING = '辰午酉亥';
const ORDER = '子丑寅卯辰巳午未申酉戌亥';
const pairIn = (list: string[], a: string, b: string) => list.some((p) => p.includes(a) && p.includes(b) && a !== b);

export interface ZodiacRelation {
  good: string[];
  bad: string[];
}
export function zodiacRelation(a: string, b: string): ZodiacRelation {
  const good: string[] = [];
  const bad: string[] = [];
  if (pairIn(SANHE, a, b)) good.push('三合 (same trine)');
  if (pairIn(LIUHE, a, b)) good.push('六合 (paired)');
  if ((ORDER.indexOf(a) + 6) % 12 === ORDER.indexOf(b)) bad.push('六沖 (opposite signs clash)');
  if (pairIn(LIUHAI, a, b)) bad.push('六害 (harm)');
  if (pairIn(XING, a, b)) bad.push('相刑 (punishment)');
  if (a === b && SELF_XING.includes(a)) bad.push('自刑 (self-punishment, same sign)');
  return { good, bad };
}

// ── The comparison ─────────────────────────────────────────────────────────

export interface Person {
  c: ChartM;
  /** "You" / "Your partner", used in the text. */
  who: string;
  whose: string;
}

function decadeAt(c: ChartM, age: number): number {
  return c.palaces.findIndex((p) => age >= p.decade[0] && age <= p.decade[1]);
}

const toneOf = (good: number, bad: number): Layer => (good && !bad ? 'match' : bad && !good ? 'differs' : good || bad ? 'partial' : 'none');

/** Compare chart A (the main chart) with chart B. `year` is the calendar year for the current periods. */
export function compare(A: Person, B: Person, year = new Date().getFullYear()): Compat {
  const xa = new Ctx(A.c);
  const xb = new Ctx(B.c);
  const sections: CompatSection[] = [];
  const lab = (x: Ctx, i: number) => x.label(i);
  const starText = (s: { stars: string[]; borrowed: boolean }) =>
    s.stars.length ? s.stars.map((n) => `⟨${n}⟩`).join('') + (s.borrowed ? ' (borrowed from the opposite palace)' : '') : 'no main stars';

  // 1. Life-palace main stars.
  {
    const sa = mainStars(xa, xa.ming);
    const sb = mainStars(xb, xb.ming);
    const h = starHarmony(sa.stars, sb.stars);
    const text =
      h.tone === 'match'
        ? `${A.whose} Life-palace stars (${starText(sa)}) and ${B.whose.toLowerCase()} (${starText(sb)}) get on by element: the book reads this as similar temperaments and an easy bond.`
        : h.tone === 'differs'
          ? `${A.whose} Life-palace stars (${starText(sa)}) and ${B.whose.toLowerCase()} (${starText(sb)}) check each other by element: the book reads clashing Life stars as friction that needs patience on both sides.`
          : h.tone === 'partial'
            ? `${A.whose} Life-palace stars (${starText(sa)}) and ${B.whose.toLowerCase()} (${starText(sb)}) partly get on and partly check each other by element: some common ground, some friction.`
            : 'Neither Life palace has main stars to compare, even borrowed.';
    sections.push({
      id: 'compat.ming',
      title: 'Life-palace stars',
      basis: 'modern',
      tone: h.tone,
      findings: [{ id: 'compat.ming', text, evidence: [`${A.who}: ${lab(xa, xa.ming)}`, `${B.who}: ${lab(xb, xb.ming)}`, ...h.pairs], sources: [STARS_SRC, ELEMENT_SRC] }],
    });
  }

  // 2. Star groups and 互垣.
  {
    const findings: Finding[] = [];
    const ga = { fu: starGroup(xa, xa.byName('夫妻')), ming: starGroup(xa, xa.ming), body: starGroup(xa, xa.body) };
    const gb = { fu: starGroup(xb, xb.byName('夫妻')), ming: starGroup(xb, xb.ming), body: starGroup(xb, xb.body) };
    const aToB = sameFamily(ga.fu.group, gb.ming.group) || sameFamily(ga.fu.group, gb.body.group);
    const bToA = sameFamily(gb.fu.group, ga.ming.group) || sameFamily(gb.fu.group, ga.body.group);
    const lifeText = (p: Person, g: typeof ga) =>
      `${p.whose} Life palace’s 三方 is ⟨${g.ming.group}⟩: ${GROUP_EN[g.ming.group]}${g.body.group !== g.ming.group ? `; the Body palace’s is ⟨${g.body.group}⟩` : ''}. ${p.whose} 夫妻 palace’s 三方, the kind of partner it looks for, is ⟨${g.fu.group}⟩.`;
    findings.push({
      id: 'compat.groups',
      text: `${lifeText(A, ga)} ${lifeText(B, gb)}`,
      evidence: [
        `${A.who}: 命 ${ga.ming.stars.map((s) => `⟨${s}⟩`).join('')} · 身 ${ga.body.stars.map((s) => `⟨${s}⟩`).join('')} · 夫妻 ${ga.fu.stars.map((s) => `⟨${s}⟩`).join('')}`,
        `${B.who}: 命 ${gb.ming.stars.map((s) => `⟨${s}⟩`).join('')} · 身 ${gb.body.stars.map((s) => `⟨${s}⟩`).join('')} · 夫妻 ${gb.fu.stars.map((s) => `⟨${s}⟩`).join('')}`,
      ],
      sources: [GROUP_KIND_SRC],
    });
    const text =
      aToB && bToA
        ? 'Each person’s 夫妻 group is the other’s own group, both ways (互垣): the book’s best match, a couple who understand each other and can weather trouble.'
        : aToB || bToA
          ? `${aToB ? A.whose : B.whose} 夫妻 group matches ${aToB ? B.whose.toLowerCase() : A.whose.toLowerCase()} own group, but not the other way round: one of you is the kind of partner the other’s chart looks for, while the reverse fit is looser.`
          : 'Neither 夫妻 group matches the other person’s own group. The book says this does not rule a couple out: it works when one gives way rather than competing, though it is less easy-going.';
    findings.push({
      id: 'compat.huyuan',
      text,
      evidence: [
        `${A.whose} 夫妻 ⟨${ga.fu.group}⟩ vs ${B.whose.toLowerCase()} 命 ⟨${gb.ming.group}⟩ / 身 ⟨${gb.body.group}⟩: ${aToB ? 'match' : 'no match'}`,
        `${B.whose} 夫妻 ⟨${gb.fu.group}⟩ vs ${A.whose.toLowerCase()} 命 ⟨${ga.ming.group}⟩ / 身 ⟨${ga.body.group}⟩: ${bToA ? 'match' : 'no match'}`,
      ],
      sources: [GROUP_SRC],
    });

    // The book's stricter version: the 夫妻 palace's own stars are the partner's Life or Body stars.
    const direct = (x: Ctx, y: Ctx) => {
      const fu = mainStars(x, x.byName('夫妻')).stars;
      const own = [...mainStars(y, y.ming).stars, ...mainStars(y, y.body).stars];
      return fu.filter((s) => own.includes(s));
    };
    const inSanhe = (x: Ctx, y: Ctx) => {
      const own = [...new Set([...mainStars(y, y.ming).stars, ...mainStars(y, y.body).stars])];
      const set = [x.ming, ...trines(x.ming)].flatMap((k) => x.majors(k));
      return own.filter((s) => set.includes(s));
    };
    const dAB = direct(xa, xb);
    const dBA = direct(xb, xa);
    const sAB = inSanhe(xa, xb);
    const sBA = inSanhe(xb, xa);
    if (dAB.length || dBA.length) {
      const line = (p: Person, q: Person, stars: string[], tri: string[]) =>
        stars.length
          ? `${p.whose} 夫妻 palace holds ${stars.map((s) => `⟨${s}⟩`).join('')}, a main star of ${q.whose.toLowerCase()} Life or Body palace${tri.length ? `, and ${q.whose.toLowerCase()} stars also sit in ${p.whose.toLowerCase()} Life-palace 三合` : ''}.`
          : '';
      findings.push({
        id: 'compat.direct',
        text: `${[line(A, B, dAB, sBA), line(B, A, dBA, sAB)].filter(Boolean).join(' ')} The book counts this as a closer fit than sharing a group.`,
        evidence: [
          `${A.whose} 夫妻 stars in ${B.whose.toLowerCase()} 命/身: ${dAB.map((s) => `⟨${s}⟩`).join('') || 'none'}`,
          `${B.whose} 夫妻 stars in ${A.whose.toLowerCase()} 命/身: ${dBA.map((s) => `⟨${s}⟩`).join('') || 'none'}`,
          `${B.whose} 命/身 stars in ${A.whose.toLowerCase()} 三合: ${sAB.map((s) => `⟨${s}⟩`).join('') || 'none'}`,
          `${A.whose} 命/身 stars in ${B.whose.toLowerCase()} 三合: ${sBA.map((s) => `⟨${s}⟩`).join('') || 'none'}`,
        ],
        sources: [STAR_DIRECT_SRC],
      });
    }
    const n = Number(aToB) + Number(bToA);
    sections.push({ id: 'compat.groups', title: 'Star groups and 互垣', basis: 'modern', tone: n === 2 ? 'match' : n === 1 ? 'partial' : 'differs', findings });
  }

  // 3. 五行局.
  if (A.c.ju && B.c.ju) {
    const ea = JU_ELEMENT[A.c.ju];
    const eb = JU_ELEMENT[B.c.ju];
    const same = A.c.ju === B.c.ju;
    const TEMPER: Record<string, string> = { 水二局: 'quick-witted and changeable', 木三局: 'cheerful and orderly', 金四局: 'blunt and sharp', 土五局: 'practical and easy-going', 火六局: 'active and forceful' };
    sections.push({
      id: 'compat.ju',
      title: 'Element class (五行局)',
      basis: 'modern',
      tone: same ? 'match' : 'partial',
      findings: [
        {
          id: 'compat.ju',
          text: same
            ? `You share the same element class, ⟨${A.c.ju}⟩ (${TEMPER[A.c.ju]}): a similar pace and manner.`
            : `${A.whose} element class is ⟨${A.c.ju}⟩ (${TEMPER[A.c.ju] ?? ''}) and ${B.whose.toLowerCase()} is ⟨${B.c.ju}⟩ (${TEMPER[B.c.ju] ?? ''}). The book only asks whether they are the same; it gives no rule for which different classes suit each other.`,
          evidence: [`${A.who}: ⟨${A.c.ju}⟩ (${ELEMENT_EN[ea]})`, `${B.who}: ⟨${B.c.ju}⟩ (${ELEMENT_EN[eb]})`],
          sources: [JU_SRC],
        },
      ],
    });
  }

  // 4. Current 大限 and 小限.
  if (A.c.lunarYear !== undefined && B.c.lunarYear !== undefined) {
    const ageA = year - A.c.lunarYear + 1;
    const ageB = year - B.c.lunarYear + 1;
    const findings: Finding[] = [];
    let good = 0;
    let bad = 0;
    const kinds: [string, string, (p: Person, age: number) => number][] = [
      ['大限', '10-year periods', (p, age) => decadeAt(p.c, age)],
      ['小限', 'age palaces this year', (p, age) => xiaoxianIndex(p.c, age)],
    ];
    if (ageA >= 1 && ageB >= 1)
      for (const [zh, en, at] of kinds) {
        const ia = at(A, ageA);
        const ib = at(B, ageB);
        if (ia < 0 || ib < 0) continue;
        const sa = mainStars(xa, ia);
        const sb = mainStars(xb, ib);
        const hh = starHarmony(sa.stars, sb.stars);
        if (hh.tone === 'match') good++;
        else if (hh.tone === 'differs') bad++;
        else if (hh.tone === 'partial') (good++, bad++);
        const word = { match: 'get on', differs: 'check each other', partial: 'partly get on and partly check each other', none: 'have no main stars to compare' }[hh.tone];
        findings.push({
          id: `compat.${zh === '大限' ? 'decade' : 'xiaoxian'}`,
          text: `In ${year}, your ${en} (${zh}) fall on ${A.whose.toLowerCase()} ${A.c.palaces[ia].name as PalaceName} (${starText(sa)}) and ${B.whose.toLowerCase()} ${B.c.palaces[ib].name as PalaceName} (${starText(sb)}): their stars ${word}.${hh.tone === 'differs' ? ' The book reads clashing period stars as a time of more arguments; it passes with the period.' : ''}`,
          evidence: [`${A.who}, age ${ageA}: ${zh} ${lab(xa, ia)}`, `${B.who}, age ${ageB}: ${zh} ${lab(xb, ib)}`, ...hh.pairs],
          sources: [PERIOD_SRC, ELEMENT_SRC],
        });
      }
    if (findings.length) sections.push({ id: 'compat.periods', title: `Current periods (${year})`, basis: 'modern', tone: toneOf(good, bad), findings });
  }

  // 5. Zodiac.
  {
    const a = A.c.yearBranch;
    const b = B.c.yearBranch;
    const r = zodiacRelation(a, b);
    const an = BRANCH_ANIMAL[a];
    const bn = BRANCH_ANIMAL[b];
    const both = `⟨${a}⟩ ${an.zh} ${an.en} and ⟨${b}⟩ ${bn.zh} ${bn.en}`;
    const text = r.good.length && !r.bad.length
      ? `${both} are a favourable pairing in folk 生肖 matching: ${r.good.join(' and ')}.`
      : r.bad.length && !r.good.length
        ? `${both} are an uneasy pairing in folk 生肖 matching: ${r.bad.join(' and ')}. Almanacs advise care rather than avoidance.`
        : r.bad.length
          ? `${both} are both favourable (${r.good.join(', ')}) and uneasy (${r.bad.join(', ')}) in folk 生肖 matching.`
          : `${both} have no special relation in folk 生肖 matching: neither favoured nor warned against.`;
    sections.push({
      id: 'compat.zodiac',
      title: 'Zodiac signs (生肖)',
      basis: 'folk',
      tone: toneOf(r.good.length, r.bad.length),
      findings: [{ id: 'compat.zodiac', text, evidence: [`${A.who}: born in a ⟨${a}⟩ year`, `${B.who}: born in a ⟨${b}⟩ year`, ...r.good, ...r.bad], sources: [ZODIAC_SRC] }],
    });
  }

  return { sections, limits: LIMITS };
}

export const LIMITS = [
  'The classical 紫微斗數全書 has no method for comparing two charts. Everything above except the zodiac follows one modern compilation, the 紫微斗數集成全書; other modern schools (such as the flying-四化 schools) compare charts differently and may disagree.',
  'That book never says when two sets of stars “get on” or “harm each other”. This app judges it by each star’s element in the 全書 and the 五行 cycle, which is its own reading, not the book’s.',
  'The book names four star groups. Charts whose stars fit none of them (紫府廉武相) get a label from this app, with no description from the book.',
  'Both birth times matter: the Life and Body palaces move every two hours, so a wrong 時辰 for either person changes most of this comparison. The partner’s chart uses the 時辰 only, without true solar time.',
  'The zodiac layer is folk 生肖 matching from the 八字 tradition. It is the same for everyone born in those years, so it says very little about two particular people.',
  'There is no overall score. The book gives none, and its own advice is that a mismatch works when one partner gives way. A number would suggest a precision the method does not have.',
  'The method was written for husband and wife. Nothing in the rules depends on gender except the direction of the 10-year periods, so it reads the same for any couple, but no published couple cases were available to test it against.',
  'It describes temperament and fit, not whether a relationship will last. That depends on the two people.',
];
