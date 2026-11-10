// "This year at a glance": a short card above the tabs that pulls the current year's reading
// together: its tone, where the year and age palaces fall, where the year's 化祿 and 化忌 land, the
// main reasons behind the tone, and any zodiac note or advice. Everything here is taken from the
// full year reading, which a button opens.

import type { DecadeReading } from '../analysis/decades';
import type { YearReading } from '../analysis/years';
import { stemMutagens, type ChartM } from '../analysis/model';
import { Ctx } from '../analysis/predicates';
import { PALACE_DOMAIN, palaceTitle } from '../analysis/rules/stars';
import { isZh, tr } from '../i18n/lang';
import { decadeTone } from './analysis';
import type { Script } from '../engine/chart';
import { rich, toScript, ui } from './zhText';

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};


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
  title.append(ui(`${y.year} at a glance `, `${y.year}年運勢速覽 `), gz);
  head.append(title, h('span', `chip ${decadeTone(y.tone).cls}`, decadeTone(y.tone).label));

  const meta = h('p', 'hint');
  meta.append(
    rich(
      isZh()
        ? `虛歲${y.age}歲${d ? `，正行${d.range[0]}–${d.range[1]}歲大限（大限命宮在本命${palaceTitle(d.natalPalace)}），評為「${decadeTone(d.tone).label}」` : ''}。`
        : `Age ${y.age} (nominal)${d ? `, in the ${d.range[0]}–${d.range[1]} period (大限 in your ${PALACE_DOMAIN[d.natalPalace].en} palace), rated ${decadeTone(d.tone).label.toLowerCase()}` : ''}.`,
      script,
    ),
  );

  const items: HTMLElement[] = [];
  const yp = PALACE_DOMAIN[y.palaceName];
  const xp = PALACE_DOMAIN[y.xiaoxianName];
  items.push(
    line(
      ui('Focus', '重點'),
      isZh()
        ? y.palaceName === y.xiaoxianName
          ? `${tr(yp.domain)}（本命${palaceTitle(y.palaceName)}同時是流年命宮和小限）`
          : `${tr(yp.domain)}（流年命宮在${palaceTitle(y.palaceName)}），以及${tr(xp.domain)}（小限在${palaceTitle(y.xiaoxianName)}）`
        : y.palaceName === y.xiaoxianName
          ? `${yp.domain} (your ⟨${y.palaceName}⟩ palace is both the year palace and the age palace)`
          : `${yp.domain} (year palace ⟨${y.palaceName}⟩), and ${xp.domain} (age palace ⟨${y.xiaoxianName}⟩)`,
    ),
  );
  const muts = stemMutagens(y.stem, c.mutOverrides);
  if (muts) {
    const at = (star: string) => {
      const i = x.find(star);
      if (isZh()) return i < 0 ? '不在命盤中' : `本命${palaceTitle(c.palaces[i].name)}`;
      return i < 0 ? 'not in the chart' : `your ⟨${c.palaces[i].name}⟩ palace (${PALACE_DOMAIN[c.palaces[i].name].en.toLowerCase()})`;
    };
    items.push(
      line(
        ui('Year 四化', '流年四化'),
        isZh()
          ? `⟨${muts[0]}⟩化祿為${at(muts[0])}帶來順利；⟨${muts[3]}⟩化忌提醒${at(muts[3])}要多用心。`
          : `⟨${muts[0]}⟩ 化祿 brings ease to ${at(muts[0])}; ⟨${muts[3]}⟩ 化忌 asks for care in ${at(muts[3])}.`,
      ),
    );
  }
  const r = reasons(y.scoreParts);
  const sep = isZh() ? '；' : '; ';
  if (r.good.length) items.push(line(ui('Going for you', '有利'), r.good.join(sep)));
  if (r.bad.length) items.push(line(ui('Watch', '留意'), r.bad.join(sep)));
  const zodiac = y.findings.find((f) => /\.zodiac\./.test(f.id));
  if (zodiac) items.push(line(ui('Zodiac', '生肖'), zodiac.text));
  const advice = y.findings.find((f) => f.advice);
  if (advice) {
    const t = advice.text.replace(/^(Advice: |建議：)/, '');
    items.push(line(ui('Advice', '建議'), t.charAt(0).toUpperCase() + t.slice(1)));
  }

  const more = h('button', 'link', ui('Read the full year →', '查看全年解讀 →'));
  more.type = 'button';
  more.addEventListener('click', openFull);

  root.replaceChildren(head, meta, ...items, more);
}
