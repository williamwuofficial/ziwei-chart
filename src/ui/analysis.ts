import type { Analysis, Finding, PalaceCard, PatternFinding } from '../analysis/evaluate';
import type { PatternStatus } from '../analysis/rules/types';
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

function why(f: Finding, script: Script): HTMLElement {
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
    const p = h('p', 'source');
    if (s.verse) {
      const q = h('q');
      q.append(rich(s.verse, script));
      p.append('Classical verse: ', q, '. ');
    }
    p.append(rich(`Basis: ${s.basis}.`, script));
    d.append(p);
  }
  d.append(h('p', 'rule-id', `Rule ${f.id}`));
  return d;
}

function finding(f: Finding, script: Script): HTMLElement {
  const box = h('div', 'finding');
  const p = h('p');
  p.append(rich(f.text, script));
  box.append(p, why(f, script));
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
  card.append(head, finding(f, script), show);
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

export function renderAnalysis(root: HTMLElement, a: Analysis, script: Script, onShow: (palaces: number[]) => void): void {
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
  const groups: [string, PatternFinding[]][] = [
    ['Auspicious patterns', good],
    ['Challenging patterns', bad],
  ];
  for (const [title, list] of groups) {
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
  palHint.append(rich('Tone counts supporting versus malefic stars across each palace’s own 三方四正. Empty palaces borrow the stars opposite.', script));
  pal.append(palHint);
  for (const c of a.palaces) pal.append(palaceCard(c, script, onShow));

  root.replaceChildren(h('h2', undefined, 'Analysis'), intro, overview, pats, pal);
}
