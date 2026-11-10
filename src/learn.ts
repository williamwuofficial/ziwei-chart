// "Learn" page: a reference to the chart's palaces, stars, transformations and patterns.
// Everything is generated from the same rule data the analysis uses, so the page can't drift
// from what the app actually reads.

import './style.css';
import type { Script } from './engine/chart';
import { GLOSSARY } from './i18n/glossary';
import { stemMutagens } from './analysis/model';
import { ALL_PATTERNS } from './analysis/rules/patterns';
import { MAJOR_NATURE, MAJOR_ORDER, MAJOR_QUOTE, MINOR_NATURE, MINOR_QUOTE, MUT_QUOTE, MUT_TEXT, PALACE_DOMAIN } from './analysis/rules/stars';
import type { PatternRule, Source } from './analysis/rules/types';
import { BRANCH_ANIMAL, BRANCH_ORDER, clashBranch, ELEMENT_COLOUR, ELEMENT_EN, JU_ELEMENT, STAR_ELEMENT, type Element } from './analysis/rules/elements';
import { gloss, rich, ui } from './ui/zhText';
import { isZh, tr } from './i18n/lang';
import { setupScriptToggle } from './ui/pageScript';

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

function verse(s: Source, script: Script): HTMLElement {
  const fig = h('figure', 'verse');
  const q = h('blockquote');
  q.append(rich(`「${s.verse}」`, script));
  const cite = h('figcaption');
  cite.append(rich(s.work ? `《${s.work}》 · ${s.section}` : ui('Quoted in the traditional 格局 catalogue', '傳統格局書所引'), script));
  fig.append(q, cite);
  return fig;
}

const para = (text: string, script: Script, cls?: string) => {
  const p = h('p', cls);
  p.append(rich(text, script));
  return p;
};

/** A heading line: Chinese name, pinyin, English. */
function nameLine(tag: 'h3' | 'h4', zh: string, en: string, script: Script): HTMLElement {
  const t = h(tag, 'learn-name');
  t.append(rich(zh, script));
  const g = gloss(zh);
  if (g) t.append(' ', h('span', 'py', g.py));
  if (!isZh()) t.append(' ', h('span', 'en', en));
  return t;
}

// ── Sections ────────────────────────────────────────────────────────────────

function palaces(script: Script): HTMLElement[] {
  const list = h('div', 'learn-grid');
  for (const [zh, d] of Object.entries(PALACE_DOMAIN)) {
    const c = h('div', 'learn-item');
    c.append(nameLine('h3', zh === '命宮' ? zh : isZh() ? `${zh}宮` : zh, `${d.en} palace`, script), para(isZh() ? `主管${tr(d.domain)}。` : d.domain.charAt(0).toUpperCase() + d.domain.slice(1) + '.', script));
    list.append(c);
  }
  return [
    para(
      ui(
        'Twelve palaces sit in a fixed ring of earthly branches. The 命宮 (Life palace) is placed from your birth month and 時辰; the other eleven follow it counter-clockwise in the order below. Each palace is read for one area of life.',
        '十二宮排在固定的地支環上。命宮由出生月份和時辰定出；其餘十一宮依下列順序逆時針排列。每一宮各管人生的一個方面。',
      ),
      script,
    ),
    list,
  ];
}

function majorStars(script: Script): HTMLElement[] {
  const list = h('div', 'learn-grid');
  for (const zh of MAJOR_ORDER) {
    const n = MAJOR_NATURE[zh];
    const c = h('div', 'learn-item');
    c.append(nameLine('h3', zh, n.en, script));
    const el = STAR_ELEMENT[zh];
    const altZh = el.alt ? `；全書另作屬${el.alt}，本工具以${el.el}論` : '';
    c.append(
      para(
        isZh()
          ? `五行：${el.el}${altZh}。化氣：${n.hua}。${tr(n.text)}`
          : `Element: ${el.el} ${ELEMENT_EN[el.el]}${el.note ? `; ${el.note}` : ''}. Core quality (化氣): ${n.hua}. ${n.text}`,
        script,
      ),
    );
    const dl = h('dl', 'learn-bright');
    for (const [label, text] of [[ui('Bright (廟旺)', '廟旺'), tr(n.bright)], [ui('Weak (陷)', '落陷'), tr(n.fallen)]]) {
      const dt = h('dt');
      dt.append(rich(label, script));
      const dd = h('dd');
      dd.append(rich(text, script));
      dl.append(dt, dd);
    }
    c.append(dl);
    const q = MAJOR_QUOTE[zh];
    if (q?.verse) c.append(verse(q, script));
    if (el.src.verse && el.src.verse !== q?.verse && !q?.verse?.includes(el.src.verse)) c.append(verse(el.src, script));
    list.append(c);
  }
  return [
    para(
      ui(
        'The fourteen main stars (正曜) carry most of the reading. A palace with no main star borrows the stars of the opposite palace. Each star’s strength depends on the branch it sits in, from 廟 (strongest) through 旺, 得, 利 and 平 to 不 and 陷 (weakest).',
        '十四主星（正曜）是解讀的主體。沒有主星的宮位借對宮的星曜來看。每顆星的力量取決於所在的地支，由最強的廟，經旺、得、利、平，到最弱的不和陷。',
      ),
      script,
    ),
    list,
  ];
}

const KIND_LABEL = { lucky: ['Lucky stars', '吉星'], malefic: ['Malefic stars', '煞星'], neutral: ['Other', '其他'] } as const;

function minorStars(script: Script): HTMLElement[] {
  const out: HTMLElement[] = [
    para(
      ui(
        'The minor stars modify the main stars around them. The 六吉 (six lucky stars) and 祿存 support; the 四煞 (four malefics) and 空劫 (the two voids) obstruct. Whether a pattern holds depends largely on which of these meet it.',
        '輔星會改變四周主星的作用。六吉和祿存扶助，四煞和空劫阻礙。格局能否成立，很大程度上要看遇到的是哪些輔星。',
      ),
      script,
    ),
  ];
  for (const kind of ['lucky', 'malefic', 'neutral'] as const) {
    out.push(h('h3', 'learn-sub', ui(KIND_LABEL[kind][0], KIND_LABEL[kind][1])));
    const list = h('div', 'learn-grid');
    for (const [zh, n] of Object.entries(MINOR_NATURE).filter(([, n]) => n.kind === kind)) {
      const c = h('div', 'learn-item');
      c.append(nameLine('h4', zh, gloss(zh)?.en.replace(/ \((lucky|malefic)\)$/, '') ?? '', script));
      c.append(para(isZh() ? `${tr(n.text)}。` : n.text.charAt(0).toUpperCase() + n.text.slice(1) + '.', script));
      const q = MINOR_QUOTE[zh];
      if (q?.verse) c.append(verse(q, script));
      list.append(c);
    }
    out.push(list);
  }
  return out;
}

const MUT_EN = { 祿: 'Prosperity', 權: 'Power', 科: 'Recognition', 忌: 'Obstruction' } as const;

function transformations(script: Script): HTMLElement[] {
  const list = h('div', 'learn-grid');
  for (const m of ['祿', '權', '科', '忌'] as const) {
    const c = h('div', 'learn-item');
    c.append(nameLine('h3', `化${m}`, MUT_EN[m], script));
    c.append(
      para(
        ui(
          `Where it lands, it ${MUT_TEXT[m]('that palace’s affairs')}.`,
          { 祿: '落在哪一宮，就為該宮之事帶來順利、機會和收穫。', 權: '落在哪一宮，就為該宮之事帶來衝勁、掌控力和競爭心。', 科: '落在哪一宮，就為該宮之事帶來名聲、貴人和圓滿的解決。', 忌: '落在哪一宮，執著、煩惱和挫折就集中在哪裡，該宮之事要格外小心。' }[m],
        ),
        script,
      ),
    );
    c.append(verse(MUT_QUOTE[m], script));
    list.append(c);
  }

  const table = h('table', 'learn-table');
  const head = h('tr');
  for (const t of [ui('Stem', '天干'), '化祿', '化權', '化科', '化忌']) {
    const th = h('th');
    th.append(rich(t, script));
    head.append(th);
  }
  table.append(head);
  for (const stem of '甲乙丙丁戊己庚辛壬癸') {
    const tr = h('tr');
    const muts = stemMutagens(stem) ?? ['', '', '', ''];
    for (const cell of [stem, ...muts]) {
      const td = h('td');
      td.append(rich(cell, script));
      tr.append(td);
    }
    if ('戊庚壬'.includes(stem)) tr.className = 'disputed';
    table.append(tr);
  }
  const wrap = h('div', 'table-wrap');
  wrap.append(table);

  const note = h('p', 'hint');
  note.append(
    rich(
      ui(
        'Highlighted rows (戊, 庚, 壬) are the stems schools disagree on. The table shows the common modern table, the app’s default; the others are in Advanced settings and explained under ',
        '標示的列（戊、庚、壬）是各派有爭議的天干。此表為本工具預設的現代通行表；其他表可在進階設定中選擇，說明見',
      ),
      script,
    ),
  );
  const a = h('a', undefined, ui('Methods & sources', '方法與出處'));
  a.href = './about.html#sihua';
  note.append(a, ui('.', '。'));

  return [
    para(
      ui(
        'Each heavenly stem transforms four stars (四化). The birth-year stem sets the natal transformations; each 10-year period and each year applies its own stem on top. 化祿 and 化忌 matter most: where 化祿 lands life tends to give, and where 化忌 lands it asks for care.',
        '每個天干化四顆星（四化）。生年天干決定本命四化；每個大限和每一年又各以自己的天干加上一層。化祿和化忌最重要：化祿所在是人生較易得到的地方，化忌所在是最需要用心的地方。',
      ),
      script,
    ),
    list,
    h('h3', 'learn-sub', ui('Which stars each stem transforms', '各天干所化之星')),
    wrap,
    note,
  ];
}

const PATTERN_KIND: Record<PatternRule['kind'], [string, string]> = {
  auspicious: ['Auspicious patterns', '吉格'],
  adverse: ['Challenging patterns', '凶格'],
  structure: ['Star structures', '星系結構'],
};

function patterns(script: Script): HTMLElement[] {
  const filter = h('input', 'learn-filter') as HTMLInputElement;
  filter.type = 'search';
  filter.placeholder = ui('Filter patterns, e.g. 紫微 or wealth', '篩選格局，例如：紫微、財');
  filter.setAttribute('aria-label', ui('Filter patterns', '篩選格局'));
  const groups: HTMLElement[] = [];
  const items: { el: HTMLElement; text: string }[] = [];
  for (const kind of ['auspicious', 'adverse', 'structure'] as const) {
    const rules = ALL_PATTERNS.filter((r) => r.kind === kind);
    const g = h('div', 'learn-group');
    g.append(h('h3', 'learn-sub', `${ui(PATTERN_KIND[kind][0], PATTERN_KIND[kind][1])} (${rules.length})`));
    for (const r of rules) {
      const d = h('details', 'learn-pattern');
      const s = h('summary');
      s.append(rich(r.zh, script));
      if (!isZh()) s.append(' ', h('span', 'en', r.en));
      d.append(s, para(tr(r.text), script));
      for (const src of r.sources) {
        if (src.verse) d.append(verse(src, script));
        d.append(para(ui(`Definition: ${src.basis}.`, `定義：${tr(src.basis)}。`), script, 'source'));
      }
      g.append(d);
      // Search both the Traditional text and, in Simplified, what the reader actually sees.
      const words = `${r.zh} ${r.en} ${tr(r.text)} ${r.sources.map((x) => `${x.verse ?? ''} ${tr(x.basis)}`).join(' ')}`;
      items.push({ el: d, text: `${words} ${d.textContent ?? ''}`.toLowerCase() });
    }
    groups.push(g);
  }
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    for (const { el, text } of items) el.hidden = !!q && !text.includes(q);
    for (const g of groups) g.hidden = !!q && ![...g.querySelectorAll('details')].some((d) => !d.hidden);
  });
  return [
    para(
      ui(
        'A 格局 (pattern) is a named configuration of stars, mostly read on the Life palace and its 三方四正. The app checks each one against your chart and grades it: Formed, Flawed (破格), Weak or Broken for auspicious patterns, Present or Softened for challenging ones.',
        '格局是有名稱的星曜組合，大多看命宮及其三方四正。本工具逐一檢查你的命盤並評級：吉格分為成格、破格、力弱或格破，凶格分為成立或減輕。',
      ),
      script,
    ),
    filter,
    ...groups,
  ];
}

const GLOSS_GROUPS: [string, string, string][] = [
  ['紫微', 'Main stars', '主星'],
  ['左輔', 'Lucky, malefic and other minor stars', '吉星、煞星和其他輔星'],
  ['天空', 'Miscellaneous stars (雜曜)', '雜曜'],
  ['命宮', 'Palaces', '宮位'],
  ['廟', 'Brightness', '亮度'],
  ['祿', 'Transformations', '四化'],
  ['長生', 'Twelve life stages (長生十二神)', '長生十二神'],
  ['三方四正', 'Method terms', '術語'],
];

function glossary(script: Script): HTMLElement[] {
  const filter = h('input', 'learn-filter') as HTMLInputElement;
  filter.type = 'search';
  filter.placeholder = ui('Filter terms, e.g. 天馬 or travel', '篩選詞彙，例如：天馬');
  filter.setAttribute('aria-label', ui('Filter glossary', '篩選詞彙'));
  const out: HTMLElement[] = [];
  if (isZh()) out.push(para('中英對照：每個術語的拼音和英文譯名，方便與英文資料對照。', script, 'hint'));
  out.push(filter);
  const rows: { el: HTMLElement; text: string }[] = [];
  const blocks: HTMLElement[] = [];
  let table: HTMLTableElement | undefined;
  for (const [term, g] of Object.entries(GLOSSARY)) {
    const start = GLOSS_GROUPS.find(([k]) => k === term);
    if (start || !table) {
      const block = h('div', 'learn-group');
      const title = h('h3', 'learn-sub');
      title.append(rich(start ? ui(start[1], start[2]) : ui('Terms', '詞彙'), script));
      table = h('table', 'learn-table gloss');
      block.append(title, table);
      blocks.push(block);
      out.push(block);
    }
    const tr = h('tr');
    const a = h('td', 'zh');
    a.append(rich(term, script));
    const en = h('td');
    en.append(rich(g.en, script));
    tr.append(a, h('td', 'py', g.py), en);
    table.append(tr);
    rows.push({ el: tr, text: `${term} ${tr.textContent ?? ''} ${g.py} ${g.en}`.toLowerCase() });
  }
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    for (const { el, text } of rows) el.hidden = !!q && !text.includes(q);
    for (const b of blocks) b.hidden = !!q && ![...b.querySelectorAll('tr')].some((r) => !r.hidden);
  });
  return out;
}

const BASICS_ZH: [string, string][] = [
  ['命盤', '命盤由十二宮圍成一個方框，每宮固定對應一個地支：寅在左下角，沿左邊向上依次是卯、辰、巳，再順時針繞一圈。中央是出生資料。星曜依出生的年、月、日和時辰安放在各宮。'],
  ['命宮與身宮', '命宮的找法是從寅宮順數到出生月份，再逆數到出生時辰。它描述你的性格和人生的整體走向。身宮則是改為順數到出生時辰；它一定與六個宮位之一同宮，顯示努力的方向，成年以後越來越明顯。'],
  ['三方四正', '沒有一個宮位是單獨看的。每一宮都要連同它的三方四正一起看：本宮、左右相隔四宮的兩個三合宮，以及正對面的對宮。這四宮的星曜都會影響它。'],
  ['四化', '每個天干會把四顆星化為化祿（財祿）、化權（權勢）、化科（名聲）和化忌（阻礙）。生年天干決定本命四化；大限和流年再各加上自己的四化。'],
  ['大限與流年', '大限從命盤五行局所定的年齡開始（水二局從2歲起，火六局從6歲起），每十年移一宮：陽男陰女順行，陰男陽女逆行。每年的流年命宮是該年地支所在的宮；同時還有小限，從生年地支決定的宮位起，每年移一宮（男順女逆）。年齡以虛歲計：出生為一歲，每過農曆新年加一歲。'],
  ['格局', '古書把某些特定的星曜組合稱為格局，例如紫府同宮或日月反背。格局的強弱取決於周圍的星曜：吉星使它完整，煞星使它破損。'],
];

const BASICS: [string, string][] = [
  [
    'The chart',
    'A chart is twelve palaces arranged around a square, each fixed to one of the twelve earthly branches: 寅 at the bottom left, running clockwise through 卯, 辰 and 巳 up the left side and on round. The centre holds the birth data. Stars are placed in the palaces from the birth year, month, day and 時辰.',
  ],
  [
    'Life palace and Body palace',
    'The 命宮 is found by counting forward from 寅 to the birth month, then back to the birth hour. It describes your character and the overall shape of your life. The 身宮 is counted forward to the birth hour instead; it always shares a branch with one of six palaces, and shows where effort goes, increasingly after early adulthood.',
  ],
  [
    '三方四正',
    'No palace is read alone. Each is read with its 三方四正: the palace itself, the two palaces four steps away on either side (its trines), and the palace directly opposite. Stars in those four palaces all bear on it.',
  ],
  [
    'Transformations (四化)',
    'Four stars are transformed by each heavenly stem into 化祿 (prosperity), 化權 (power), 化科 (recognition) and 化忌 (obstruction). The birth-year stem sets the natal four; periods and years add their own.',
  ],
  [
    '10-year periods (大限) and years (流年)',
    'Periods start at the age given by the chart’s 五行局 (水二局 starts at 2, 火六局 at 6) and move one palace every ten years: clockwise for 陽 men and 陰 women, counter-clockwise for 陰 men and 陽 women. Each year’s Life palace is the palace of that year’s branch; alongside it runs the 小限, an age palace that starts from a palace set by your birth-year branch and moves one palace a year (forward for men, backward for women). Ages are nominal (虛歲): you are 1 at birth and gain a year at each Lunar New Year.',
  ],
  [
    'Patterns (格局)',
    'Classical texts name particular star combinations as patterns, such as 紫府同宮 or 日月反背. A pattern is only as strong as the stars around it: lucky stars complete it, malefics flaw or break it.',
  ],
];

function basics(script: Script): HTMLElement[] {
  return (isZh() ? BASICS_ZH : BASICS).map(([title, text]) => {
    const s = h('div', 'learn-basic');
    const t = h('h3');
    t.append(rich(title, script));
    s.append(t, para(text, script));
    return s;
  });
}

function elements(script: Script): HTMLElement[] {
  const table = h('table', 'learn-table');
  const head = h('tr');
  for (const t of isZh() ? ['五行', '五色', '五行局', '主星'] : ['Element', 'Colour (五色)', 'Element class (五行局)', 'Main stars']) {
    const th = h('th');
    th.append(rich(t, script));
    head.append(th);
  }
  table.append(head);
  for (const el of ['木', '火', '土', '金', '水'] as Element[]) {
    const tr = h('tr');
    const c = ELEMENT_COLOUR[el];
    const ju = Object.entries(JU_ELEMENT).find(([, e]) => e === el)![0];
    const stars = MAJOR_ORDER.filter((s) => STAR_ELEMENT[s].el === el).join(' ');
    const cells = isZh() ? [el, c.zh, ju, stars] : [`${el} ${ELEMENT_EN[el]}`, `${c.zh} ${c.en}`, ju, stars];
    cells.forEach((t, k) => {
      const td = h('td');
      if (k === 1) {
        const sw = h('span', 'swatch');
        sw.style.background = c.css;
        td.append(sw);
      }
      td.append(rich(t, script));
      tr.append(td);
    });
    table.append(tr);
  }
  const wrap = h('div', 'table-wrap');
  wrap.append(table);
  return [
    para(
      ui(
        'Every main star belongs to one of the five elements (五行); the 全書 states each one, and the star cards above quote it. The chart as a whole also has an element: its 五行局, which sets the age the first 10-year period starts (水二局 at 2, 木三局 at 3, and so on).',
        '每顆主星都屬五行之一；全書一一說明，上面的星曜卡片也引了原文。整張命盤也有一個五行：五行局，它決定第一個大限開始的年齡（水二局2歲，木三局3歲，依此類推）。',
      ),
      script,
    ),
    wrap,
    para(
      ui(
        'The colours are the standard 五行 correspondences (五色), shared across Chinese cosmology. The 紫微 classics don’t prescribe colours: the 全書 mentions them only to describe a person’s complexion. Lucky-colour advice usually comes from 八字 (strengthening the element a chart lacks) or from individual teachers’ conventions, so the app shows colours as background, not as a remedy.',
        '這些顏色是中國宇宙觀共通的五行配色（五色）。紫微斗數古書並不講究顏色：全書提到顏色只是用來形容人的氣色。所謂幸運色的建議通常來自八字（補命盤所缺的五行）或個別老師的習慣，所以本工具只把顏色當作背景資料，不作為化解之法。',
      ),
      script,
      'hint',
    ),
  ];
}

function zodiac(script: Script): HTMLElement[] {
  const table = h('table', 'learn-table');
  const head = h('tr');
  for (const t of isZh() ? ['地支', '生肖', '相沖'] : ['Branch', 'Animal (生肖)', 'Clashes with']) head.append(h('th', undefined, ui(t, t)));
  table.append(head);
  for (const b of BRANCH_ORDER) {
    const tr = h('tr');
    const a = BRANCH_ANIMAL[b];
    const x = clashBranch(b);
    for (const t of isZh() ? [b, a.zh, `${x}${BRANCH_ANIMAL[x].zh}`] : [b, `${a.zh} ${a.en}`, `${x} ${BRANCH_ANIMAL[x].zh} ${BRANCH_ANIMAL[x].en}`]) {
      const td = h('td');
      td.append(rich(t, script));
      tr.append(td);
    }
    table.append(tr);
  }
  const wrap = h('div', 'table-wrap');
  wrap.append(table);
  return [
    para(
      ui(
        'Your Chinese zodiac animal is simply the earthly branch of your birth year, and 紫微斗數 uses it throughout: several stars (天馬, 紅鸞, 天喜, 孤辰, 寡宿, 華蓋) are placed from it, and each year’s 太歲 palace is the palace of that year’s branch. The branch relations behind zodiac compatibility, trines (三合), pairs (六合) and clashes (六沖), are the same ones the chart uses for 三方四正 and 暗合.',
        '生肖就是出生年的地支，紫微斗數處處用到它：好幾顆星（天馬、紅鸞、天喜、孤辰、寡宿、華蓋）都依它安放，每年的太歲宮就是該年地支所在的宮。生肖配對所依據的地支關係：三合、六合和六沖，也正是命盤用來看三方四正和暗合的關係。',
      ),
      script,
    ),
    para(
      ui(
        'The year readings note two zodiac years. A 本命年 repeats your birth branch; a clash year has the opposite branch (沖太歲). The 全書 卷三 lists, for each birth branch, which years to treat with care, and the app quotes it where it covers your branch. The Western zodiac has no traditional link to 紫微斗數 and isn’t used.',
        '流年解讀會標出兩種生肖年。本命年與生年地支相同；沖太歲之年的地支與生年相對。全書卷三為每個生年地支列出需要留意的年份，若涵蓋你的地支，本工具會引用。西洋星座與紫微斗數沒有傳統上的關係，不採用。',
      ),
      script,
    ),
    wrap,
  ];
}

const SECTIONS: [string, string, string, (s: Script) => HTMLElement[]][] = [
  ['basics', 'How a chart works', '命盤的結構', basics],
  ['palaces', 'The 12 palaces', '十二宮', palaces],
  ['major', 'The 14 main stars', '十四主星', majorStars],
  ['minor', 'Minor stars', '輔星', minorStars],
  ['sihua', 'The four transformations (四化)', '四化', transformations],
  ['elements', 'Elements and colours (五行)', '五行與五色', elements],
  ['zodiac', 'The Chinese zodiac (生肖)', '生肖', zodiac],
  ['patterns', 'Patterns (格局)', '格局', patterns],
  ['glossary', 'Glossary', '中英詞彙表', glossary],
];

function render(script: Script) {
  const toc = document.getElementById('learn-toc')!;
  const root = document.getElementById('learn')!;
  toc.replaceChildren();
  root.replaceChildren();
  for (const [id, en, zh, build] of SECTIONS) {
    const title = ui(en, zh);
    const a = h('a');
    a.href = `#${id}`;
    a.append(rich(title, script));
    toc.append(a);
    const sec = h('section', 'card');
    sec.id = id;
    const t = h('h2');
    t.append(rich(title, script));
    sec.append(t, ...build(script));
    root.append(sec);
  }
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

setupScriptToggle(render);
