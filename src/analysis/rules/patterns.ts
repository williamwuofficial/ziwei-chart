// Named patterns (格局). Conditions follow the traditional pattern catalogue (formation rules and
// the general rule that 四煞, 空劫 or 化忌 in the 三方四正 "break" a lucky pattern). Verses are
// classical 經云 / 賦 lines, public domain. Meanings are paraphrased as tendencies, not fates.

import { anhe, LUCKY6, neighbours, opp, sfsz, SHA4, trines, type Ctx } from '../predicates';
import type { Match, PatternRule } from './types';

const CATALOGUE = 'Traditional 格局 catalogue: formation conditions';

const m = (x: Ctx, evidence: string[], palaces: number[] = sfsz(x.ming), variant?: string): Match => ({
  evidence,
  palaces,
  variant,
});
const sitsIn = (x: Ctx, i: number, stars: string[]) => `${stars.map((s) => `⟨${s}⟩`).join(' + ')} in ${x.label(i)}`;

/** 夾 helper: stars a and b on the two sides of palace i (either way round). */
function flanked(x: Ctx, i: number, a: (j: number) => boolean, b: (j: number) => boolean): boolean {
  const [l, r] = neighbours(i);
  return (a(l) && b(r)) || (a(r) && b(l));
}

export const AUSPICIOUS: PatternRule[] = [
  {
    id: 'ge.zifu-tonggong',
    zh: '紫府同宮格',
    en: 'Emperor and Treasury together',
    kind: 'auspicious',
    sources: [{ verse: '紫府同宮，終身福厚', basis: `${CATALOGUE}: 命宮 in 寅 or 申 holding 紫微 and 天府` }],
    match: (x) => (x.at(x.ming, '寅', '申') && x.has(x.ming, '紫微', '天府') ? m(x, [sitsIn(x, x.ming, ['紫微', '天府'])]) : undefined),
    text: 'The leadership star and the treasury star share the Life palace. Classically a sign of lasting good fortune: steady authority, the ability to hold on to resources, and a life that tends to stabilise rather than swing. It depends heavily on helper stars (輔弼) to reach its full level.',
  },
  {
    id: 'ge.zifu-chaoyuan',
    zh: '紫府朝垣格',
    en: 'Emperor and Treasury salute the Life palace',
    kind: 'auspicious',
    sources: [{ verse: '紫府朝垣，食祿萬鍾', basis: `${CATALOGUE}: 紫微 and 天府 both shine on 命宮 from its trines or opposite palace` }],
    match: (x) => {
      if (x.has(x.ming, '紫微') || x.has(x.ming, '天府')) return undefined;
      const others = [...trines(x.ming), opp(x.ming)];
      const zw = others.find((i) => x.has(i, '紫微'));
      const tf = others.find((i) => x.has(i, '天府'));
      return zw !== undefined && tf !== undefined ? m(x, [`⟨紫微⟩ in ${x.label(zw)}`, `⟨天府⟩ in ${x.label(tf)}`]) : undefined;
    },
    text: 'The two "ruler" stars support the Life palace from outside. Classically associated with a comfortable livelihood and backing from people in authority: you tend to do best inside strong structures, with seniors who recognise you.',
  },
  {
    id: 'ge.tianfu-chaoyuan',
    zh: '天府朝垣格',
    en: 'Treasury in the Heaven gate (戌)',
    kind: 'auspicious',
    sources: [{ verse: '天府臨戌有星扶，腰金衣紫', basis: `${CATALOGUE}: 天府 and 廉貞 in 命宮 at 戌, with no malefics` }],
    match: (x) => (x.at(x.ming, '戌') && x.has(x.ming, '天府', '廉貞') ? m(x, [sitsIn(x, x.ming, ['天府', '廉貞'])]) : undefined),
    text: 'The treasury star sits in 戌, the "heaven gate" position. Classically a pattern of substantial wealth and standing, especially with 左輔 or 右弼 in the Life palace. It favours careful stewardship over risk.',
  },
  {
    id: 'ge.junchen-qinghui',
    zh: '君臣慶會格',
    en: 'Ruler and ministers in council',
    kind: 'auspicious',
    sources: [{ verse: '君臣慶會，才學經邦', basis: `${CATALOGUE}: 紫微 in 命宮 met by its "ministers" (府相, 輔弼, 昌曲, 魁鉞) in the 三方四正` }],
    match: (x) => {
      if (!x.has(x.ming, '紫微')) return undefined;
      const ministers = sfsz(x.ming).flatMap((i) => x.hasAny(i, LUCKY6));
      const uniq = [...new Set(ministers)];
      return uniq.length >= 2 ? m(x, [`⟨紫微⟩ in ${x.label(x.ming)}`, `ministers in the 三方四正: ${uniq.map((s) => `⟨${s}⟩`).join(', ')}`]) : undefined;
    },
    text: 'The emperor star has its court around it. Classically one of the strongest leadership patterns: talent for organising people, being trusted with responsibility, and gathering capable helpers. If malefics sit with 紫微, the classics warn of "servants overpowering the master": being undermined by those you rely on.',
  },
  {
    id: 'ge.fuxiang-chaoyuan',
    zh: '府相朝垣格',
    en: 'Treasury and Seal salute the Life palace',
    kind: 'auspicious',
    sources: [{ verse: '府相朝垣格最良，出仕為官大吉昌', basis: `${CATALOGUE}: 天府 and 天相 occupy the two trines (財帛 and 官祿) of 命宮` }],
    match: (x) => {
      const [a, b] = trines(x.ming);
      const ok = (x.has(a, '天府') && x.has(b, '天相')) || (x.has(a, '天相') && x.has(b, '天府'));
      return ok ? m(x, [`⟨天府⟩ and ⟨天相⟩ in the trines ${x.label(a)} and ${x.label(b)}`]) : undefined;
    },
    text: 'The stars of stored wealth and of the official seal guard your money and career palaces. Classically a sign of secure income and success in public or institutional roles, and of warm ties with family and friends.',
  },
  {
    id: 'ge.jiyue-tongliang',
    zh: '機月同梁格',
    en: 'Secretary pattern (機月同梁)',
    kind: 'auspicious',
    sources: [{ verse: '機月同梁作吏人', basis: `${CATALOGUE}: 天機, 太陰, 天同 and 天梁 all meet in the 三方四正 of 命宮; 文昌 or 文曲 among them is required` }],
    match: (x) => {
      const s = sfsz(x.ming);
      if (!x.inSet(s, '天機', '太陰', '天同', '天梁')) return undefined;
      const wen = s.some((i) => x.hasAny(i, ['文昌', '文曲']).length);
      return m(x, ['⟨天機⟩, ⟨太陰⟩, ⟨天同⟩ and ⟨天梁⟩ all in the 三方四正'], s, wen ? undefined : 'Neither 文昌 nor 文曲 joins the group, which the catalogue requires for the full pattern.');
    },
    text: 'The four "civil" stars gather around the Life palace. Classically the pattern of the capable administrator: steady careers in government, large organisations, planning, writing or specialist roles, with low risk and steady progress rather than dramatic leaps.',
  },
  {
    id: 'ge.jiliang-jiahui',
    zh: '機梁加會格',
    en: 'Strategist and Elder together',
    kind: 'auspicious',
    sources: [{ verse: '（天機、天梁）會左右、昌曲，文為清顯，武為忠良', basis: `${CATALOGUE}: 天機 and 天梁 in 命宮 at 辰 or 戌` }],
    match: (x) => (x.at(x.ming, '辰', '戌') && x.has(x.ming, '天機', '天梁') ? m(x, [sitsIn(x, x.ming, ['天機', '天梁'])]) : undefined),
    text: 'Planning intelligence and the protective elder star share the Life palace. Classically a mind for strategy, debate and specialist knowledge; with many helpers it reaches high positions, with few it suits law, security, teaching or philosophy.',
  },
  {
    id: 'ge.wenliang-zhenji',
    zh: '文梁振紀格',
    en: 'Scholar and Elder uphold order',
    kind: 'auspicious',
    sources: [{ verse: '天梁文昌居廟旺，位至台綱', basis: `${CATALOGUE}: 天梁 bright (廟/旺) in 命宮 with 文昌 or 文曲` }],
    match: (x) => {
      if (!x.bright(x.ming, '天梁')) return undefined;
      const wen = x.hasAny(x.ming, ['文昌', '文曲']);
      return wen.length ? m(x, [`⟨天梁⟩ ${x.brightness(x.ming, '天梁')} with ${wen.map((s) => `⟨${s}⟩`).join(', ')} in ${x.label(x.ming)}`]) : undefined;
    },
    text: 'The upright elder star at strength meets a literary star. Classically suited to public service, regulation and institutions that need integrity; a reputation for fairness.',
  },
  {
    id: 'ge.juri-tonggong',
    zh: '巨日同宮格',
    en: 'Great Gate and Sun together',
    kind: 'auspicious',
    sources: [{ verse: '巨日同宮，官封三代', basis: `${CATALOGUE}: 巨門 and 太陽 in 命宮 at 寅 (申 is the weaker form)` }],
    match: (x) =>
      x.at(x.ming, '寅', '申') && x.has(x.ming, '巨門', '太陽')
        ? m(x, [sitsIn(x, x.ming, ['巨門', '太陽'])], sfsz(x.ming), x.at(x.ming, '申') ? 'In 申 the Sun is setting, so the catalogue rates this a weaker form than in 寅.' : undefined)
        : undefined,
    text: 'The Sun lights up the star of speech. Classically a pattern of public recognition, persuasion and influence: lawyers, teachers, broadcasters, politicians. Reputation tends to run ahead of money.',
  },
  {
    id: 'ge.jincan-guanghui',
    zh: '金燦光輝格',
    en: 'Golden radiance (Sun at noon)',
    kind: 'auspicious',
    sources: [{ verse: '太陽居午，謂之日麗中天，有專權之貴，敵國之富', basis: `${CATALOGUE}: 太陽 in 命宮 at 午` }],
    match: (x) => (x.at(x.ming, '午') && x.has(x.ming, '太陽') ? m(x, [`⟨太陽⟩ in ${x.label(x.ming)}`]) : undefined),
    text: 'The Sun at its noon peak in the Life palace. Classically the brightest Sun: generous, visible, a natural public figure with authority and the means that follow. Without 昌曲 or 輔弼 the classics say the brilliance is reduced.',
  },
  {
    id: 'ge.rizhao-leimen',
    zh: '日照雷門格',
    en: 'Sun shines on the Thunder Gate',
    kind: 'auspicious',
    sources: [{ verse: '日照雷門，富貴榮華', basis: `${CATALOGUE}: 太陽 and 天梁 in 命宮 at 卯` }],
    match: (x) => (x.at(x.ming, '卯') && x.has(x.ming, '太陽', '天梁') ? m(x, [sitsIn(x, x.ming, ['太陽', '天梁'])]) : undefined),
    text: 'The rising Sun with the elder star in 卯. Classically early promise and a rise to recognition, especially for daytime births; integrity and public spirit are the engines.',
  },
  {
    id: 'ge.yangliang-changlu',
    zh: '陽梁昌祿格',
    en: 'Sun, Elder, Scholar and Prosperity',
    kind: 'auspicious',
    sources: [{ verse: '天梁太陽昌祿會，臚傳第一名', basis: `${CATALOGUE} (common broader form): 太陽, 天梁, 文昌 and 祿 (祿存 or 化祿) all in the 三方四正 of 命宮` }],
    match: (x) => {
      const s = sfsz(x.ming);
      if (!x.inSet(s, '太陽', '天梁', '文昌')) return undefined;
      const lu = s.some((i) => x.has(i, '祿存') || x.hasMut(i, '祿'));
      return lu ? m(x, ['⟨太陽⟩, ⟨天梁⟩, ⟨文昌⟩ and a 祿 star all in the 三方四正']) : undefined;
    },
    text: 'The classic examination pattern. Associated with academic success, qualifications and winning competitive selections, and with careers that grow out of credentials.',
  },
  {
    id: 'ge.mingzhu-chuhai',
    zh: '明珠出海格',
    en: 'Bright pearl rises from the sea',
    kind: 'auspicious',
    sources: [{ verse: '日卯月亥，安命未，蟾宮折桂之榮', basis: `${CATALOGUE}: 命宮 at 未 with no main star, 太陽 at 卯 and 太陰 at 亥` }],
    match: (x) =>
      x.at(x.ming, '未') && x.noMain(x.ming) && x.at(x.find('太陽'), '卯') && x.at(x.find('太陰'), '亥')
        ? m(x, [`${x.label(x.ming)} has no main star`, '⟨太陽⟩ at 卯 and ⟨太陰⟩ at 亥 shine on it'])
        : undefined,
    text: 'An empty Life palace lit by a bright Sun and a bright Moon from the trines. Classically a pattern of high achievement in examinations and public life, with both career and finances doing well.',
  },
  {
    id: 'ge.yuelang-tianmen',
    zh: '月朗天門格',
    en: 'Bright Moon at the Heaven gate',
    kind: 'auspicious',
    sources: [{ verse: '月朗天門，晉爵封侯', basis: `${CATALOGUE}: 太陰 in 命宮 at 亥 (best for night births)` }],
    match: (x) =>
      x.at(x.ming, '亥') && x.has(x.ming, '太陰')
        ? m(x, [`⟨太陰⟩ in ${x.label(x.ming)}`], sfsz(x.ming), x.dayBirth ? undefined : 'A night birth, which the catalogue names as the ideal for this pattern.')
        : undefined,
    text: 'The Moon at full brightness in 亥. Classically great wealth or rank; refined, perceptive and good with assets and property. 昌曲 in the same palace is called the finest form.',
  },
  {
    id: 'ge.riyue-bingming',
    zh: '日月並明格',
    en: 'Sun and Moon both bright',
    kind: 'auspicious',
    sources: [{ verse: '日月並明，佐九重於堯殿', basis: `${CATALOGUE}: 天梁 at 丑 with 太陽 at 巳 and 太陰 at 酉; or empty 命宮 at 午 with 巨日 at 寅 and 同陰 at 子` }],
    match: (x) => {
      const sun = x.find('太陽');
      const moon = x.find('太陰');
      if (x.at(x.ming, '丑') && x.has(x.ming, '天梁') && x.at(sun, '巳') && x.at(moon, '酉'))
        return m(x, [`⟨天梁⟩ in ${x.label(x.ming)}`, '⟨太陽⟩ at 巳 and ⟨太陰⟩ at 酉']);
      if (x.at(x.ming, '午') && x.noMain(x.ming) && x.at(sun, '寅') && x.at(moon, '子'))
        return m(x, [`${x.label(x.ming)} has no main star`, '⟨太陽⟩ at 寅 and ⟨太陰⟩ at 子']);
      return undefined;
    },
    text: 'Both luminaries are bright and support the Life palace. Classically early learning and reputation, steady promotions and service close to the top of an organisation.',
  },
  {
    id: 'ge.yuesheng-canghai',
    zh: '月生滄海格',
    en: 'Moon rising over the sea',
    kind: 'auspicious',
    sources: [{ verse: '太陰居子，號曰水澄桂萼，得忠諫之職，清要之才', basis: `${CATALOGUE}: 天同 and 太陰 in 命宮 at 子` }],
    match: (x) => (x.at(x.ming, '子') && x.has(x.ming, '天同', '太陰') ? m(x, [sitsIn(x, x.ming, ['天同', '太陰'])]) : undefined),
    text: 'The Moon in clear water with the star of contentment. Classically refined, gentle and well educated, earning both money and a good name; trusted advisers and specialists.',
  },
  {
    id: 'ge.shouxing-rumiao',
    zh: '壽星入廟格',
    en: 'Longevity star in its temple',
    kind: 'auspicious',
    sources: [{ verse: '梁居午位，官資清顯', basis: `${CATALOGUE}: 天梁 in 命宮 at 午` }],
    match: (x) => (x.at(x.ming, '午') && x.has(x.ming, '天梁') ? m(x, [`⟨天梁⟩ in ${x.label(x.ming)}`]) : undefined),
    text: 'The elder (longevity) star at its strongest. Classically upright, steady and able to handle hard problems and lead people; good health and long life, with name mattering more than money.',
  },
  {
    id: 'ge.yingxing-rumiao',
    zh: '英星入廟格',
    en: 'Hero star in its temple',
    kind: 'auspicious',
    sources: [{ verse: '子午破軍，加官進爵', basis: `${CATALOGUE}: 破軍 in 命宮 at 子 or 午; 甲 and 癸 years best, 丙 and 戊 years excluded` }],
    match: (x) => {
      if (!(x.at(x.ming, '子', '午') && x.has(x.ming, '破軍'))) return undefined;
      if (x.yearStemIs('丙', '戊')) return undefined;
      return m(x, [`⟨破軍⟩ in ${x.label(x.ming)}`], sfsz(x.ming), x.yearStemIs('甲', '癸') ? `A ${x.c.yearStem} year, which the catalogue rates the best.` : undefined);
    },
    text: 'The pioneer star at full strength. Classically success away from one’s birthplace, in enterprise or command; bold breaks with the old that pay off, with sudden rises.',
  },
  {
    id: 'ge.shizhong-yinyu',
    zh: '石中隱玉格',
    en: 'Jade hidden in stone',
    kind: 'auspicious',
    sources: [{ verse: '子午巨門，石中隱玉', basis: `${CATALOGUE}: 巨門 in 命宮 at 子 or 午; 辛 and 癸 years qualify fully` }],
    match: (x) => {
      if (!(x.at(x.ming, '子', '午') && x.has(x.ming, '巨門'))) return undefined;
      const full = x.yearStemIs('辛', '癸');
      return m(x, [`⟨巨門⟩ in ${x.label(x.ming)}`], sfsz(x.ming), full ? undefined : `For a ${x.c.yearStem} year the catalogue treats this as a partial form; 辛 and 癸 years qualify fully.`);
    },
    text: 'Talent hidden like jade in rough stone. Classically high ideals and unusual ability that only show after years of hard work; the reward comes later, in business, public office or as an authority in a field.',
  },
  {
    id: 'ge.qisha-chaodou',
    zh: '七殺朝斗格',
    en: 'General faces the Dipper',
    kind: 'auspicious',
    sources: [{ verse: '七殺寅申子午，一生爵祿榮昌', basis: `${CATALOGUE}: 七殺 in 命宮 at 寅, 申, 子 or 午` }],
    match: (x) => (x.at(x.ming, '寅', '申', '子', '午') && x.has(x.ming, '七殺') ? m(x, [`⟨七殺⟩ in ${x.label(x.ming)}`]) : undefined),
    text: 'The general star in its strongest positions. Classically a commander or founder: decisive, strategic and able to build something from nothing. With malefics as well as helpers, the classics warn of big rises and falls.',
  },
  {
    id: 'ge.matou-daijian',
    zh: '馬頭帶箭格',
    en: 'Arrow at the horse’s head',
    kind: 'auspicious',
    sources: [{ verse: '馬頭帶箭，鎮禦邊疆', basis: `${CATALOGUE}: 命宮 at 午 with 擎羊, holding 貪狼 or 天同+太陰 (丙 and 戊 years)` }],
    match: (x) =>
      x.at(x.ming, '午') && x.has(x.ming, '擎羊') && (x.has(x.ming, '貪狼') || x.has(x.ming, '天同', '太陰'))
        ? m(x, [`⟨擎羊⟩ with ${x.majors(x.ming).map((s) => `⟨${s}⟩`).join(' + ')} in ${x.label(x.ming)}`])
        : undefined,
    tolerates: ['擎羊', '火星', '鈴星'],
    text: 'The blade star sits at the horse position and turns into drive. Classically hard early years and success that comes from going far from home; good fortune arrives in mid-life through enterprise or a demanding career.',
  },
  {
    id: 'ge.juji-tonglin',
    zh: '巨機同臨格',
    en: 'Great Gate and Strategist in 卯',
    kind: 'auspicious',
    sources: [{ verse: '巨機同宮，公卿之位', basis: `${CATALOGUE}: 巨門 and 天機 in 命宮 at 卯 (not 酉)` }],
    match: (x) => (x.at(x.ming, '卯') && x.has(x.ming, '巨門', '天機') ? m(x, [sitsIn(x, x.ming, ['巨門', '天機'])]) : undefined),
    text: 'Analysis and eloquence together in their good position. Classically first-rate learning and influence through ideas and speech; with fewer helpers it still points to success in business.',
  },
  {
    id: 'ge.tianyi-gongming',
    zh: '天乙拱命格',
    en: 'Noble helpers face each other (坐貴向貴)',
    kind: 'auspicious',
    sources: [{ verse: '天魁天鉞，蓋世文章', basis: `${CATALOGUE}: 天魁 and 天鉞, one in 命宮 and the other in 遷移 or 身宮` }],
    match: (x) => {
      const k = x.find('天魁');
      const y = x.find('天鉞');
      const partner = (a: number, b: number) => a === x.ming && (b === opp(x.ming) || b === x.body);
      return partner(k, y) || partner(y, k) ? m(x, [`⟨天魁⟩ in ${x.label(k)}`, `⟨天鉞⟩ in ${x.label(y)}`], [k, y]) : undefined;
    },
    text: 'The two "noble person" stars bracket you. Classically help arrives when needed and difficulties turn out well; you tend both to help others and to be helped. Good for higher education.',
  },
  {
    id: 'ge.sanqi-jiahui',
    zh: '三奇加會格',
    en: 'Three wonders meet',
    kind: 'auspicious',
    sources: [{ verse: '科權祿拱，名譽昭彰', basis: `${CATALOGUE}: birth-year 化祿, 化權 and 化科 all in the 三方四正 of 命宮` }],
    match: (x) => {
      const s = sfsz(x.ming);
      const where = (['祿', '權', '科'] as const).map((k) => x.findMut(k));
      return where.every((i) => s.includes(i)) ? m(x, where.map((i, n) => `化${['祿', '權', '科'][n]} in ${x.label(i)}`)) : undefined;
    },
    text: 'Prosperity, power and fame all converge on your life axis. Classically big ambitions, good luck and timely help, with a real chance of achieving something unusual.',
  },
  {
    id: 'ge.quanlu-xunfeng',
    zh: '權祿巡逢格',
    en: 'Power and Prosperity meet',
    kind: 'auspicious',
    sources: [{ verse: '權祿重逢，財官雙美', basis: `${CATALOGUE}: birth-year 化祿 and 化權 both in the 三方四正, at least one in 命宮` }],
    match: (x) => {
      const s = sfsz(x.ming);
      const lu = x.findMut('祿');
      const quan = x.findMut('權');
      if (!(s.includes(lu) && s.includes(quan)) || (lu !== x.ming && quan !== x.ming)) return undefined;
      return m(x, [`化祿 in ${x.label(lu)}`, `化權 in ${x.label(quan)}`]);
    },
    text: 'Wealth and authority arrive together. Classically "both money and position": you can turn influence into income and income into influence.',
  },
  {
    id: 'ge.kequanlu-jia',
    zh: '科權祿夾格',
    en: 'Flanked by the transformations',
    kind: 'auspicious',
    sources: [{ verse: '科權祿夾為貴格', basis: `${CATALOGUE}: two of 化祿, 化權, 化科 in the palaces on either side of 命宮` }],
    match: (x) => {
      const [l, r] = neighbours(x.ming);
      const good = (i: number) => x.muts(i).filter(([, k]) => k !== '忌');
      const a = good(l);
      const b = good(r);
      if (!a.length || !b.length) return undefined;
      const kinds = new Set([...a, ...b].map(([, k]) => k));
      return kinds.size >= 2 ? m(x, [`${[...a, ...b].map(([s, k]) => `⟨${s}⟩化${k}`).join(', ')} on both sides of ${x.label(x.ming)}`], [l, x.ming, r]) : undefined;
    },
    text: 'Good transformations sit on both sides of the Life palace. Classically a sign of being well placed and well supported, with doors opened by circumstance and by people close to you.',
  },
  {
    id: 'ge.shuanglu-jiaming',
    zh: '雙祿夾命格',
    en: 'Two prosperities flank the Life palace',
    kind: 'auspicious',
    sources: [{ verse: '化祿及祿存夾身命，主富貴', basis: `${CATALOGUE}: 祿存 and birth-year 化祿 in the palaces on either side of 命宮` }],
    match: (x) =>
      flanked(x, x.ming, (i) => x.has(i, '祿存'), (i) => x.hasMut(i, '祿'))
        ? m(x, [`⟨祿存⟩ and 化祿 on either side of ${x.label(x.ming)}`], [...neighbours(x.ming), x.ming])
        : undefined,
    text: 'Both prosperity stars bracket the Life palace. Classically wealth from your surroundings. The catalogue adds that many cases have flaws, so judge it alongside the stars inside the palace.',
  },
  {
    id: 'ge.zuoyou-tonggong',
    zh: '左右同宮格',
    en: 'Both helper stars together',
    kind: 'auspicious',
    sources: [{ verse: '左右同宮，披羅衣紫', basis: `${CATALOGUE}: 左輔 and 右弼 together in 命宮 or 身宮 at 丑 or 未` }],
    match: (x) => {
      const i = [x.ming, x.body].find((j) => x.at(j, '丑', '未') && x.has(j, '左輔', '右弼'));
      return i !== undefined ? m(x, [sitsIn(x, i, ['左輔', '右弼'])], sfsz(x.ming)) : undefined;
    },
    text: 'The two helper stars together. Classically dignified, helpful and a strong planner who resolves problems; often successful as the trusted second-in-command rather than the figurehead.',
  },
  {
    id: 'ge.wengui-wenhua',
    zh: '文桂文華格',
    en: 'Literary laurels',
    kind: 'auspicious',
    sources: [{ verse: '文桂文華，佐九重於堯殿', basis: `${CATALOGUE}: 文昌 and 文曲 together in 命宮 at 丑 or 未, or in the opposite palace` }],
    match: (x) => {
      if (!x.at(x.ming, '丑', '未')) return undefined;
      const i = [x.ming, opp(x.ming)].find((j) => x.has(j, '文昌', '文曲'));
      return i !== undefined ? m(x, [sitsIn(x, i, ['文昌', '文曲'])]) : undefined;
    },
    text: 'Both literary stars together. Classically graceful, gentle, studious and multi-talented, with achievements in culture, scholarship or the arts.',
  },
  {
    id: 'ge.tanwu-tongxing',
    zh: '貪武同行格',
    en: 'Wolf and Warrior travel together',
    kind: 'auspicious',
    sources: [{ verse: '貪武不發少年人，運過三十才發福', basis: `${CATALOGUE}: 武曲 and 貪狼 in 命宮 at 丑 or 未` }],
    match: (x) => (x.at(x.ming, '丑', '未') && x.has(x.ming, '武曲', '貪狼') ? m(x, [sitsIn(x, x.ming, ['武曲', '貪狼'])]) : undefined),
    tolerates: ['火星', '鈴星'],
    text: 'The wealth star and the desire star together. Classically a late bloomer: early years are hard, success arrives after about thirty, and it can be large. 火星 or 鈴星 here strengthens it.',
  },
  {
    id: 'ge.huotan',
    zh: '火貪格 / 鈴貪格',
    en: 'Fire (or Bell) and Wolf',
    kind: 'auspicious',
    sources: [{ verse: '貪狼火星居廟旺，名振諸邦', basis: `${CATALOGUE}: 貪狼 in 命宮 with 火星 or 鈴星 in 命宮 or its 三方四正 (best in 辰戌丑未)` }],
    match: (x) => {
      if (!x.has(x.ming, '貪狼')) return undefined;
      const fl = sfsz(x.ming).flatMap((i) => x.hasAny(i, ['火星', '鈴星']).map((s) => `⟨${s}⟩ in ${x.label(i)}`));
      return fl.length
        ? m(x, [`⟨貪狼⟩ in ${x.label(x.ming)}`, ...fl], sfsz(x.ming), x.at(x.ming, '辰', '戌', '丑', '未') ? 'In a 辰戌丑未 palace, which the catalogue calls the finest form.' : undefined)
        : undefined;
    },
    tolerates: ['火星', '鈴星'],
    text: 'The fire star ignites the desire star. Classically sudden, explosive success: windfalls, fast business growth, or distinction in high-pressure careers. Gains can be quick; keeping them takes discipline.',
  },
  {
    id: 'ge.guixing-jiaming',
    zh: '貴星夾命格',
    en: 'Flanked by noble stars',
    kind: 'auspicious',
    sources: [{ verse: '昌曲夾命最為奇', basis: `${CATALOGUE}: 命宮 flanked by 紫微+天府, 太陽+太陰, 左輔+右弼, 文昌+文曲 or 天魁+天鉞` }],
    match: (x) => {
      const pairs: [string, string][] = [['紫微', '天府'], ['太陽', '太陰'], ['左輔', '右弼'], ['文昌', '文曲'], ['天魁', '天鉞']];
      const hits = pairs.filter(([a, b]) => flanked(x, x.ming, (i) => x.has(i, a), (i) => x.has(i, b)));
      return hits.length ? m(x, hits.map(([a, b]) => `⟨${a}⟩ and ⟨${b}⟩ on either side of ${x.label(x.ming)}`), [...neighbours(x.ming), x.ming]) : undefined;
    },
    text: 'A matched pair of noble stars surrounds the Life palace. Classically good family and social support; 昌曲 flanking points to scholarship or administration, 日月 to resources, 左右 to helpful people.',
  },
  {
    id: 'ge.lianzhen-wenwu',
    zh: '廉貞文武格',
    en: 'Chastity star, civil and martial',
    kind: 'auspicious',
    sources: [{ verse: '廉貞遇文昌，好禮樂', basis: `${CATALOGUE}: 廉貞 in 命宮 at 寅 or 申 with 文昌 and 文曲 in the 三方四正` }],
    match: (x) =>
      x.at(x.ming, '寅', '申') && x.has(x.ming, '廉貞') && x.inSet(sfsz(x.ming), '文昌', '文曲')
        ? m(x, [`⟨廉貞⟩ in ${x.label(x.ming)}`, '⟨文昌⟩ and ⟨文曲⟩ in the 三方四正'])
        : undefined,
    text: 'The disciplined, intense 廉貞 refined by the literary stars. Classically capable in both civil and martial roles; cultured, principled and good at rules and ceremony.',
  },
  {
    id: 'ge.xiongsu-chaoyuan',
    zh: '雄宿朝垣格',
    en: 'Heroic star holds its seat',
    kind: 'auspicious',
    sources: [{ verse: '廉貞在未申宮守命，無四煞，富貴聲揚遠播名', basis: `${CATALOGUE}: 廉貞 in 命宮 at 未 or 申 without malefics` }],
    match: (x) => (x.at(x.ming, '未', '申') && x.has(x.ming, '廉貞') ? m(x, [`⟨廉貞⟩ in ${x.label(x.ming)}`]) : undefined),
    text: '廉貞 in its strong seat. Classically an early breakthrough: making a name, or money, while young. With malefics the catalogue reduces it to ordinary.',
  },
  {
    id: 'ge.luwen-gongming',
    zh: '祿文拱命格',
    en: 'Prosperity and letters guard the Life palace',
    kind: 'auspicious',
    sources: [{ verse: '祿文拱命，富而且貴', basis: `${CATALOGUE}: 祿存 in 命宮 with 文昌 or 文曲 in its 三方四正` }],
    match: (x) => {
      if (!x.has(x.ming, '祿存')) return undefined;
      const wen = sfsz(x.ming).flatMap((i) => x.hasAny(i, ['文昌', '文曲']));
      return wen.length ? m(x, [`⟨祿存⟩ in ${x.label(x.ming)}`, `${[...new Set(wen)].map((s) => `⟨${s}⟩`).join(', ')} in the 三方四正`]) : undefined;
    },
    text: 'Stored wealth backed by learning. Classically both comfortable and respected; money earned through knowledge, writing or credentials.',
  },
  {
    id: 'ge.luhe-yuanyang',
    zh: '祿合鴛鴦格',
    en: 'Mandarin-duck prosperity',
    kind: 'auspicious',
    sources: [{ verse: '雙祿重逢，終身富貴', basis: `${CATALOGUE}: 祿存 and birth-year 化祿 together in 命宮` }],
    match: (x) => (x.has(x.ming, '祿存') && x.hasMut(x.ming, '祿') ? m(x, [`⟨祿存⟩ and 化祿 in ${x.label(x.ming)}`]) : undefined),
    text: 'Both prosperity stars in the Life palace. Classically one of the clearest wealth signatures: business ownership, property and investment, or a well-paid senior role.',
  },
  {
    id: 'ge.shuanglu-chaoyuan',
    zh: '雙祿朝垣格',
    en: 'Two prosperities salute the Life palace',
    kind: 'auspicious',
    sources: [{ verse: '雙祿重逢，終身富貴', basis: `${CATALOGUE}: 祿存 and birth-year 化祿 both in the 三方四正 of 命宮 (not both inside it)` }],
    match: (x) => {
      const s = sfsz(x.ming);
      const a = x.find('祿存');
      const b = x.findMut('祿');
      if (!s.includes(a) || !s.includes(b) || (a === x.ming && b === x.ming)) return undefined;
      return m(x, [`⟨祿存⟩ in ${x.label(a)}`, `化祿 in ${x.label(b)}`]);
    },
    text: 'Both prosperity stars reach the Life palace from its axis. Classically rich and respected, with money coming through career, travel and connections.',
  },
  {
    id: 'ge.luma-jiaochi',
    zh: '祿馬交馳格',
    en: 'Prosperity and Horse gallop together',
    kind: 'auspicious',
    sources: [{ verse: '祿馬最喜交馳', basis: `${CATALOGUE}: 祿存 or 化祿 together with 天馬 in the 三方四正 of 命宮` }],
    match: (x) => {
      const s = sfsz(x.ming);
      const horse = s.find((i) => x.has(i, '天馬'));
      const lu = s.find((i) => x.has(i, '祿存') || x.hasMut(i, '祿'));
      return horse !== undefined && lu !== undefined ? m(x, [`⟨天馬⟩ in ${x.label(horse)}`, `祿 in ${x.label(lu)}`]) : undefined;
    },
    text: 'Wealth on the move. Classically money from far away or through travel, relocation and change; a busy, mobile working life that pays.',
  },
  {
    id: 'ge.eryao-tonglin',
    zh: '日月照命格 (二曜同臨)',
    en: 'Sun and Moon shine from opposite',
    kind: 'auspicious',
    sources: [{ verse: '日月守命，不如照合併明', basis: `${CATALOGUE}: 命宮 at 丑 or 未 with no main star, 太陽 and 太陰 together in the opposite palace` }],
    match: (x) =>
      x.at(x.ming, '丑', '未') && x.noMain(x.ming) && x.has(opp(x.ming), '太陽', '太陰')
        ? m(x, [`${x.label(x.ming)} has no main star`, `⟨太陽⟩ and ⟨太陰⟩ in ${x.label(opp(x.ming))}`])
        : undefined,
    text: 'Sun and Moon light the empty Life palace from opposite. Classically better than having them inside it: talent recognised by others, and a capacity for both public and private success.',
  },
  {
    id: 'ge.danchi-guichi',
    zh: '丹墀桂墀格',
    en: 'Red and laurel steps',
    kind: 'auspicious',
    sources: [{ verse: '丹墀桂墀，早遂青雲之志', basis: `${CATALOGUE}: 太陽 in 命宮 at 辰 or 巳, or 太陰 in 命宮 at 酉 or 戌` }],
    match: (x) => {
      if (x.at(x.ming, '辰', '巳') && x.has(x.ming, '太陽')) return m(x, [`⟨太陽⟩ in ${x.label(x.ming)}`]);
      if (x.at(x.ming, '酉', '戌') && x.has(x.ming, '太陰')) return m(x, [`⟨太陰⟩ in ${x.label(x.ming)}`]);
      return undefined;
    },
    text: 'A luminary in its rising-strength position. Classically early success: getting into the right school or company, being trusted with responsibility young, or an early inheritance or business win.',
  },
  {
    id: 'ge.jiadi-dengyong',
    zh: '甲第登庸格',
    en: 'Top of the examination list',
    kind: 'auspicious',
    sources: [{ verse: '科命權朝，登庸甲第', basis: `${CATALOGUE}: birth-year 化科 in 命宮 with 化權 in its trines or opposite palace` }],
    match: (x) => {
      if (!x.hasMut(x.ming, '科')) return undefined;
      const q = x.findMut('權');
      return [...trines(x.ming), opp(x.ming)].includes(q) ? m(x, [`化科 in ${x.label(x.ming)}`, `化權 in ${x.label(q)}`]) : undefined;
    },
    text: 'Fame in the Life palace, power facing it. Classically outstanding in study and writing, often innovative in research or technology, and suited to management.',
  },
  {
    id: 'ge.keming-huilu',
    zh: '科名會祿格',
    en: 'Fame meets Prosperity',
    kind: 'auspicious',
    sources: [{ verse: '科祿命逢兼合吉，威權壓衆相王朝', basis: `${CATALOGUE}: birth-year 化科 in 命宮 with 化祿 in its trines or opposite palace` }],
    match: (x) => {
      if (!x.hasMut(x.ming, '科')) return undefined;
      const lu = x.findMut('祿');
      return [...trines(x.ming), opp(x.ming)].includes(lu) ? m(x, [`化科 in ${x.label(x.ming)}`, `化祿 in ${x.label(lu)}`]) : undefined;
    },
    text: 'Reputation backed by income. Classically talent that becomes widely known and is well paid.',
  },
  {
    id: 'ge.jixiang-liming',
    zh: '極向離明格',
    en: 'Pole star faces the light (紫微 at 午)',
    kind: 'auspicious',
    sources: [{ verse: '紫微居午無煞湊，位至公卿', basis: `${CATALOGUE}: 紫微 in 命宮 at 午 with no malefics in the 三方四正` }],
    match: (x) => (x.at(x.ming, '午') && x.has(x.ming, '紫微') ? m(x, [`⟨紫微⟩ in ${x.label(x.ming)}`]) : undefined),
    text: 'The emperor star at its most commanding. Classically considerable success even without helpers, as long as malefics stay away: senior office or major business.',
  },
  {
    id: 'ge.jiangxing-dedi',
    zh: '將星得地格',
    en: 'The general holds the ground',
    kind: 'auspicious',
    sources: [{ verse: '武曲廟垣，威名赫奕', basis: `${CATALOGUE}: 武曲 bright (廟/旺) in 命宮` }],
    match: (x) => (x.bright(x.ming, '武曲') ? m(x, [`⟨武曲⟩ ${x.brightness(x.ming, '武曲')} in ${x.label(x.ming)}`]) : undefined),
    text: 'The wealth-and-command star at strength. Classically decisive, practical and good with money: finance, management, engineering or command roles.',
  },
  {
    id: 'ge.minglu-anlu',
    zh: '明祿暗祿格',
    en: 'Open and hidden prosperity',
    kind: 'auspicious',
    sources: [{ verse: '明祿暗祿，錦上添花', basis: `${CATALOGUE}: birth-year 化祿 in 命宮 with 祿存 in its 暗合 (六合) partner palace` }],
    match: (x) => (x.hasMut(x.ming, '祿') && x.has(anhe(x.ming), '祿存') ? m(x, [`化祿 in ${x.label(x.ming)}`, `⟨祿存⟩ in its 暗合 partner ${x.label(anhe(x.ming))}`], [x.ming, anhe(x.ming)]) : undefined),
    text: 'A visible and a hidden source of prosperity. Classically "adding flowers to brocade": it does not create fortune by itself, but enlarges good fortune that is already there.',
  },
  {
    id: 'ge.keming-luan',
    zh: '科明祿暗格',
    en: 'Open fame, hidden prosperity',
    kind: 'auspicious',
    sources: [{ verse: '科明祿暗，位列三台', basis: `${CATALOGUE}: birth-year 化科 in 命宮 with 祿存 in its 暗合 partner palace` }],
    match: (x) => (x.hasMut(x.ming, '科') && x.has(anhe(x.ming), '祿存') ? m(x, [`化科 in ${x.label(x.ming)}`, `⟨祿存⟩ in its 暗合 partner ${x.label(anhe(x.ming))}`], [x.ming, anhe(x.ming)]) : undefined),
    text: 'A public reputation with quiet material backing. Classically a respected position with resources behind it.',
  },
];

export const ADVERSE: PatternRule[] = [
  {
    id: 'ge.wu-zhengyao',
    zh: '命無正曜格',
    en: 'No main star in the Life palace',
    kind: 'adverse',
    sources: [{ verse: '命無正曜，二姓方可延生，離祖方可成家', basis: `${CATALOGUE}: 命宮 holds none of the 14 main stars; read it through the opposite palace (借星)` }],
    match: (x) => (x.noMain(x.ming) ? m(x, [`${x.label(x.ming)} has no main star`, `borrowing ${x.majors(opp(x.ming)).map((s) => `⟨${s}⟩`).join(' + ') || 'nothing'} from ${x.label(opp(x.ming))}`]) : undefined),
    text: 'The Life palace is "empty" and takes its character from the opposite palace, so identity is shaped strongly by environment. Classical texts link this to independence from one’s family roots: finding your footing away from home, or a change of name or setting in youth. It is not unlucky by itself; supporting stars in the trines decide the outcome.',
  },
  {
    id: 'ge.jiju-maoyou',
    zh: '極居卯酉格',
    en: 'Pole star in 卯 or 酉 meets malefics',
    kind: 'adverse',
    sources: [{ verse: '極居卯酉，多為脫俗僧人', basis: `${CATALOGUE}: 紫微 and 貪狼 in 命宮 at 卯 or 酉 meeting 擎羊, 空劫 or 化忌, with none of the rescuing stars` }],
    match: (x) => {
      if (!(x.at(x.ming, '卯', '酉') && x.has(x.ming, '紫微', '貪狼'))) return undefined;
      const s = sfsz(x.ming);
      const bad = s.flatMap((i) => [...x.hasAny(i, ['擎羊', '地空', '地劫']), ...x.muts(i).filter(([, k]) => k === '忌').map(([n]) => `${n}化忌`)]);
      const rescue =
        x.muts(x.ming).some(([n, k]) => (n === '紫微' && (k === '權' || k === '科')) || (n === '貪狼' && (k === '祿' || k === '權'))) ||
        x.has(x.ming, '祿存') ||
        s.some((i) => x.hasAny(i, ['火星', '鈴星', '左輔', '右弼', '文昌', '文曲']).length);
      return bad.length && !rescue ? m(x, [sitsIn(x, x.ming, ['紫微', '貪狼']), `meets ${[...new Set(bad)].map((b) => `⟨${b}⟩`).join(', ')}`, 'no rescuing star (祿存, 火鈴, 輔弼, 昌曲, or a good transformation on 紫微 or 貪狼)']) : undefined;
    },
    text: 'Classically a pull away from worldly ambition: strong interest in religion, philosophy, metaphysics or healing, and a life where conventional status matters less. Charm and sociability remain strong.',
  },
  {
    id: 'ge.shagong-lianzhen',
    zh: '殺拱廉貞格',
    en: 'General pressing on 廉貞',
    kind: 'adverse',
    sources: [{ verse: '貞逢七殺實堪傷，十載淹留有禍殃', basis: `${CATALOGUE}: 廉貞 and 七殺 in 命宮 with no lucky stars and several malefics in the 三方四正` }],
    match: (x) => {
      if (!x.has(x.ming, '廉貞', '七殺')) return undefined;
      const s = sfsz(x.ming);
      const bad = x.malefic(s);
      return x.support(s).length === 0 && bad.length >= 2 ? m(x, [sitsIn(x, x.ming, ['廉貞', '七殺']), `malefics: ${bad.map((b) => `⟨${b}⟩`).join(', ')}`, 'no lucky stars in the 三方四正']) : undefined;
    },
    text: 'Two forceful stars without moderation. Classically a warning of stalled years, money that slips away and risk from conflict or accidents. It favours disciplined, structured work and caution with speculation.',
  },
  {
    id: 'ge.ju-feng-sisha',
    zh: '巨逢四煞格',
    en: 'Great Gate meets the four malefics',
    kind: 'adverse',
    sources: [{ verse: '巨門四煞陷而凶', basis: `${CATALOGUE}: 巨門 fallen (陷/不) in 命宮 together with 擎羊, 陀羅, 火星 or 鈴星` }],
    match: (x) => {
      if (!x.fallen(x.ming, '巨門')) return undefined;
      const sha = x.hasAny(x.ming, SHA4);
      return sha.length ? m(x, [`⟨巨門⟩ ${x.brightness(x.ming, '巨門')} in ${x.label(x.ming)}`, `with ${sha.map((s) => `⟨${s}⟩`).join(', ')}`]) : undefined;
    },
    text: 'The star of words and doubt, weakened and aggravated. Classically disputes, gossip and legal or verbal trouble. Careful speech, written agreements and avoiding conflict are the remedies.',
  },
  {
    id: 'ge.matou-daijian-xiong',
    zh: '馬頭帶劍格 (擎羊獨守)',
    en: 'Blade alone in a cardinal palace',
    kind: 'adverse',
    sources: [{ verse: '擎羊在子午卯酉守命，非夭折則主刑傷', basis: `${CATALOGUE}: 擎羊 alone (no main star) in 命宮 at 子, 午, 卯 or 酉` }],
    match: (x) => (x.at(x.ming, '子', '午', '卯', '酉') && x.noMain(x.ming) && x.has(x.ming, '擎羊') ? m(x, [`⟨擎羊⟩ alone in ${x.label(x.ming)}`]) : undefined),
    text: 'The blade star without a main star to steer it. Classically bold and decisive, but prone to conflict, injuries and harsh dealings. Channelled into disciplined, physical or technical work it becomes an asset.',
  },
  {
    id: 'ge.mingli-fengkong',
    zh: '命裏逢空格',
    en: 'Emptiness in the Life palace',
    kind: 'adverse',
    sources: [{ verse: '命裏逢空，不飄流即主疾苦', basis: `${CATALOGUE}: 地空 and/or 地劫 in a 命宮 with no main star, with no lucky stars to rescue it` }],
    match: (x) => {
      if (!x.noMain(x.ming)) return undefined;
      const kj = x.hasAny(x.ming, ['地空', '地劫']);
      return kj.length && x.support(sfsz(x.ming)).length === 0 ? m(x, [`${kj.map((s) => `⟨${s}⟩`).join(' + ')} in an empty ${x.label(x.ming)}`, 'no lucky stars in the 三方四正']) : undefined;
    },
    text: 'The two "void" stars in an empty Life palace. Classically money is hard to accumulate and plans may fall through; an unconventional or spiritual path, or idea-driven work, suits it better than chasing material security.',
  },
  {
    id: 'ge.tianliang-gongyue',
    zh: '天梁拱月格',
    en: 'Elder and Moon both fallen',
    kind: 'adverse',
    sources: [{ verse: '天梁、太陰，卻作飄蓬之客', basis: `${CATALOGUE}: a fallen 天梁 in 命宮 meeting 太陰, or a fallen 太陰 meeting 天梁, with malefics and no lucky stars` }],
    match: (x) => {
      const s = sfsz(x.ming);
      const core = (x.fallen(x.ming, '天梁') && x.inSet(s, '太陰')) || (x.fallen(x.ming, '太陰') && x.inSet(s, '天梁'));
      if (!core || x.support(s).length) return undefined;
      const bad = x.malefic(s);
      return bad.length ? m(x, ['fallen ⟨天梁⟩/⟨太陰⟩ pair around the Life palace', `malefics: ${bad.map((b) => `⟨${b}⟩`).join(', ')}`]) : undefined;
    },
    text: 'Classically a drifting pattern: restless moves, difficulty building savings and a pull towards pleasure over work. A steady base and long-term commitments counteract it.',
  },
  {
    id: 'ge.wenxing-shiwei',
    zh: '文星失位格',
    en: 'Literary star out of place',
    kind: 'adverse',
    sources: [{ verse: '昌曲陷宮凶煞破，虛譽之隆', basis: `${CATALOGUE}: 文昌 or 文曲 fallen in 命宮, meeting 四煞, 空劫 or 化忌` }],
    match: (x) => {
      const wen = ['文昌', '文曲'].filter((s) => x.fallen(x.ming, s));
      if (!wen.length) return undefined;
      const bad = x.malefic(sfsz(x.ming));
      return bad.length ? m(x, [`${wen.map((s) => `⟨${s}⟩ ${x.brightness(x.ming, s)}`).join(', ')} in ${x.label(x.ming)}`, `malefics: ${bad.map((b) => `⟨${b}⟩`).join(', ')}`]) : undefined;
    },
    text: 'Talent without the right stage. Classically ability that is not fully recognised: near-misses in exams, studying one thing and working in another, or unconventional ideas that find a small audience.',
  },
  {
    id: 'ge.kexing-fengpo',
    zh: '科星逢破格',
    en: 'Fame star broken',
    kind: 'adverse',
    sources: [{ verse: '苗而不秀，科名陷於凶神', basis: `${CATALOGUE}: birth-year 化科 in 命宮 with 四煞 or 空劫 in the same palace` }],
    match: (x) => {
      if (!x.hasMut(x.ming, '科')) return undefined;
      const bad = x.hasAny(x.ming, [...SHA4, '地空', '地劫']);
      return bad.length ? m(x, [`化科 in ${x.label(x.ming)}`, `with ${bad.map((b) => `⟨${b}⟩`).join(', ')}`]) : undefined;
    },
    text: '"Sprouts that do not flower": scholarly talent whose formal recognition is blocked. Classically good learning but disappointing exams or credentials, and a risk of criticism. Persistence and alternative routes help.',
  },
  {
    id: 'ge.xingqiu-jiayin',
    zh: '刑囚夾印格',
    en: 'Punishment and prison around the seal',
    kind: 'adverse',
    sources: [{ verse: '刑囚夾印，刑仗唯司', basis: `${CATALOGUE}: 廉貞 and 天相 in 命宮 with 擎羊 in the same palace` }],
    match: (x) => (x.has(x.ming, '廉貞', '天相', '擎羊') ? m(x, [sitsIn(x, x.ming, ['廉貞', '天相', '擎羊'])]) : undefined),
    text: 'Classically a warning about legal trouble, disputes with authority and surgery or injury. With lucky stars it turns into a career in law, police, the military or compliance: enforcing the rules instead of breaking them.',
  },
  {
    id: 'ge.yuetong-yusha',
    zh: '月同遇煞格',
    en: 'Moon and Contentment meet malefics',
    kind: 'adverse',
    sources: [{ verse: '天同太陰同在午宮守命，加煞重，肢體羸黃', basis: `${CATALOGUE}: 天同 and 太陰 in 命宮 at 午 with 火星, 鈴星, 地空, 地劫 or 天刑` }],
    match: (x) => {
      if (!(x.at(x.ming, '午') && x.has(x.ming, '天同', '太陰'))) return undefined;
      const bad = x.hasAny(x.ming, ['火星', '鈴星', '地空', '地劫', '天刑']);
      return bad.length ? m(x, [sitsIn(x, x.ming, ['天同', '太陰']), `with ${bad.map((b) => `⟨${b}⟩`).join(', ')}`]) : undefined;
    },
    text: 'Gentle stars in a weak position under pressure. Classically sensitive, prone to low energy and emotional setbacks. Health routines and stable relationships matter more than usual.',
  },
  {
    id: 'ge.maluo-kongwang',
    zh: '馬落空亡格',
    en: 'Horse falls into the void',
    kind: 'adverse',
    sources: [{ verse: '馬遇空亡，終身奔走', basis: `${CATALOGUE}: 天馬 in 命宮 with 地空 or 地劫` }],
    match: (x) => {
      if (!x.has(x.ming, '天馬')) return undefined;
      const kj = x.hasAny(x.ming, ['地空', '地劫']);
      return kj.length ? m(x, [`⟨天馬⟩ with ${kj.map((s) => `⟨${s}⟩`).join(', ')} in ${x.label(x.ming)}`]) : undefined;
    },
    text: 'Movement without arrival. Classically a busy life of change, travel and new starts where effort does not always accumulate. Choosing a few long projects helps.',
  },
  {
    id: 'ge.liangma-piaodang',
    zh: '梁馬飄蕩格',
    en: 'Elder and Horse drifting',
    kind: 'adverse',
    sources: [{ verse: '天梁天馬陷，飄蕩無疑', basis: `${CATALOGUE}: 天梁 in 命宮 at 巳 or 亥, 天馬 in 命宮 or 遷移, malefics and no lucky stars` }],
    match: (x) => {
      if (!(x.at(x.ming, '巳', '亥') && x.has(x.ming, '天梁'))) return undefined;
      if (!(x.has(x.ming, '天馬') || x.has(opp(x.ming), '天馬'))) return undefined;
      const s = sfsz(x.ming);
      const bad = x.malefic(s);
      return bad.length && !x.support(s).length ? m(x, [`⟨天梁⟩ in ${x.label(x.ming)} with ⟨天馬⟩`, `malefics: ${bad.map((b) => `⟨${b}⟩`).join(', ')}`]) : undefined;
    },
    text: 'Classically a wandering life, often busy with other people’s affairs and living away from home. Success, if it comes, is found elsewhere and needs consolidating.',
  },
  {
    id: 'ge.lufeng-liangsha',
    zh: '祿逢兩煞格',
    en: 'Prosperity meets the void',
    kind: 'adverse',
    sources: [{ verse: '祿逢衝破，吉也成凶', basis: `${CATALOGUE}: 祿存 or 化祿 in 命宮 together with 地空 or 地劫, and 四煞 in the 三方四正` }],
    match: (x) => {
      if (!(x.has(x.ming, '祿存') || x.hasMut(x.ming, '祿'))) return undefined;
      const kj = x.hasAny(x.ming, ['地空', '地劫']);
      const sha = sfsz(x.ming).flatMap((i) => x.hasAny(i, SHA4));
      return kj.length && sha.length ? m(x, [`祿 with ${kj.map((s) => `⟨${s}⟩`).join(', ')} in ${x.label(x.ming)}`, `${[...new Set(sha)].map((s) => `⟨${s}⟩`).join(', ')} in the 三方四正`]) : undefined;
    },
    text: 'Prosperity that leaks. Classically money looks good on paper or arrives in bursts but is hard to keep. Savings structures and caution with partners’ schemes are the remedy.',
  },
  {
    id: 'ge.riyue-canghui',
    zh: '日月藏輝格 (日月反背)',
    en: 'Sun and Moon hide their light',
    kind: 'adverse',
    sources: [{ verse: '日月最嫌反背，乃為失輝', basis: `${CATALOGUE}: 太陽 in 命宮 at 酉戌亥子 for a night birth, or 太陰 at 卯辰巳午 for a day birth, with malefics and no lucky stars` }],
    match: (x) => {
      const sun = x.has(x.ming, '太陽') && x.at(x.ming, '酉', '戌', '亥', '子') && !x.dayBirth;
      const moon = x.has(x.ming, '太陰') && x.at(x.ming, '卯', '辰', '巳', '午') && x.dayBirth;
      if (!sun && !moon) return undefined;
      const s = sfsz(x.ming);
      const bad = x.malefic(s);
      return bad.length && !x.support(s).length
        ? m(x, [`${sun ? '⟨太陽⟩' : '⟨太陰⟩'} in ${x.label(x.ming)}, ${x.dayBirth ? 'day' : 'night'} birth`, `malefics: ${bad.map((b) => `⟨${b}⟩`).join(', ')}`])
        : undefined;
    },
    text: 'A luminary out of its hours. Classically a life of extra effort for the same result. The catalogue notes that, with any lucky stars and no malefics, such people often achieve more than average precisely because they work harder.',
  },
  {
    id: 'ge.yangtuo-jiaji',
    zh: '羊陀夾忌格',
    en: 'Obstacle trapped between blades',
    kind: 'adverse',
    sources: [{ verse: '羊陀夾忌為敗局', basis: `${CATALOGUE}: 祿存 in 命宮 (always flanked by 擎羊 and 陀羅) with 化忌 in 命宮 or the opposite palace` }],
    match: (x) => {
      if (!x.has(x.ming, '祿存')) return undefined;
      const ji = [x.ming, opp(x.ming)].find((i) => x.hasMut(i, '忌'));
      return ji !== undefined ? m(x, [`⟨祿存⟩ in ${x.label(x.ming)}, flanked by ⟨擎羊⟩ and ⟨陀羅⟩`, `化忌 in ${x.label(ji)}`], [...neighbours(x.ming), x.ming, opp(x.ming)]) : undefined;
    },
    text: 'The obstacle star is hemmed in by the two blades, so its pressure has no outlet. Classically short-term gains that bring long-term trouble, and a tendency to hold on too tightly. Generosity and flexibility ease it.',
  },
  {
    id: 'ge.huoling-jiaming',
    zh: '火鈴夾命格',
    en: 'Fire and Bell flank the Life palace',
    kind: 'adverse',
    sources: [{ verse: '火鈴夾命為敗局', basis: `${CATALOGUE}: 火星 and 鈴星 in the palaces on either side of 命宮 (with 貪狼 in 命宮 it turns auspicious)` }],
    match: (x) =>
      flanked(x, x.ming, (i) => x.has(i, '火星'), (i) => x.has(i, '鈴星')) && !x.has(x.ming, '貪狼')
        ? m(x, [`⟨火星⟩ and ⟨鈴星⟩ on either side of ${x.label(x.ming)}`], [...neighbours(x.ming), x.ming])
        : undefined,
    text: 'Classically impulsive, rebellious and prone to sudden conflicts or accidents. Courage is the upside; patience before acting is the lesson.',
  },
  {
    id: 'ge.jiekong-jiaming',
    zh: '劫空夾命格',
    en: 'The voids flank the Life palace',
    kind: 'adverse',
    sources: [{ verse: '劫空夾命為敗局', basis: `${CATALOGUE}: 地空 and 地劫 in the palaces on either side of 命宮` }],
    match: (x) =>
      flanked(x, x.ming, (i) => x.has(i, '地空'), (i) => x.has(i, '地劫'))
        ? m(x, [`⟨地空⟩ and ⟨地劫⟩ on either side of ${x.label(x.ming)}`], [...neighbours(x.ming), x.ming])
        : undefined,
    text: 'Classically little practical help from family and siblings, and plans that fall through. The catalogue stresses that strong, well-supported stars in the Life palace largely cancel it.',
  },
  {
    id: 'ge.yisheng-gupin',
    zh: '一生孤貧格',
    en: 'Self-made without support',
    kind: 'adverse',
    sources: [{ basis: `${CATALOGUE}: 破軍 fallen in 命宮 (卯酉巳亥) with no lucky stars anywhere in the 三方四正` }],
    match: (x) =>
      x.has(x.ming, '破軍') && x.at(x.ming, '卯', '酉', '巳', '亥') && !x.support(sfsz(x.ming)).length
        ? m(x, [`⟨破軍⟩ in ${x.label(x.ming)}`, 'no lucky stars in the 三方四正'])
        : undefined,
    text: 'The pioneer star without allies. Classically a hard, lonely road with little inherited help. Read today as a strongly self-made life: progress comes from your own effort and from building your own network.',
  },
];

export const ALL_PATTERNS: PatternRule[] = [...AUSPICIOUS, ...ADVERSE];
