// Readings drawn from 《紫微斗數全書》卷二 (see rules/juan2.ts).
import type { Finding } from './evaluate';
import type { PalaceName } from './model';
import { opp, type Ctx } from './predicates';
import { JUAN2, MING_SECTION, MING_TABLE } from './rules/juan2';
import { L, tr } from '../i18n/lang';
import { PALACE_DOMAIN } from './rules/stars';
import type { Source } from './rules/types';

const WORK = '紫微斗數全書' as const;

/** The classical line for each main star in a (non-Life) palace, and the pair line if two share it. */
export function palaceClassics(x: Ctx, i: number): Finding | undefined {
  const name = x.p(i).name as PalaceName;
  const table = JUAN2[name];
  if (!table) return undefined;
  const borrowed = x.noMain(i);
  const src = borrowed ? opp(i) : i;
  const majors = x.majors(src);
  const basis = `全書 卷二, ${table.section}: what each main star means in the ${PALACE_DOMAIN[name].en} palace`;
  const parts: string[] = [];
  const sources: Source[] = [];
  for (const star of majors) {
    const e = table.stars[star];
    if (!e) continue;
    parts.push(L(`The 全書 on ⟨${star}⟩ here: ${e[1]}.`, `全書論⟨${star}⟩在此宮：${tr(e[1])}。`));
    sources.push({ verse: e[0], work: WORK, section: table.section, basis });
  }
  if (majors.length === 2) {
    const [a, b] = majors;
    const pair = table.stars[a]?.[2]?.[b] ?? table.stars[b]?.[2]?.[a];
    if (pair) {
      parts.push(L(`With ⟨${a}⟩ and ⟨${b}⟩ together: ${pair[1]}.`, `⟨${a}⟩、⟨${b}⟩同宮：${tr(pair[1])}。`));
      sources.push({ verse: pair[0], work: WORK, section: table.section, basis });
    }
  }
  if (!parts.length) return undefined;
  return {
    id: `palace.${i}.juan2`,
    text: `${borrowed ? L(`This palace has no main star, so it borrows from ${x.label(src)}. `, `本宮無主星，借${x.label(src)}的星曜來看。`) : ''}${parts.join(L(' ', ''))}`,
    evidence: [L(`${majors.map((s) => `⟨${s}⟩`).join(' + ')} in ${x.label(src)}`, `${majors.map((s) => `⟨${s}⟩`).join('、')}在${x.label(src)}`)],
    sources,
  };
}

// Verdict phrases used in the 命宮 tables, most specific first.
const VERDICTS: [string, string, string][] = [
  ['大貴財官格', 'a highly honoured wealth-and-office pattern (財官格)', '大貴的財官格'],
  ['福厚財官格', 'a wealth-and-office pattern (財官格) with ample good fortune', '福厚的財官格'],
  ['財官格', 'a wealth-and-office pattern (財官格): success with both money and position', '財官格：錢財和地位都有成就'],
  ['貴不耐久', 'honour that does not last', '貴而不能長久'],
  ['貴格', 'a pattern of honour and standing (貴格)', '貴格：有名望和地位'],
  ['主貴', 'honour and standing', '主貴：有名望和地位'],
  ['福不耐久', 'good fortune that does not last', '福氣不能長久'],
  ['合局不耐久', 'it fits the pattern, but results do not last', '合格局，但成果不能長久'],
  ['不耐久', 'results that do not last', '成果不能長久'],
  ['福厚', 'ample good fortune', '福厚'],
  ['為福', 'good fortune', '為福'],
  ['祿合格', 'a prosperity (祿) combination', '祿合格'],
  ['成敗帶疾', 'ups and downs, with health to watch', '有起有落，健康要留意'],
  ['有成敗', 'ups and downs', '有起有落'],
  ['悔吝', 'regrets and setbacks', '多悔恨和挫折'],
  ['困', 'hardship', '較為困頓'],
  ['下局', 'a lesser form of the placement', '較次的格局'],
  ['孤寡', 'a more solitary path', '人生較為孤獨'],
  ['利達', 'success', '順利通達'],
  ['吉利', 'favourable', '吉利'],
  ['宜之', 'suitable', '相宜'],
  ['吉', 'favourable', '吉'],
  ['利', 'favourable', '利'],
];
const verdict = (clause: string) => {
  const v = VERDICTS.find(([k]) => clause.includes(k));
  return v && L(v[1], v[2]);
};

const STEMS = '甲乙丙丁戊己庚辛壬癸';
const BRANCH_RE = /([子丑寅卯辰巳午未申酉戌亥]+)宮/g;

interface MingVerdict {
  line: string;
  text: string;
}

/** Read the 全書 命宮 table for a main star at a branch, for a birth-year stem. */
export function readMingTable(star: string, branch: string, stem: string): MingVerdict | undefined {
  for (const line of MING_TABLE[star] ?? []) {
    for (const sentence of line.split('。').filter(Boolean)) {
      const clauses = sentence.split('，');
      const branches = [...clauses[0].matchAll(BRANCH_RE)].flatMap((m) => [...m[1]]);
      if (!branches.includes(branch)) continue;
      const byStem: { stems: string[]; verdict?: string }[] = [];
      const general: string[] = [];
      for (const c of clauses) {
        const m = c.match(/([甲乙丙丁戊己庚辛壬癸六]+)生(?:人)?(.*)$/);
        if (m) byStem.push({ stems: [...m[1]].filter((ch) => STEMS.includes(ch)), verdict: verdict(m[2]) });
        else {
          const v = verdict(c.replace(BRANCH_RE, ''));
          if (v) general.push(c.includes('加吉星') ? L(`with lucky stars, ${v}`, `加吉星則${v}`) : v);
        }
      }
      const head = L(`The 全書's table for ⟨${star}⟩ in the ${branch} Life palace`, `全書命宮表：⟨${star}⟩在${branch}宮坐命`);
      const mine = byStem.find((g) => g.stems.includes(stem));
      if (mine?.verdict) return { line, text: L(`${head} names ${stem} years: ${mine.verdict}.`, `${head}，${stem}年生人：${mine.verdict}。`) };
      if (byStem.length) {
        const listed = byStem
          .filter((g) => g.verdict)
          .map((g) => L(`${g.stems.join('')} years, ${g.verdict}`, `${g.stems.join('')}年生人${g.verdict}`))
          .join(L('; ', '；'));
        return {
          line,
          text: L(
            `${head} lists ${listed}. A ${stem} year is not among them, so the table gives no special verdict for you.${general.length ? ` Generally: ${general.join('; ')}.` : ''}`,
            `${head}，列出${listed}。${stem}年不在其中，表中對你沒有特別的論斷。${general.length ? `一般而言：${general.join('；')}。` : ''}`,
          ),
        };
      }
      if (general.length) return { line, text: L(`${head}: ${general.join('; ')}.`, `${head}：${general.join('；')}。`) };
    }
  }
  return undefined;
}

export function mingClassics(x: Ctx): Finding[] {
  const out: Finding[] = [];
  for (const star of x.majors(x.ming)) {
    const r = readMingTable(star, x.p(x.ming).branch, x.c.yearStem);
    if (!r) continue;
    out.push({
      id: `ming.table.${star}`,
      text: r.text,
      evidence: [L(`⟨${star}⟩ in ${x.label(x.ming)}`, `⟨${star}⟩在${x.label(x.ming)}`), L(`birth-year stem ${x.c.yearStem}`, `生年天干${x.c.yearStem}`)],
      sources: [{ verse: r.line, work: WORK, section: MING_SECTION, basis: '全書 卷二 命宮: each main star’s placements by branch, with the birth-year stems that form a pattern there' }],
    });
  }
  return out;
}
