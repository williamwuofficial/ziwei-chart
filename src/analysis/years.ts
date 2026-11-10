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
import { L, tr } from '../i18n/lang';
import { MUT_QUOTE, MUT_TEXT, PALACE_DOMAIN, palaceTitle } from './rules/stars';
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
        text: L(
          `Your own zodiac year (本命年, ${a.zh} ${a.en}): the year repeats your birth-year branch. ${q ? 'The 全書 names it among the years to treat with care for your branch.' : 'Widely observed as a year for care; the 全書 doesn’t single it out for your branch.'} Read it with the year’s own stars.`,
          `本命年（屬${a.zh}）：流年地支與生年地支相同。${q ? '全書把它列為你這個生年地支需要留意的年份。' : '民間普遍認為本命年要多加小心；全書並沒有特別點出你的生年地支。'}宜與當年的星曜一併參看。`,
        ),
        evidence: [L(`birth-year branch ${birth}`, `生年地支${birth}`), L(`year branch ${year}`, `流年地支${year}`)],
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
        text: L(
          `Clash year (沖太歲): the ${year} (${y.zh} ${y.en}) year is opposite your ${birth} (${a.zh} ${a.en}) birth year. ${q ? 'The 全書 names this clash for your branch.' : 'The 全書 doesn’t name this clash for your branch, but the rule is widely observed.'} It suggests change and friction; read it with the year’s own stars.`,
          `沖太歲：${year}年（屬${y.zh}）與你的生年${birth}（屬${a.zh}）相沖。${q ? '全書對你的生年地支點出了這一沖。' : '全書沒有對你的生年地支點出這一沖，但這條規則流傳很廣。'}主變動和摩擦；宜與當年的星曜一併參看。`,
        ),
        evidence: [L(`birth-year branch ${birth}`, `生年地支${birth}`), L(`year branch ${year}, opposite (六沖)`, `流年地支${year}，相沖（六沖）`)],
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
    text: L(`The year’s Life palace falls on your natal ${dom.en} palace, so the year centres on ${dom.domain}.`, `流年命宮落在本命${palaceTitle(p.name)}，這一年以${tr(dom.domain)}為重心。`),
    evidence: [L(`${year} is a ${stem}${branch} year`, `${year}年為${stem}${branch}年`), L(`流年命宮 is the ${branch} palace: ${x.label(yi)}`, `流年命宮在${branch}宮：${x.label(yi)}`)],
    sources: [YEAR_BASIS],
  });

  const sup = x.support(sfsz(yi)).length;
  const bad = x.malefic(sfsz(yi)).length;
  const balance = Math.max(-1, Math.min(1, Math.trunc((sup - bad) / 3)));
  if (balance) add(balance, L(`${sup} supporting vs ${bad} malefic stars around the year palace`, `流年命宮三方四正吉星${sup}顆、煞星${bad}顆`));

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
      text: L(
        `The year’s 化${m} falls on ⟨${star}⟩ in your natal ${d.en} palace: it ${MUT_TEXT[m](d.domain)}.`,
        `流年化${m}落在本命${palaceTitle(c.palaces[at].name)}的⟨${star}⟩：${MUT_TEXT[m](d.domain)}。`,
      ),
      evidence: [L(`year stem ${stem} turns ⟨${star}⟩ into 化${m}`, `流年天干${stem}化⟨${star}⟩為化${m}`), L(`⟨${star}⟩ is in ${x.label(at)}`, `⟨${star}⟩在${x.label(at)}`)],
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
            ? L(
                `Triple obstruction (三忌): the year, decade and birth 化忌 all meet in the ${d.en} palace. This is the year to be most careful with ${d.domain}.`,
                `三忌：流年、大限和生年化忌同會${palaceTitle(c.palaces[at].name)}。這一年${tr(d.domain)}方面最需要謹慎。`,
              )
            : L(
                `Double obstruction (疊忌): the year 化忌 lands where the ${natalJi ? 'birth' : 'decade'} 化忌 already is, so ${d.domain} is under extra pressure this year.`,
                `疊忌：流年化忌落在${natalJi ? '生年' : '大限'}化忌所在的宮位，今年${tr(d.domain)}方面壓力加重。`,
              ),
          evidence: [
            L(`year 化忌 on ⟨${star}⟩ in ${x.label(at)}`, `流年化忌在${x.label(at)}的⟨${star}⟩`),
            ...(natalJi ? [L(`birth 化忌 in ${x.label(at)}`, `生年化忌在${x.label(at)}`)] : []),
            ...(withDecade ? [L(`decade 化忌 in ${x.label(at)}`, `大限化忌在${x.label(at)}`)] : []),
          ],
          sources: [STACK_JI_BASIS],
        });
        add(triple ? -3 : -2, L(`${triple ? '三忌' : '疊忌'} in ${x.label(at)}`, `${triple ? '三忌' : '疊忌'}在${x.label(at)}`));
      }
      if (at === yi || at === opp(yi)) {
        findings.push({
          id: `${id}.jichong`,
          text:
            at === yi
              ? L('The year 化忌 sits in the year’s own palace: expect worry and setbacks to touch most of the year.', '流年化忌就在流年命宮：這一年大部分時間都可能有煩惱和挫折。')
              : L('The year 化忌 clashes into the year’s palace from opposite (忌沖): pressure from outside and sudden changes.', '流年化忌從對宮沖入流年命宮（忌沖）：有外來壓力和突然的變動。'),
          evidence: [L(`year 化忌 on ⟨${star}⟩ in ${x.label(at)}`, `流年化忌在${x.label(at)}的⟨${star}⟩`), L(`流年命宮 ${x.label(yi)}`, `流年命宮${x.label(yi)}`)],
          sources: [YEAR_JI_BASIS],
        });
        add(-1, L(`year 化忌 ${at === yi ? 'in' : 'clashing into'} the year palace`, at === yi ? '流年化忌在流年命宮' : '流年化忌沖流年命宮'));
      }
    } else {
      const natalLu = x.hasMut(at, '祿') || x.has(at, '祿存');
      const withDecade = at === decadeLu;
      if (natalLu || withDecade) {
        findings.push({
          id: `${id}.dielu`,
          text: L(
            `Double prosperity (疊祿): the year 化祿 joins the ${withDecade ? 'decade 化祿' : x.hasMut(at, '祿') ? 'birth 化祿' : '⟨祿存⟩'} in the ${d.en} palace, a good year for gains through ${d.domain}.`,
            `疊祿：流年化祿與${withDecade ? '大限化祿' : x.hasMut(at, '祿') ? '生年化祿' : '⟨祿存⟩'}同在${palaceTitle(c.palaces[at].name)}，是在${tr(d.domain)}方面有所收穫的好年。`,
          ),
          evidence: [
            L(`year 化祿 on ⟨${star}⟩ in ${x.label(at)}`, `流年化祿在${x.label(at)}的⟨${star}⟩`),
            withDecade ? L(`decade 化祿 in ${x.label(at)}`, `大限化祿在${x.label(at)}`) : L(`natal 祿 in ${x.label(at)}`, `本命祿星在${x.label(at)}`),
          ],
          sources: [STACK_LU_BASIS],
        });
        add(withDecade && natalLu ? 2 : 1, L(`疊祿 in ${x.label(at)}`, `疊祿在${x.label(at)}`));
      }
      if (sfsz(yi).includes(at)) add(1, L(`year 化祿 lands around the year palace (${x.label(at)})`, `流年化祿落在流年命宮三方四正（${x.label(at)}）`));
    }
  });

  const xx = readXiaoxian(x, id, age, decadePalace, yi, muts ? x.find(muts[3]) : -1);
  findings.push(...xx.findings);
  for (const [n, why] of xx.score) add(n, why);
  if (!parts.length) parts.push(L('0: no strong signals either way', '0：吉凶都沒有明顯的訊號'));
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
