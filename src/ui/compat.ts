// Compatibility card: a small partner form under the analysis, and the layered comparison.
// The partner's details are kept in memory only, never stored: they belong to someone else.

import { compare, type CompatSection, type Layer } from '../analysis/compat';
import type { ChartM } from '../analysis/model';
import type { Pillars } from '../analysis/bazi';
import { SHICHEN } from '../input/solarTime';
import type { Gender, Script } from '../engine/chart';
import { finding } from './analysis';
import { rich, toScript } from './zhText';

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const TONE: Record<Layer, { label: string; cls: string }> = {
  match: { label: 'Good fit', cls: 'good' },
  partial: { label: 'Mixed', cls: 'mixed' },
  differs: { label: 'Differs', cls: 'bad' },
  none: { label: 'No signal', cls: 'neutral' },
};

export interface Partner {
  gender: Gender;
  date: string;
  timeIndex: number;
}

let partner: Partner | undefined;

/**
 * Draw the card. `own` is the main chart's model; `build` makes the partner's model with the same
 * settings as the main chart.
 */
export interface Side {
  c: ChartM;
  pillars: Pillars;
}

export function renderCompat(root: HTMLElement, own: Side, build: (p: Partner) => Side, script: Script): void {
  const head = h('h2', undefined, 'Compatibility');
  const zh = h('span', 'zh', toScript(' 合婚', script));
  head.append(zh);
  const intro = h('p', 'hint');
  intro.append(
    rich(
      'Compare this chart with a partner’s. The 紫微斗數全書 has no compatibility method, so this follows a modern compilation, the 紫微斗數集成全書, with a comparison of the two 八字 (Four Pillars) as a separate last layer. The partner’s details stay on this page and are not saved.',
      script,
    ),
  );

  const form = h('form', 'compat-form');
  form.noValidate = true;
  const g = h('fieldset', 'field gender');
  g.append(h('legend', undefined, 'Partner’s gender'));
  for (const [v, l] of [['male', 'Male'], ['female', 'Female']] as const) {
    const lab = h('label', 'choice');
    const r = h('input');
    r.type = 'radio';
    r.name = 'pgender';
    r.value = v;
    r.checked = partner?.gender === v;
    lab.append(r, ` ${l}`);
    g.append(lab);
  }
  const row = h('div', 'row');
  const dl = h('label', 'field');
  dl.append(h('span', 'label', 'Partner’s date of birth'));
  const date = h('input');
  date.type = 'date';
  date.name = 'pdate';
  date.min = '1900-01-01';
  date.max = '2099-12-31';
  date.value = partner?.date ?? '';
  dl.append(date);
  const tl = h('label', 'field');
  tl.append(h('span', 'label', 'Partner’s time of birth (時辰)'));
  const sel = h('select');
  sel.name = 'ptime';
  sel.append(new Option('Choose…', ''));
  SHICHEN.forEach((s, i) => sel.append(new Option(toScript(`${s.zh}時 ${s.range}`, script), String(i))));
  if (partner) sel.value = String(partner.timeIndex);
  tl.append(sel);
  row.append(dl, tl);
  const err = h('p', 'form-error');
  err.setAttribute('role', 'alert');
  err.hidden = true;
  const btn = h('button', 'primary', 'Compare');
  btn.type = 'submit';
  form.append(g, row, err, btn);

  const out = h('div', 'compat-result');
  out.setAttribute('aria-live', 'polite');

  const run = () => {
    if (!partner) return;
    let other: Side;
    try {
      other = build(partner);
    } catch (e) {
      err.hidden = false;
      err.textContent = `Could not build the partner’s chart: ${String(e)}`;
      return;
    }
    const res = compare({ ...own, who: 'You', whose: 'Your' }, { ...other, who: 'Your partner', whose: 'Your partner’s' });
    out.replaceChildren(...res.sections.map((s) => section(s, script)), limits(res.limits, script));
  };

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const gender = form.querySelector<HTMLInputElement>('input[name="pgender"]:checked')?.value as Gender | undefined;
    const missing = [!gender && 'gender', !date.value && 'date of birth', sel.value === '' && 'time of birth'].filter(Boolean);
    if (missing.length) {
      err.hidden = false;
      err.textContent = `Please enter the partner’s ${missing.join(', ')}.`;
      return;
    }
    err.hidden = true;
    partner = { gender: gender!, date: date.value, timeIndex: Number(sel.value) };
    run();
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  root.replaceChildren(head, intro, form, out);
  // Keep the comparison when the main chart is recalculated (e.g. a settings change).
  run();
}

function section(s: CompatSection, script: Script): HTMLElement {
  const sec = h('section', 'an-section compat-layer');
  const t = h('h3');
  const name = h('span');
  name.append(rich(s.title, script));
  t.append(name);
  const tone = TONE[s.tone];
  t.append(h('span', `chip ${tone.cls}`, tone.label));
  const b = h('span', 'chip neutral', toScript(s.basis === 'bazi' ? '八字' : '集成全書', script));
  b.title = s.basis === 'bazi' ? 'From the 八字 classics 三命通會 and 淵海子平' : 'From the modern 紫微斗數集成全書';
  t.append(b);
  sec.append(t);
  for (const f of s.findings) sec.append(finding(f, script));
  return sec;
}

function limits(list: string[], script: Script): HTMLElement {
  const box = h('details', 'an-section compat-limits fold');
  const sum = h('summary');
  sum.append(h('span', 'fold-title', 'What this comparison can’t tell you'), ' ', h('span', 'fold-teaser', `${list.length} known gaps: there is no classical method, and both birth times must be right`));
  box.append(sum);
  const ul = h('ul');
  for (const l of list) {
    const li = h('li');
    li.append(rich(l, script));
    ul.append(li);
  }
  box.append(ul);
  return box;
}
