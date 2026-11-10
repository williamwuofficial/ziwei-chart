// 10-year periods (大限). Each decade is read the classical way:
//  1. The decade's 命宮 sits on a natal palace, whose affairs become the decade's focus.
//  2. The stars of that palace (borrowed from opposite if empty) colour the decade.
//  3. The decade palace's stem transforms four stars (大限四化); where 祿 and 忌 land matters most.
//  4. 疊忌 / 疊祿: decade 化忌 or 化祿 landing where the natal one (or 祿存) already is.
//  5. Named patterns re-checked with the decade palace standing in for the 命宮.
// The tone is a transparent heuristic over those findings; the parts are shown to the reader.

import { STATUS_RANK, evaluatePatterns, type Finding, type PatternFinding } from './evaluate';
import type { ChartM, Mut, PalaceName } from './model';
import { Ctx, opp, sfsz } from './predicates';
import { decadeAdvice } from './advice';
import { L, tr } from '../i18n/lang';
import { MAJOR_NATURE, MUT_TEXT, PALACE_DOMAIN, palaceTitle } from './rules/stars';
import type { Source } from './rules/types';

const DECADE_BASIS: Source = { basis: '大限 method: the decade’s 命宮 falls on a natal palace, and that palace’s affairs become the decade’s focus' };
const DECADE_STAR_BASIS: Source = { basis: '大限 method: the stars of the decade palace (borrowed from opposite when empty) colour the decade' };
const DECADE_MUT_BASIS: Source = { basis: '大限四化: the decade palace’s heavenly stem transforms four stars for ten years; where 化祿 and 化忌 land matters most' };
const DECADE_LU_SRC: Source = { verse: '大限十年吉慶無疑', work: '紫微斗數全書', section: '問化祿星所主若何', basis: DECADE_MUT_BASIS.basis };
const DECADE_JI_SRC: Source = { verse: '大限十年悔吝', work: '紫微斗數全書', section: '問化忌星所主若何', basis: DECADE_MUT_BASIS.basis };
const DIEJI_BASIS: Source = { basis: '四化 rule: a decade 化忌 on the palace that already holds the natal 化忌 doubles the obstruction (疊忌)' };
const DIELU_BASIS: Source = { basis: '四化 rule: a decade 化祿 on a palace that already holds the natal 化祿 or 祿存 doubles the gain (疊祿 / 雙祿)' };
const JICHONG_BASIS: Source = { basis: '四化 rule: a decade 化忌 in the decade 命宮, or in its opposite palace (忌沖), presses on the whole decade' };

const FOCUS: Record<PalaceName, string> = {
  命宮: 'your own Life palace: a decade about establishing who you are, with your natal character fully on display',
  兄弟: 'the Siblings palace: siblings, peers and partners shape the decade, as do shared ventures and cash reserves',
  夫妻: 'the Spouse palace: relationships and partnership are central, and a key partner shapes events',
  子女: 'the Children palace: children, students, creative output and the people who report to you come to the fore',
  財帛: 'the Wealth palace: earning and managing money take centre stage',
  疾厄: 'the Health palace: health, stamina and working conditions ask for attention',
  遷移: 'the Travel palace: movement, relocation, public exposure and life away from home',
  僕役: 'the Friends palace: friends, colleagues and networks decide results',
  官祿: 'the Career palace: work, position and achievement dominate',
  田宅: 'the Property palace: home, property and the family base, such as buying, moving or building a household',
  福德: 'the Fortune palace: inner life, interests and peace of mind; a decade to pursue what you enjoy',
  父母: 'the Parents palace: parents, superiors and institutions, plus documents, credentials and authority',
};

const FOCUS_ZH: Record<PalaceName, string> = {
  命宮: '本命命宮：這十年重在確立自我，本命的性格會完整地表現出來',
  兄弟: '兄弟宮：兄弟、同輩和合夥人左右這十年，合作事業和現金周轉也是重點',
  夫妻: '夫妻宮：感情和伴侶關係是重心，關鍵的伴侶會影響事情的走向',
  子女: '子女宮：子女、學生、創作成果和部屬成為焦點',
  財帛: '財帛宮：賺錢和理財是這十年的主軸',
  疾厄: '疾厄宮：健康、體力和工作環境需要留意',
  遷移: '遷移宮：外出、遷居、在外的表現和離鄉發展',
  僕役: '僕役宮：朋友、同事和人脈決定成敗',
  官祿: '官祿宮：工作、職位和成就是主軸',
  田宅: '田宅宮：家庭、房產和家業，例如置產、搬家或成家立室',
  福德: '福德宮：內心、興趣和心境；適合追求自己喜愛的事',
  父母: '父母宮：父母、上司和機構，以及文書、資格和權威',
};

const STAGES_ZH: Record<string, string> = {
  Childhood: '童年',
  Education: '求學',
  'Early career and relationships': '初入社會與感情',
  Establishment: '立業',
  'Peak responsibility': '責任最重',
  Consolidation: '穩固',
  Transition: '轉變',
  'Later life': '晚年',
};

const STAGES: [number, number, string][] = [
  [0, 12, 'Childhood'],
  [13, 22, 'Education'],
  [23, 32, 'Early career and relationships'],
  [33, 42, 'Establishment'],
  [43, 52, 'Peak responsibility'],
  [53, 62, 'Consolidation'],
  [63, 72, 'Transition'],
  [73, 200, 'Later life'],
];

/** Life-stage labels overlapping a nominal-age range. */
export function stageFor(from: number, to: number): string {
  return STAGES.filter(([a, b]) => a <= to && b >= from)
    .map(([, , label]) => L(label, STAGES_ZH[label]))
    .join(' → ');
}

export type DecadeTone = 'favourable' | 'mixed' | 'challenging';

export interface DecadeReading {
  index: number;
  range: [number, number];
  stage: string;
  stem: string;
  natalPalace: PalaceName;
  tone: DecadeTone;
  score: number;
  /** How the score was built, for the tone's "Why?" panel. */
  scoreParts: string[];
  findings: Finding[];
  patterns: PatternFinding[];
}

const MUT_ORDER: Mut[] = ['祿', '權', '科', '忌'];

export function readDecade(c: ChartM, i: number): DecadeReading {
  const natal = new Ctx(c);
  const x = new Ctx(c, { ming: i });
  const p = c.palaces[i];
  const id = `decade.${p.decade[0]}`;
  const findings: Finding[] = [];
  const parts: string[] = [];
  let score = 0;
  const add = (n: number, why: string) => {
    score += n;
    parts.push(`${n > 0 ? '+' : '−'}${Math.abs(n)}: ${why}`);
  };

  // 1. Focus: which natal palace the decade runs through.
  findings.push({
    id: `${id}.focus`,
    text: L(`This decade runs through ${FOCUS[p.name]}.`, `這十年行經${FOCUS_ZH[p.name]}。`),
    evidence: [L(`大限 ${p.decade[0]}–${p.decade[1]} is ${natal.label(i)}`, `${p.decade[0]}–${p.decade[1]}歲大限在${natal.label(i)}`)],
    sources: [DECADE_BASIS],
  });

  // 2. The decade palace's main stars.
  const borrowed = x.noMain(i);
  const src = borrowed ? opp(i) : i;
  const stars = c.palaces[src].major;
  if (stars.length) {
    const desc = stars
      .map((s) => {
        const n = MAJOR_NATURE[s.name];
        const bright = s.brightness && ['廟', '旺'].includes(s.brightness);
        const weak = s.brightness && ['陷', '不'].includes(s.brightness);
        return L(`⟨${s.name}⟩ (${n?.en ?? 'main star'}, ${bright ? 'bright' : weak ? 'weak' : 'moderate'})`, `⟨${s.name}⟩（${bright ? '廟旺' : weak ? '落陷' : '平'}）`);
      })
      .join(L(' with ', '、'));
    const lead = L(
      stars
        .map((s) => MAJOR_NATURE[s.name]?.text.split('. ')[0])
        .filter(Boolean)
        .map((t, n) => (n === 0 ? t! : t!.charAt(0).toLowerCase() + t!.slice(1)))
        .join('; '),
      stars
        .map((s) => (MAJOR_NATURE[s.name] ? tr(MAJOR_NATURE[s.name].text).split('。')[0] : undefined))
        .filter(Boolean)
        .join('；'),
    );
    findings.push({
      id: `${id}.stars`,
      text: L(
        `The decade is coloured by ${desc}${borrowed ? `, borrowed from ${natal.label(src)}` : ''}. ${lead}.`,
        `這十年由${desc}定調${borrowed ? `（借自${natal.label(src)}）` : ''}。${lead}。`,
      ),
      evidence: stars.map((s) => L(`⟨${s.name}⟩${s.brightness ? ` ⟨${s.brightness}⟩` : ''} in ${natal.label(src)}`, `⟨${s.name}⟩${s.brightness ? `⟨${s.brightness}⟩` : ''}在${natal.label(src)}`)),
      sources: [DECADE_STAR_BASIS],
    });
  }

  // Support and malefics around the decade palace (natal stars).
  const sup = x.support(sfsz(i));
  const bad = x.malefic(sfsz(i));
  // Halved and capped so star counts don't drown out the decade's own 四化 and patterns.
  const balance = Math.max(-2, Math.min(2, Math.trunc((sup.length - bad.length) / 2)));
  if (balance !== 0) add(balance, L(`${sup.length} supporting vs ${bad.length} malefic stars in the decade’s 三方四正`, `大限三方四正吉星${sup.length}顆、煞星${bad.length}顆`));

  // 3. Decade 四化.
  const muts = p.decadeMut;
  if (muts) {
    const keyPalaces = sfsz(i);
    muts.forEach((star, k) => {
      const m = MUT_ORDER[k];
      const at = natal.find(star);
      if (at < 0) return;
      const domain = PALACE_DOMAIN[c.palaces[at].name];
      if (m === '祿' || m === '忌') {
        findings.push({
          id: `${id}.mut.${m}`,
          text: L(
            `This decade’s 化${m} falls on ⟨${star}⟩ in your natal ${domain.en} palace: it ${MUT_TEXT[m](domain.domain)}.`,
            `大限化${m}落在本命${palaceTitle(c.palaces[at].name)}的⟨${star}⟩：${MUT_TEXT[m](domain.domain)}。`,
          ),
          evidence: [L(`decade stem ${p.stem} turns ⟨${star}⟩ into 化${m}`, `大限宮干${p.stem}化⟨${star}⟩為化${m}`), L(`⟨${star}⟩ is in ${natal.label(at)}`, `⟨${star}⟩在${natal.label(at)}`)],
          sources: [m === '祿' ? DECADE_LU_SRC : DECADE_JI_SRC],
        });
        if (keyPalaces.includes(at)) add(m === '祿' ? 1 : -1, L(`decade 化${m} lands in the decade’s 三方四正 (${natal.label(at)})`, `大限化${m}落在大限三方四正（${natal.label(at)}）`));
      }
      if (m === '忌' && natal.hasMut(at, '忌')) {
        findings.push({
          id: `${id}.dieji`,
          text: L(
            `Double obstruction (疊忌): the decade 化忌 lands on the palace that already holds your birth-year 化忌, so ${domain.domain} is the decade’s main pressure point.`,
            `疊忌：大限化忌落在生年化忌所在的宮位，${tr(domain.domain)}是這十年最主要的壓力所在。`,
          ),
          evidence: [L(`decade 化忌 on ⟨${star}⟩ in ${natal.label(at)}`, `大限化忌在${natal.label(at)}的⟨${star}⟩`), L(`birth-year 化忌 also in ${natal.label(at)}`, `生年化忌也在${natal.label(at)}`)],
          sources: [DIEJI_BASIS],
        });
        add(-2, L(`疊忌 in ${natal.label(at)}`, `疊忌在${natal.label(at)}`));
      }
      if (m === '忌' && (at === i || at === opp(i))) {
        findings.push({
          id: `${id}.jichong`,
          text:
            at === i
              ? L(
                  'The decade 化忌 sits in the decade palace itself, so worry and setbacks touch the whole decade. It favours caution over expansion.',
                  '大限化忌就在大限命宮，煩惱和挫折會貫穿整個十年。宜守不宜攻。',
                )
              : L(
                  'The decade 化忌 clashes into the decade palace from opposite (忌沖), so outside pressure and changes of circumstance are likely. Keep plans flexible.',
                  '大限化忌從對宮沖入大限命宮（忌沖），容易有外來壓力和環境變動。計畫宜保留彈性。',
                ),
          evidence: [L(`decade 化忌 on ⟨${star}⟩ in ${natal.label(at)}`, `大限化忌在${natal.label(at)}的⟨${star}⟩`), L(`decade palace ${natal.label(i)}`, `大限命宮${natal.label(i)}`)],
          sources: [JICHONG_BASIS],
        });
        add(-1, L(`decade 化忌 ${at === i ? 'in' : 'clashing into'} the decade palace`, at === i ? '大限化忌在大限命宮' : '大限化忌沖大限命宮'));
      }
      if (m === '祿' && (natal.hasMut(at, '祿') || natal.has(at, '祿存'))) {
        findings.push({
          id: `${id}.dielu`,
          text: L(
            `Double prosperity (疊祿): the decade 化祿 joins ${natal.hasMut(at, '祿') ? 'your birth-year 化祿' : '⟨祿存⟩'} in the ${domain.en} palace, a strong sign of gain through ${domain.domain}.`,
            `疊祿：大限化祿與${natal.hasMut(at, '祿') ? '生年化祿' : '⟨祿存⟩'}同在${palaceTitle(c.palaces[at].name)}，是${tr(domain.domain)}方面大有收穫的有力徵兆。`,
          ),
          evidence: [
            L(`decade 化祿 on ⟨${star}⟩ in ${natal.label(at)}`, `大限化祿在${natal.label(at)}的⟨${star}⟩`),
            natal.hasMut(at, '祿') ? L(`birth-year 化祿 in ${natal.label(at)}`, `生年化祿在${natal.label(at)}`) : L(`⟨祿存⟩ in ${natal.label(at)}`, `⟨祿存⟩在${natal.label(at)}`),
          ],
          sources: [DIELU_BASIS],
        });
        add(1, L(`疊祿 in ${natal.label(at)}`, `疊祿在${natal.label(at)}`));
      }
    });
  }

  // 5. Patterns around the decade palace.
  const pats = evaluatePatterns(x).filter((f) => f.status !== 'bare' && f.status !== 'broken' && f.rule.id !== 'ge.wu-zhengyao');
  const good = pats.filter((f) => f.rule.kind === 'auspicious' && (f.status === 'formed' || f.status === 'flawed'));
  const hard = pats.filter((f) => f.rule.kind === 'adverse' && f.status === 'present');
  const goodPts = Math.min(2, good.filter((f) => f.status === 'formed').length + Math.floor(good.filter((f) => f.status === 'flawed').length / 2));
  if (goodPts) add(goodPts, L(`auspicious patterns around the decade palace: ${good.map((f) => f.rule.zh).join(', ')}`, `大限命宮成吉格：${good.map((f) => f.rule.zh).join('、')}`));
  if (hard.length) add(-Math.min(2, hard.length), L(`challenging patterns around the decade palace: ${hard.map((f) => f.rule.zh).join(', ')}`, `大限命宮見凶格：${hard.map((f) => f.rule.zh).join('、')}`));

  const tone: DecadeTone = score >= 2 ? 'favourable' : score <= -2 ? 'challenging' : 'mixed';
  if (!parts.length) parts.push(L('0: no strong signals either way', '0：吉凶都沒有明顯的訊號'));
  findings.push(...decadeAdvice(natal, i, id, tone === 'challenging', muts ? natal.find(muts[3]) : -1));
  return {
    index: i,
    range: p.decade,
    stage: stageFor(p.decade[0], p.decade[1]),
    stem: p.stem,
    natalPalace: p.name,
    tone,
    score,
    scoreParts: parts,
    findings,
    patterns: pats.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]),
  };
}

/** All decades in age order, up to those starting by age 95. */
export function readDecades(c: ChartM): DecadeReading[] {
  return c.palaces
    .filter((p) => p.decade[0] <= 95)
    .sort((a, b) => a.decade[0] - b.decade[0])
    .map((p) => readDecade(c, p.index));
}

