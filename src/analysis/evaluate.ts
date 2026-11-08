import type { ChartM, Mut, PalaceName } from './model';
import { Ctx, opp, sfsz } from './predicates';
import { ALL_PATTERNS } from './rules/patterns';
import {
  BODY_QUOTE, BODY_TEXT, JICHONG_BASIS, MAJOR_NATURE, MAJOR_QUOTE, MINOR_BASIS, MINOR_NATURE, MINOR_QUOTE, MUT_BASIS,
  MUT_QUOTE, MUT_TEXT, PAIR_BASIS, PAIR_NOTES, PAIR_QUOTE, pairKey, PALACE_DOMAIN, STAR_BASIS,
} from './rules/stars';
import type { PatternRule, PatternStatus, Source } from './rules/types';
import { mingClassics, palaceClassics } from './juan2Read';

/** One statement in the analysis, with everything needed for its "Why?" panel. */
export interface Finding {
  id: string;
  text: string;
  evidence: string[];
  sources: Source[];
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

const list = (xs: string[]) => xs.map((s) => `⟨${s}⟩`).join(', ');

const STATUS_TEXT: Record<PatternStatus, (sup: string[], bad: string[]) => string> = {
  formed: (sup) => `Supported by ${list(sup)} and free of 四煞, 空劫 and 化忌 in the 三方四正, so the classical reading applies in full.`,
  flawed: (sup, bad) =>
    `Supporting stars are present (${list(sup)}), but so are ${list(bad)}. The classics call this 破格 (a flawed pattern): the promise shows, but it is delivered only in part, or at a cost.`,
  bare: () => 'The structure is present, but without the supporting stars (六吉, 祿存 or 祿/權/科) the classics require, so its effect is modest.',
  broken: (_, bad) => `The structure is present but meets ${list(bad)} with no supporting stars, so the classics treat it as broken: the potential is there but hard to realise.`,
  present: () => '',
  mitigated: (sup) => `Lucky stars (${list(sup)}) in the 三方四正 soften this, as the classics allow.`,
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
      text: [rule.text, hit.variant, statusText].filter(Boolean).join(' '),
      evidence: [
        ...hit.evidence,
        ...(sup.length ? [`supporting stars in scope: ${list(sup)}`] : []),
        ...(bad.length ? [`malefics in scope: ${list(bad)}`] : []),
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
      text: `⟨${s.name}⟩, ${n.en} (化氣 ⟨${n.hua}⟩)${borrowed ? `, borrowed from ${x.label(src)}` : ''}: ${n.text} ${tone}`.trim(),
      evidence: [`⟨${s.name}⟩${b ? ` at brightness ⟨${b}⟩` : ''} in ${x.label(src)}${borrowed ? ` (${x.label(i)} has no main star)` : ''}`],
      sources: [MAJOR_QUOTE[s.name] ?? STAR_BASIS],
    });
  }
  if (majors.length === 2) {
    const key = pairKey(majors[0].name, majors[1].name);
    const note = PAIR_NOTES[key];
    if (note)
      out.push({
        id: `${idPrefix}.pair.${key}`,
        text: `Together, ${key.split('+').map((s) => `⟨${s}⟩`).join(' and ')}: ${note}`,
        evidence: [`${key.split('+').map((s) => `⟨${s}⟩`).join(' + ')} share ${x.label(src)}`],
        sources: [PAIR_QUOTE[key] ?? PAIR_BASIS],
      });
  }
  return out;
}

function mutFindings(x: Ctx, i: number, idPrefix: string): Finding[] {
  const domain = PALACE_DOMAIN[x.p(i).name].domain;
  const out: Finding[] = x.muts(i).map(([star, k]: [string, Mut]) => ({
    id: `${idPrefix}.mut.${k}`,
    text: `Birth-year 化${k} on ⟨${star}⟩ ${MUT_TEXT[k](domain)}.`,
    evidence: [`⟨${star}⟩化${k} (from the ${x.c.yearStem} year stem) in ${x.label(i)}`],
    sources: [MUT_QUOTE[k]],
  }));
  const o = opp(i);
  const ji = x.muts(o).find(([, k]) => k === '忌');
  if (ji)
    out.push({
      id: `${idPrefix}.jichong`,
      text: `化忌 in the opposite palace clashes into this one (忌沖), so ${domain} is exposed to pressure from outside.`,
      evidence: [`⟨${ji[0]}⟩化忌 in ${x.label(o)}, opposite ${x.label(i)}`],
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
  const part = (xs: string[]) => xs.map((n) => `⟨${n}⟩ (${MINOR_NATURE[n].text})`).join('; ');
  const sentences = [
    lucky.length ? `Helped by ${part(lucky)}.` : '',
    bad.length ? `Challenged by ${part(bad)}.` : '',
    other.length ? `Also ${part(other)}.` : '',
  ].filter(Boolean);
  // One quote per distinct verse (天魁/天鉞, 火星/鈴星 and 地空/地劫 share theirs).
  const quotes = [...new Map(here.map((n) => MINOR_QUOTE[n]).filter(Boolean).map((q) => [q.verse, q])).values()];
  return [{ id: `${idPrefix}.minor`, text: sentences.join(' '), evidence: [`${list(here)} in ${x.label(i)}`], sources: quotes.length ? quotes : [MINOR_BASIS] }];
}

/** 羊陀夾忌 in any palace: 祿存 (always flanked by 擎羊 and 陀羅) sharing the palace with the birth 化忌. */
function yangTuoJiaJi(x: Ctx, i: number, idPrefix: string): Finding[] {
  if (i === x.ming || !x.has(i, '祿存') || !x.hasMut(i, '忌')) return [];
  const ji = x.muts(i).find(([, k]) => k === '忌')![0];
  const domain = PALACE_DOMAIN[x.p(i).name].domain;
  return [
    {
      id: `${idPrefix}.yangtuo`,
      text: `Obstacle trapped between the blades (羊陀夾忌): the birth 化忌 sits with 祿存 here, hemmed in by 擎羊 and 陀羅, so trouble in ${domain} has no easy outlet. The classics call this a losing position (敗局) for the palace’s affairs.`,
      evidence: [`⟨${ji}⟩化忌 and ⟨祿存⟩ in ${x.label(i)}`, '⟨擎羊⟩ and ⟨陀羅⟩ on either side'],
      sources: [{ verse: '羊陀夾忌為敗局', work: '紫微斗數全書', section: '論諸星同垣各司所宜', basis: '羊陀夾忌 applied to the palace where it occurs (the named pattern covers the Life palace)' }],
    },
  ];
}

const FLANK_BASIS = '占驗派 practice (范振木, fjm.tw): a pair of stars on both sides of any palace strengthens it (紫府, 日月, 左右, 昌曲, 魁鉞) or weakens it (火鈴, 空劫), not only around the Life palace';
const KONGJIE_BASIS = '占驗派 practice (范振木, 地空地劫暨命例分析, fjm.tw): 地空 and 地劫 in the same palace, flanking it, shining from both trines, or facing each other across it, make that palace weak (弱宮)';
const GOOD_FLANKS: [string, string, string][] = [
  ['紫微', '天府', 'the emperor and treasury stars'],
  ['太陽', '太陰', 'the sun and moon'],
  ['左輔', '右弼', 'the two helper stars'],
  ['文昌', '文曲', 'the two literary stars'],
  ['天魁', '天鉞', 'the two noble-helper stars'],
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
        text: `Flanked by ${good.map(([a, b, en]) => `${en} (⟨${a}⟩, ⟨${b}⟩)`).join(' and ')}: this palace is held up from both sides, a strength for ${domain}.`,
        evidence: good.map(([a, b]) => `⟨${a}⟩ and ⟨${b}⟩ on either side of ${x.label(i)}`),
        sources: [{ verse: '夾貴夾祿少人知，夾權夾科世所宜', work: '紫微斗數全書', section: '斗數骨髓賦', basis: FLANK_BASIS }],
      });
    if (flank('火星', '鈴星'))
      out.push({
        id: `${idPrefix}.flank.huoling`,
        text: `Flanked by 火星 and 鈴星 (火鈴夾): pressure from both sides, so ${domain} sees sudden flare-ups and restless effort.`,
        evidence: [`⟨火星⟩ and ⟨鈴星⟩ on either side of ${x.label(i)}`],
        sources: [{ verse: '火鈴夾命為敗局', work: '紫微斗數全書', section: '論諸星同垣各司所宜', basis: FLANK_BASIS }],
      });
  }
  const kj = kongJieRelation(x, i);
  if (kj && !(i === x.ming && kj === '夾')) {
    const how = { 同宮: 'sit together in it', 夾: 'flank it', 拱: 'shine on it from both trines', 對照: 'face each other across it' }[kj];
    out.push({
      id: `${idPrefix}.kongjie`,
      text: `地空 and 地劫 ${how} (空劫${kj}), which makes this a weak palace (弱宮): plans in ${domain} tend to fall through or take more effort than they return. Good stars here show their faults more than their strengths.`,
      evidence: [`⟨地空⟩ in ${x.label(x.find('地空'))}`, `⟨地劫⟩ in ${x.label(x.find('地劫'))}`],
      sources: [{ verse: '劫空夾命為敗局', work: '紫微斗數全書', section: '論諸星同垣各司所宜', basis: KONGJIE_BASIS }],
    });
  }
  return out;
}

function tone(x: Ctx, i: number): PalaceCard['tone'] {
  const s = sfsz(i);
  const sup = x.support(s).length;
  const bad = x.malefic(s).length;
  let t: PalaceCard['tone'] = sup === 0 && bad === 0 ? 'neutral' : sup >= bad + 2 ? 'supported' : bad >= sup + 2 ? 'pressured' : 'mixed';
  // A palace that 空劫 bear on is weak (弱宮): step its tone down one level.
  if (kongJieRelation(x, i)) t = t === 'supported' ? 'mixed' : 'pressured';
  return t;
}

export function analyse(c: ChartM): Analysis {
  const x = new Ctx(c);
  const overview: Finding[] = [...starFindings(x, x.ming, 'ming'), ...mingClassics(x)];

  const bodyName = x.p(x.body).name;
  const bodyText = BODY_TEXT[bodyName];
  if (bodyText)
    overview.push({ id: 'body', text: bodyText, evidence: [`身宮 is ${x.label(x.body)}`], sources: [BODY_QUOTE] });

  const where = (['祿', '權', '科', '忌'] as const).map((k) => [k, x.findMut(k)] as const).filter(([, i]) => i >= 0);
  if (where.length)
    overview.push({
      id: 'sihua',
      text:
        `Birth-year transformations (${c.yearStem} year): ` +
        where.map(([k, i]) => `化${k} in the ${PALACE_DOMAIN[x.p(i).name].en} palace`).join(', ') +
        '. Where 化祿 lands is where life tends to give; where 化忌 lands is where it asks for the most care.',
      evidence: [
        ...where.map(([k, i]) => `${x.muts(i).find(([, m]) => m === k)?.[0] ? `⟨${x.muts(i).find(([, m]) => m === k)![0]}⟩` : ''}化${k} in ${x.label(i)}`),
        `四化 table: ${c.sihuaLabel ?? 'Common table (全書)'}`,
      ],
      sources: [MUT_BASIS, ...where.map(([k]) => MUT_QUOTE[k])],
    });

  const palaces: PalaceCard[] = c.palaces.map((p) => {
    const d = PALACE_DOMAIN[p.name];
    const id = `palace.${p.index}`;
    return {
      index: p.index,
      name: p.name,
      en: d.en,
      domain: d.domain,
      tone: tone(x, p.index),
      // The Life palace's main stars are already read in the overview.
      findings: [
        ...(p.index === x.ming ? [] : starFindings(x, p.index, id)),
        ...(p.index === x.ming ? [] : [palaceClassics(x, p.index)].filter((f): f is Finding => !!f)),
        ...minorFinding(x, p.index, id),
        ...mutFindings(x, p.index, id),
        ...yangTuoJiaJi(x, p.index, id),
        ...palaceFlanks(x, p.index, id),
      ],
    };
  });
  // Life palace first, then the traditional counter-clockwise order.
  palaces.sort((a, b) => ((x.ming - a.index + 12) % 12) - ((x.ming - b.index + 12) % 12));

  return { overview, patterns: evaluatePatterns(x), palaces };
}
