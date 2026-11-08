// What the sources advise doing about a difficult star, period or year (趨吉避凶).
// Every note is tied to a source: a verse of 《紫微斗數全書》 (checked by scripts/verify-sources.mjs),
// or a published case reading by a modern teacher, cited by episode or article and paraphrased.
// Left out on purpose: feng shui remedies (倪海廈's bed and desk directions) and anything that
// promises to avert illness or death.

import type { Finding } from './evaluate';
import type { Ctx } from './predicates';
import type { Source } from './rules/types';

/** 全書: hidden good deeds (陰騭) carry a person through a bad period. */
const YINZHI: Source[] = [
  { verse: '陰騭延年增百福，至於陷地不遭傷', work: '紫微斗數全書', section: '斗數骨髓賦', basis: '全書: hidden good deeds lengthen life and add blessings, so even a weak placement does no harm' },
  {
    verse: '平日利物濟人，反身修德，以作善降福，雖凶不害',
    work: '紫微斗數全書',
    section: '論陰騭延壽',
    basis: '全書 卷三 論陰騭延壽: people whose 大限, 小限 and 流年 reach bad palaces yet come through unharmed are those who helped others and corrected their own conduct',
  },
];

/** 全書 卷二 陀羅入限吉凶訣 (printed under the 命宮 section of 卷二). */
const TUO_PATIENCE: Source = {
  verse: '限遇陀羅事亦多，必然忍耐要謙和',
  work: '紫微斗數全書',
  section: '一命宮',
  basis: '全書 卷二 陀羅入限吉凶訣: a period that meets 陀羅 brings many troubles, met with patience and humility',
};

const NI = (ep: number, what: string): Source => ({ basis: `倪海廈 天紀 lecture ${ep} (student notes, finalhopes.com): ${what}` });
const FAN = (n: string, what: string): Source => ({ basis: `范振木, 紫微斗數命例探討與解讀 (論命實務${n}, fjm.tw): ${what}` });
const KUNDE: Source = { basis: 'kunde.org.tw 紫微案例故事 「淑真的廉貞故事」: for a 廉貞 Life palace with 七殺 in the Spouse palace, the author suggests a partner whose Life palace holds a gentler main star (天府, 天同, 天梁 or 天相)' };

const PEER_MONEY: Source[] = [
  NI(10, '巨門化忌 in the Friends palace: do not go into business partnerships, which invite legal trouble'),
  FAN('十一', '武曲化忌 in the Friends palace led to money disputes with friends; choose friends carefully and avoid lending or borrowing with them'),
  FAN('一', 'where the Siblings palace overlaps the Wealth palace, better not to lend or borrow money with siblings'),
];

const advice = (f: Omit<Finding, 'advice'>): Finding => ({ ...f, advice: true });

/** A 化忌 (birth, decade or year) in the Siblings or Friends palace. */
function peerMoney(x: Ctx, at: number, id: string, layer: string, period: string): Finding[] {
  const name = x.p(at).name;
  if (name !== '兄弟' && name !== '僕役') return [];
  const who = name === '兄弟' ? 'siblings and close partners' : 'friends and colleagues';
  return [
    advice({
      id: `${id}.advice.peer-money`,
      text: `Advice: with ${layer} 化忌 in the ${name === '兄弟' ? 'Siblings' : 'Friends'} palace, the case readings warn against joint ventures, guarantees and lending or borrowing money with ${who}${period}. Keep money matters with them in writing.`,
      evidence: [`${layer} 化忌 in ${x.label(at)}`],
      sources: PEER_MONEY,
    }),
  ];
}

// ── Natal palace cards ──────────────────────────────────────────────────────

export function palaceAdvice(x: Ctx, i: number, id: string, pressured: boolean): Finding[] {
  const out: Finding[] = [];
  const name = x.p(i).name;
  if (x.hasMut(i, '忌')) out.push(...peerMoney(x, i, id, 'the birth-year', ''));

  const juJi = x.muts(i).some(([s, m]) => s === '巨門' && m === '忌');
  if (juJi && x.has(i, '天刑'))
    out.push(
      advice({
        id: `${id}.advice.channel`,
        text: 'Advice: 巨門化忌 with 天刑 points to disputes and legal trouble. 倪海廈 reads the same stars as an asset in work that deals with conflict and rules, such as police, the military or law, and as trouble in the matching periods otherwise.',
        evidence: [`⟨巨門⟩化忌 and ⟨天刑⟩ in ${x.label(i)}`],
        sources: [NI(13, '巨門, 天刑 and 化忌 in one palace mean lawsuits and disputes; excellent for a police officer or soldier, otherwise trouble in the matching periods')],
      }),
    );

  if (name === '財帛' && pressured)
    out.push(
      advice({
        id: `${id}.advice.steady-money`,
        text: 'Advice: with the Wealth palace under pressure, the case readings favour property and long-term holdings over speculation and quick trading.',
        evidence: [`${x.label(i)} rates under pressure`],
        sources: [FAN('十一', 'with a weak Wealth palace, buying property and long-term investment suit better than active money management')],
      }),
    );

  if (name === '夫妻' && x.has(i, '七殺') && x.has(x.ming, '廉貞'))
    out.push(
      advice({
        id: `${id}.advice.partner`,
        text: 'Advice: 廉貞 in the Life palace with 七殺 in the Spouse palace can make a relationship tense and quarrelsome. One case reading suggests a partner of steadier temperament, one whose Life palace holds 天府, 天同, 天梁 or 天相.',
        evidence: [`⟨廉貞⟩ in ${x.label(x.ming)}`, `⟨七殺⟩ in ${x.label(i)}`],
        sources: [KUNDE],
      }),
    );
  return out;
}

// ── Decades ─────────────────────────────────────────────────────────────────

export function decadeAdvice(x: Ctx, i: number, id: string, challenging: boolean, ji?: number): Finding[] {
  const out: Finding[] = [];
  if (ji !== undefined && ji >= 0) out.push(...peerMoney(x, ji, id, 'the decade', ' during these ten years'));
  if (x.has(i, '陀羅'))
    out.push(
      advice({
        id: `${id}.advice.tuo`,
        text: 'Advice: 陀羅 sits in the decade palace, a sign of drawn-out delays. The classics answer it with patience and humility: don’t force matters, and let slow ones run their course.',
        evidence: [`⟨陀羅⟩ in ${x.label(i)}`],
        sources: [TUO_PATIENCE],
      }),
    );
  if (challenging)
    out.push(
      advice({
        id: `${id}.advice.yinzhi`,
        text: 'Advice: for a hard period the 全書’s remedy is conduct, not ritual. People who quietly help others and correct their own faults are said to come through bad periods unharmed (陰騭). Giving, helping and keeping your dealings clean are the classical answer.',
        evidence: ['the decade rates as challenging'],
        sources: YINZHI,
      }),
    );
  return out;
}

// ── Years ───────────────────────────────────────────────────────────────────

export function yearAdvice(x: Ctx, id: string, challenging: boolean, ji: number): Finding[] {
  const out: Finding[] = [];
  if (ji >= 0) {
    out.push(...peerMoney(x, ji, id, 'the year', ' this year'));
    const name = x.p(ji).name;
    if (name === '夫妻' || name === '官祿')
      out.push(
        advice({
          id: `${id}.advice.wedding`,
          text: `Advice: the year 化忌 ${name === '夫妻' ? 'falls in' : 'clashes into'} the Spouse palace. If a wedding is planned, 倪海廈’s rule is to marry after the 化忌 has passed (過忌成婚), not during it.`,
          evidence: [`year 化忌 in ${x.label(ji)}`],
          sources: [NI(12, 'a marriage made under a 化忌 does not hold; marrying after it has passed (過忌成婚) is best')],
        }),
      );
  }
  if (challenging)
    out.push(
      advice({
        id: `${id}.advice.study`,
        text: 'Advice: in a difficult year, 倪海廈 suggests putting the energy into study or teaching rather than new ventures.',
        evidence: ['the year rates as challenging'],
        sources: [NI(12, 'when the year is bad, go and study or teach')],
      }),
    );
  return out;
}
