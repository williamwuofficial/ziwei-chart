import type { DecadeReading, DecadeTone } from '../analysis/decades';
import type { YearReading } from '../analysis/years';
import type { Analysis, Finding, PalaceCard, PatternFinding } from '../analysis/evaluate';
import type { PatternStatus, Source } from '../analysis/rules/types';
import type { Script } from '../engine/chart';
import { rich, tip, toScript } from './zhText';

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const STATUS_LABEL: Record<PatternStatus, { label: string; cls: string; hint: string }> = {
  formed: { label: 'Formed', cls: 'good', hint: 'Core structure, supporting stars, and no malefics in the 三方四正.' },
  flawed: { label: 'Flawed (破格)', cls: 'mixed', hint: 'Core structure and supporting stars, but malefics too.' },
  bare: { label: 'Weak', cls: 'neutral', hint: 'Core structure without supporting stars.' },
  broken: { label: 'Broken', cls: 'bad', hint: 'Core structure meeting malefics with no supporting stars.' },
  present: { label: 'Present', cls: 'bad', hint: 'Conditions met with nothing to soften them.' },
  mitigated: { label: 'Softened', cls: 'mixed', hint: 'Conditions met, but lucky stars soften the effect.' },
};

const TONE_LABEL: Record<PalaceCard['tone'], { label: string; cls: string }> = {
  supported: { label: 'Well supported', cls: 'good' },
  mixed: { label: 'Mixed', cls: 'mixed' },
  pressured: { label: 'Under pressure', cls: 'bad' },
  neutral: { label: 'Quiet', cls: 'neutral' },
};

function why(f: Finding, script: Script, showVerse = true): HTMLElement {
  const d = h('details', 'why');
  d.append(h('summary', undefined, 'Why?'));
  const ul = h('ul');
  for (const e of f.evidence) {
    const li = h('li');
    li.append(rich(e, script));
    ul.append(li);
  }
  d.append(ul);
  for (const s of f.sources) {
    if (s.verse && showVerse) d.append(verseLine(s, script));
    const p = h('p', 'source');
    p.append(rich(`Basis: ${s.basis}.`, script));
    d.append(p);
  }
  d.append(h('p', 'rule-id', `Rule ${f.id}`));
  return d;
}

/** The original text with its citation: 「…」 — 《紫微斗數全書》 · 斗數骨髓賦. */
function verseLine(s: Source, script: Script): HTMLElement {
  const fig = h('figure', 'verse');
  const q = h('blockquote');
  q.append(rich(`「${s.verse}」`, script));
  const cite = h('figcaption');
  if (s.work) cite.append(rich(`《${s.work}》 · ${s.section}`, script));
  else cite.append(rich('Classical verse as quoted in the traditional 格局 catalogue (not located in the Wikisource text of 《紫微斗數全書》)', script));
  fig.append(q, cite);
  return fig;
}

function finding(f: Finding, script: Script, showVerse = true): HTMLElement {
  const box = h('div', f.advice ? 'finding advice' : 'finding');
  const p = h('p');
  if (f.advice) {
    p.append(h('strong', 'advice-label', 'Advice'), ' ');
    const t = f.text.replace(/^Advice: /, '');
    p.append(rich(t.charAt(0).toUpperCase() + t.slice(1), script));
  } else p.append(rich(f.text, script));
  box.append(p, why(f, script, showVerse));
  return box;
}

function patternCard(f: PatternFinding, script: Script, onShow: (palaces: number[]) => void): HTMLElement {
  const card = h('article', `pattern ${f.rule.kind}`);
  const head = h('header');
  const name = h('h4');
  const zh = h('span', 'zh', toScript(f.rule.zh, script));
  zh.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
  name.append(zh, h('span', 'en', f.rule.en));
  const st = STATUS_LABEL[f.status];
  const chip = h('span', `chip ${st.cls}`);
  chip.append(rich(st.label, script));
  chip.title = st.hint;
  head.append(name, chip);
  const show = h('button', 'link show-on-chart', 'Show on chart');
  show.type = 'button';
  show.addEventListener('click', () => onShow(f.palaces));
  card.append(head);
  // Lead with the original text where the pattern has one.
  for (const s of f.rule.sources) if (s.verse) card.append(verseLine(s, script));
  card.append(finding(f, script, false), show);
  return card;
}

function palaceCard(c: PalaceCard, script: Script, onShow: (palaces: number[]) => void): HTMLElement {
  const d = h('details', 'palace-card');
  const s = h('summary');
  const name = h('span', 'zh term', toScript(c.name, script));
  name.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
  name.title = tip(c.name) ?? '';
  const tone = TONE_LABEL[c.tone];
  s.append(name, h('span', 'en', `${c.en} palace`), h('span', `chip ${tone.cls}`, tone.label));
  d.append(s);
  d.append(h('p', 'domain', `Governs ${c.domain}.`));
  if (!c.findings.length) d.append(h('p', 'hint', 'No main stars, notable minor stars or transformations here.'));
  for (const f of c.findings) d.append(finding(f, script));
  const show = h('button', 'link show-on-chart', 'Show on chart');
  show.type = 'button';
  show.addEventListener('click', () => onShow([c.index]));
  d.append(show);
  return d;
}

const DECADE_TONE: Record<DecadeTone, { label: string; cls: string }> = {
  favourable: { label: 'Favourable', cls: 'good' },
  mixed: { label: 'Mixed', cls: 'mixed' },
  challenging: { label: 'Challenging', cls: 'bad' },
};

export interface DecadeOptions {
  decades: DecadeReading[];
  /** Current nominal age, to mark the decade you are in. */
  nowAge?: number;
  onPick: (palaceIndex: number) => void;
  /** Year-by-year readings for a decade palace (computed when opened). */
  years?: (palaceIndex: number) => YearReading[];
}

function toneWhy(parts: string[], score: number, script: Script): HTMLElement {
  const how = h('details', 'why tone-why');
  how.append(h('summary', undefined, 'How the tone was set'));
  const ul = h('ul');
  for (const part of parts) {
    const li = h('li');
    li.append(rich(part, script));
    ul.append(li);
  }
  how.append(ul, h('p', 'source', `Total ${score}: 2 or more is Favourable, −2 or less is Challenging, anything between is Mixed.`));
  return how;
}

function yearsBlock(d: DecadeReading, o: DecadeOptions, script: Script, open: boolean): HTMLElement {
  const box = h('details', 'years');
  box.append(h('summary', undefined, 'Year by year (流年)'));
  const fill = () => {
    if (box.dataset.filled) return;
    box.dataset.filled = '1';
    for (const y of o.years!(d.index)) {
      const row = h('details', `year-row${o.nowAge === y.age ? ' now' : ''}`);
      const sum = h('summary');
      const gz = h('span', 'zh', `${y.stem}${y.branch}`);
      gz.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
      sum.append(h('span', 'yr', String(y.year)), gz, h('span', 'en', `age ${y.age}`));
      if (o.nowAge === y.age) sum.append(h('span', 'chip now', 'This year'));
      sum.append(h('span', `chip ${DECADE_TONE[y.tone].cls}`, DECADE_TONE[y.tone].label));
      row.append(sum);
      for (const f of y.findings) row.append(finding(f, script));
      row.append(toneWhy(y.scoreParts, y.score, script));
      if (o.nowAge === y.age) row.open = true;
      box.append(row);
    }
  };
  box.addEventListener('toggle', fill);
  if (open) {
    box.open = true;
    fill();
  }
  return box;
}

/** Selects a period card by its palace index; set while a decades section is on the page. */
let selectDecade: ((palaceIndex: number) => void) | undefined;

/** Show the reading for the period in this palace (e.g. when it is picked on the chart). */
export function showDecade(palaceIndex: number): void {
  selectDecade?.(palaceIndex);
}

function decadesSection(o: DecadeOptions, script: Script, onShow: (palaces: number[]) => void): HTMLElement {
  const sec = h('section', 'an-section decades-section');
  sec.append(h('h3', undefined, 'Life stages by 10-year period'));
  const hint = h('p', 'hint');
  hint.append(
    rich(
      'Each 10-year period (大限) is read from the natal palace it runs through, that palace’s stars, the period’s own four transformations, and the patterns around it. Ages are nominal (虛歲): 1 at birth and +1 at each Lunar New Year, so about a year ahead of Western age. The tone adds up the signals listed under “How the tone was set”. It is a rule of thumb, not a verdict.',
      script,
    ),
  );
  sec.append(hint);
  if (o.years) {
    const yh = h('p', 'hint');
    yh.append(rich('Each period also opens year by year (流年): the year’s palace is the one matching the year’s earthly branch, and the year stem brings its own four transformations, which can stack on the birth and period ones (疊忌, 疊祿).', script));
    sec.append(yh);
  }

  const inDecade = (d: DecadeReading) => o.nowAge !== undefined && o.nowAge >= d.range[0] && o.nowAge <= d.range[1];
  // The timeline works as tabs: only the selected period's card is shown, so moving between
  // periods doesn't mean scrolling past all the others.
  const bar = h('div', 'timeline');
  bar.setAttribute('role', 'tablist');
  bar.setAttribute('aria-label', '10-year periods');
  const tabs: HTMLButtonElement[] = [];
  const cards: HTMLElement[] = [];
  const select = (k: number, focusTop = false) => {
    tabs.forEach((t, j) => {
      t.setAttribute('aria-selected', String(j === k));
      t.tabIndex = j === k ? 0 : -1;
      t.classList.toggle('selected', j === k);
    });
    cards.forEach((c, j) => (c.hidden = j !== k));
    // Coming from the bottom of a long card, bring the new card's top back into view.
    if (focusTop && bar.getBoundingClientRect().top < 0) bar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  o.decades.forEach((d, k) => {
    const b = h('button', `tl-item ${DECADE_TONE[d.tone].cls}${inDecade(d) ? ' now' : ''}`);
    b.type = 'button';
    b.id = `decade-tab-${d.range[0]}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', `decade-${d.range[0]}`);
    b.append(h('span', 'tl-ages', `${d.range[0]}–${d.range[1]}`), h('span', 'tl-tone', DECADE_TONE[d.tone].label));
    if (inDecade(d)) b.append(h('span', 'tl-now', 'Now'));
    b.title = `${d.stage} · ${DECADE_TONE[d.tone].label}`;
    b.addEventListener('click', () => select(k));
    b.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      e.preventDefault();
      const n = (k + step + tabs.length) % tabs.length;
      select(n);
      tabs[n].focus();
    });
    tabs.push(b);
    bar.append(b);
  });
  sec.append(bar);

  o.decades.forEach((d, k) => {
    const card = h('article', `decade-card${inDecade(d) ? ' now' : ''}`);
    card.id = `decade-${d.range[0]}`;
    card.setAttribute('role', 'tabpanel');
    card.setAttribute('aria-labelledby', `decade-tab-${d.range[0]}`);
    cards.push(card);
    const head = h('header');
    const title = h('h4');
    title.append(h('span', 'ages', `Ages ${d.range[0]}–${d.range[1]}`));
    const pal = h('span', 'zh term', toScript(d.natalPalace, script));
    pal.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
    pal.title = tip(d.natalPalace) ?? '';
    title.append(pal, h('span', 'stage', d.stage));
    const chips = h('div', 'chips');
    if (inDecade(d)) chips.append(h('span', 'chip now', 'You are here'));
    chips.append(h('span', `chip ${DECADE_TONE[d.tone].cls}`, DECADE_TONE[d.tone].label));
    head.append(title, chips);
    card.append(head);
    for (const f of d.findings) card.append(finding(f, script));

    if (d.patterns.length) {
      const pl = h('div', 'decade-patterns');
      pl.append(h('p', 'label', 'Patterns around this period’s palace'));
      for (const f of d.patterns) {
        const row = h('details', 'pattern-row');
        const sum = h('summary');
        const zh = h('span', 'zh', toScript(f.rule.zh, script));
        zh.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
        const st = STATUS_LABEL[f.status];
        const chip = h('span', `chip ${st.cls}`);
        chip.append(rich(st.label, script));
        sum.append(zh, h('span', 'en', f.rule.en), chip);
        row.append(sum, finding(f, script));
        pl.append(row);
      }
      card.append(pl);
    }

    card.append(toneWhy(d.scoreParts, d.score, script));
    if (o.years) card.append(yearsBlock(d, o, script, inDecade(d)));

    const actions = h('div', 'decade-actions');
    const overlay = h('button', 'link', 'Show this period on the chart');
    overlay.type = 'button';
    overlay.addEventListener('click', () => o.onPick(d.index));
    const pals = h('button', 'link', 'Highlight its palaces');
    pals.type = 'button';
    pals.addEventListener('click', () => onShow([d.index, (d.index + 4) % 12, (d.index + 8) % 12, (d.index + 6) % 12]));
    actions.append(overlay, pals);
    card.append(actions);

    // Step to the neighbouring periods from the bottom of the card.
    const nav = h('nav', 'decade-nav');
    nav.setAttribute('aria-label', 'Neighbouring periods');
    const prev = o.decades[k - 1];
    const next = o.decades[k + 1];
    if (prev) {
      const p = h('button', 'link', `← Ages ${prev.range[0]}–${prev.range[1]}`);
      p.type = 'button';
      p.addEventListener('click', () => select(k - 1, true));
      nav.append(p);
    }
    if (next) {
      const n = h('button', 'link next', `Ages ${next.range[0]}–${next.range[1]} →`);
      n.type = 'button';
      n.addEventListener('click', () => select(k + 1, true));
      nav.append(n);
    }
    card.append(nav);
    sec.append(card);
  });

  const now = o.decades.findIndex(inDecade);
  select(now >= 0 ? now : 0);
  selectDecade = (palaceIndex) => {
    const k = o.decades.findIndex((d) => d.index === palaceIndex);
    if (k >= 0) select(k);
  };
  return sec;
}

export function renderAnalysis(
  root: HTMLElement,
  a: Analysis,
  script: Script,
  onShow: (palaces: number[]) => void,
  decades?: DecadeOptions,
): void {
  const intro = h('p', 'hint');
  intro.append(
    rich(
      'Each statement comes from a known star configuration: the 14 main stars’ natures, named patterns (格局) from the classical pattern catalogue, and the four transformations. Open “Why?” to see the stars that triggered it and its source. Traditional readings describe tendencies, not certainties.',
      script,
    ),
  );

  const overview = h('section', 'an-section');
  overview.append(h('h3', undefined, 'Life palace overview'));
  for (const f of a.overview) overview.append(finding(f, script));

  const good = a.patterns.filter((p) => p.rule.kind === 'auspicious');
  const bad = a.patterns.filter((p) => p.rule.kind === 'adverse');
  const pats = h('section', 'an-section');
  pats.append(h('h3', undefined, 'Named patterns (格局)'));
  const legend = h('p', 'hint');
  legend.append(
    rich(
      'Patterns are judged on the Life palace’s 三方四正. A lucky pattern is Formed when supporting stars are present and 四煞, 空劫 and 化忌 are absent; Flawed (破格) when both are present; Weak with neither; Broken with malefics only.',
      script,
    ),
  );
  pats.append(legend);
  const structures = a.patterns.filter((p) => p.rule.kind === 'structure');
  const groups: [string, PatternFinding[]][] = [
    ['Star structures', structures],
    ['Auspicious patterns', good],
    ['Challenging patterns', bad],
  ];
  for (const [title, list] of groups) {
    if (!list.length && title === 'Star structures') continue;
    pats.append(h('h4', 'group', `${title} (${list.length})`));
    if (!list.length)
      pats.append(h('p', 'hint', title.startsWith('Auspicious') ? 'None found in this chart. Many charts form few or no named patterns; the palace readings below still apply.' : 'None found in this chart.'));
    const grid = h('div', 'pattern-grid');
    for (const f of list) grid.append(patternCard(f, script, onShow));
    pats.append(grid);
  }

  const pal = h('section', 'an-section');
  pal.append(h('h3', undefined, 'The twelve palaces'));
  const palHint = h('p', 'hint');
  palHint.append(rich('Tone weighs the palace’s own stars first: lucky stars and 祿/權/科 help, malefics hurt, and the birth 化忌 counts heavily. Its 三方四正 count a quarter, and 空劫 weaken it. Empty palaces borrow the stars opposite.', script));
  pal.append(palHint);
  for (const c of a.palaces) pal.append(palaceCard(c, script, onShow));

  const sections: HTMLElement[] = [h('h2', undefined, 'Analysis'), intro, overview];
  if (decades) sections.push(decadesSection(decades, script, onShow));
  sections.push(pats, pal);
  root.replaceChildren(...sections);
}
