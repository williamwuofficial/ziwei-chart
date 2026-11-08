// Star natures, palace domains, the four transformations and 身宮 placements.
// These are the shared vocabulary of every school: each star's 化氣 (core quality), what each
// palace governs, and what 祿/權/科/忌 do. Texts are paraphrased as tendencies.

import type { Mut, PalaceName } from '../model';
import type { Source } from './types';

export const STAR_BASIS: Source = { basis: 'Standard star nature (化氣 and 星性) shared across schools' };
export const PAIR_BASIS: Source = { basis: 'Standard double-star (雙星) combinations of the 14 main stars' };
export const MUT_BASIS: Source = { basis: 'Four transformations (四化): 祿 brings gain, 權 control, 科 reputation, 忌 obstruction' };
export const BODY_BASIS: Source = { basis: 'Standard 身宮 reading: the palace that shapes where effort goes, increasingly after early adulthood' };
export const MINOR_BASIS: Source = { basis: 'Standard natures of the 六吉 (six lucky), 四煞 (four malefics), 空劫, 祿存 and 天馬' };
export const JICHONG_BASIS: Source = { basis: '四化 rule: 化忌 in the opposite palace clashes into a palace (忌沖)' };

export interface StarNature {
  /** 化氣 keyword. */
  hua: string;
  en: string;
  text: string;
  bright: string;
  fallen: string;
}

export const MAJOR_NATURE: Record<string, StarNature> = {
  紫微: {
    hua: '尊', en: 'the emperor star',
    text: 'Dignity, leadership and a need to be respected. Likes to be in charge, works well at the top of a structure, and is generous to loyal people. Pride can make it hard to take advice.',
    bright: 'Bright, its authority is natural and recognised.',
    fallen: 'Without support it can be a ruler with no court: high standards and frustration.',
  },
  天機: {
    hua: '善', en: 'the strategist star',
    text: 'A quick, analytical mind: planning, research, technology and advice. Restless and changeable; better at designing a plan than at grinding through it.',
    bright: 'Bright, the intelligence turns into sound strategy.',
    fallen: 'Weak, it tends to overthink, worry and change course too often.',
  },
  太陽: {
    hua: '貴', en: 'the sun star',
    text: 'Generous, outgoing and public-spirited; gives energy to others and wants to be seen doing good. Name and reputation matter more than money.',
    bright: 'Bright, it earns recognition and leadership.',
    fallen: 'Weak, it gives more than it gets back: a lot of effort for modest reward.',
  },
  武曲: {
    hua: '財', en: 'the wealth general',
    text: 'Decisive, practical and focused on results and money. Good in finance, engineering and command. Can be blunt or stubborn, and relationships may take second place to work.',
    bright: 'Bright, it is a strong earner and executor.',
    fallen: 'Weak, finances and decisions swing more and it can turn rigid.',
  },
  天同: {
    hua: '福', en: 'the contentment star',
    text: 'Easy-going, kind and pleasure-loving; a peacemaker who prefers comfort to struggle. Often starts slowly and gains steadily; enjoys food, art and good company.',
    bright: 'Bright, life tends to be comfortable and harmonious.',
    fallen: 'Weak, it is prone to emotional ups and downs and to avoiding hard work.',
  },
  廉貞: {
    hua: '囚', en: 'the disciplined passion star',
    text: 'Intense, principled and complex: strong desires held in check by strong rules. Suited to law, politics, regulation or demanding technical work. Emotions run deep.',
    bright: 'Bright, it shows integrity and organising power.',
    fallen: 'Weak, inner conflict, legal or health strain and stubbornness show more.',
  },
  天府: {
    hua: '庫', en: 'the treasury star',
    text: 'Stable, careful and conservative; a manager and keeper of resources. Good at holding and growing what exists rather than starting from zero.',
    bright: 'Bright, it brings security and steady wealth.',
    fallen: 'Under pressure it can become cautious to the point of missing chances.',
  },
  太陰: {
    hua: '富', en: 'the moon star',
    text: 'Gentle, perceptive and aesthetic; values home, property and quiet accumulation. Imaginative and sensitive to mood and atmosphere.',
    bright: 'Bright, it brings wealth, property and refinement.',
    fallen: 'Weak, it brings moodiness and money that is harder to keep.',
  },
  貪狼: {
    hua: '桃花', en: 'the desire star',
    text: 'Charismatic, sociable and versatile: wide interests, many talents, strong appetites. Good at networking, sales, entertainment and anything that needs charm.',
    bright: 'Bright, ambition becomes opportunity.',
    fallen: 'Weak, it scatters its energy and is drawn into excess.',
  },
  巨門: {
    hua: '暗', en: 'the speech and doubt star',
    text: 'Questioning, articulate and analytical; good at research, law, teaching and anything that uses words. The shadow side is suspicion, criticism and disputes.',
    bright: 'Bright, its voice brings authority and income.',
    fallen: 'Weak, gossip, misunderstanding and quarrels follow more easily.',
  },
  天相: {
    hua: '印', en: 'the seal star',
    text: 'Fair, diplomatic and service-minded; the trusted aide who keeps things running. Cares about appearance and propriety and is strongly influenced by the stars around it.',
    bright: 'Bright, it is a reliable, respected manager.',
    fallen: 'Weak, it tends to follow others and avoid hard choices.',
  },
  天梁: {
    hua: '蔭', en: 'the elder (shelter) star',
    text: 'Protective, principled and mature beyond its years; likes to advise and to rescue. Associated with medicine, law, insurance and teaching, and with turning danger into safety.',
    bright: 'Bright, it brings authority and longevity.',
    fallen: 'Weak, it can drift, lecture or take on other people’s troubles.',
  },
  七殺: {
    hua: '將', en: 'the general star',
    text: 'Independent, brave and decisive; acts first and adjusts later. Thrives on challenge and change; life tends to come in big swings rather than smooth progress.',
    bright: 'Bright, it is a commander and founder.',
    fallen: 'Weak, risk-taking and conflict cost more.',
  },
  破軍: {
    hua: '耗', en: 'the pioneer (breaker) star',
    text: 'Restless and revolutionary: breaks the old to build the new. Bold, impatient with routine and willing to start over; spending and relationships can be turbulent.',
    bright: 'Bright, it turns disruption into innovation.',
    fallen: 'Weak, it breaks more than it builds.',
  },
};

/** Double-star combinations, keyed by the two names sorted in MAJOR order. */
export const PAIR_NOTES: Record<string, string> = {
  '紫微+天府': 'Authority plus resources: a steady, capable leader who also knows how to keep what is earned.',
  '紫微+貪狼': 'Charm meets authority (the classical 桃花犯主): sociable, persuasive and drawn to pleasure, religion or the arts. Discipline decides which way it goes.',
  '紫微+天相': 'The ruler with his seal: an organiser who works through rules and institutions.',
  '紫微+七殺': 'Leadership that turns harshness into power (化殺為權): decisive, ambitious and able to command.',
  '紫微+破軍': 'Authority that reforms: drives change, can be autocratic and restless.',
  '天機+太陰': 'Intelligence with sensitivity: planning, design and finance; mobile and changeable.',
  '天機+巨門': 'Analysis plus argument: research, law, consulting and teaching; can overthink and debate too much.',
  '天機+天梁': 'Strategist and adviser: specialist knowledge, debate, philosophy and planning.',
  '太陽+巨門': 'The sun lights up the voice: public speaking, law, media and teaching; fame before fortune.',
  '太陽+天梁': 'Public spirit and principle: service, medicine, teaching and leadership by example.',
  '太陽+太陰': 'Sun and moon together: changeable and dual-natured, with talent on both public and private sides.',
  '武曲+天府': 'Wealth and treasury: a strong, conservative financial pairing.',
  '武曲+貪狼': 'Money and desire: a late-blooming earner, practical, ambitious and good at business.',
  '武曲+天相': 'Wealth with the seal: finance, management and trusted executive roles.',
  '武曲+七殺': 'Two generals: courageous, hard-driving and prone to risky ventures and accidents.',
  '武曲+破軍': 'Wealth that is spent to rebuild: bold enterprise with big swings in money.',
  '天同+太陰': 'Gentle, refined and artistic; emotional and comfort-seeking.',
  '天同+巨門': 'Comfort meets doubt: kind but anxious, with misunderstandings to manage.',
  '天同+天梁': 'Kind and protective: service, care and advisory work; a calm life if it avoids drifting.',
  '廉貞+天府': 'Discipline with resources: careful, capable and good at managing systems.',
  '廉貞+天相': 'Rules plus the seal: administration, law and compliance.',
  '廉貞+七殺': 'Intense and driven: success through hard, risky work; the classics also warn of accidents.',
  '廉貞+破軍': 'Two disruptive forces: bold innovation, a turbulent life and strong passions.',
  '廉貞+貪狼': 'Two desire stars: talented, charming and pleasure-loving, prone to excess.',
};

export const MAJOR_ORDER = ['紫微', '天機', '太陽', '武曲', '天同', '廉貞', '天府', '太陰', '貪狼', '巨門', '天相', '天梁', '七殺', '破軍'];
export const pairKey = (a: string, b: string) => [a, b].sort((x, y) => MAJOR_ORDER.indexOf(x) - MAJOR_ORDER.indexOf(y)).join('+');

export const MINOR_NATURE: Record<string, { kind: 'lucky' | 'malefic' | 'neutral'; text: string }> = {
  左輔: { kind: 'lucky', text: 'help from peers and steady support' },
  右弼: { kind: 'lucky', text: 'quiet help and flexibility' },
  文昌: { kind: 'lucky', text: 'formal learning, writing and credentials' },
  文曲: { kind: 'lucky', text: 'eloquence, the arts and informal talent' },
  天魁: { kind: 'lucky', text: 'help from senior, male or public benefactors' },
  天鉞: { kind: 'lucky', text: 'help from behind the scenes, often female benefactors' },
  祿存: { kind: 'lucky', text: 'stored wealth and careful saving' },
  天馬: { kind: 'neutral', text: 'movement, travel and change' },
  擎羊: { kind: 'malefic', text: 'sharp, open conflict and cutting decisions' },
  陀羅: { kind: 'malefic', text: 'delays, entanglement and hidden friction' },
  火星: { kind: 'malefic', text: 'sudden flare-ups and impulsive moves' },
  鈴星: { kind: 'malefic', text: 'smouldering tension and nagging worries' },
  地空: { kind: 'malefic', text: 'ideas that do not materialise; unconventional thinking' },
  地劫: { kind: 'malefic', text: 'unexpected losses and disruption' },
};

export interface PalaceDomain {
  en: string;
  domain: string;
}

export const PALACE_DOMAIN: Record<PalaceName, PalaceDomain> = {
  命宮: { en: 'Life', domain: 'your character, abilities and the overall shape of your life' },
  兄弟: { en: 'Siblings', domain: 'siblings, close peers and partners in joint ventures' },
  夫妻: { en: 'Spouse', domain: 'marriage, partners and close relationships' },
  子女: { en: 'Children', domain: 'children, students, creativity and younger people around you' },
  財帛: { en: 'Wealth', domain: 'income, how you earn and how you handle money' },
  疾厄: { en: 'Health', domain: 'physical constitution and the health issues to watch' },
  遷移: { en: 'Travel', domain: 'how the outside world treats you: travel, moving, public life' },
  僕役: { en: 'Friends', domain: 'friends, colleagues, staff and social networks' },
  官祿: { en: 'Career', domain: 'career, work style and achievement' },
  田宅: { en: 'Property', domain: 'home, property, family assets and the household' },
  福德: { en: 'Fortune', domain: 'inner life, peace of mind, hobbies and enjoyment' },
  父母: { en: 'Parents', domain: 'parents, superiors, documents and your relationship with authority' },
};

/** What each birth-year transformation does when it sits in a palace. */
export const MUT_TEXT: Record<Mut, (domain: string) => string> = {
  祿: (d) => `brings ease, opportunity and gain to ${d}`,
  權: (d) => `brings drive, control and competitiveness to ${d}`,
  科: (d) => `brings reputation, helpful people and smooth resolutions to ${d}`,
  忌: (d) => `is where attachment, worry and setbacks concentrate, so take extra care with ${d}`,
};

export const BODY_TEXT: Partial<Record<PalaceName, string>> = {
  命宮: 'Body and Life palaces coincide (身命同宮): what you are and what you pursue are the same thing. Strongly self-directed; the Life palace stars speak with double weight.',
  夫妻: 'The Body palace sits in the Spouse palace: partnership shapes your path. A partner’s influence on your choices and fortunes is unusually strong.',
  財帛: 'The Body palace sits in the Wealth palace: earning and managing money become a central focus of adult life.',
  遷移: 'The Body palace sits in the Travel palace: life is lived outward, with movement, travel, a public role, or success away from your birthplace.',
  官祿: 'The Body palace sits in the Career palace: work and achievement define you; a career-centred life.',
  福德: 'The Body palace sits in the Fortune palace: inner contentment, interests and quality of life matter more than outward status.',
};
