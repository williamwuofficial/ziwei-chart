// 小限 (the age palace): a second yearly palace that moves with age rather than the calendar.
// 全書 卷二 安小限訣: men count forward and women backward, whatever the year's yin or yang, from
// 辰 (寅午戌 years), 戌 (申子辰), 未 (巳酉丑) or 丑 (亥卯未), one palace per year of nominal age.
// The 全書 reads the 小限 alongside the 大限 and 流年 (論二限太歲吉凶), and gives 化祿, 化權 and
// 化忌 their own 小限 lines. 倪海廈 and 范振木 both read yearly events through it.

import type { Finding } from './evaluate';
import type { ChartM, Mut } from './model';
import type { Ctx } from './predicates';
import { MAJOR_NATURE, PALACE_DOMAIN } from './rules/stars';
import type { Source } from './rules/types';

const START: Record<string, string> = { 寅: '辰', 午: '辰', 戌: '辰', 申: '戌', 子: '戌', 辰: '戌', 巳: '未', 酉: '未', 丑: '未', 亥: '丑', 卯: '丑', 未: '丑' };

/** Palace index of the 小限 at a nominal age (1 at birth). */
export function xiaoxianIndex(c: ChartM, age: number): number {
  const start = c.palaces.findIndex((p) => p.branch === START[c.yearBranch]);
  const step = c.gender === 'male' ? 1 : -1; // iztro's palace order 寅卯辰… runs forward (順)
  return (((start + step * (age - 1)) % 12) + 12) % 12;
}

const PLACEMENT: Source = {
  verse: '寅午戌人起辰宮，申子辰人自戌宮，巳酉丑人起未宮，亥卯未人起丑宮',
  work: '紫微斗數全書',
  section: '安身命例',
  basis: '全書 卷二 安小限訣: men count forward and women backward from this palace, one palace per year of age',
};
const LU_SRC: Source = { verse: '小限逢之主進財入仕之喜', work: '紫微斗數全書', section: '問化祿星所主若何', basis: '全書: a 小限 reaching the 化祿 brings gain and advancement that year' };
const QUAN_SRC: Source = { verse: '小限相逢，無有不吉', work: '紫微斗數全書', section: '問化權星所主若何', basis: '全書: a 小限 meeting the 化權 is favourable' };
const JI_SRC: Source = { verse: '小限逢之一年不足', work: '紫微斗數全書', section: '問化忌星所主若何', basis: '全書: a 小限 reaching the 化忌 makes for a year that falls short' };
const MEET_SRC: Source = {
  verse: '又看大限與小限相逢吉凶何如，大限逢太歲吉凶何如，小限逢太歲吉凶何如',
  work: '紫微斗數全書',
  section: '論二限太歲吉凶',
  basis: '全書 卷三: where the 大限, 小限 and 流年 meet in one palace, that palace’s stars weigh more heavily on the year',
};
const ALL_THREE_JI: Source = { verse: '二限太歲交臨，斷然蹭蹬', work: '紫微斗數全書', section: '問化忌星所主若何', basis: '全書: a 化忌 where both periods and the year meet brings setbacks' };

export interface XiaoxianPart {
  index: number;
  findings: Finding[];
  /** Score contributions, as [points, reason]. */
  score: [number, string][];
}

export function readXiaoxian(x: Ctx, id: string, age: number, decadePalace: number, yearPalace: number, yearJi: number): XiaoxianPart {
  const c = x.c;
  const i = xiaoxianIndex(c, age);
  const p = c.palaces[i];
  const dom = PALACE_DOMAIN[p.name];
  const findings: Finding[] = [];
  const score: [number, string][] = [];

  const borrowed = x.noMain(i);
  const src = borrowed ? (i + 6) % 12 : i;
  const stars = c.palaces[src].major.map((s) => `⟨${s.name}⟩ (${MAJOR_NATURE[s.name]?.en ?? 'main star'})`).join(' with ');
  findings.push({
    id: `${id}.xiaoxian`,
    text: `The age palace (小限) for age ${age} is your natal ${dom.en} palace, which brings ${dom.domain} into play this year as well${stars ? `. It is coloured by ${stars}${borrowed ? ', borrowed from the opposite palace' : ''}` : ''}.`,
    evidence: [`小限 at age ${age}: ${x.label(i)}`, `counted ${c.gender === 'male' ? 'forward' : 'backward'} from the ${START[c.yearBranch]} palace for a ${c.yearBranch} year`],
    sources: [PLACEMENT],
  });

  const natal = (m: Mut) => x.muts(i).find(([, k]) => k === m)?.[0];
  const lu = natal('祿');
  const quan = natal('權');
  const ji = natal('忌');
  if (lu || quan) {
    const star = (lu ?? quan)!;
    findings.push({
      id: `${id}.xiaoxian.good`,
      text: `The 小限 reaches your birth 化${lu ? '祿' : '權'} on ⟨${star}⟩: the classics read this as a year of ${lu ? 'gain and advancement' : 'things going your way'} in ${dom.domain}.`,
      evidence: [`birth-year 化${lu ? '祿' : '權'} on ⟨${star}⟩ in ${x.label(i)}`, `小限 at age ${age} in ${x.label(i)}`],
      sources: [lu ? LU_SRC : QUAN_SRC],
    });
    score.push([1, `小限 meets the birth 化${lu ? '祿' : '權'} (${x.label(i)})`]);
  }
  if (ji) {
    findings.push({
      id: `${id}.xiaoxian.ji`,
      text: `The 小限 reaches your birth 化忌 on ⟨${ji}⟩: the classics call it a year that falls short. Expect ${dom.domain} to need more care than usual.`,
      evidence: [`birth-year 化忌 on ⟨${ji}⟩ in ${x.label(i)}`, `小限 at age ${age} in ${x.label(i)}`],
      sources: [JI_SRC],
    });
    score.push([-1, `小限 meets the birth 化忌 (${x.label(i)})`]);
  }

  const withDecade = i === decadePalace;
  const withYear = i === yearPalace;
  if (withDecade || withYear) {
    const both = withDecade && withYear;
    const anyJi = !!ji || yearJi === i || (c.palaces[decadePalace].decadeMut && x.find(c.palaces[decadePalace].decadeMut![3]) === i);
    findings.push({
      id: `${id}.xiaoxian.meet`,
      text: both
        ? `The 小限, the 10-year period and the year all fall on the ${dom.en} palace, so its stars weigh on this year with full force.${anyJi ? ' With a 化忌 there too, the classics warn of setbacks: a year for caution.' : ''}`
        : `The 小限 falls on the same palace as the ${withDecade ? '10-year period' : 'year'} (${dom.en}), which doubles that palace’s weight this year.`,
      evidence: [`小限 in ${x.label(i)}`, ...(withDecade ? [`大限 in ${x.label(decadePalace)}`] : []), ...(withYear ? [`流年 in ${x.label(yearPalace)}`] : [])],
      sources: both && anyJi ? [MEET_SRC, ALL_THREE_JI] : [MEET_SRC],
    });
    if (both && anyJi) score.push([-1, `大限, 小限 and 流年 meet on a 化忌 (${x.label(i)})`]);
  }

  return { index: i, findings, score };
}
