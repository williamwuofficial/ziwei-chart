import type { ChartM, Mut, PalaceName } from './model';
import { Ctx, opp, sfsz } from './predicates';
import { ALL_PATTERNS } from './rules/patterns';
import {
  BODY_QUOTE, BODY_TEXT, JICHONG_BASIS, MAJOR_NATURE, MAJOR_QUOTE, MINOR_BASIS, MINOR_NATURE, MINOR_QUOTE, MUT_BASIS,
  MUT_QUOTE, MUT_TEXT, PAIR_BASIS, PAIR_NOTES, PAIR_QUOTE, pairKey, PALACE_DOMAIN, STAR_BASIS,
} from './rules/stars';
import type { PatternRule, PatternStatus, Source } from './rules/types';

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
    else status = sup.length ? 'mitigated' : 'present';
    const statusText = STATUS_TEXT[status](sup, bad);
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

function tone(x: Ctx, i: number): PalaceCard['tone'] {
  const s = sfsz(i);
  const sup = x.support(s).length;
  const bad = x.malefic(s).length;
  if (sup === 0 && bad === 0) return 'neutral';
  if (sup >= bad + 2) return 'supported';
  if (bad >= sup + 2) return 'pressured';
  return 'mixed';
}

export function analyse(c: ChartM): Analysis {
  const x = new Ctx(c);
  const overview: Finding[] = [...starFindings(x, x.ming, 'ming')];

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
        ...minorFinding(x, p.index, id),
        ...mutFindings(x, p.index, id),
      ],
    };
  });
  // Life palace first, then the traditional counter-clockwise order.
  palaces.sort((a, b) => ((x.ming - a.index + 12) % 12) - ((x.ming - b.index + 12) % 12));

  return { overview, patterns: evaluatePatterns(x), palaces };
}
