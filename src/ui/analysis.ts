import type { DecadeReading, DecadeTone } from '../analysis/decades';
import type { YearReading } from '../analysis/years';
import type { Analysis, Finding, PalaceCard, PatternFinding } from '../analysis/evaluate';
import type { PatternStatus, Source } from '../analysis/rules/types';
import type { Script } from '../engine/chart';
import { isZh, tr } from '../i18n/lang';
import { rich, tip, toScript, ui } from './zhText';

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const STATUS_EN: Record<PatternStatus, { label: string; cls: string; hint: string }> = {
  formed: { label: 'Formed', cls: 'good', hint: 'Core structure, supporting stars, and no malefics in the 三方四正.' },
  flawed: { label: 'Flawed (破格)', cls: 'mixed', hint: 'Core structure and supporting stars, but malefics too.' },
  bare: { label: 'Weak', cls: 'neutral', hint: 'Core structure without supporting stars.' },
  broken: { label: 'Broken', cls: 'bad', hint: 'Core structure meeting malefics with no supporting stars.' },
  present: { label: 'Present', cls: 'bad', hint: 'Conditions met with nothing to soften them.' },
  mitigated: { label: 'Softened', cls: 'mixed', hint: 'Conditions met, but lucky stars soften the effect.' },
};
const STATUS_ZH: Record<PatternStatus, { label: string; hint: string }> = {
  formed: { label: '成格', hint: '格局結構具備，有吉星扶助，三方四正不見煞星。' },
  flawed: { label: '破格', hint: '格局結構具備，有吉星扶助，但也見煞星。' },
  bare: { label: '力弱', hint: '格局結構具備，但無吉星扶助。' },
  broken: { label: '格破', hint: '格局結構具備，遇煞星而無吉星扶助。' },
  present: { label: '成立', hint: '條件成立，沒有可減輕的因素。' },
  mitigated: { label: '減輕', hint: '條件成立，但有吉星減輕影響。' },
};
const statusLabel = (s: PatternStatus) => ({ ...STATUS_EN[s], ...(isZh() ? STATUS_ZH[s] : {}) });

const TONE_EN: Record<PalaceCard['tone'], { label: string; cls: string }> = {
  supported: { label: 'Well supported', cls: 'good' },
  mixed: { label: 'Mixed', cls: 'mixed' },
  pressured: { label: 'Under pressure', cls: 'bad' },
  neutral: { label: 'Quiet', cls: 'neutral' },
};
const TONE_ZH: Record<PalaceCard['tone'], string> = { supported: '得助', mixed: '吉凶互見', pressured: '受壓', neutral: '平靜' };
const toneLabel = (t: PalaceCard['tone']) => ({ cls: TONE_EN[t].cls, label: ui(TONE_EN[t].label, TONE_ZH[t]) });

function why(f: Finding, script: Script, showVerse = true): HTMLElement {
  const d = h('details', 'why');
  const sum = h('summary', undefined, ui('Why?', '依據'));
  // The rule ID is for bug reports and debugging, so it stays out of the visible text.
  sum.title = `Rule ${f.id}`;
  d.dataset.rule = f.id;
  d.append(sum);
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
    p.append(rich(isZh() ? `根據：${tr(s.basis)}。` : `Basis: ${s.basis}.`, script));
    d.append(p);
  }
  return d;
}

/** The original text with its citation: 「…」 — 《紫微斗數全書》 · 斗數骨髓賦. */
function verseLine(s: Source, script: Script): HTMLElement {
  const fig = h('figure', 'verse');
  const q = h('blockquote');
  q.append(rich(`「${s.verse}」`, script));
  const cite = h('figcaption');
  if (s.work) cite.append(rich(`《${s.work}》 · ${s.section}`, script));
  else cite.append(rich(ui('Classical verse as quoted in the traditional 格局 catalogue (not located in the Wikisource text of 《紫微斗數全書》)', '傳統格局書所引的古文（在維基文庫的《紫微斗數全書》中未找到）'), script));
  fig.append(q, cite);
  return fig;
}

export function finding(f: Finding, script: Script, showVerse = true): HTMLElement {
  const box = h('div', f.advice ? 'finding advice' : 'finding');
  const p = h('p');
  if (f.advice) {
    p.append(h('strong', 'advice-label', ui('Advice', '建議')), ' ');
    const t = f.text.replace(/^(Advice: |建議：)/, '');
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
  name.append(zh);
  if (!isZh()) name.append(h('span', 'en', f.rule.en));
  const st = statusLabel(f.status);
  const chip = h('span', `chip ${st.cls}`);
  chip.append(rich(st.label, script));
  chip.title = st.hint;
  head.append(name, chip);
  const show = h('button', 'link show-on-chart', ui('Show on chart', '在命盤上顯示'));
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
  if (!isZh()) name.title = tip(c.name) ?? '';
  else name.classList.remove('term');
  const tone = toneLabel(c.tone);
  s.append(name);
  if (!isZh()) s.append(h('span', 'en', `${c.en} palace`));
  s.append(h('span', `chip ${tone.cls}`, tone.label));
  d.append(s);
  d.append(h('p', 'domain', ui(`Governs ${c.domain}.`, `主管${c.domain}。`)));
  if (!c.findings.length) d.append(h('p', 'hint', ui('No main stars, notable minor stars or transformations here.', '此宮沒有主星、重要的輔星或四化。')));
  for (const f of c.findings) d.append(finding(f, script));
  const show = h('button', 'link show-on-chart', ui('Show on chart', '在命盤上顯示'));
  show.type = 'button';
  show.addEventListener('click', () => onShow([c.index]));
  d.append(show);
  return d;
}

const DECADE_TONE_EN: Record<DecadeTone, { label: string; cls: string }> = {
  favourable: { label: 'Favourable', cls: 'good' },
  mixed: { label: 'Mixed', cls: 'mixed' },
  challenging: { label: 'Challenging', cls: 'bad' },
};
const DECADE_TONE_ZH: Record<DecadeTone, string> = { favourable: '順', mixed: '平', challenging: '逆' };
/** Tone chip label and class for a decade or year, in the current language. */
export const decadeTone = (t: DecadeTone) => ({ cls: DECADE_TONE_EN[t].cls, label: ui(DECADE_TONE_EN[t].label, DECADE_TONE_ZH[t]) });

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
  how.append(h('summary', undefined, ui('How the tone was set', '評分方式')));
  const ul = h('ul');
  for (const part of parts) {
    const li = h('li');
    li.append(rich(part, script));
    ul.append(li);
  }
  how.append(ul, h('p', 'source', ui(`Total ${score}: 2 or more is Favourable, −2 or less is Challenging, anything between is Mixed.`, `總分${score}：2分以上為順，−2分以下為逆，其間為平。`)));
  return how;
}

function yearsBlock(d: DecadeReading, o: DecadeOptions, script: Script, open: boolean): HTMLElement {
  const box = h('details', 'years');
  box.append(h('summary', undefined, ui('Year by year (流年)', '逐年流年')));
  const fill = () => {
    if (box.dataset.filled) return;
    box.dataset.filled = '1';
    for (const y of o.years!(d.index)) {
      const row = h('details', `year-row${o.nowAge === y.age ? ' now' : ''}`);
      const sum = h('summary');
      const gz = h('span', 'zh', `${y.stem}${y.branch}`);
      gz.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
      sum.append(h('span', 'yr', String(y.year)), gz, h('span', 'en', ui(`age ${y.age}`, `${y.age}歲`)));
      // Both yearly palaces: the 流年 palace (by the year's branch) and the 小限 (by age).
      const pals = h('span', 'yr-palaces');
      pals.append(rich(`流年 ${y.palaceName} · 小限 ${y.xiaoxianName}`, script));
      sum.append(pals);
      if (o.nowAge === y.age) sum.append(h('span', 'chip now', ui('This year', '今年')));
      sum.append(h('span', `chip ${decadeTone(y.tone).cls}`, decadeTone(y.tone).label));
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
  sec.dataset.panel = 'decades';
  sec.append(h('h3', undefined, ui('Life stages by 10-year period', '十年大限')));
  const hint = h('p', 'hint');
  hint.append(
    rich(
      ui(
        'Each 10-year period (大限) is read from the natal palace it runs through, that palace’s stars, the period’s own four transformations, and the patterns around it. Ages are nominal (虛歲): 1 at birth and +1 at each Lunar New Year, so about a year ahead of Western age. The tone adds up the signals listed under “How the tone was set”. It is a rule of thumb, not a verdict.',
        '每個大限依它所行經的本命宮位、該宮的星曜、大限本身的四化，以及周圍的格局來解讀。年齡以虛歲計：出生為一歲，每過農曆新年加一歲，大約比西式年齡多一歲。順逆是把「評分方式」中列出的訊號加總而成，只是粗略的參考，不是定論。',
      ),
      script,
    ),
  );
  sec.append(hint);
  if (o.years) {
    const yh = h('p', 'hint');
    yh.append(
      rich(
        ui(
          'Each period also opens year by year. Every year has two palaces: the 流年 palace, matching the year’s earthly branch, and the 小限 (age palace), which moves one palace per year of age from a starting point set by your birth year. The year stem brings its own four transformations, which can stack on the birth and period ones (疊忌, 疊祿).',
          '每個大限也可以逐年展開。每一年有兩個宮位：流年命宮（地支與流年相同的宮）和小限（從生年決定的起點，每歲移一宮）。流年天干有自己的四化，可以與生年和大限的四化重疊（疊忌、疊祿）。',
        ),
        script,
      ),
    );
    sec.append(yh);
  }

  const inDecade = (d: DecadeReading) => o.nowAge !== undefined && o.nowAge >= d.range[0] && o.nowAge <= d.range[1];
  // The timeline works as tabs: only the selected period's card is shown, so moving between
  // periods doesn't mean scrolling past all the others.
  const bar = h('div', 'timeline');
  bar.setAttribute('role', 'tablist');
  bar.setAttribute('aria-label', ui('10-year periods', '大限'));
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
    const b = h('button', `tl-item ${decadeTone(d.tone).cls}${inDecade(d) ? ' now' : ''}`);
    b.type = 'button';
    b.id = `decade-tab-${d.range[0]}`;
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-controls', `decade-${d.range[0]}`);
    b.append(h('span', 'tl-ages', `${d.range[0]}–${d.range[1]}`), h('span', 'tl-tone', decadeTone(d.tone).label));
    if (inDecade(d)) b.append(h('span', 'tl-now', ui('Now', '現在')));
    b.title = `${toScript(d.stage, script)} · ${decadeTone(d.tone).label}`;
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
    title.append(h('span', 'ages', ui(`Ages ${d.range[0]}–${d.range[1]}`, `${d.range[0]}–${d.range[1]}歲`)));
    const pal = h('span', isZh() ? 'zh' : 'zh term', toScript(d.natalPalace, script));
    pal.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
    if (!isZh()) pal.title = tip(d.natalPalace) ?? '';
    title.append(pal, h('span', 'stage', toScript(d.stage, script)));
    const chips = h('div', 'chips');
    if (inDecade(d)) chips.append(h('span', 'chip now', ui('You are here', '目前所在')));
    chips.append(h('span', `chip ${decadeTone(d.tone).cls}`, decadeTone(d.tone).label));
    head.append(title, chips);
    card.append(head);
    for (const f of d.findings) card.append(finding(f, script));

    if (d.patterns.length) {
      const pl = h('div', 'decade-patterns');
      pl.append(h('p', 'label', ui('Patterns around this period’s palace', '大限命宮的格局')));
      for (const f of d.patterns) {
        const row = h('details', 'pattern-row');
        const sum = h('summary');
        const zh = h('span', 'zh', toScript(f.rule.zh, script));
        zh.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
        const st = statusLabel(f.status);
        const chip = h('span', `chip ${st.cls}`);
        chip.append(rich(st.label, script));
        sum.append(zh);
        if (!isZh()) sum.append(h('span', 'en', f.rule.en));
        sum.append(chip);
        row.append(sum, finding(f, script));
        pl.append(row);
      }
      card.append(pl);
    }

    card.append(toneWhy(d.scoreParts, d.score, script));
    if (o.years) card.append(yearsBlock(d, o, script, inDecade(d)));

    const actions = h('div', 'decade-actions');
    const overlay = h('button', 'link', ui('Show this period on the chart', '在命盤上顯示此大限'));
    overlay.type = 'button';
    overlay.addEventListener('click', () => o.onPick(d.index));
    const pals = h('button', 'link', ui('Highlight its palaces', '標示其三方四正'));
    pals.type = 'button';
    pals.addEventListener('click', () => onShow([d.index, (d.index + 4) % 12, (d.index + 8) % 12, (d.index + 6) % 12]));
    actions.append(overlay, pals);
    card.append(actions);

    // Step to the neighbouring periods from the bottom of the card.
    const nav = h('nav', 'decade-nav');
    nav.setAttribute('aria-label', ui('Neighbouring periods', '前後大限'));
    const prev = o.decades[k - 1];
    const next = o.decades[k + 1];
    if (prev) {
      const p = h('button', 'link', ui(`← Ages ${prev.range[0]}–${prev.range[1]}`, `← ${prev.range[0]}–${prev.range[1]}歲`));
      p.type = 'button';
      p.addEventListener('click', () => select(k - 1, true));
      nav.append(p);
    }
    if (next) {
      const n = h('button', 'link next', ui(`Ages ${next.range[0]}–${next.range[1]} →`, `${next.range[0]}–${next.range[1]}歲 →`));
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
      ui(
        'Each statement comes from a known star configuration: the 14 main stars’ natures, named patterns (格局) from the classical pattern catalogue, and the four transformations. Open “Why?” to see the stars that triggered it and its source. Traditional readings describe tendencies, not certainties.',
        '每一句解讀都來自已知的星曜組合：十四主星的星性、古典格局書中的格局，以及四化。打開「依據」可以看到觸發它的星曜和出處。傳統的論斷描述的是傾向，不是定數。',
      ),
      script,
    ),
  );

  const overview = h('section', 'an-section');
  overview.dataset.panel = 'overview';
  overview.append(h('h3', undefined, ui('Life palace overview', '命宮總論')), intro);
  for (const f of a.overview) overview.append(finding(f, script));

  const good = a.patterns.filter((p) => p.rule.kind === 'auspicious');
  const bad = a.patterns.filter((p) => p.rule.kind === 'adverse');
  const pats = h('section', 'an-section');
  pats.dataset.panel = 'patterns';
  pats.append(h('h3', undefined, ui('Named patterns (格局)', '格局')));
  const legend = h('p', 'hint');
  legend.append(
    rich(
      ui(
        'Patterns are judged on the Life palace’s 三方四正. A lucky pattern is Formed when supporting stars are present and 四煞, 空劫 and 化忌 are absent; Flawed (破格) when both are present; Weak with neither; Broken with malefics only.',
        '格局以命宮的三方四正來判斷。吉格有吉星扶助而不見四煞、空劫、化忌時為「成格」；兩者都有時為「破格」；兩者都沒有時為「力弱」；只有煞星時為「格破」。',
      ),
      script,
    ),
  );
  pats.append(legend);
  const structures = a.patterns.filter((p) => p.rule.kind === 'structure');
  const groups: [string, string, PatternFinding[]][] = [
    ['structure', ui('Star structures', '星系結構'), structures],
    ['auspicious', ui('Auspicious patterns', '吉格'), good],
    ['adverse', ui('Challenging patterns', '凶格'), bad],
  ];
  for (const [kind, title, list] of groups) {
    if (!list.length && kind === 'structure') continue;
    // Each group folds; the lucky and challenging ones start open, the structures closed.
    const grp = h('details', 'pattern-group');
    grp.open = kind !== 'structure' && list.length > 0;
    grp.append(h('summary', 'group', `${title} (${list.length})`));
    if (!list.length)
      grp.append(
        h(
          'p',
          'hint',
          kind === 'auspicious'
            ? ui('None found in this chart. Many charts form few or no named patterns; the palace readings still apply.', '此命盤未見吉格。很多命盤只有很少或沒有格局；各宮的解讀仍然適用。')
            : ui('None found in this chart.', '此命盤未見。'),
        ),
      );
    const grid = h('div', 'pattern-grid');
    for (const f of list) grid.append(patternCard(f, script, onShow));
    grp.append(grid);
    pats.append(grp);
  }

  const pal = h('section', 'an-section');
  pal.dataset.panel = 'palaces';
  pal.append(h('h3', undefined, ui('The twelve palaces', '十二宮')));
  const palHint = h('p', 'hint');
  palHint.append(
    rich(
      ui(
        'Tone weighs the palace’s own stars first: lucky stars and 祿/權/科 help, malefics hurt, and the birth 化忌 counts heavily. Its 三方四正 count a quarter, and 空劫 weaken it. Empty palaces borrow the stars opposite.',
        '吉凶先看本宮的星曜：吉星和祿權科加分，煞星減分，生年化忌分量最重。三方四正只算四分之一，空劫會削弱本宮。空宮借對宮的星曜來看。',
      ),
      script,
    ),
  );
  pal.append(palHint);
  for (const c of a.palaces) pal.append(palaceCard(c, script, onShow));

  // Each section is a tab panel (see ui/tabs.ts), in the order of the tab bar.
  const sections: HTMLElement[] = [overview];
  if (decades) sections.push(decadesSection(decades, script, onShow));
  sections.push(pal, pats);
  root.replaceChildren(...sections);
}
