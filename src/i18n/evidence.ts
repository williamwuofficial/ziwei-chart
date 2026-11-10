// Chinese for the short evidence lines the 格局 rules write ("⟨紫微⟩ in ⟨命宮⟩ (午)", "⟨左輔⟩ and
// ⟨右弼⟩ flank it"). They use a small, fixed phrasebook, so they are translated phrase by phrase
// here rather than line by line in every rule. tests/i18n.test.ts checks no English survives.

const RULES: [RegExp, string][] = [
  [/^fallen ⟨天梁⟩\/⟨太陰⟩ pair around the Life palace$/, '命宮三方四正見落陷的⟨天梁⟩、⟨太陰⟩'],
  [/⟨天梁⟩ on one side, a 祿 star \(祿存 or 化祿\) on the other/, '一邊⟨天梁⟩，一邊祿星（祿存或化祿）'],
  [/^no lucky stars in the 三方四正$/, '三方四正無吉星'],
  [/^no malefics in the 三方四正$/, '三方四正無煞星'],
  [/^no (.+) around it$/, '四周無$1'],
  [/^meets /, '遇'],
  [/ hold the 三方四正$/, '在三方四正'],
  [/the other luminary opposite/, '另一顆光明之星在對宮'],
  [/, night birth$/, '，夜生'],
  [/, day birth$/, '，日生'],
  [/ in its 三方四正/, '在其三方四正'],
  [/ or /g, '或'],
  [/^(.+) has no main star$/, '$1無主星'],
  [/^borrowing (.+) from (.+)$/, '借$2的$1'],
  [/, flanked by ⟨擎羊⟩ and ⟨陀羅⟩/, '，被⟨擎羊⟩、⟨陀羅⟩所夾'],
  [/ on (?:either side|both sides) of (.+)$/, '分居$1兩旁'],
  [/ on either side$/, '分居兩旁'],
  [/ flank it$/, '夾命'],
  [/ shine on it$/, '照命'],
  [/ all in the 三方四正$/, '都在三方四正'],
  [/ in its 暗合 partner /, '在暗合宮'],
  [/ in an empty /, '在空宮'],
  [/ alone in /, '獨坐'],
  [/ in the 三方四正$/, '在三方四正'],
  [/^malefics: /, '煞星：'],
  [/^with /, '加'],
  [/ with /, '加'],
  [/ in the /g, '在'],
  [/ in /g, '在'],
  [/\bthe 身宮/g, '身宮'],
  [/ at /, '在'],
  [/ and /g, '、'],
  [/a 祿 star/, '祿星'],
  [/^祿 /, '祿星'],
  [/^([甲乙丙丁戊己庚辛壬癸]) year$/, '$1年生'],
  [/\bnothing\b/, '無'],
  [/ \+ /g, '、'],
  [/, /g, '、'],
];

export function evidenceZh(s: string): string {
  let out = s;
  for (const [re, to] of RULES) out = out.replace(re, to);
  // Brightness written after a star ("⟨天梁⟩ 廟") reads naturally without the space.
  return out.replace(/⟩ ([廟旺得利平不陷])/g, '⟩$1');
}
