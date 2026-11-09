// Year-by-year readings (流年) inside a 10-year period.
//  1. The year's 命宮 is the palace whose branch matches the year branch (太歲入卦); its natal
//     palace sets the year's focus.
//  2. The year stem transforms four stars (流年四化); where 祿 and 忌 land matters most.
//  3. Stacking: the year 化忌 on a palace that already holds the natal or decade 化忌 (疊忌,
//     or 三忌 when all three meet), and the year 化祿 joining the natal or decade 祿 (疊祿).
//  4. The year 化忌 in, or opposite, the year's own palace.
//  5. The 小限 (age palace): its palace, the birth 祿/權/忌 it reaches, and where it meets the
//     大限 or 流年 palace (see xiaoxian.ts).
// The tone uses the same transparent scoring as the decades, with smaller weights.

import type { Finding } from './evaluate';
import { stemMutagens, type ChartM, type Mut, type PalaceName } from './model';
import { Ctx, opp, sfsz } from './predicates';
import { yearAdvice } from './advice';
import { readXiaoxian } from './xiaoxian';
import { BRANCH_ANIMAL, CLASH_BASIS, CLASH_QUOTE, clashBranch, OWN_YEAR_BASIS, OWN_YEAR_QUOTE } from './rules/elements';
import { MUT_QUOTE, MUT_TEXT, PALACE_DOMAIN } from './rules/stars';
import type { Source } from './rules/types';
import type { DecadeTone } from './decades';

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥';

const YEAR_BASIS: Source = { basis: '流年 method: the year’s 命宮 is the palace whose branch matches the year branch (太歲入卦)' };
const YEAR_MUT_BASIS: Source = { basis: '流年四化: the year stem transforms four stars for that year; where 化祿 and 化忌 land matters most' };
const STACK_JI_BASIS: Source = { verse: '二限太歲交臨，斷然蹭蹬', work: '紫微斗數全書', section: '問化忌星所主若何', basis: '四化 rule: a year 化忌 on a palace that already holds the natal or decade 化忌 compounds it (疊忌; 三忌 when all three meet)' };
const STACK_LU_BASIS: Source = { basis: '四化 rule: a year 化祿 joining the natal 化祿, 祿存 or the decade 化祿 compounds the gain (疊祿)' };
const YEAR_JI_BASIS: Source = { basis: '四化 rule: a year 化忌 in the year’s 命宮, or clashing into it from opposite, presses on the whole year' };

/** Stem and branch of a lunar year, e.g. 2026 → 丙午. */
export function yearGanZhi(year: number): { stem: string; branch: string } {
  return { stem: STEMS[(((year - 4) % 10) + 10) % 10], branch: BRANCHES[(((year - 4) % 12) + 12) % 12] };
}

export interface YearReading {
  year: number;
  age: number;
  stem: string;
  branch: string;
  palace: number;
  /** Palace index of the 小限 (age palace) for this year. */
  xiaoxian: number;
  /** Natal palace name of both yearly palaces, for display. */
  palaceName: PalaceName;
  xiaoxianName: PalaceName;
  tone: DecadeTone;
  score: number;
  scoreParts: string[];
  findings: Finding[];
}

const MUT_ORDER: Mut[] = ['祿', '權', '科', '忌'];

/** 本命年 and clash-year (沖太歲) notes. Informational: they don't change the year's rating. */
function zodiacNotes(birth: string, year: string, id: string) {
  const a = BRANCH_ANIMAL[birth];
  if (!a) return [];
  if (year === birth) {
    const q = OWN_YEAR_QUOTE[birth];
    return [
      {
        id: `${id}.zodiac.own`,
        text: `Your own zodiac year (本命年, ${a.zh} ${a.en}): the year repeats your birth-year branch. ${q ? 'The 全書 names it among the years to treat with care for your branch.' : 'Widely observed as a year for care; the 全書 doesn’t single it out for your branch.'} Read it with the year’s own stars.`,
        evidence: [`birth-year branch ${birth}`, `year branch ${year}`],
        sources: q ? [q, OWN_YEAR_BASIS] : [OWN_YEAR_BASIS],
      },
    ];
  }
  if (year === clashBranch(birth)) {
    const q = CLASH_QUOTE[birth];
    const y = BRANCH_ANIMAL[year];
    return [
      {
        id: `${id}.zodiac.clash`,
        text: `Clash year (沖太歲): the ${year} (${y.zh} ${y.en}) year is opposite your ${birth} (${a.zh} ${a.en}) birth year. ${q ? 'The 全書 names this clash for your branch.' : 'The 全書 doesn’t name this clash for your branch, but the rule is widely observed.'} It suggests change and friction; read it with the year’s own stars.`,
        evidence: [`birth-year branch ${birth}`, `year branch ${year}, opposite (六沖)`],
        sources: q ? [q, CLASH_BASIS] : [CLASH_BASIS],
      },
    ];
  }
  return [];
}

export function readYear(c: ChartM, decadePalace: number, year: number): YearReading {
  const x = new Ctx(c);
  const { stem, branch } = yearGanZhi(year);
  const age = year - (c.lunarYear ?? year) + 1;
  const yi = c.palaces.findIndex((p) => p.branch === branch);
  const p = c.palaces[yi];
  const id = `year.${year}`;
  const findings: Finding[] = [];
  const parts: string[] = [];
  let score = 0;
  const add = (n: number, why: string) => {
    score += n;
    parts.push(`${n > 0 ? '+' : '−'}${Math.abs(n)}: ${why}`);
  };

  const dom = PALACE_DOMAIN[p.name];
  findings.push({
    id: `${id}.focus`,
    text: `The year’s Life palace falls on your natal ${dom.en} palace, so the year centres on ${dom.domain}.`,
    evidence: [`${year} is a ${stem}${branch} year`, `流年命宮 is the ${branch} palace: ${x.label(yi)}`],
    sources: [YEAR_BASIS],
  });

  const sup = x.support(sfsz(yi)).length;
  const bad = x.malefic(sfsz(yi)).length;
  const balance = Math.max(-1, Math.min(1, Math.trunc((sup - bad) / 3)));
  if (balance) add(balance, `${sup} supporting vs ${bad} malefic stars around the year palace`);

  const decadeMut = c.palaces[decadePalace].decadeMut;
  const decadeJi = decadeMut ? x.find(decadeMut[3]) : -1;
  const decadeLu = decadeMut ? x.find(decadeMut[0]) : -1;
  const muts = stemMutagens(stem, c.mutOverrides);
  muts?.forEach((star, k) => {
    const m = MUT_ORDER[k];
    if (m !== '祿' && m !== '忌') return;
    const at = x.find(star);
    if (at < 0) return;
    const d = PALACE_DOMAIN[c.palaces[at].name];
    findings.push({
      id: `${id}.mut.${m}`,
      text: `The year’s 化${m} falls on ⟨${star}⟩ in your natal ${d.en} palace: it ${MUT_TEXT[m](d.domain)}.`,
      evidence: [`year stem ${stem} turns ⟨${star}⟩ into 化${m}`, `⟨${star}⟩ is in ${x.label(at)}`],
      sources: [YEAR_MUT_BASIS, MUT_QUOTE[m]],
    });
    if (m === '忌') {
      const natalJi = x.hasMut(at, '忌');
      const withDecade = at === decadeJi;
      if (natalJi || withDecade) {
        const triple = natalJi && withDecade;
        findings.push({
          id: `${id}.dieji`,
          text: triple
            ? `Triple obstruction (三忌): the year, decade and birth 化忌 all meet in the ${d.en} palace. This is the year to be most careful with ${d.domain}.`
            : `Double obstruction (疊忌): the year 化忌 lands where the ${natalJi ? 'birth' : 'decade'} 化忌 already is, so ${d.domain} is under extra pressure this year.`,
          evidence: [`year 化忌 on ⟨${star}⟩ in ${x.label(at)}`, ...(natalJi ? [`birth 化忌 in ${x.label(at)}`] : []), ...(withDecade ? [`decade 化忌 in ${x.label(at)}`] : [])],
          sources: [STACK_JI_BASIS],
        });
        add(triple ? -3 : -2, `${triple ? '三忌' : '疊忌'} in ${x.label(at)}`);
      }
      if (at === yi || at === opp(yi)) {
        findings.push({
          id: `${id}.jichong`,
          text: at === yi ? 'The year 化忌 sits in the year’s own palace: expect worry and setbacks to touch most of the year.' : 'The year 化忌 clashes into the year’s palace from opposite (忌沖): pressure from outside and sudden changes.',
          evidence: [`year 化忌 on ⟨${star}⟩ in ${x.label(at)}`, `流年命宮 ${x.label(yi)}`],
          sources: [YEAR_JI_BASIS],
        });
        add(-1, `year 化忌 ${at === yi ? 'in' : 'clashing into'} the year palace`);
      }
    } else {
      const natalLu = x.hasMut(at, '祿') || x.has(at, '祿存');
      const withDecade = at === decadeLu;
      if (natalLu || withDecade) {
        findings.push({
          id: `${id}.dielu`,
          text: `Double prosperity (疊祿): the year 化祿 joins the ${withDecade ? 'decade 化祿' : x.hasMut(at, '祿') ? 'birth 化祿' : '⟨祿存⟩'} in the ${d.en} palace, a good year for gains through ${d.domain}.`,
          evidence: [`year 化祿 on ⟨${star}⟩ in ${x.label(at)}`, withDecade ? `decade 化祿 in ${x.label(at)}` : `natal 祿 in ${x.label(at)}`],
          sources: [STACK_LU_BASIS],
        });
        add(withDecade && natalLu ? 2 : 1, `疊祿 in ${x.label(at)}`);
      }
      if (sfsz(yi).includes(at)) add(1, `year 化祿 lands around the year palace (${x.label(at)})`);
    }
  });

  const xx = readXiaoxian(x, id, age, decadePalace, yi, muts ? x.find(muts[3]) : -1);
  findings.push(...xx.findings);
  for (const [n, why] of xx.score) add(n, why);
  if (!parts.length) parts.push('0: no strong signals either way');
  const tone: DecadeTone = score >= 2 ? 'favourable' : score <= -2 ? 'challenging' : 'mixed';
  findings.push(...zodiacNotes(c.yearBranch, branch, id));
  findings.push(...yearAdvice(x, id, tone === 'challenging', muts ? x.find(muts[3]) : -1));
  return { year, age, stem, branch, palace: yi, xiaoxian: xx.index, palaceName: p.name, xiaoxianName: c.palaces[xx.index].name, tone, score, scoreParts: parts, findings };
}

/** Every year of a decade, by nominal age. Needs the chart's lunar birth year. */
export function readYears(c: ChartM, decadePalace: number): YearReading[] {
  if (c.lunarYear === undefined) return [];
  const [from, to] = c.palaces[decadePalace].decade;
  const out: YearReading[] = [];
  for (let age = from; age <= to; age++) {
    const year = c.lunarYear + age - 1;
    if (year > 2100) break;
    out.push(readYear(c, decadePalace, year));
  }
  return out;
}
