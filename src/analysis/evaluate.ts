import type { ChartM, Mut, PalaceName } from './model';
import { Ctx, opp, sfsz } from './predicates';
import { ALL_PATTERNS } from './rules/patterns';
import {
  BODY_QUOTE, BODY_TEXT, JICHONG_BASIS, MAJOR_NATURE, MAJOR_QUOTE, MINOR_BASIS, MINOR_NATURE, MINOR_QUOTE, MUT_BASIS,
  MUT_QUOTE, MUT_TEXT, PAIR_BASIS, palaceTitle, PAIR_NOTES, PAIR_QUOTE, pairKey, PALACE_DOMAIN, STAR_BASIS,
} from './rules/stars';
import type { PatternRule, PatternStatus, Source } from './rules/types';
import { mingClassics, palaceClassics } from './juan2Read';
import { palaceAdvice } from './advice';
import { isZh, L, join, tr } from '../i18n/lang';
import { evidenceZh } from '../i18n/evidence';
import { altElementNote, BRANCH_ANIMAL, COLOUR_BASIS, ELEMENT_COLOUR, ELEMENT_EN, JU_ELEMENT, STAR_ELEMENT } from './rules/elements';

/** One statement in the analysis, with everything needed for its "Why?" panel. */
export interface Finding {
  id: string;
  text: string;
  evidence: string[];
  sources: Source[];
  /** A note on what the sources advise doing about it (趨吉避凶), shown apart from the readings. */
  advice?: boolean;
}

export interface PatternFinding extends Finding {
  rule: PatternRule;
  status: PatternStatus;
  palaces: number[];
}

export interface PalaceCard {
  index: number;
  name: PalaceName;
  en: string;
  domain: string;
  tone: 'supported' | 'mixed' | 'pressured' | 'neutral';
  findings: Finding[];
}

export interface Analysis {
  overview: Finding[];
  patterns: PatternFinding[];
  palaces: PalaceCard[];
}

const list = (xs: string[]) => join(xs.map((s) => `⟨${s}⟩`));


const STATUS_TEXT: Record<PatternStatus, (sup: string[], bad: string[]) => string> = {
  formed: (sup) =>
    L(
      `Supported by ${list(sup)} and free of 四煞, 空劫 and 化忌 in the 三方四正, so the classical reading applies in full.`,
      `得${list(sup)}扶助，三方四正不見四煞、空劫、化忌，古書的論斷完整成立。`,
    ),
  flawed: (sup, bad) =>
    L(
      `Supporting stars are present (${list(sup)}), but so are ${list(bad)}. The classics call this 破格 (a flawed pattern): the promise shows, but it is delivered only in part, or at a cost.`,
      `有吉星扶助（${list(sup)}），但也見${list(bad)}。古書稱為破格：吉象雖然顯現，只能部分兌現，或要付出代價。`,
    ),
  bare: () =>
    L(
      'The structure is present, but without the supporting stars (六吉, 祿存 or 祿/權/科) the classics require, so its effect is modest.',
      '格局的結構已具備，但缺少古書要求的吉星（六吉、祿存或祿權科）扶助，作用有限。',
    ),
  broken: (_, bad) =>
    L(
      `The structure is present but meets ${list(bad)} with no supporting stars, so the classics treat it as broken: the potential is there but hard to realise.`,
      `格局的結構已具備，但遇${list(bad)}而無吉星扶助，古書視為破格：潛力雖在，卻難以發揮。`,
    ),
  present: () => '',
  mitigated: (sup) => L(`Lucky stars (${list(sup)}) in the 三方四正 soften this, as the classics allow.`, `三方四正有吉星（${list(sup)}），依古書可以化解一部分。`),
};

export const STATUS_RANK: Record<PatternStatus, number> = { formed: 0, flawed: 1, bare: 2, broken: 3, present: 4, mitigated: 5 };

export function evaluatePatterns(x: Ctx): PatternFinding[] {
  const out: PatternFinding[] = [];
  for (const rule of ALL_PATTERNS) {
    const hit = rule.match(x);
    if (!hit) continue;
    const scope = rule.scope?.(x) ?? sfsz(x.ming);
    const sup = x.support(scope);
    const bad = x.malefic(scope, { except: rule.tolerates });
    let status: PatternStatus;
    if (rule.kind === 'auspicious') status = sup.length ? (bad.length ? 'flawed' : 'formed') : bad.length ? 'broken' : 'bare';
    else if (rule.kind === 'structure') status = 'present';
    else status = sup.length ? 'mitigated' : 'present';
    const statusText = rule.kind === 'structure' ? '' : STATUS_TEXT[status](sup, bad);
    out.push({
      id: rule.id,
      rule,
      status,
      palaces: hit.palaces,
      text: [tr(rule.text), tr(hit.variant), statusText].filter(Boolean).join(L(' ', '')),
      evidence: [
        ...(isZh() ? hit.evidence.map(evidenceZh) : hit.evidence),
        ...(sup.length ? [L(`supporting stars in scope: ${list(sup)}`, `範圍內的吉星：${list(sup)}`)] : []),
        ...(bad.length ? [L(`malefics in scope: ${list(bad)}`, `範圍內的煞星：${list(bad)}`)] : []),
      ],
      sources: rule.sources,
    });
  }
  return out.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
}

/** Main-star reading for a palace (borrowing from the opposite palace when empty). */
function starFindings(x: Ctx, i: number, idPrefix: string): Finding[] {
  const out: Finding[] = [];
  const borrowed = x.noMain(i);
  const src = borrowed ? opp(i) : i;
  const majors = x.p(src).major;
  for (const s of majors) {
    const n = MAJOR_NATURE[s.name];
    if (!n) continue;
    const b = s.brightness;
    const tone = b && ['廟', '旺'].includes(b) ? n.bright : b && ['陷', '不'].includes(b) ? n.fallen : '';
    out.push({
      id: `${idPrefix}.star.${s.name}`,
      text: L(
        `⟨${s.name}⟩, ${n.en} (化氣 ⟨${n.hua}⟩)${borrowed ? `, borrowed from ${x.label(src)}` : ''}: ${n.text} ${tone}`.trim(),
        `⟨${s.name}⟩（化氣為⟨${n.hua}⟩）${borrowed ? `，借自${x.label(src)}` : ''}：${tr(n.text)}${tr(tone)}`,
      ),
      evidence: [
        L(
          `⟨${s.name}⟩${b ? ` at brightness ⟨${b}⟩` : ''} in ${x.label(src)}${borrowed ? ` (${x.label(i)} has no main star)` : ''}`,
          `⟨${s.name}⟩${b ? `（⟨${b}⟩）` : ''}在${x.label(src)}${borrowed ? `（${x.label(i)}無主星）` : ''}`,
        ),
      ],
      sources: [MAJOR_QUOTE[s.name] ?? STAR_BASIS],
    });
  }
  if (majors.length === 2) {
    const key = pairKey(majors[0].name, majors[1].name);
    const note = PAIR_NOTES[key];
    if (note)
      out.push({
        id: `${idPrefix}.pair.${key}`,
        text: L(`Together, ${key.split('+').map((s) => `⟨${s}⟩`).join(' and ')}: ${note}`, `${key.split('+').map((s) => `⟨${s}⟩`).join('、')}同宮：${tr(note)}`),
        evidence: [L(`${key.split('+').map((s) => `⟨${s}⟩`).join(' + ')} share ${x.label(src)}`, `${key.split('+').map((s) => `⟨${s}⟩`).join('、')}同在${x.label(src)}`)],
        sources: [PAIR_QUOTE[key] ?? PAIR_BASIS],
      });
  }
  return out;
}

// What a birth-year transformation in the Career palace suggests about the kind of work.
const CAREER_MUT: Partial<Record<Mut, string>> = {
  科: 'In the Career palace it points to work built on knowledge and reputation: teaching, research, writing or professional credentials.',
  權: 'In the Career palace it points to work with authority: public office, management or roles that make decisions.',
  祿: 'In the Career palace it points to work that handles money or brings steady pay, such as finance, trade or running a business.',
};
const CAREER_MUT_ZH: Partial<Record<Mut, string>> = {
  科: '在官祿宮，適合以知識和名聲立足的工作：教學、研究、寫作或專業資格。',
  權: '在官祿宮，適合有權責的工作：公職、管理或負責決策的職位。',
  祿: '在官祿宮，適合經手錢財或收入穩定的工作，例如金融、貿易或自己經營生意。',
};
const CAREER_BASIS: Source = { basis: '倪海廈 天紀 lectures (as noted by students, finalhopes.com): 化科 in 官祿 suits teaching, 化權 public office, 化祿 roles that handle money; consistent with the 全書 natures of 科 (主掌文墨) and 權 (掌判生殺)' };

function mutFindings(x: Ctx, i: number, idPrefix: string): Finding[] {
  const domain = PALACE_DOMAIN[x.p(i).name].domain;
  const career = x.p(i).name === '官祿';
  const out: Finding[] = x.muts(i).map(([star, k]: [string, Mut]) => ({
    id: `${idPrefix}.mut.${k}`,
    text: L(
      `Birth-year 化${k} on ⟨${star}⟩ ${MUT_TEXT[k](domain)}.${career && CAREER_MUT[k] ? ` ${CAREER_MUT[k]}` : ''}`,
      `生年⟨${star}⟩化${k}，${MUT_TEXT[k](domain)}。${career && CAREER_MUT_ZH[k] ? CAREER_MUT_ZH[k] : ''}`,
    ),
    evidence: [L(`⟨${star}⟩化${k} (from the ${x.c.yearStem} year stem) in ${x.label(i)}`, `⟨${star}⟩化${k}（${x.c.yearStem}年干所化）在${x.label(i)}`)],
    sources: career && CAREER_MUT[k] ? [MUT_QUOTE[k], CAREER_BASIS] : [MUT_QUOTE[k]],
  }));
  const o = opp(i);
  const ji = x.muts(o).find(([, k]) => k === '忌');
  if (ji)
    out.push({
      id: `${idPrefix}.jichong`,
      text: L(`化忌 in the opposite palace clashes into this one (忌沖), so ${domain} is exposed to pressure from outside.`, `對宮化忌沖入本宮（忌沖），${tr(domain)}容易受到外來的壓力。`),
      evidence: [L(`⟨${ji[0]}⟩化忌 in ${x.label(o)}, opposite ${x.label(i)}`, `⟨${ji[0]}⟩化忌在${x.label(o)}，與${x.label(i)}相對`)],
      sources: [JICHONG_BASIS],
    });
  return out;
}

function minorFinding(x: Ctx, i: number, idPrefix: string): Finding[] {
  const here = x.p(i).minor.map((s) => s.name).filter((n) => MINOR_NATURE[n]);
  if (!here.length) return [];
  const lucky = here.filter((n) => MINOR_NATURE[n].kind === 'lucky');
  const bad = here.filter((n) => MINOR_NATURE[n].kind === 'malefic');
  const other = here.filter((n) => MINOR_NATURE[n].kind === 'neutral');
  const part = (xs: string[]) => xs.map((n) => L(`⟨${n}⟩ (${MINOR_NATURE[n].text})`, `⟨${n}⟩（${tr(MINOR_NATURE[n].text)}）`)).join(L('; ', '；'));
  const sentences = [
    lucky.length ? L(`Helped by ${part(lucky)}.`, `得${part(lucky)}相助。`) : '',
    bad.length ? L(`Challenged by ${part(bad)}.`, `受${part(bad)}考驗。`) : '',
    other.length ? L(`Also ${part(other)}.`, `另有${part(other)}。`) : '',
  ].filter(Boolean);
  // One quote per distinct verse (天魁/天鉞, 火星/鈴星 and 地空/地劫 share theirs).
  const quotes = [...new Map(here.map((n) => MINOR_QUOTE[n]).filter(Boolean).map((q) => [q.verse, q])).values()];
  return [{ id: `${idPrefix}.minor`, text: sentences.join(L(' ', '')), evidence: [L(`${list(here)} in ${x.label(i)}`, `${list(here)}在${x.label(i)}`)], sources: quotes.length ? quotes : [MINOR_BASIS] }];
}

/** 羊陀夾忌 in any palace: 祿存 (always flanked by 擎羊 and 陀羅) sharing the palace with the birth 化忌. */
function yangTuoJiaJi(x: Ctx, i: number, idPrefix: string): Finding[] {
  if (i === x.ming || !x.has(i, '祿存') || !x.hasMut(i, '忌')) return [];
  const ji = x.muts(i).find(([, k]) => k === '忌')![0];
  const domain = PALACE_DOMAIN[x.p(i).name].domain;
  return [
    {
      id: `${idPrefix}.yangtuo`,
      text: L(
        `Obstacle trapped between the blades (羊陀夾忌): the birth 化忌 sits with 祿存 here, hemmed in by 擎羊 and 陀羅, so trouble in ${domain} has no easy outlet. The classics call this a losing position (敗局) for the palace’s affairs.`,
        `羊陀夾忌：生年化忌與祿存同宮，被擎羊、陀羅前後夾住，${tr(domain)}方面的困擾不易化解。古書稱之為敗局，主此宮之事多阻。`,
      ),
      evidence: [L(`⟨${ji}⟩化忌 and ⟨祿存⟩ in ${x.label(i)}`, `⟨${ji}⟩化忌與⟨祿存⟩同在${x.label(i)}`), L('⟨擎羊⟩ and ⟨陀羅⟩ on either side', '⟨擎羊⟩、⟨陀羅⟩分居兩旁')],
      sources: [{ verse: '羊陀夾忌為敗局', work: '紫微斗數全書', section: '論諸星同垣各司所宜', basis: '羊陀夾忌 applied to the palace where it occurs (the named pattern covers the Life palace)' }],
    },
  ];
}

const FLANK_BASIS = '占驗派 practice (范振木, fjm.tw): a pair of stars on both sides of any palace strengthens it (紫府, 日月, 左右, 昌曲, 魁鉞) or weakens it (火鈴, 空劫), not only around the Life palace';
const KONGJIE_BASIS = '占驗派 practice (范振木, 地空地劫暨命例分析, fjm.tw): 地空 and 地劫 in the same palace, flanking it, shining from both trines, or facing each other across it, make that palace weak (弱宮)';
const GOOD_FLANKS: [string, string, string, string][] = [
  ['紫微', '天府', 'the emperor and treasury stars', '紫府'],
  ['太陽', '太陰', 'the sun and moon', '日月'],
  ['左輔', '右弼', 'the two helper stars', '左右'],
  ['文昌', '文曲', 'the two literary stars', '昌曲'],
  ['天魁', '天鉞', 'the two noble-helper stars', '魁鉞'],
];

/** Which way 地空 and 地劫 bear on a palace, if they do. */
export function kongJieRelation(x: Ctx, i: number): '同宮' | '夾' | '拱' | '對照' | undefined {
  const k = x.find('地空');
  const j = x.find('地劫');
  if (k < 0 || j < 0) return undefined;
  if (k === i && j === i) return '同宮';
  const [l, r] = [(i + 11) % 12, (i + 1) % 12];
  if ((k === l && j === r) || (k === r && j === l)) return '夾';
  const tr = [(i + 4) % 12, (i + 8) % 12];
  if (tr.includes(k) && tr.includes(j) && k !== j) return '拱';
  if ((k === i && j === opp(i)) || (j === i && k === opp(i))) return '對照';
  return undefined;
}

/** Flanking pairs and the 空劫 relation for a palace (the Life palace's own flanks are named patterns). */
function palaceFlanks(x: Ctx, i: number, idPrefix: string): Finding[] {
  const out: Finding[] = [];
  const domain = PALACE_DOMAIN[x.p(i).name].domain;
  const [l, r] = [(i + 11) % 12, (i + 1) % 12];
  const flank = (a: string, b: string) => (x.has(l, a) && x.has(r, b)) || (x.has(l, b) && x.has(r, a));
  if (i !== x.ming) {
    const good = GOOD_FLANKS.filter(([a, b]) => flank(a, b));
    if (good.length)
      out.push({
        id: `${idPrefix}.flank.good`,
        text: L(
          `Flanked by ${good.map(([a, b, en]) => `${en} (⟨${a}⟩, ⟨${b}⟩)`).join(' and ')}: this palace is held up from both sides, a strength for ${domain}.`,
          `${good.map(([, , , zh]) => `${zh}夾`).join('、')}：本宮兩旁有吉星相扶，對${tr(domain)}是一大助力。`,
        ),
        evidence: good.map(([a, b]) => L(`⟨${a}⟩ and ⟨${b}⟩ on either side of ${x.label(i)}`, `⟨${a}⟩、⟨${b}⟩分居${x.label(i)}兩旁`)),
        sources: [{ verse: '夾貴夾祿少人知，夾權夾科世所宜', work: '紫微斗數全書', section: '斗數骨髓賦', basis: FLANK_BASIS }],
      });
    if (flank('火星', '鈴星'))
      out.push({
        id: `${idPrefix}.flank.huoling`,
        text: L(
          `Flanked by 火星 and 鈴星 (火鈴夾): pressure from both sides, so ${domain} sees sudden flare-ups and restless effort.`,
          `火鈴夾：兩旁受壓，${tr(domain)}方面容易突然生變，勞心費力。`,
        ),
        evidence: [L(`⟨火星⟩ and ⟨鈴星⟩ on either side of ${x.label(i)}`, `⟨火星⟩、⟨鈴星⟩分居${x.label(i)}兩旁`)],
        sources: [{ verse: '火鈴夾命為敗局', work: '紫微斗數全書', section: '論諸星同垣各司所宜', basis: FLANK_BASIS }],
      });
  }
  const kj = kongJieRelation(x, i);
  if (kj && !(i === x.ming && kj === '夾')) {
    const how = { 同宮: 'sit together in it', 夾: 'flank it', 拱: 'shine on it from both trines', 對照: 'face each other across it' }[kj];
    const howZh = { 同宮: '同在本宮', 夾: '夾住本宮', 拱: '從三合兩方拱照', 對照: '隔宮相對' }[kj];
    out.push({
      id: `${idPrefix}.kongjie`,
      text: L(
        `地空 and 地劫 ${how} (空劫${kj}), which makes this a weak palace (弱宮): plans in ${domain} tend to fall through or take more effort than they return. Good stars here show their faults more than their strengths.`,
        `地空、地劫${howZh}（空劫${kj}），本宮成為弱宮：${tr(domain)}方面的計畫容易落空，或付出多於回報。宮中吉星也較易顯出缺點而非長處。`,
      ),
      evidence: [L(`⟨地空⟩ in ${x.label(x.find('地空'))}`, `⟨地空⟩在${x.label(x.find('地空'))}`), L(`⟨地劫⟩ in ${x.label(x.find('地劫'))}`, `⟨地劫⟩在${x.label(x.find('地劫'))}`)],
      sources: [{ verse: '劫空夾命為敗局', work: '紫微斗數全書', section: '論諸星同垣各司所宜', basis: KONGJIE_BASIS }],
    });
  }
  return out;
}

/**
 * Palace tone, weighing the palace itself (本宮) before its 三方四正, as classical reading does:
 * - its own lucky stars and 祿/權/科 count +1 each, its malefics −1 each;
 * - the birth-year 化忌 sitting in it counts a further −2 (the strongest single signal);
 * - the trines and opposite palace count a quarter;
 * - 空劫 bearing on it (同宮, 夾, 拱, 對照) weakens it (−1.5).
 * Chosen against palace ratings published by kunde.org.tw and 范振木 (tests/sources-cases.test.ts):
 * it matches half of them exactly and never calls a palace the opposite of their rating.
 */
export function toneScore(x: Ctx, i: number): { score: number; factors: number } {
  const own = [i];
  const around = sfsz(i).filter((j) => j !== i);
  const ownSup = x.support(own).length;
  const ownBad = x.malefic(own).length;
  const ji = x.muts(i).filter(([, k]) => k === '忌').length;
  const sup = x.support(around).length;
  const bad = x.malefic(around).length;
  const kj = kongJieRelation(x, i) ? 1 : 0;
  const score = ownSup - ownBad - 2 * ji + 0.25 * (sup - bad) - 1.5 * kj;
  return { score, factors: ownSup + ownBad + sup + bad + kj };
}

function tone(x: Ctx, i: number): PalaceCard['tone'] {
  const { score, factors } = toneScore(x, i);
  if (!factors) return 'neutral';
  return score >= 1.5 ? 'supported' : score <= -1.5 ? 'pressured' : 'mixed';
}

/** The chart's element and zodiac, with the element's traditional colour, as cultural background. */
function elementFinding(x: Ctx): Finding[] {
  const ju = x.c.ju;
  const el = ju ? JU_ELEMENT[ju] : undefined;
  if (!el) return [];
  const src = x.noMain(x.ming) ? opp(x.ming) : x.ming;
  const stars = x.p(src).major.map((s) => s.name).filter((s) => STAR_ELEMENT[s]);
  const starText = stars.map((s) => `⟨${s}⟩ ${ELEMENT_EN[STAR_ELEMENT[s].el].toLowerCase()}`).join(' and ');
  const starTextZh = stars.map((s) => `⟨${s}⟩屬${STAR_ELEMENT[s].el}`).join('、');
  const animal = BRANCH_ANIMAL[x.c.yearBranch];
  const colour = ELEMENT_COLOUR[el];
  return [
    {
      id: 'elements',
      text: L(
        `${animal ? `Born in a ${x.c.yearBranch} (${animal.zh} ${animal.en}) year. ` : ''}` +
          `The chart’s element class is ${ju} (${ELEMENT_EN[el].toLowerCase()})` +
          (stars.length ? `, and the Life palace${src !== x.ming ? ' borrows' : ' holds'} ${starText}` : '') +
          `. In the 五行 correspondences ${ELEMENT_EN[el].toLowerCase()} goes with ${colour.en} (${colour.zh}). This is cultural background: the 紫微 classics don’t prescribe lucky colours.`,
        `${animal ? `生於${x.c.yearBranch}年（屬${animal.zh}）。` : ''}` +
          `命盤五行局為${ju}（屬${el}）` +
          (stars.length ? `，命宮${src !== x.ming ? '借入' : '有'}${starTextZh}` : '') +
          `。依五行配色，${el}對應${colour.zh}色。這只是文化背景：紫微斗數古書並不講究吉祥顏色。`,
      ),
      evidence: [
        `年支 ${x.c.yearBranch}${animal ? ` (${animal.zh})` : ''}`,
        `五行局 ${ju}`,
        ...stars.map((s) => L(`⟨${s}⟩ is ${STAR_ELEMENT[s].el} (${ELEMENT_EN[STAR_ELEMENT[s].el].toLowerCase()})`, `⟨${s}⟩屬${STAR_ELEMENT[s].el}`)),
        ...stars.map(altElementNote).filter((n): n is string => !!n),
      ],
      sources: [...stars.map((s) => STAR_ELEMENT[s].src), COLOUR_BASIS],
    },
  ];
}

export function analyse(c: ChartM): Analysis {
  const x = new Ctx(c);
  const overview: Finding[] = [...starFindings(x, x.ming, 'ming'), ...mingClassics(x)];

  const bodyName = x.p(x.body).name;
  const bodyText = BODY_TEXT[bodyName];
  if (bodyText)
    overview.push({ id: 'body', text: tr(bodyText), evidence: [L(`身宮 is ${x.label(x.body)}`, `身宮在${x.label(x.body)}`)], sources: [BODY_QUOTE] });

  const where = (['祿', '權', '科', '忌'] as const).map((k) => [k, x.findMut(k)] as const).filter(([, i]) => i >= 0);
  if (where.length)
    overview.push({
      id: 'sihua',
      text: L(
        `Birth-year transformations (${c.yearStem} year): ` +
          where.map(([k, i]) => `化${k} in the ${PALACE_DOMAIN[x.p(i).name].en} palace`).join(', ') +
          '. Where 化祿 lands is where life tends to give; where 化忌 lands is where it asks for the most care.',
        `生年四化（${c.yearStem}年）：` +
          where.map(([k, i]) => `化${k}在${palaceTitle(x.p(i).name)}`).join('、') +
          '。化祿所在，是人生較易得到的地方；化忌所在，是最需要用心的地方。',
      ),
      evidence: [
        ...where.map(([k, i]) => `${x.muts(i).find(([, m]) => m === k)?.[0] ? `⟨${x.muts(i).find(([, m]) => m === k)![0]}⟩` : ''}化${k}${L(' in ', '在')}${x.label(i)}`),
        L(`四化 table: ${c.sihuaLabel ?? 'Common modern table'}`, `四化表：${tr(c.sihuaLabel ?? 'Common modern table')}`),
      ],
      sources: [MUT_BASIS, ...where.map(([k]) => MUT_QUOTE[k])],
    });

  overview.push(...elementFinding(x));

  const palaces: PalaceCard[] = c.palaces.map((p) => {
    const d = PALACE_DOMAIN[p.name];
    const id = `palace.${p.index}`;
    const t = tone(x, p.index);
    return {
      index: p.index,
      name: p.name,
      en: d.en,
      domain: tr(d.domain),
      tone: t,
      // The Life palace's main stars are already read in the overview.
      findings: [
        ...(p.index === x.ming ? [] : starFindings(x, p.index, id)),
        ...(p.index === x.ming ? [] : [palaceClassics(x, p.index)].filter((f): f is Finding => !!f)),
        ...minorFinding(x, p.index, id),
        ...mutFindings(x, p.index, id),
        ...yangTuoJiaJi(x, p.index, id),
        ...palaceFlanks(x, p.index, id),
        ...palaceAdvice(x, p.index, id, t === 'pressured'),
      ],
    };
  });
  // Life palace first, then the traditional counter-clockwise order.
  palaces.sort((a, b) => ((x.ming - a.index + 12) % 12) - ((x.ming - b.index + 12) % 12));

  return { overview, patterns: evaluatePatterns(x), palaces };
}
