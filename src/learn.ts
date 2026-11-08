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
import { gloss, rich } from './ui/zhText';
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
  cite.append(rich(s.work ? `《${s.work}》 · ${s.section}` : 'Quoted in the traditional 格局 catalogue', script));
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
  t.append(' ', h('span', 'en', en));
  return t;
}

// ── Sections ────────────────────────────────────────────────────────────────

function palaces(script: Script): HTMLElement[] {
  const list = h('div', 'learn-grid');
  for (const [zh, d] of Object.entries(PALACE_DOMAIN)) {
    const c = h('div', 'learn-item');
    c.append(nameLine('h3', zh, `${d.en} palace`, script), para(d.domain.charAt(0).toUpperCase() + d.domain.slice(1) + '.', script));
    list.append(c);
  }
  return [
    para(
      'Twelve palaces sit in a fixed ring of earthly branches. The 命宮 (Life palace) is placed from your birth month and 時辰; the other eleven follow it counter-clockwise in the order below. Each palace is read for one area of life.',
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
    c.append(para(`Element: ${el.el} ${ELEMENT_EN[el.el]}${el.note ? `; ${el.note}` : ''}. Core quality (化氣): ${n.hua}. ${n.text}`, script));
    const dl = h('dl', 'learn-bright');
    for (const [label, text] of [['Bright (廟旺)', n.bright], ['Weak (陷)', n.fallen]]) {
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
      'The fourteen main stars (正曜) carry most of the reading. A palace with no main star borrows the stars of the opposite palace. Each star’s strength depends on the branch it sits in, from 廟 (strongest) through 旺, 得, 利 and 平 to 不 and 陷 (weakest).',
      script,
    ),
    list,
  ];
}

const KIND_LABEL = { lucky: 'Lucky stars', malefic: 'Malefic stars', neutral: 'Other' } as const;

function minorStars(script: Script): HTMLElement[] {
  const out: HTMLElement[] = [
    para(
      'The minor stars modify the main stars around them. The 六吉 (six lucky stars) and 祿存 support; the 四煞 (four malefics) and 空劫 (the two voids) obstruct. Whether a pattern holds depends largely on which of these meet it.',
      script,
    ),
  ];
  for (const kind of ['lucky', 'malefic', 'neutral'] as const) {
    out.push(h('h3', 'learn-sub', KIND_LABEL[kind]));
    const list = h('div', 'learn-grid');
    for (const [zh, n] of Object.entries(MINOR_NATURE).filter(([, n]) => n.kind === kind)) {
      const c = h('div', 'learn-item');
      c.append(nameLine('h4', zh, gloss(zh)?.en.replace(/ \((lucky|malefic)\)$/, '') ?? '', script));
      c.append(para(n.text.charAt(0).toUpperCase() + n.text.slice(1) + '.', script));
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
    const t = MUT_TEXT[m]('that palace’s affairs');
    c.append(para(`Where it lands, it ${t}.`, script));
    c.append(verse(MUT_QUOTE[m], script));
    list.append(c);
  }

  const table = h('table', 'learn-table');
  const head = h('tr');
  for (const t of ['Stem', '化祿', '化權', '化科', '化忌']) {
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
  note.append(rich('Highlighted rows (戊, 庚, 壬) are the stems schools disagree on. The table shows the common modern table, the app’s default; the others are in Advanced settings and explained under ', script));
  const a = h('a', undefined, 'Methods & sources');
  a.href = './about.html#sihua';
  note.append(a, '.');

  return [
    para(
      'Each heavenly stem transforms four stars (四化). The birth-year stem sets the natal transformations; each 10-year period and each year applies its own stem on top. 化祿 and 化忌 matter most: where 化祿 lands life tends to give, and where 化忌 lands it asks for care.',
      script,
    ),
    list,
    h('h3', 'learn-sub', 'Which stars each stem transforms'),
    wrap,
    note,
  ];
}

const PATTERN_KIND: Record<PatternRule['kind'], string> = {
  auspicious: 'Auspicious patterns',
  adverse: 'Challenging patterns',
  structure: 'Star structures',
};

function patterns(script: Script): HTMLElement[] {
  const filter = h('input', 'learn-filter') as HTMLInputElement;
  filter.type = 'search';
  filter.placeholder = 'Filter patterns, e.g. 紫微 or wealth';
  filter.setAttribute('aria-label', 'Filter patterns');
  const groups: HTMLElement[] = [];
  const items: { el: HTMLElement; text: string }[] = [];
  for (const kind of ['auspicious', 'adverse', 'structure'] as const) {
    const rules = ALL_PATTERNS.filter((r) => r.kind === kind);
    const g = h('div', 'learn-group');
    g.append(h('h3', 'learn-sub', `${PATTERN_KIND[kind]} (${rules.length})`));
    for (const r of rules) {
      const d = h('details', 'learn-pattern');
      const s = h('summary');
      s.append(rich(r.zh, script), ' ', h('span', 'en', r.en));
      d.append(s, para(r.text, script));
      for (const src of r.sources) {
        if (src.verse) d.append(verse(src, script));
        d.append(para(`Definition: ${src.basis}.`, script, 'source'));
      }
      g.append(d);
      items.push({ el: d, text: `${r.zh} ${r.en} ${r.text} ${r.sources.map((x) => `${x.verse ?? ''} ${x.basis}`).join(' ')}`.toLowerCase() });
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
      'A 格局 (pattern) is a named configuration of stars, mostly read on the Life palace and its 三方四正. The app checks each one against your chart and grades it: Formed, Flawed (破格), Weak or Broken for auspicious patterns, Present or Softened for challenging ones.',
      script,
    ),
    filter,
    ...groups,
  ];
}

const GLOSS_GROUPS: [string, string][] = [
  ['紫微', 'Main stars'],
  ['左輔', 'Lucky, malefic and other minor stars'],
  ['天空', 'Miscellaneous stars (雜曜)'],
  ['命宮', 'Palaces'],
  ['廟', 'Brightness'],
  ['祿', 'Transformations'],
  ['長生', 'Twelve life stages (長生十二神)'],
  ['三方四正', 'Method terms'],
];

function glossary(script: Script): HTMLElement[] {
  const filter = h('input', 'learn-filter') as HTMLInputElement;
  filter.type = 'search';
  filter.placeholder = 'Filter terms, e.g. 天馬 or travel';
  filter.setAttribute('aria-label', 'Filter glossary');
  const out: HTMLElement[] = [filter];
  const rows: { el: HTMLElement; text: string }[] = [];
  const blocks: HTMLElement[] = [];
  let table: HTMLTableElement | undefined;
  for (const [term, g] of Object.entries(GLOSSARY)) {
    const start = GLOSS_GROUPS.find(([k]) => k === term);
    if (start || !table) {
      const block = h('div', 'learn-group');
      const title = h('h3', 'learn-sub');
      title.append(rich(start?.[1] ?? 'Terms', script));
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
    rows.push({ el: tr, text: `${term} ${g.py} ${g.en}`.toLowerCase() });
  }
  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    for (const { el, text } of rows) el.hidden = !!q && !text.includes(q);
    for (const b of blocks) b.hidden = !!q && ![...b.querySelectorAll('tr')].some((r) => !r.hidden);
  });
  return out;
}

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
    'Periods start at the age given by the chart’s 五行局 (水二局 starts at 2, 火六局 at 6) and move one palace every ten years: clockwise for 陽 men and 陰 women, counter-clockwise for 陰 men and 陽 women. Each year’s Life palace is the palace of that year’s branch. Ages are nominal (虛歲): you are 1 at birth and gain a year at each Lunar New Year.',
  ],
  [
    'Patterns (格局)',
    'Classical texts name particular star combinations as patterns, such as 紫府同宮 or 日月反背. A pattern is only as strong as the stars around it: lucky stars complete it, malefics flaw or break it.',
  ],
];

function basics(script: Script): HTMLElement[] {
  return BASICS.map(([title, text]) => {
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
  for (const t of ['Element', 'Colour (五色)', 'Element class (五行局)', 'Main stars']) {
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
    const cells = [`${el} ${ELEMENT_EN[el]}`, `${c.zh} ${c.en}`, ju, stars];
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
      'Every main star belongs to one of the five elements (五行); the 全書 states each one, and the star cards above quote it. The chart as a whole also has an element: its 五行局, which sets the age the first 10-year period starts (水二局 at 2, 木三局 at 3, and so on).',
      script,
    ),
    wrap,
    para(
      'The colours are the standard 五行 correspondences (五色), shared across Chinese cosmology. The 紫微 classics don’t prescribe colours: the 全書 mentions them only to describe a person’s complexion. Lucky-colour advice usually comes from 八字 (strengthening the element a chart lacks) or from individual teachers’ conventions, so the app shows colours as background, not as a remedy.',
      script,
      'hint',
    ),
  ];
}

function zodiac(script: Script): HTMLElement[] {
  const table = h('table', 'learn-table');
  const head = h('tr');
  for (const t of ['Branch', 'Animal (生肖)', 'Clashes with']) head.append(h('th', undefined, t));
  table.append(head);
  for (const b of BRANCH_ORDER) {
    const tr = h('tr');
    const a = BRANCH_ANIMAL[b];
    const x = clashBranch(b);
    for (const t of [b, `${a.zh} ${a.en}`, `${x} ${BRANCH_ANIMAL[x].zh} ${BRANCH_ANIMAL[x].en}`]) {
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
      'Your Chinese zodiac animal is simply the earthly branch of your birth year, and 紫微斗數 uses it throughout: several stars (天馬, 紅鸞, 天喜, 孤辰, 寡宿, 華蓋) are placed from it, and each year’s 太歲 palace is the palace of that year’s branch. The branch relations behind zodiac compatibility, trines (三合), pairs (六合) and clashes (六沖), are the same ones the chart uses for 三方四正 and 暗合.',
      script,
    ),
    para(
      'The year readings note two zodiac years. A 本命年 repeats your birth branch; a clash year has the opposite branch (沖太歲). The 全書 卷三 lists, for each birth branch, which years to treat with care, and the app quotes it where it covers your branch. The Western zodiac has no traditional link to 紫微斗數 and isn’t used.',
      script,
    ),
    wrap,
  ];
}

const SECTIONS: [string, string, (s: Script) => HTMLElement[]][] = [
  ['basics', 'How a chart works', basics],
  ['palaces', 'The 12 palaces', palaces],
  ['major', 'The 14 main stars', majorStars],
  ['minor', 'Minor stars', minorStars],
  ['sihua', 'The four transformations (四化)', transformations],
  ['elements', 'Elements and colours (五行)', elements],
  ['zodiac', 'The Chinese zodiac (生肖)', zodiac],
  ['patterns', 'Patterns (格局)', patterns],
  ['glossary', 'Glossary', glossary],
];

function render(script: Script) {
  const toc = document.getElementById('learn-toc')!;
  const root = document.getElementById('learn')!;
  toc.replaceChildren();
  root.replaceChildren();
  for (const [id, title, build] of SECTIONS) {
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
