// "This year at a glance": a short card above the tabs that pulls the current year's reading
// together: its tone, where the year and age palaces fall, where the year's 化祿 and 化忌 land, the
// main reasons behind the tone, and any zodiac note or advice. Everything here is taken from the
// full year reading, which a button opens.

import type { DecadeReading } from '../analysis/decades';
import type { YearReading } from '../analysis/years';
import { stemMutagens, type ChartM } from '../analysis/model';
import { Ctx } from '../analysis/predicates';
import { PALACE_DOMAIN } from '../analysis/rules/stars';
import type { Script } from '../engine/chart';
import { rich, toScript } from './zhText';

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const TONE = {
  favourable: { label: 'Favourable', cls: 'good' },
  mixed: { label: 'Mixed', cls: 'mixed' },
  challenging: { label: 'Challenging', cls: 'bad' },
} as const;

/** Split "+2: reason" / "−1: reason" score lines into the strongest pluses and minuses. */
function reasons(parts: string[]): { good: string[]; bad: string[] } {
  const parsed = parts
    .map((p) => {
      const m = p.match(/^([+−-])(\d+):\s*(.*)$/);
      return m ? { n: (m[1] === '+' ? 1 : -1) * Number(m[2]), why: m[3] } : undefined;
    })
    .filter((x): x is { n: number; why: string } => !!x && x.n !== 0);
  const top = (xs: typeof parsed) => xs.sort((a, b) => Math.abs(b.n) - Math.abs(a.n)).slice(0, 3).map((x) => x.why);
  return { good: top(parsed.filter((x) => x.n > 0)), bad: top(parsed.filter((x) => x.n < 0)) };
}

export function renderGlance(
  root: HTMLElement,
  c: ChartM,
  y: YearReading | undefined,
  d: DecadeReading | undefined,
  script: Script,
  openFull: () => void,
): void {
  if (!y) {
    root.hidden = true;
    return;
  }
  root.hidden = false;
  const x = new Ctx(c);
  const line = (label: string, text: string) => {
    const p = h('p', 'glance-line');
    p.append(h('span', 'glance-label', label));
    const t = h('span');
    t.append(rich(text, script));
    p.append(t);
    return p;
  };

  const head = h('div', 'glance-head');
  const title = h('h2');
  const gz = h('span', 'zh', toScript(`${y.stem}${y.branch}年`, script));
  gz.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
  title.append(`${y.year} at a glance `, gz);
  head.append(title, h('span', `chip ${TONE[y.tone].cls}`, TONE[y.tone].label));

  const meta = h('p', 'hint');
  meta.append(
    rich(
      `Age ${y.age} (nominal)${d ? `, in the ${d.range[0]}–${d.range[1]} period (大限 in your ${PALACE_DOMAIN[d.natalPalace].en} palace), rated ${TONE[d.tone].label.toLowerCase()}` : ''}.`,
      script,
    ),
  );

  const items: HTMLElement[] = [];
  const yp = PALACE_DOMAIN[y.palaceName];
  const xp = PALACE_DOMAIN[y.xiaoxianName];
  items.push(
    line(
      'Focus',
      y.palaceName === y.xiaoxianName
        ? `${yp.domain} (your ⟨${y.palaceName}⟩ palace is both the year palace and the age palace)`
        : `${yp.domain} (year palace ⟨${y.palaceName}⟩), and ${xp.domain} (age palace ⟨${y.xiaoxianName}⟩)`,
    ),
  );
  const muts = stemMutagens(y.stem, c.mutOverrides);
  if (muts) {
    const at = (star: string) => {
      const i = x.find(star);
      return i < 0 ? 'not in the chart' : `your ⟨${c.palaces[i].name}⟩ palace (${PALACE_DOMAIN[c.palaces[i].name].en.toLowerCase()})`;
    };
    items.push(line('Year 四化', `⟨${muts[0]}⟩ 化祿 brings ease to ${at(muts[0])}; ⟨${muts[3]}⟩ 化忌 asks for care in ${at(muts[3])}.`));
  }
  const r = reasons(y.scoreParts);
  if (r.good.length) items.push(line('Going for you', r.good.join('; ')));
  if (r.bad.length) items.push(line('Watch', r.bad.join('; ')));
  const zodiac = y.findings.find((f) => /\.zodiac\./.test(f.id));
  if (zodiac) items.push(line('Zodiac', zodiac.text));
  const advice = y.findings.find((f) => f.advice);
  if (advice) {
    const t = advice.text.replace(/^Advice: /, '');
    items.push(line('Advice', t.charAt(0).toUpperCase() + t.slice(1)));
  }

  const more = h('button', 'link', 'Read the full year →');
  more.type = 'button';
  more.addEventListener('click', openFull);

  root.replaceChildren(head, meta, ...items, more);
}
