// 《紫微斗數全書》卷二: what each main star means in each of the eleven non-Life palaces, and how
// it reads together with a partner star (「X同…」). Every verse is an exact excerpt of the
// Wikisource transcription, checked by scripts/verify-sources.mjs; glosses are paraphrased and
// softened (the text speaks bluntly about separation, illness and family loss).
//
// Shape: palace → { section heading in 卷二, stars: star → [verse, gloss, { partner: [verse, gloss] }] }.
// Clauses whose star attribution is ambiguous in the transcription are left out.
// Self-contained (no runtime imports) so the verifier can import it with Node's type stripping.

export type Line = readonly [verse: string, en: string];
export type StarEntry = readonly [verse: string, en: string, pairs?: Readonly<Record<string, Line>>];
export interface PalaceTable {
  section: string;
  stars: Readonly<Record<string, StarEntry>>;
}

export const JUAN2: Readonly<Record<string, PalaceTable>> = {
  兄弟: {
    section: '二兄弟',
    stars: {
      紫微: ['紫微有倚靠年長之兄', 'an older sibling to lean on', {
        天府: ['天府同三人', 'about three siblings'],
        天相: ['天相同三四人', 'three or four siblings'],
        破軍: ['破軍同亦有三人，或各胞生', 'about three, possibly half-siblings'],
      }],
      天機: ['天機廟旺有二人', 'about two siblings when the star is bright', {
        巨門: ['與巨門同二人，陷地，相背不一心', 'two siblings; when weak, they pull in different directions'],
        天梁: ['天梁同二人', 'about two siblings'],
        太陰: ['太陰同二三人', 'two or three siblings'],
      }],
      太陽: ['太陽廟旺三人', 'about three siblings when the Sun is bright', {
        巨門: ['與巨門同無殺加有三人', 'three siblings if no malefics join'],
        太陰: ['太陰同五人，陷地，不和欠力', 'a larger family; when weak, less harmony and support'],
      }],
      武曲: ['武曲廟旺有二人，不合', 'about two siblings, with some friction', {
        天相: ['天相同二人', 'about two siblings'],
      }],
      天同: ['天同入廟四五人', 'four or five siblings when bright', {
        天梁: ['天梁同二三人', 'two or three siblings'],
        巨門: ['巨門同無殺三人', 'three siblings if no malefics join'],
        太陰: ['太陰同四五人', 'four or five siblings'],
      }],
      廉貞: ['廉貞入廟二人', 'about two siblings when bright', {
        貪狼: ['貪狼同招怨', 'resentment between siblings'],
        天相: ['天相同二人', 'about two siblings'],
        七殺: ['七殺同一人', 'perhaps only one sibling'],
        天府: ['天府同加左右昌曲有三人', 'three siblings, with helper stars'],
      }],
      天府: ['天府有五人', 'a larger family (the text says five)', {
        紫微: ['紫微同加左右昌曲有六七人', 'a large family when helper stars join'],
        廉貞: ['廉貞同三人', 'about three siblings'],
      }],
      太陰: ['太陰入廟兄弟五人', 'a larger family when bright', {
        太陽: ['太陽同亦五六人', 'five or six siblings'],
        天機: ['天機同二人', 'about two siblings'],
      }],
      貪狼: ['貪狼廟旺二人，陷地宜各胞', 'about two siblings; when weak, possibly half-siblings', {
        廉貞: ['廉貞同不和', 'little harmony'],
        紫微: ['紫微同有三人', 'about three siblings'],
      }],
      巨門: ['巨門廟旺二人，陷地，各胞有，宜分居', 'about two siblings; when weak, better to live apart', {
        太陽: ['太陽同加左右昌曲有三人', 'three siblings, with helper stars'],
        天機: ['天機同有二人，更乖違不一心', 'two siblings, often at odds'],
      }],
      天相: ['天相和平有二三人', 'two or three siblings on even terms', {
        武曲: ['武曲同二人', 'about two siblings'],
        廉貞: ['廉貞同二人', 'about two siblings'],
      }],
      天梁: ['天梁廟旺二人和順', 'about two siblings, on good terms', {
        天同: ['天同同三人', 'about three siblings'],
        天機: ['天機同二人', 'about two siblings'],
      }],
      七殺: ['七殺主孤克', 'a more solitary position: few siblings, or distance between them'],
      破軍: ['破軍入廟三人', 'about three siblings when bright', {
        武曲: ['武曲同二人', 'about two siblings'],
        紫微: ['紫微同二人', 'about two siblings'],
        廉貞: ['廉貞同一人', 'perhaps one sibling'],
      }],
    },
  },

  夫妻: {
    section: '三妻妾',
    stars: {
      紫微: ['紫微晚聘諧老性剛', 'marrying later and growing old together, with a strong-willed partner', {
        天府: ['天府同諧老', 'a lasting marriage'],
        天相: ['天相同年少', 'a younger partner'],
        破軍: ['破軍同刑剋', 'friction and strain in the marriage'],
        貪狼: ['貪狼同有吉星免刑', 'lucky stars spare the marriage from strain'],
      }],
      天機: ['天機宜年少剛強之', 'suits a younger, strong-minded partner', {
        天梁: ['天梁同宜年長', 'suits an older partner'],
        太陰: ['太陰同內助美容', 'an attractive, supportive partner'],
      }],
      太陽: ['太陽廟旺遲娶吉，早娶克，因妻得貴', 'better to marry later; an early marriage is strained; the partner raises your standing', {
        天梁: ['與天梁同加左右招賢明之妻', 'with helper stars, a wise partner'],
        太陰: ['太陰同內助', 'a supportive partner'],
        巨門: ['巨門同無羊陀火鈴空劫不克', 'free of strain if no malefics join'],
      }],
      武曲: ['武曲背克宜遲娶，同年夫婦也相當', 'better to marry later; a partner of the same age suits', {
        貪狼: ['貪狼同招遲無刑', 'a later marriage, without strain'],
        七殺: ['七殺同克二三妻', 'strain; the text even speaks of more than one marriage'],
      }],
      天同: ['天同遲娶諧老，夫宜長妻宜少', 'a later marriage that lasts, the husband older than the wife', {
        巨門: ['巨門同加四殺亦克', 'with malefics, strain'],
        太陰: ['太陰同助美容', 'an attractive, supportive partner'],
        天梁: ['天梁同極美夫婦', 'an excellent match'],
      }],
      廉貞: ['廉貞三度作新郎', 'the text warns of more than one marriage', {
        貪狼: ['貪狼同愈克', 'even more strain'],
        七殺: ['七殺同亦刑', 'strain as well'],
        天府: ['府諧老性剛者無克', 'a lasting marriage, if the partner is strong-willed'],
      }],
      天府: ['天府相生寵愛夫主貴', 'mutual affection, and a partner of standing'],
      太陰: ['太陰入廟男女皆貴美夫婦', 'when bright, a well-matched, attractive couple', {
        太陽: ['太陽同諧老', 'a lasting marriage'],
        天機: ['天機同美好宜少年', 'good, with a younger partner'],
      }],
      貪狼: ['貪狼男女不得美，三次作新郎，入廟宜遲娶', 'relationships are not easy; the text advises marrying later', {
        廉貞: ['廉貞同主克', 'strain'],
        紫微: ['紫微同年長方可對', 'suits an older partner'],
      }],
      巨門: ['巨門宜年長定克欠和', 'suits an older partner; expect some friction', {
        太陽: ['太陽同無四殺加諧老', 'lasting, if no malefics join'],
        天機: ['天機同內助美貌', 'an attractive, supportive partner'],
        天同: ['天同同性聰之妻並頭', 'a clever partner'],
      }],
      天相: ['天相貌美賢淑夫宜年長，親上成親', 'an attractive, virtuous partner, best older; perhaps a match within your own circle', {
        紫微: ['紫微同諧老', 'a lasting marriage'],
        武曲: ['武曲少和', 'less harmony'],
        廉貞: ['廉貞同入廟免刑', 'when bright, free of strain'],
      }],
      天梁: ['天梁妻宜大美容', 'an older, attractive partner suits', {
        天同: ['天同同和氣', 'harmonious'],
        天機: ['天機招美淑', 'an attractive, virtuous partner'],
      }],
      七殺: ['七殺早克', 'early strain; better to marry later', {
        武曲: ['武曲同亦克，或遲娶免刑', 'strain, avoided by marrying later'],
        廉貞: ['廉貞主生離', 'a risk of separation'],
      }],
      破軍: ['破軍男女俱克別聚主生離', 'strain on both sides and a risk of separation', {
        武曲: ['武曲同克三', 'repeated strain'],
        廉貞: ['廉貞亦克且欠和', 'strain and little harmony'],
        紫微: ['紫微同宜年長之妻', 'suits an older partner'],
      }],
    },
  },

  子女: {
    section: '四子女',
    stars: {
      紫微: ['紫微廟旺男三女二', 'several children (the text says three sons and two daughters)', {
        破軍: ['破軍同三人', 'about three children'],
      }],
      天機: ['天機廟旺二人', 'about two children', {
        天梁: ['天梁同在寅宮，有二三人，在申宮女多男少', 'two or three children in 寅; in 申 more daughters'],
        太陰: ['太陰同二三人', 'two or three children'],
      }],
      太陽: ['太陽入廟男三女二晚子貴', 'several children; a later child does especially well', {
        巨門: ['巨門同三人', 'about three children'],
        太陰: ['太陰同五人', 'a larger family'],
      }],
      武曲: ['武曲主一子', 'perhaps one child', {
        破軍: ['破軍同主刑，止有一人', 'some strain; perhaps one child'],
        天相: ['天相同先招外子，後親生一子', 'perhaps a step- or adopted child first, then one of your own'],
        七殺: ['七殺同主孤', 'few children'],
        貪狼: ['貪狼晚招二子', 'two children, later in life'],
      }],
      天同: ['天同廟旺五子有貴', 'several children who do well', {
        巨門: ['巨門同三人', 'about three children'],
        太陰: ['太陰同五人，在午宮陷地減半', 'a larger family, fewer in 午'],
        天梁: ['天梁同先女後男有二子', 'a daughter first, then sons'],
      }],
      廉貞: ['廉貞一人', 'perhaps one child', {
        天府: ['天府同主貴子三人', 'three children of note'],
        天相: ['天相同有二子', 'two children'],
      }],
      天府: ['天府五人', 'several children', {
        武曲: ['武曲同二人', 'about two children'],
        紫微: ['紫微同四五人', 'four or five children'],
        廉貞: ['廉貞同三人', 'about three children'],
      }],
      太陰: ['太陰女三男二先女後男，廟旺有貴子', 'daughters first; when bright, children who do well', {
        太陽: ['太陽同五人', 'a larger family'],
        天機: ['天機同二人', 'about two children'],
        天同: ['天同同五人，廟地無克', 'a larger family when bright'],
      }],
      貪狼: ['貪狼廟旺二人', 'about two children', {
        紫微: ['紫微同二人', 'about two children'],
        廉貞: ['廉貞同子少', 'few children'],
        武曲: ['武曲同三人，先難後易', 'three children, after early difficulty'],
      }],
      巨門: ['巨門入廟二入，先難後易', 'about two children, after early difficulty', {
        太陽: ['太陽同居一二子易養', 'one or two children, easy to raise'],
        天機: ['天機同一人', 'one child'],
      }],
      天相: ['天相無羊陀火鈴同有二子成器', 'two capable children, if no malefics join', {
        紫微: ['紫微同如昌曲左右有三四人', 'three or four children, with helper stars'],
        武曲: ['武曲同有三人', 'about three children'],
      }],
      天梁: ['天梁廟旺二人', 'about two children', {
        天同: ['天同同加昌曲左右吉星有三人', 'three children, with helper stars'],
        天機: ['天機同有二人', 'about two children'],
      }],
      七殺: ['七殺主孤一人之分', 'few children; perhaps one', {
        紫微: ['紫微同再吉星有三人', 'three children, with lucky stars'],
      }],
      破軍: ['破軍入廟三人，剛強之子', 'about three strong-willed children', {
        紫微: ['紫微同三人', 'about three children'],
        武曲: ['武曲同加昌曲左右有三人', 'three children, with helper stars'],
        廉貞: ['廉貞同一人', 'perhaps one child'],
      }],
    },
  },

  財帛: {
    section: '五財帛',
    stars: {
      紫微: ['紫微豐足倉箱', 'well-stocked finances', {
        破軍: ['破軍同先難後易', 'hard at first, easier later'],
        天相: ['天相同財帛蓄積', 'savings accumulate'],
        天府: ['天府同富足終身保守', 'comfortable and careful with money all your life'],
        七殺: ['七殺同加吉財帛橫發', 'with lucky stars, sudden gains'],
      }],
      天機: ['天機勞心費力生財', 'money earned through mental effort', {
        巨門: ['巨門同鬧中求取', 'money earned amid bustle and competition'],
        天梁: ['天梁同機關巧計生外財', 'clever plans bring income from outside'],
        太陰: ['太陰同陷宮成敗', 'when weak, ups and downs'],
      }],
      太陽: ['太陽入廟豐足，陷宮勞碌不遂', 'comfortable when bright; hard work for little when weak', {
        太陰: ['太陰同加左右吉星發財不小', 'with helper stars, considerable wealth'],
        巨門: ['巨門同早年成敗', 'ups and downs in early years'],
      }],
      武曲: ['武曲豐足化吉有巨萬家資', 'comfortable; with good transformations, great wealth', {
        破軍: ['破軍同東來西去先無後有', 'money comes and goes; little at first, more later'],
        天相: ['天相同財帛豐盈', 'ample money'],
        七殺: ['七殺同白手生財成家', 'builds wealth from nothing'],
        貪狼: ['貪狼同三十年後方發財', 'wealth arrives after about thirty'],
      }],
      天同: ['天同白手生財晚發', 'self-made wealth that comes later', {
        巨門: ['巨門同財氣進退', 'money ebbs and flows'],
        天梁: ['天梁同財大旺', 'strong finances'],
      }],
      廉貞: ['廉貞在申寅宮鬧中生財，陷宮先難後易', 'earns in busy, competitive settings; hard at first when weak', {
        貪狼: ['貪狼生橫發橫破', 'sudden gains and sudden losses'],
        七殺: ['七殺同鬧中取', 'earned amid competition'],
        天相: ['天相同富足倉箱', 'well-stocked finances'],
      }],
      天府: ['天府富足', 'comfortable finances', {
        紫微: ['紫微同巨積', 'large savings'],
        廉貞: ['廉貞武曲同加權祿為富奢翁', 'with 化權 or 化祿, a wealthy person'],
        武曲: ['廉貞武曲同加權祿為富奢翁', 'with 化權 or 化祿, a wealthy person'],
      }],
      太陰: ['太陰入廟富足倉箱，陷宮成敗不聚', 'comfortable when bright; when weak, savings do not hold', {
        太陽: ['太陽同先少後多', 'little at first, more later'],
        天機: ['天機同白手生財成家', 'self-made wealth'],
        天同: ['天同同財旺生身', 'strong finances'],
      }],
      貪狼: ['貪狼廟旺橫發，陷地貧窮', 'sudden gains when bright; lean times when weak', {
        紫微: ['紫微同守現成，家計自後更豐盈', 'keeps what exists and grows it later'],
      }],
      巨門: ['巨門白手生財成家，宜鬧中取', 'self-made, best in busy, competitive fields', {
        太陽: ['太陽同入廟守見成家計', 'when bright, keeps an existing base'],
        天機: ['天機同財氣生身，所作不一', 'income from varied work'],
        天同: ['天同同白手成家', 'self-made'],
      }],
      天相: ['天相富足', 'comfortable finances', {
        紫微: ['紫微同財氣橫進', 'sudden inflows of money'],
        武曲: ['武曲同加四殺百工生財', 'with malefics, earns through crafts and trades'],
        廉貞: ['廉貞同商賈生財', 'earns through trade'],
      }],
      天梁: ['天梁富足入廟上等富貴，陷宮辛勤求財度日', 'comfortable, very well off when bright; when weak, works hard to get by', {
        天同: ['天同同白手生財勝祖', 'self-made, surpassing the family'],
        天機: ['天機同勞心用力發財不多', 'effort brings modest wealth'],
      }],
      破軍: ['破軍在子午宮，多有金銀寶貝蓄積', 'in 子 or 午, valuables and savings accumulate', {
        武曲: ['武曲同守巳亥宮，東來西去', 'in 巳 or 亥, money comes and goes'],
        紫微: ['紫微同先去後生', 'spends first, gains later'],
        廉貞: ['廉貞同勞碌生財，先難後遂', 'hard-won money, easier later'],
      }],
    },
  },

  疾厄: {
    section: '六疾厄',
    stars: {
      紫微: ['紫微災少', 'few health troubles', {
        天府: ['天府同亦少', 'few health troubles'],
      }],
      天機: ['天機襁褓多災', 'more ailments in infancy', {
        巨門: ['巨門同血氣疾', 'circulation and blood to watch'],
        天梁: ['天梁同下部疾', 'the lower body to watch'],
        太陰: ['太陰同瘡災', 'skin complaints to watch'],
      }],
      太陽: ['太陽頭風', 'headaches to watch', {
        太陰: ['太陰同加化忌，羊陀主眼目有傷', 'with 化忌 or the blade stars, the eyes to watch'],
      }],
      武曲: ['武曲襁褓災迍', 'ailments in infancy', {
        天相: ['天相同招暗疾', 'hidden, chronic complaints to watch'],
        七殺: ['七殺同血疾', 'blood-related complaints to watch'],
        貪狼: ['貪狼同廟旺無疾', 'healthy when bright'],
      }],
      天同: ['天同入廟災少', 'few health troubles when bright', {
        巨門: ['巨門同心氣疾', 'heart and breathing to watch'],
        太陰: ['太陰同加羊火血氣疾', 'with the blade or fire stars, circulation to watch'],
        天梁: ['天梁同加四殺心氣疾', 'with malefics, heart and breathing to watch'],
      }],
      廉貞: ['廉貞襁褓災瘡腰足之疾，入廟加吉和平', 'childhood skin, back or leg complaints, mild when bright'],
      天府: ['天府災少臨災有救', 'few troubles, and help when they come', {
        紫微: ['紫微同災少', 'few health troubles'],
      }],
      太陰: ['太陰廟旺無災', 'healthy when bright', {
        太陽: ['若太陽同加吉美一生災少', 'with lucky stars, a healthy life'],
      }],
      巨門: ['巨門少年膿血之厄', 'infections in youth to watch', {
        太陽: ['太陽同有頭瘋疽', 'head complaints to watch'],
      }],
      天相: ['天相災少', 'few health troubles', {
        紫微: ['紫微同災少', 'few health troubles'],
      }],
      七殺: ['七殺幼年多災', 'more ailments in childhood', {
        廉貞: ['廉貞同主目疾', 'the eyes to watch'],
      }],
      破軍: ['破軍幼年瘡癩', 'skin complaints in childhood', {
        武曲: ['武曲同目視疾', 'eyesight to watch'],
        紫微: ['紫微同災少', 'few health troubles'],
      }],
    },
  },

  遷移: {
    section: '七遷移',
    stars: {
      紫微: ['紫微同左右出外貴人扶持發福', 'with helper stars, patrons help you prosper away from home', {
        天府: ['天府同出入通達', 'smooth comings and goings'],
        天相: ['天相同在外發財', 'earns away from home'],
        破軍: ['破軍同貴人見愛，小人不足', 'liked by patrons, resented by petty people'],
      }],
      天機: ['天機出外遇貴居家有是非', 'meets patrons away from home; gossip at home', {
        巨門: ['巨門同動中則吉', 'good when on the move'],
        天梁: ['天梁同出外稱意', 'travel goes as you wish'],
        太陰: ['太陰同忙中吉', 'busy but fortunate'],
      }],
      太陽: ['太陽宜出外發福不耐靜守', 'prospers away from home; restless staying put', {
        太陰: ['太陰同出外忙中吉', 'busy but fortunate away from home'],
        巨門: ['巨門勞心', 'tiring'],
      }],
      武曲: ['武曲鬧忙中進少不宜靜守', 'busy with modest gains; does not suit staying put', {
        貪狼: ['貪狼同作鉅商', 'a big trader'],
        七殺: ['七殺破軍同身心不得靜守', 'restless in body and mind'],
        破軍: ['七殺破軍同身心不得靜守', 'restless in body and mind'],
      }],
      天同: ['天同出外遇貴人扶持', 'patrons help you away from home', {
        巨門: ['巨門同勞心', 'tiring'],
        太陰: ['太陰同辛苦', 'hard going'],
        天梁: ['天梁同貴人見愛', 'liked by patrons'],
      }],
      廉貞: ['廉貞出外通達近貴，在家日少', 'gets on well away from home, close to people of rank; seldom at home', {
        貪狼: ['貪狼同鬧中立腳', 'finds a footing amid bustle'],
        七殺: ['七殺同在外廣招財', 'earns widely away from home'],
        天相: ['天相同動中則吉', 'good when on the move'],
      }],
      天府: ['天府出外遇貴人扶', 'patrons help you away from home', {
        廉貞: ['廉貞武曲鬧中取財作鉅商', 'earns amid bustle as a big trader'],
        武曲: ['廉貞武曲鬧中取財作鉅商', 'earns amid bustle as a big trader'],
      }],
      太陰: ['太陰入廟出外遇貴發財，陷宮招是非', 'when bright, patrons and money away from home; when weak, gossip', {
        太陽: ['太陽同極美', 'excellent'],
        天同: ['天同同在廟旺地出外白手生財成家', 'self-made away from home'],
      }],
      貪狼: ['貪狼獨守在外勞碌，鬧中橫進財', 'hard work away from home, with sudden gains', {
        廉貞: ['廉貞同加四殺，在外艱難', 'with malefics, hard going away from home'],
        武曲: ['武曲同作鉅商', 'a big trader'],
      }],
      巨門: ['巨門出外勞心不安，與人不足多是非', 'tiring and unsettled away from home, with disputes'],
      天相: ['天相出外貴人提撕', 'patrons lift you up away from home', {
        紫微: ['紫微同吉利', 'fortunate'],
        武曲: ['武曲同在外發財', 'earns away from home'],
        廉貞: ['廉貞同加羊陀火鈴招是非小人不足', 'with malefics, gossip and petty people'],
      }],
      天梁: ['天梁出外近貴貴人成就', 'patrons help you succeed away from home', {
        天同: ['天同同福厚', 'fortunate'],
        天機: ['天機同藝術途中走', 'lives by a skill while travelling'],
      }],
      七殺: ['七殺在外日多，在家日少', 'more days away than at home', {
        武曲: ['武曲同動中則吉', 'good when on the move'],
        廉貞: ['廉貞同在外生財', 'earns away from home'],
        紫微: ['紫微同在外多遂志', 'goals are realised away from home'],
      }],
      破軍: ['破軍出外勞心不寧，入廟在外崢嶸', 'unsettled away from home; when bright, makes a mark there'],
    },
  },

  僕役: {
    section: '八奴僕',
    stars: {
      紫微: ['紫微成行得力，旺主生財', 'many capable helpers who bring in money', {
        破軍: ['破軍同先難後有招', 'hard to find at first, found later'],
        天相: ['天相同得力', 'capable helpers'],
      }],
      天機: ['天機入廟得力，陷空怨主', 'capable helpers when bright; resentment when weak', {
        天梁: ['天梁同晚招', 'good helpers come later'],
        太陰: ['太陰同欠力', 'less capable helpers'],
      }],
      太陽: ['太陽入廟旺主發，陷宮無分', 'when bright, helpers who help you prosper; when weak, few', {
        太陰: ['太陰同多招', 'many helpers'],
        巨門: ['巨門同有多招怨', 'many helpers, but grudges'],
      }],
      武曲: ['武曲旺宮不少，一呼百諾', 'when bright, many who answer your call', {
        天府: ['天府同多奴多婢', 'plenty of staff'],
        破軍: ['破軍同招怨，會走，末年有招', 'grudges and departures; better later in life'],
        天相: ['天相同得力', 'capable helpers'],
        七殺: ['七殺同，背主', 'disloyalty'],
        貪狼: ['貪狼同欠力', 'less capable helpers'],
      }],
      天同: ['天同得力旺相', 'capable, supportive helpers', {
        巨門: ['巨門先難後易', 'hard at first, easier later'],
        太陰: ['太陰同得力', 'capable helpers'],
        天梁: ['天梁同助主', 'supportive helpers'],
      }],
      廉貞: ['廉貞陷地奴背主，晚年方招得，入廟一呼百諾', 'when weak, disloyalty until later life; when bright, many answer your call', {
        貪狼: ['貪狼同欠力', 'less capable helpers'],
        七殺: ['七殺同背主', 'disloyalty'],
      }],
      天府: ['天府得力一呼百諾', 'capable people answer your call', {
        紫微: ['紫微同助主天家', 'supportive helpers'],
        武曲: ['武曲同奴僕有', 'staff are there when needed'],
      }],
      太陰: ['太陰廟地得力成行', 'when bright, many capable helpers', {
        太陽: ['太陽同多奴多婢', 'plenty of staff'],
        天機: ['天機同欠力', 'less capable helpers'],
        天同: ['天同同旺主', 'helpers who help you prosper'],
      }],
      貪狼: ['貪狼初難招敗主之奴', 'at first, helpers who cost you', {
        廉貞: ['廉貞同亦少', 'few helpers'],
      }],
      巨門: ['巨門入廟早年不得力，招是非', 'little help and some gossip early on', {
        太陽: ['太陽同助主衛家', 'protective helpers'],
        天同: ['天同同末年招得', 'good helpers later in life'],
      }],
      天相: ['天相末年招得', 'good helpers come later in life', {
        紫微: ['紫微同多奴多婢', 'plenty of staff'],
        武曲: ['武曲同怨主', 'resentment'],
        廉貞: ['廉貞同末年可招', 'helpers later in life'],
      }],
      天梁: ['天梁奴多旺主', 'many helpers who help you prosper', {
        天同: ['天同同有衛家之奴', 'protective helpers'],
        天機: ['天機同不一心', 'divided loyalties'],
      }],
      七殺: ['七殺欺主有剛強之僕', 'strong-willed people who may overstep', {
        武曲: ['武曲同背主', 'disloyalty'],
        廉貞: ['廉貞欠力', 'less capable helpers'],
      }],
      破軍: ['破軍入廟得力，陷宮招怨背主', 'capable helpers when bright; grudges and disloyalty when weak', {
        武曲: ['武曲同違背', 'disloyalty'],
        紫微: ['紫微同得力', 'capable helpers'],
        廉貞: ['廉貞同欠力', 'less capable helpers'],
      }],
    },
  },

  官祿: {
    section: '九官祿',
    stars: {
      紫微: ['紫微廟旺遇左右昌曲魁鉞，軒勝位至封候伯', 'bright and with helper stars, rises to very high rank', {
        天府: ['天府同權貴名利兩全', 'power, money and name together'],
        天相: ['天相加內外權貴清正', 'upright authority in public and private roles'],
        破軍: ['破軍同鬧中安身', 'finds a place amid turmoil'],
      }],
      天機: ['天機入廟權貴', 'authority and rank when bright', {
        天梁: ['天梁同文武之材', 'talent for civil or military roles'],
        太陰: ['太陰同名振邊夷', 'a reputation that travels far'],
      }],
      太陽: ['太陽入廟文武為良，不見羊陀火鈴吉', 'when bright, good in civil or military careers, best without malefics', {
        太陰: ['太陰同貴顯', 'distinction'],
      }],
      武曲: ['武曲入廟與昌曲左右同宮，武職崢嶸', 'bright with helper stars: distinction in military or executive roles', {
        貪狼: ['貪狼同為貪汙之官', 'a warning about integrity in office'],
        破軍: ['破軍同軍旅內出身', 'rises through the military or uniformed services'],
      }],
      天同: ['天同入廟文武皆宜', 'when bright, suits civil or military work', {
        巨門: ['巨門同先小後大', 'starts small and grows large'],
      }],
      廉貞: ['廉貞入廟武職權貴不耐久', 'when bright, authority in uniformed or executive roles, though not lasting', {
        貪狼: ['貪狼同鬧中權貴', 'power gained amid turmoil'],
        七殺: ['七殺同軍旅出身', 'rises through the uniformed services'],
        天相: ['天相天府同衣錦富貴', 'wealth and honour'],
        天府: ['天相天府同衣錦富貴', 'wealth and honour'],
      }],
      天府: ['天府入廟文武皆吉', 'when bright, good in any career', {
        紫微: ['紫微同文武聲名', 'renown'],
        廉貞: ['廉貞武曲同權貴', 'authority and rank'],
        武曲: ['廉貞武曲同權貴', 'authority and rank'],
      }],
      太陰: ['太陰入廟多貴', 'honours when bright', {
        天同: ['天同同文武皆宜', 'suits civil or military work'],
        天機: ['天機同鬧中進身', 'advances in busy settings'],
      }],
      貪狼: ['貪狼入廟遇火鈴武職掌大權', 'bright and with the fire stars: great authority in demanding roles', {
        紫微: ['紫微同文武之職權貴非小', 'considerable authority'],
      }],
      巨門: ['巨門入廟武職權貴，文人不耐久', 'when bright, authority in demanding roles; desk careers do not last', {
        太陽: ['太陽同有進退，入廟久長', 'ups and downs; lasting when bright'],
        天機: ['天機同在卯宮吉美，在酉宮雖美無始終', 'good in 卯; in 酉 promising but left unfinished'],
      }],
      天相: ['天相入廟文武皆宜食祿千鍾，陷地成敗', 'when bright, suits any career and pays well; when weak, ups and downs', {
        紫微: ['紫微同權貴', 'authority and rank'],
      }],
      天梁: ['天梁廟午會左右魁鉞，文武之材', 'bright in 午 with helper stars: broad talent', {
        天同: ['天同同權貴不小', 'considerable authority'],
        天機: ['天機同崢嶸貴顯', 'distinction'],
      }],
      七殺: ['七殺廟旺武職崢嶸權貴非小，不宜文人', 'when bright, distinction in demanding roles; less suited to desk work', {
        武曲: ['武曲同權貴', 'authority and rank'],
        廉貞: ['廉貞同功名顯達', 'recognised achievement'],
      }],
      破軍: ['破軍廟旺武職軒勝', 'when bright, excels in demanding roles', {
        武曲: ['武曲同加權祿，文昌文曲顯達', 'with 權祿 and 昌曲, prominence'],
        紫微: ['紫微同宮名振揚', 'renown'],
        廉貞: ['廉貞同文人不耐久，胥吏最美', 'administrative roles suit best'],
      }],
    },
  },

  田宅: {
    section: '十田宅',
    stars: {
      紫微: ['紫微茂盛自置旺相', 'acquires plenty of property', {
        破軍: ['破軍同退祖', 'moves away from family property'],
        天相: ['天相同有見成家業', 'inherits an established base'],
      }],
      天機: ['天機退祖新創置', 'leaves family property and acquires anew', {
        巨門: ['巨門同在卯宮有田莊，在酉宮不守祖業', 'owns land in 卯; in 酉 does not keep family property'],
        天梁: ['天梁同有置晚年富', 'acquires property and is well off later'],
        太陰: ['太陰同自置旺相', 'acquires plenty'],
      }],
      太陽: ['太陽入廟得祖業', 'inherits family property when bright', {
        太陰: ['太陰同加吉星田多', 'with lucky stars, much property'],
        巨門: ['巨門同在寅宮旺盛，在申宮退祖', 'flourishes in 寅; in 申 moves away from family property'],
      }],
      武曲: ['武曲單居旺地，得祖父大業，陷地退後方成', 'alone and bright, inherits a large estate; when weak, loses first and rebuilds'],
      天同: ['天同先少後多，自置甚旺', 'little at first and much later, self-acquired', {
        巨門: ['巨門同田少', 'little property'],
        太陰: ['太陰同入廟大富', 'very well off when bright'],
        天梁: ['天梁同先退後進', 'loses first, gains later'],
      }],
      廉貞: ['廉貞破祖', 'breaks with family property', {
        貪狼: ['貪狼同有祖業，不耐久', 'inherits, but it does not last'],
        七殺: ['七殺同自置', 'self-acquired'],
        天府: ['天府同守見成家業', 'keeps an established base'],
        天相: ['天相同先無後有', 'nothing at first, something later'],
      }],
      天府: ['天府田園茂盛，守祖自置旺相', 'plenty of property, inherited and acquired', {
        紫微: ['紫微同大富', 'very well off'],
        廉貞: ['廉貞武曲同守祖業榮昌', 'keeps and grows family property'],
        武曲: ['廉貞武曲同守祖業榮昌', 'keeps and grows family property'],
      }],
      太陰: ['太陰入廟田多', 'much property when bright', {
        天機: ['天機同自創置', 'self-acquired'],
        天同: ['天同同白手自置', 'self-made'],
      }],
      貪狼: ['貪狼陷宮退祖一世田少，廟旺有祖業', 'little property when weak; inherits when bright', {
        廉貞: ['廉貞同無分', 'little share'],
        紫微: ['紫微同有祖業', 'inherits'],
        武曲: ['武曲同晚置', 'acquires late'],
      }],
      巨門: ['巨門廟旺橫發置買，陷地無分，因田產招非', 'sudden purchases when bright; when weak, disputes over property', {
        太陽: ['太陽同先無後有', 'nothing at first, something later'],
      }],
      天相: ['天相廟旺有分', 'a share of property when bright', {
        紫微: ['紫微同自置', 'self-acquired'],
        武曲: ['武曲同無分', 'little share'],
      }],
      天梁: ['天梁入廟旺有祖業', 'inherits when bright', {
        天同: ['天同同先難後易', 'hard at first, easier later'],
        天機: ['天機同不見羊陀火鈴空劫，終有田宅', 'without malefics, property in the end'],
      }],
      破軍: ['破軍在子午宮守祖業榮昌', 'in 子 or 午, keeps and grows family property', {
        紫微: ['紫微同有見成家業', 'an established base'],
        廉貞: ['廉貞同先破後有置', 'loses first, acquires later'],
      }],
    },
  },

  福德: {
    section: '十一福德',
    stars: {
      紫微: ['紫微福厚享福安樂', 'deep contentment and ease', {
        天府: ['天府天相同終身獲吉', 'fortunate all your life'],
        天相: ['天府天相同終身獲吉', 'fortunate all your life'],
        破軍: ['破軍同勞心費力不安', 'restless effort'],
      }],
      天機: ['天機先勞後逸', 'effort first, ease later', {
        巨門: ['巨門同勞力欠安', 'toil and unease'],
        天梁: ['天梁同享福', 'contentment'],
        太陰: ['太陰同主快樂', 'happiness'],
      }],
      太陽: ['太陽忙中發福', 'happiness through being busy', {
        太陰: ['太陰同快樂', 'happiness'],
        巨門: ['巨門同費力欠安', 'effort and unease'],
        天梁: ['天梁同快樂', 'happiness'],
      }],
      武曲: ['武曲勞心費力，入廟安然享福', 'effortful; at ease when bright', {
        破軍: ['破軍同東走西行，不寧靜', 'restless'],
        天相: ['天相同老境安康', 'a peaceful old age'],
        七殺: ['七殺同欠安康', 'less ease'],
        貪狼: ['貪狼同晚年享福', 'contentment later in life'],
      }],
      天同: ['天同快樂有福有壽', 'happiness, blessings and long life', {
        巨門: ['巨門同多憂少喜', 'more worry than joy'],
        太陰: ['太陰同享福', 'contentment'],
        天梁: ['天梁同清閒快樂', 'leisure and happiness'],
      }],
      廉貞: ['廉貞獨守忙中生福', 'alone, contentment through being busy', {
        天相: ['天相同有福有壽', 'blessings and long life'],
        天府: ['天府同安樂無憂', 'ease without worry'],
        破軍: ['破軍同不守靜，勞心費力', 'restless effort'],
      }],
      天府: ['天府安靜享福', 'quiet contentment', {
        紫微: ['紫微同快樂', 'happiness'],
        廉貞: ['廉貞同身安心忙', 'body at ease, mind busy'],
        武曲: ['武曲同早年更辛苦，中晚安樂享福', 'harder early on, at ease later'],
      }],
      太陰: ['太陰入廟享福快樂', 'contentment when bright', {
        太陽: ['太陽同極美', 'excellent'],
        天機: ['天機同心忙', 'a busy mind'],
        天同: ['天同同安靜無憂', 'calm and free of worry'],
      }],
      貪狼: ['貪狼勞心不安', 'a restless mind', {
        廉貞: ['廉貞同福薄', 'thin contentment'],
        紫微: ['紫微同晚年快樂', 'happier later in life'],
      }],
      巨門: ['巨門勞力不安', 'toil and unease', {
        太陽: ['太陽同有憂有喜', 'worries and joys'],
        天機: ['天機同心忙不安', 'a restless mind'],
        天同: ['天同同享福', 'contentment'],
      }],
      天相: ['天相安逸享福有壽', 'ease, contentment and long life', {
        紫微: ['紫微同快樂', 'happiness'],
      }],
      七殺: ['七殺入廟享福', 'contentment when bright', {
        武曲: ['武曲同欠安', 'less ease'],
        廉貞: ['廉貞同辛勤', 'hard work'],
        紫微: ['紫微同先勞後逸，末年方如意遂心', 'effort first, fulfilment late in life'],
      }],
      破軍: ['破軍勞心費力', 'effortful', {
        武曲: ['武曲同欠安', 'less ease'],
        廉貞: ['廉貞同辛勤', 'hard work'],
        紫微: ['紫微同安樂', 'ease'],
      }],
    },
  },

  父母: {
    section: '十二父母',
    stars: {
      紫微: ['紫微無克', 'no conflict with parents', {
        天府: ['天府同亦無刑', 'no friction'],
        天相: ['天相同無刑', 'no friction'],
        貪狼: ['貪狼同無殺加亦無刑', 'no friction if no malefics join'],
        破軍: ['破軍同早克', 'early distance from a parent'],
      }],
      天機: ['天機廟旺無刑', 'no friction when bright', {
        太陰: ['太陰同免刑', 'free of friction'],
        天梁: ['天梁同無刑，俱要無殺', 'no friction, if no malefics join'],
      }],
      太陽: ['太陽入廟無克，陷地克父', 'harmony when bright; distance from the father when weak', {
        巨門: ['巨門同加四殺空劫早克', 'with malefics, early distance'],
        天梁: ['天梁同無刑', 'no friction'],
      }],
      武曲: ['武曲克早', 'early distance from a parent', {
        貪狼: ['貪狼同刑剋', 'friction'],
        七殺: ['七殺同有刑', 'friction'],
        天相: ['天相同加羊陀火鈴空劫刑傷', 'with malefics, friction'],
      }],
      天同: ['天同獨守廟旺無刑', 'alone and bright, no friction', {
        巨門: ['巨門同欠和', 'less harmony'],
        太陰: ['太陰同父母雙全', 'both parents present and well'],
        天梁: ['天梁同無刑或退祖業', 'no friction, or leaving the family estate'],
      }],
      廉貞: ['廉貞難為父母', 'a difficult relationship with parents', {
        貪狼: ['貪狼同早刑', 'early friction'],
        七殺: ['七殺孤克', 'distance and solitude'],
        天府: ['天府同免刑', 'free of friction'],
        破軍: ['破軍同早刑', 'early friction'],
      }],
      天府: ['天府父母雙全', 'both parents present and well', {
        紫微: ['紫微同亦無刑', 'no friction'],
        廉貞: ['廉貞武曲同，在廟旺無刑', 'no friction when bright'],
        武曲: ['廉貞武曲同，在廟旺無刑', 'no friction when bright'],
      }],
      太陰: ['太陰入廟無克', 'harmony when bright', {
        太陽: ['太陽同無四殺父母雙全', 'both parents well, if no malefics join'],
        天機: ['天機同無刑', 'no friction'],
        天同: ['天同同極美', 'excellent'],
      }],
      貪狼: ['貪狼狼陷地早棄祖', 'when weak, leaves the family early', {
        廉貞: ['廉貞同早刑主孤單', 'early friction and solitude'],
        紫微: ['紫微同無殺加雙全', 'both parents well, if no malefics join'],
      }],
      巨門: ['巨門陷地傷克棄祖過房', 'when weak, distance; perhaps raised by others', {
        太陽: ['太陽同少和', 'less harmony'],
      }],
      天相: ['天相廟旺無刑', 'no friction when bright', {
        紫微: ['紫微同無刑剋', 'no friction'],
        廉貞: ['廉貞同亦刑', 'friction'],
      }],
      天梁: ['天梁陷地，加羊陀火鈴孤克', 'when weak and with malefics, distance from parents', {
        天同: ['天同同加四殺有刑，無殺無刑', 'friction only if malefics join'],
        天機: ['天機同無刑', 'no friction'],
        太陽: ['太陽同克遲', 'distance comes late'],
      }],
      七殺: ['七殺克早離祖', 'early distance; leaves home', {
        武曲: ['武曲同亦刑', 'friction'],
        廉貞: ['廉貞同刑早', 'early friction'],
        紫微: ['紫微同加吉星無刑', 'with lucky stars, no friction'],
      }],
      破軍: ['破軍克早離祖', 'early distance; leaves home', {
        武曲: ['武曲同克早', 'early distance'],
        廉貞: ['廉貞同亦早克', 'early distance'],
        紫微: ['紫微同無刑', 'no friction'],
      }],
    },
  },
};

/**
 * 命宮: for each main star, the 全書 卷二 table of placements by branch, with the birth-year stems
 * that form a pattern there (e.g. 「子宮喜丁己庚生人貴格，壬癸生人不耐久」). Parsed at runtime by
 * readMingTable() in evaluate.ts.
 */
export const MING_TABLE: Readonly<Record<string, readonly string[]>> = {
  紫微: [
    '子宮喜丁己庚生人貴格，壬癸生人不耐久。',
    '午宮入廟喜甲丁己生人財官格，丙戊生人成敗帶疾。',
    '卯酉宮貪狼同度，乙辛甲庚生人貴不耐久。',
    '寅申宮旺地與天府同度，甲庚丁己生人財官格。',
    '巳亥宮旺地與七殺同度，乙戊生人財官格。',
    '辰戌宮得地與天相同度，乙己甲庚癸生人財官格。',
    '丑未宮入廟與破軍同度，乙己甲庚丁壬生人財官格。',
  ],
  天機: [
    '子午宮入廟，丁己癸甲庚壬生人財官格。',
    '卯酉宮旺地與巨門同度，乙辛戊癸生人財官格。',
    '寅申宮得地與太陰同度，丁己癸甲庚壬生人財官格。',
    '巳亥宮和平，丙壬戊生人合局不耐久。',
    '辰戌宮利益與天梁同度，壬庚丁生人為福。',
    '丑未宮陷地，丙戊丁壬生人財官格，乙壬生人祿合格。',
  ],
  太陽: [
    '子宮陷午宮旺，丁己生人財官格，壬丙戊生人悔吝。',
    '卯宮廟酉宮和平，乙辛生人財官格，甲庚生人困。',
    '寅宮旺申宮得地與巨門同度，丁己甲庚生人財官格。',
    '巳宮旺財官格。亥宮陷逢殺孤寡貧窮。',
    '辰宮旺財官格。戌宮陷反背孤寡。',
    '丑宮陷未宮得地與太陰同度，加吉星財官格。',
  ],
  武曲: [
    '子午宮旺地，與天府同度，丁己庚生人財官格。',
    '卯酉宮利益，與七殺同度，乙辛生人財官格。',
    '寅申宮得地，與天相同度，丁己甲庚生人財官格。',
    '巳亥宮和平，與破軍同度，壬戊生人財官格。',
    '辰戌宮入廟，甲乙生人財官格。',
    '丑未宮入廟，與貪狼同度，戊辛生人大貴財官格。',
  ],
  天同: [
    '子宮旺地午宮陷，丁己癸辛生人財官格。',
    '卯酉宮和平，乙丙辛生人財官格。',
    '寅宮利申宮旺，與天梁同度，乙甲丁生人福厚。',
    '巳亥宮入廟，壬丙戊生人財官格。',
    '辰戌宮和平，丙丁生人利達，庚癸生人福不耐久。',
    '丑未宮不得地，與巨門同度，乙壬甲辛庚生人財官格。',
  ],
  廉貞: [
  ],
  天府: [
    '子午宮與武曲同度，丁己癸生人為福，財官格。',
    '卯宮入廟，酉宮旺地，乙丙辛生人財官格。',
    '寅宮入廟，申宮得地，與紫微同度，丁己生人財官格。',
    '巳亥宮得地，乙丙戊辛生人財官格。',
    '辰戌宮入廟，與廉貞同度，甲庚壬生人財官格。',
    '丑未宮入廟加吉星財官格。',
  ],
  太陰: [
  ],
  貪狼: [
    '子午宮旺地，丁己生人福厚，丙戊庚生寅申人下局。',
    '卯酉宮利益，與紫微同度，見火星貴，乙辛己生人宜之，財官格。',
    '寅申宮和平，庚生人財官格。',
    '巳亥宮陷地，與廉貞同度，丙戊壬生人為福不耐久。',
    '辰戌宮入廟，戊己生人財官格。',
    '丑未宮入廟，與武曲同度，見火星，戊己庚生人貴格。',
  ],
  巨門: [
    '子午宮安命，丙戊生人孤寡夭折。六甲生人居卯宮雖入廟，與擎羊同度破局平常論。',
    '子午宮旺地，丁己癸辛生人福厚，丙戊生人主困。',
    '卯酉宮入廟，與天機同度，乙辛己丙生人財官格，丁戊生人有成敗。',
    '寅申宮入廟，與太陽同度，庚癸辛生人財官格。',
    '辰戌宮和平，癸辛生人主貴，丁生人困。',
    '丑未宮不得地，癸辛丙生人財官格。',
  ],
  天相: [
    '子午宮入廟，與廉貞同度，丁己癸甲生人財官格。',
    '卯酉宮陷地，乙辛生人吉。甲庚生人主困。',
    '辰戌宮得地，與紫微同度，財官格。',
    '丑宮入廟未宮得地，加吉星財官格。',
    '寅申宮入廟，與武曲同度，丁甲庚生人財官格。',
    '巳亥宮得地，丙戊壬生人為福。',
  ],
  天梁: [
  ],
  七殺: [
    '辰宮安命六庚生人吉利，羊陀火鈴衝會，又在陷地殘疾下局，雖富貴不耐久。',
    '子午宮旺地，丁己甲生人財官格。',
    '卯酉宮旺地，與武曲同度，乙辛生人福厚財官格。',
    '辰戌宮入廟，加吉星財官格。',
    '丑未宮入廟，與廉貞同度，加吉星財官格。',
    '寅申宮入廟，甲庚丁己生人財官格。',
    '巳亥宮和平，與紫微同度，丙戊壬生人財官格。',
  ],
  破軍: [
    '子午宮入廟，丁己癸生人福厚，丙戊生人主困。',
    '卯酉宮陷地與廉貞同度，乙辛癸生人利，甲庚丙生人不耐久。',
    '辰戌宮旺地，甲癸生人為福。',
    '丑未宮旺地與紫微同度，丙戊乙生人財官格。',
    '寅申宮得地，甲庚丁己生人財官格。',
    '巳亥宮與武曲同度，戊生人福厚。',
  ],
};
export const MING_SECTION = '一命宮';
