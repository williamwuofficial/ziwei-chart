// Compatibility (合婚) between two charts.
//
// The 紫微斗數全書 has no method for comparing two people: it reads marriage from one chart only. The
// steps here follow a modern Taiwanese compilation, the 紫微斗數集成全書 (section 紫微斗數論合婚與夫妻關係大全),
// paraphrased, not quoted, since it is a modern work:
//   1. compare the main stars of both Life palaces, then of the current 大限 and 小限;
//   2. sort stars into groups (殺破狼, 機月同梁, 紫府 with 殺破狼, 巨日). The match is closest when one
//      person's 夫妻 palace group is the other's Life or Body palace group, best both ways (互垣);
//   3. compare the two 五行局.
// A last, separate layer compares the two 八字 (Four Pillars): day stems, day branches (the 八字
// spouse palace) and year branches, quoted from 三命通會 and 淵海子平 (see bazi.ts).
//
// The book never says when two sets of stars "get on" (和合) or "harm each other" (克害). This module
// reads that through the 全書's own star elements and the 五行 生克 cycle, and says so in the text.

import type { Finding } from './evaluate';
import type { ChartM, PalaceName } from './model';
import { xiaoxianIndex } from './xiaoxian';
import { Ctx, trines } from './predicates';
import { baziCompat, branchRelation, type Pillars } from './bazi';
import { altElementNote, BRANCH_ANIMAL, ELEMENT_EN, JU_ELEMENT, STAR_ELEMENT, type Element } from './rules/elements';
import { isZh, L, tr } from '../i18n/lang';
import type { Source } from './rules/types';

export type Layer = 'match' | 'partial' | 'differs' | 'none';

export interface CompatSection {
  id: string;
  title: string;
  /** Which source this layer rests on, shown as a small label. */
  basis: 'modern' | 'bazi';
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
      const wordZh = r === 'same' ? '同五行' : r === 'feeds' ? (GEN[ea] === eb ? `${ea}生${eb}` : `${eb}生${ea}`) : CTRL[ea] === eb ? `${ea}剋${eb}` : `${eb}剋${ea}`;
      pairs.push(L(`⟨${s}⟩ ${ELEMENT_EN[ea]} · ⟨${t}⟩ ${ELEMENT_EN[eb]}: ${word}`, `⟨${s}⟩屬${ea}・⟨${t}⟩屬${eb}：${wordZh}`));
    }
  if (!pairs.length) return { tone: 'none', pairs };
  for (const s of new Set([...a, ...b])) {
    const n = altElementNote(s);
    if (n) pairs.push(n);
  }
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

// ── The comparison ─────────────────────────────────────────────────────────

export interface Person {
  c: ChartM;
  /** "You" / "Your partner", used in the text. */
  who: string;
  whose: string;
  /** The 八字 pillars, when known. Without them only the year branches are compared. */
  pillars?: Pillars;
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
    s.stars.length ? s.stars.map((n) => `⟨${n}⟩`).join('') + (s.borrowed ? L(' (borrowed from the opposite palace)', '（借對宮）') : '') : L('no main stars', '無主星');

  // 1. Life-palace main stars.
  {
    const sa = mainStars(xa, xa.ming);
    const sb = mainStars(xb, xb.ming);
    const h = starHarmony(sa.stars, sb.stars);
    const both = L(`${A.whose} Life-palace stars (${starText(sa)}) and ${B.whose.toLowerCase()} (${starText(sb)})`, `${A.whose}命宮主星（${starText(sa)}）與${B.whose}（${starText(sb)}）`);
    const text =
      h.tone === 'match'
        ? L(`${both} get on by element: the book reads this as similar temperaments and an easy bond.`, `${both}五行相和：書中認為兩人性情相近，容易相處。`)
        : h.tone === 'differs'
          ? L(`${both} check each other by element: the book reads clashing Life stars as friction that needs patience on both sides.`, `${both}五行相剋：書中認為命星相剋主摩擦，需要雙方耐心。`)
          : h.tone === 'partial'
            ? L(`${both} partly get on and partly check each other by element: some common ground, some friction.`, `${both}五行有生有剋：有共通之處，也有摩擦。`)
            : L('Neither Life palace has main stars to compare, even borrowed.', '兩人命宮都沒有可比較的主星（借對宮也沒有）。');
    sections.push({
      id: 'compat.ming',
      title: L('Life-palace stars', '命宮主星'),
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
      L(
        `${p.whose} Life palace’s 三方 is ⟨${g.ming.group}⟩: ${GROUP_EN[g.ming.group]}${g.body.group !== g.ming.group ? `; the Body palace’s is ⟨${g.body.group}⟩` : ''}. ${p.whose} 夫妻 palace’s 三方, the kind of partner it looks for, is ⟨${g.fu.group}⟩.`,
        `${p.whose}命宮三方屬⟨${g.ming.group}⟩：${tr(GROUP_EN[g.ming.group])}${g.body.group !== g.ming.group ? `；身宮三方屬⟨${g.body.group}⟩` : ''}。${p.whose}夫妻宮三方，也就是所尋找的伴侶類型，屬⟨${g.fu.group}⟩。`,
      );
    findings.push({
      id: 'compat.groups',
      text: `${lifeText(A, ga)}${L(' ', '')}${lifeText(B, gb)}`,
      evidence: [
        `${A.who}: 命 ${ga.ming.stars.map((s) => `⟨${s}⟩`).join('')} · 身 ${ga.body.stars.map((s) => `⟨${s}⟩`).join('')} · 夫妻 ${ga.fu.stars.map((s) => `⟨${s}⟩`).join('')}`,
        `${B.who}: 命 ${gb.ming.stars.map((s) => `⟨${s}⟩`).join('')} · 身 ${gb.body.stars.map((s) => `⟨${s}⟩`).join('')} · 夫妻 ${gb.fu.stars.map((s) => `⟨${s}⟩`).join('')}`,
      ],
      sources: [GROUP_KIND_SRC],
    });
    const text =
      aToB && bToA
        ? L(
            'Each person’s 夫妻 group is the other’s own group, both ways (互垣): the book’s best match, a couple who understand each other and can weather trouble.',
            '雙方的夫妻宮組合都正是對方本身的組合（互垣）：書中最理想的配對，彼此了解，能共度難關。',
          )
        : aToB || bToA
          ? L(
              `${aToB ? A.whose : B.whose} 夫妻 group matches ${aToB ? B.whose.toLowerCase() : A.whose.toLowerCase()} own group, but not the other way round: one of you is the kind of partner the other’s chart looks for, while the reverse fit is looser.`,
              `${aToB ? A.whose : B.whose}夫妻宮組合與${aToB ? B.whose : A.whose}本身的組合相合，反過來卻不然：其中一人正是對方命盤所尋找的伴侶，另一方向則較鬆散。`,
            )
          : L(
              'Neither 夫妻 group matches the other person’s own group. The book says this does not rule a couple out: it works when one gives way rather than competing, though it is less easy-going.',
              '雙方的夫妻宮組合都與對方本身的組合不同。書中說這並不表示不能在一起：只要一方肯讓步、不互相較勁就行，只是相處沒那麼輕鬆。',
            );
    findings.push({
      id: 'compat.huyuan',
      text,
      evidence: [
        L(`${A.whose} 夫妻 ⟨${ga.fu.group}⟩ vs ${B.whose.toLowerCase()} 命 ⟨${gb.ming.group}⟩ / 身 ⟨${gb.body.group}⟩: ${aToB ? 'match' : 'no match'}`, `${A.whose}夫妻⟨${ga.fu.group}⟩ 對 ${B.whose}命⟨${gb.ming.group}⟩／身⟨${gb.body.group}⟩：${aToB ? '相合' : '不合'}`),
        L(`${B.whose} 夫妻 ⟨${gb.fu.group}⟩ vs ${A.whose.toLowerCase()} 命 ⟨${ga.ming.group}⟩ / 身 ⟨${ga.body.group}⟩: ${bToA ? 'match' : 'no match'}`, `${B.whose}夫妻⟨${gb.fu.group}⟩ 對 ${A.whose}命⟨${ga.ming.group}⟩／身⟨${ga.body.group}⟩：${bToA ? '相合' : '不合'}`),
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
          ? L(
              `${p.whose} 夫妻 palace holds ${stars.map((s) => `⟨${s}⟩`).join('')}, a main star of ${q.whose.toLowerCase()} Life or Body palace${tri.length ? `, and ${q.whose.toLowerCase()} stars also sit in ${p.whose.toLowerCase()} Life-palace 三合` : ''}.`,
              `${p.whose}夫妻宮有${stars.map((s) => `⟨${s}⟩`).join('')}，正是${q.whose}命宮或身宮的主星${tri.length ? `，而${q.whose}的星也在${p.whose}命宮三合之中` : ''}。`,
            )
          : '';
      const none = L('none', '無');
      findings.push({
        id: 'compat.direct',
        text: `${[line(A, B, dAB, sBA), line(B, A, dBA, sAB)].filter(Boolean).join(L(' ', ''))}${L(' The book counts this as a closer fit than sharing a group.', '書中認為這比同屬一組更為相配。')}`,
        evidence: [
          L(`${A.whose} 夫妻 stars in ${B.whose.toLowerCase()} 命/身`, `${A.whose}夫妻宮星在${B.whose}命／身`) + `${L(': ', '：')}${dAB.map((s) => `⟨${s}⟩`).join('') || none}`,
          L(`${B.whose} 夫妻 stars in ${A.whose.toLowerCase()} 命/身`, `${B.whose}夫妻宮星在${A.whose}命／身`) + `${L(': ', '：')}${dBA.map((s) => `⟨${s}⟩`).join('') || none}`,
          L(`${B.whose} 命/身 stars in ${A.whose.toLowerCase()} 三合`, `${B.whose}命／身星在${A.whose}三合`) + `${L(': ', '：')}${sAB.map((s) => `⟨${s}⟩`).join('') || none}`,
          L(`${A.whose} 命/身 stars in ${B.whose.toLowerCase()} 三合`, `${A.whose}命／身星在${B.whose}三合`) + `${L(': ', '：')}${sBA.map((s) => `⟨${s}⟩`).join('') || none}`,
        ],
        sources: [STAR_DIRECT_SRC],
      });
    }
    const n = Number(aToB) + Number(bToA);
    sections.push({ id: 'compat.groups', title: L('Star groups and 互垣', '星曜組合與互垣'), basis: 'modern', tone: n === 2 ? 'match' : n === 1 ? 'partial' : 'differs', findings });
  }

  // 3. 五行局.
  if (A.c.ju && B.c.ju) {
    const ea = JU_ELEMENT[A.c.ju];
    const eb = JU_ELEMENT[B.c.ju];
    const same = A.c.ju === B.c.ju;
    const TEMPER: Record<string, string> = !isZh()
      ? { 水二局: 'quick-witted and changeable', 木三局: 'cheerful and orderly', 金四局: 'blunt and sharp', 土五局: 'practical and easy-going', 火六局: 'active and forceful' }
      : { 水二局: '機靈多變', 木三局: '開朗有條理', 金四局: '直率犀利', 土五局: '務實隨和', 火六局: '積極強勢' };
    sections.push({
      id: 'compat.ju',
      title: L('Element class (五行局)', '五行局'),
      basis: 'modern',
      tone: same ? 'match' : 'partial',
      findings: [
        {
          id: 'compat.ju',
          text: same
            ? L(`You share the same element class, ⟨${A.c.ju}⟩ (${TEMPER[A.c.ju]}): a similar pace and manner.`, `兩人同為⟨${A.c.ju}⟩（${TEMPER[A.c.ju]}）：步調和作風相近。`)
            : L(
                `${A.whose} element class is ⟨${A.c.ju}⟩ (${TEMPER[A.c.ju] ?? ''}) and ${B.whose.toLowerCase()} is ⟨${B.c.ju}⟩ (${TEMPER[B.c.ju] ?? ''}). The book only asks whether they are the same; it gives no rule for which different classes suit each other.`,
                `${A.whose}五行局是⟨${A.c.ju}⟩（${TEMPER[A.c.ju] ?? ''}），${B.whose}是⟨${B.c.ju}⟩（${TEMPER[B.c.ju] ?? ''}）。書中只看兩人是否相同，沒有說明哪些不同的局較為相配。`,
              ),
          evidence: [L(`${A.who}: ⟨${A.c.ju}⟩ (${ELEMENT_EN[ea]})`, `${A.who}：⟨${A.c.ju}⟩`), L(`${B.who}: ⟨${B.c.ju}⟩ (${ELEMENT_EN[eb]})`, `${B.who}：⟨${B.c.ju}⟩`)],
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
        const wordZh = { match: '相和', differs: '相剋', partial: '有生有剋', none: '沒有可比較的主星' }[hh.tone];
        const pn = (c: ChartM, i: number) => L(c.palaces[i].name, c.palaces[i].name === '命宮' ? '命宮' : `${c.palaces[i].name}宮`);
        findings.push({
          id: `compat.${zh === '大限' ? 'decade' : 'xiaoxian'}`,
          text: L(
            `In ${year}, your ${en} (${zh}) fall on ${A.whose.toLowerCase()} ${A.c.palaces[ia].name as PalaceName} (${starText(sa)}) and ${B.whose.toLowerCase()} ${B.c.palaces[ib].name as PalaceName} (${starText(sb)}): their stars ${word}.${hh.tone === 'differs' ? ' The book reads clashing period stars as a time of more arguments; it passes with the period.' : ''}`,
            `${year}年，兩人的${zh}分別落在${A.whose}${pn(A.c, ia)}（${starText(sa)}）和${B.whose}${pn(B.c, ib)}（${starText(sb)}）：星曜${wordZh}。${hh.tone === 'differs' ? '書中認為運限星曜相剋時爭吵較多，運限一過就會好轉。' : ''}`,
          ),
          evidence: [L(`${A.who}, age ${ageA}: ${zh} ${lab(xa, ia)}`, `${A.who}，${ageA}歲：${zh}${lab(xa, ia)}`), L(`${B.who}, age ${ageB}: ${zh} ${lab(xb, ib)}`, `${B.who}，${ageB}歲：${zh}${lab(xb, ib)}`), ...hh.pairs],
          sources: [PERIOD_SRC, ELEMENT_SRC],
        });
      }
    if (findings.length) sections.push({ id: 'compat.periods', title: L(`Current periods (${year})`, `目前運限（${year}年）`), basis: 'modern', tone: toneOf(good, bad), findings });
  }

  // 5. 八字 (Four Pillars).
  {
    const a = A.c.yearBranch;
    const b = B.c.yearBranch;
    const an = BRANCH_ANIMAL[a];
    const bn = BRANCH_ANIMAL[b];
    if (A.pillars && B.pillars) {
      const m = baziCompat(A.pillars, B.pillars, A.who, B.who);
      const yr = m.findings.find((f) => f.id === 'compat.bazi.year')!;
      yr.text = yr.text.replace(`Your birth-year signs ⟨${a}⟩ and ⟨${b}⟩`, `Your birth-year signs, ⟨${a}⟩ ${an.en} and ⟨${b}⟩ ${bn.en},`);
      sections.push({ id: 'compat.bazi', title: L('Four Pillars (八字)', '八字'), basis: 'bazi', tone: toneOf(m.good, m.bad), findings: m.findings });
    } else {
      const r = branchRelation(a, b);
      sections.push({
        id: 'compat.bazi',
        title: L('Four Pillars (八字)', '八字'),
        basis: 'bazi',
        tone: toneOf(r.good.length, r.bad.length),
        findings: [
          {
            id: 'compat.bazi.year',
            text: L(
              `Your birth-year signs, ${an.en} (${an.zh}) and ${bn.en} (${bn.zh}), ${r.good.length ? `are in harmony (${r.good.join(', ')})` : ''}${r.good.length && r.bad.length ? ' and ' : ''}${r.bad.length ? `meet with friction (${r.bad.join(', ')})` : ''}${!r.good.length && !r.bad.length ? 'have no special relation' : ''}.`,
              `兩人生肖屬${an.zh}和屬${bn.zh}，${r.good.length ? `相合（${r.good.join('、')}）` : ''}${r.good.length && r.bad.length ? '，但也' : ''}${r.bad.length ? `有摩擦（${r.bad.join('、')}）` : ''}${!r.good.length && !r.bad.length ? '沒有特別的關係' : ''}。`,
            ),
            evidence: [`${A.who}${L(': ', '：')}⟨${a}⟩`, `${B.who}${L(': ', '：')}⟨${b}⟩`],
            sources: [{ basis: '八字 branch relations (三命通會 卷二)' }],
          },
        ],
      });
    }
  }

  return { sections, limits: LIMITS };
}

export const LIMITS = [
  'The classical 紫微斗數全書 has no method for comparing two charts. Everything above except the 八字 layer follows one modern compilation, the 紫微斗數集成全書; other modern schools (such as the flying-四化 schools) compare charts differently and may disagree.',
  'That book never says when two sets of stars “get on” or “harm each other”. This app judges it by each star’s element in the 全書 and the 五行 cycle, which is its own reading, not the book’s.',
  'The book names four star groups. Charts whose stars fit none of them (紫府廉武相) get a label from this app, with no description from the book.',
  'Both birth times matter: the Life and Body palaces move every two hours, so a wrong 時辰 for either person changes most of this comparison. The partner’s chart uses the 時辰 only, without true solar time.',
  'The 八字 layer compares the day stems, the day branches (the 八字 spouse palace) and the birth-year signs. It does not weigh whole charts against each other (each person’s useful element, 用神), where 八字 schools disagree most. Day pillars change at midnight, or at 23:00 with the late-子-hour setting, so a birth near midnight needs care.',
  'There is no overall score. The book gives none, and its own advice is that a mismatch works when one partner gives way. A number would suggest a precision the method does not have.',
  'The method was written for husband and wife. Nothing in the rules depends on gender except the direction of the 10-year periods, so it reads the same for any couple, but no published couple cases were available to test it against.',
  'It describes temperament and fit, not whether a relationship will last. That depends on the two people.',
];
