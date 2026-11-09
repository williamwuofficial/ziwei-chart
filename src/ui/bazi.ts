// Four Pillars (八字) card: the pillars table with Ten Gods and hidden stems, element counts, and the
// cited readings.

import { BRANCH_EL, CYCLE, elementRole, PILLAR_LABEL, ROLE, STEM_EL, TEN_GOD, type BaziReading } from '../analysis/bazi';
import { ELEMENT_COLOUR, ELEMENT_EN, type Element } from '../analysis/rules/elements';
import type { Script } from '../engine/chart';
import { finding } from './analysis';
import { rich, toScript } from './zhText';

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const zh = (text: string, script: Script, cls = 'zh') => {
  const s = h('span', cls, toScript(text, script));
  s.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
  return s;
};

const elCls = (e: Element) => `el-${ELEMENT_EN[e].toLowerCase()}`;
const EL_INK: Record<Element, string> = { 木: '#2e8b57', 火: '#d2402f', 土: '#b8860b', 金: '#8a8f98', 水: '#3a6fd8' };

const SVG = 'http://www.w3.org/2000/svg';
const svg = <K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) => {
  const e = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

/**
 * The five elements on a pentagon in generating order (木 top, then clockwise). Solid discs grow with
 * the visible count, dashed rings with the count including hidden stems. Arrows round the edge are
 * 相生 (feeds); the inner star is 相剋 (checks). Each node is labelled with its role to the Day Master.
 */
function pentagon(r: BaziReading, script: Script): SVGSVGElement {
  const W = 420;
  const H = 340;
  const cx = W / 2;
  const cy = 172;
  const R = 112;
  const dmEl = STEM_EL[r.dayMaster];
  const pos = CYCLE.map((e, i) => {
    const a = ((-90 + i * 72) * Math.PI) / 180;
    return { e, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), ux: Math.cos(a), uy: Math.sin(a) };
  });
  const disc = (e: Element) => 14 + 3.2 * r.counts[e];
  const ring = (e: Element) => 14 + 3.2 * r.countsHidden[e];
  const root = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pentagon', role: 'img' });
  root.setAttribute(
    'aria-label',
    `Five-element pentagon. ${CYCLE.map((e) => `${ELEMENT_EN[e]} ${r.counts[e]} visible, ${r.countsHidden[e]} with hidden stems, ${ROLE[elementRole(dmEl, e)].en}`).join('; ')}.`,
  );
  const defs = svg('defs', {});
  for (const [id, cls] of [['pg-gen', 'gen'], ['pg-ctl', 'ctl']]) {
    const m = svg('marker', { id, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    m.append(svg('path', { d: 'M0,0 L10,5 L0,10 z', class: `arrowhead ${cls}` }));
    defs.append(m);
  }
  root.append(defs);

  const link = (i: number, j: number, cls: 'gen' | 'ctl') => {
    const a = pos[i];
    const b = pos[j];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const ra = Math.max(disc(a.e), ring(a.e)) + 5;
    const rb = Math.max(disc(b.e), ring(b.e)) + 7;
    if (ra + rb >= len - 6) return;
    root.append(svg('line', { x1: a.x + (dx / len) * ra, y1: a.y + (dy / len) * ra, x2: b.x - (dx / len) * rb, y2: b.y - (dy / len) * rb, class: `pg-${cls}`, 'marker-end': `url(#pg-${cls})` }));
  };
  for (let i = 0; i < 5; i++) link(i, (i + 2) % 5, 'ctl');
  for (let i = 0; i < 5; i++) link(i, (i + 1) % 5, 'gen');

  for (const p of pos) {
    const g = svg('g', { class: `pg-node${p.e === dmEl ? ' dm' : ''}` });
    const ink = EL_INK[p.e];
    if (r.countsHidden[p.e] > r.counts[p.e]) g.append(svg('circle', { cx: p.x, cy: p.y, r: ring(p.e), class: 'pg-ring', style: `stroke:${ink}` }));
    g.append(svg('circle', { cx: p.x, cy: p.y, r: disc(p.e), class: `pg-disc${r.counts[p.e] ? '' : ' zero'}`, style: `fill:${ink};stroke:${ink}` }));
    if (p.e === dmEl) g.append(svg('circle', { cx: p.x, cy: p.y, r: Math.max(disc(p.e), ring(p.e)) + 4, class: 'pg-dm' }));
    const t = svg('text', { x: p.x, y: p.y + 1, class: 'pg-zh', 'dominant-baseline': 'middle', 'text-anchor': 'middle' });
    t.textContent = toScript(p.e, script);
    g.append(t);
    // Label outside the node, away from the centre.
    const off = Math.max(disc(p.e), ring(p.e)) + 12;
    const lx = p.x + p.ux * off;
    const ly = p.y + p.uy * off;
    const anchor = Math.abs(p.ux) < 0.3 ? 'middle' : p.ux > 0 ? 'start' : 'end';
    const dy = p.uy < -0.5 ? -18 : p.uy > 0.5 ? 6 : -6;
    const role = ROLE[elementRole(dmEl, p.e)];
    const l1 = svg('text', { x: lx, y: ly + dy, class: 'pg-label', 'text-anchor': anchor });
    l1.textContent = `${ELEMENT_EN[p.e]} ${r.counts[p.e]}${r.countsHidden[p.e] > r.counts[p.e] ? ` (+${r.countsHidden[p.e] - r.counts[p.e]})` : ''}`;
    const l2 = svg('text', { x: lx, y: ly + dy + 14, class: `pg-role${p.e === dmEl ? ' dm' : ''}`, 'text-anchor': anchor });
    l2.textContent = p.e === dmEl ? `Day Master · ${toScript(role.zh, script)}` : `${role.en} · ${toScript(role.zh, script)}`;
    g.append(l1, l2);
    root.append(g);
  }
  return root;
}

export interface BaziNotes {
  /** Set when the birth is within a day of a solar term (節氣), where the month pillar may change. */
  nearTerm?: string;
  lateZi: boolean;
}

export function renderBazi(root: HTMLElement, r: BaziReading, script: Script, notes: BaziNotes): void {
  const head = h('h2', undefined, 'Four Pillars');
  head.append(zh(' 八字', script));
  const intro = h('p', 'hint');
  intro.append(
    rich(
      '八字 is a separate system from 紫微斗數, built from the same birth moment: four pillars of a heavenly stem over an earthly branch. It is read from the day stem, the Day Master (日主). Months follow the solar terms (節氣) and the year starts at 立春.',
      script,
    ),
  );

  const table = h('table', 'pillars');
  const thead = h('thead');
  const hr = h('tr');
  hr.append(h('th'));
  for (const p of r.pillars) {
    const th = h('th');
    th.scope = 'col';
    th.append(PILLAR_LABEL[p.key].en, ' ', zh(PILLAR_LABEL[p.key].zh, script, 'zh small'));
    hr.append(th);
  }
  thead.append(hr);
  const body = h('tbody');
  const row = (label: string, cell: (p: BaziReading['pillars'][number]) => Node | string) => {
    const tr = h('tr');
    const th = h('th');
    th.scope = 'row';
    th.textContent = label;
    tr.append(th);
    for (const p of r.pillars) {
      const td = h('td');
      td.append(cell(p));
      tr.append(td);
    }
    body.append(tr);
  };
  row('Ten God', (p) => {
    if (!p.god) {
      const s = h('span', 'god dm');
      s.append(zh('日主', script), ' Day Master');
      return s;
    }
    const s = h('span', 'god');
    s.title = TEN_GOD[p.god].text;
    s.append(zh(p.god, script), ` ${TEN_GOD[p.god].en}`);
    return s;
  });
  row('Stem', (p) => {
    const s = h('span', `char ${elCls(STEM_EL[p.stem])}`);
    s.append(zh(p.stem, script, 'zh big'), h('small', undefined, ELEMENT_EN[STEM_EL[p.stem]]));
    return s;
  });
  row('Branch', (p) => {
    const s = h('span', `char ${elCls(BRANCH_EL[p.branch])}`);
    s.append(zh(p.branch, script, 'zh big'), h('small', undefined, ELEMENT_EN[BRANCH_EL[p.branch]]));
    return s;
  });
  row('Hidden stems', (p) => {
    const ul = h('ul', 'hidden');
    for (const x of p.hidden) {
      const li = h('li', elCls(STEM_EL[x.stem]));
      li.title = `${TEN_GOD[x.god].en}: ${TEN_GOD[x.god].text}`;
      li.append(zh(x.stem, script), ' ', zh(x.god, script, 'zh small'));
      ul.append(li);
    }
    return ul;
  });
  table.append(thead, body);
  const wrap = h('div', 'pillars-wrap');
  wrap.append(table);

  // Element bars.
  const bars = h('div', 'el-bars');
  bars.setAttribute('aria-label', 'Element counts across the eight characters');
  const max = Math.max(...Object.values(r.countsHidden), 1);
  for (const e of ['木', '火', '土', '金', '水'] as Element[]) {
    const line = h('div', 'el-bar');
    const name = h('span', 'el-name');
    name.append(zh(e, script), ` ${ELEMENT_EN[e]}`);
    const track = h('span', 'track');
    const fill = h('span', 'fill');
    fill.style.width = `${(r.counts[e] / max) * 100}%`;
    fill.style.background = ELEMENT_COLOUR[e].css;
    // countsHidden counts the stems plus every hidden stem; the faded part is what it adds.
    const hid = h('span', 'fill hid');
    hid.style.width = `${(Math.max(0, r.countsHidden[e] - r.counts[e]) / max) * 100}%`;
    hid.style.background = ELEMENT_COLOUR[e].css;
    track.append(fill, hid);
    const stems = r.pillars.filter((p) => STEM_EL[p.stem] === e).length;
    line.append(name, track, h('span', 'n', `${r.counts[e]} · ${r.countsHidden[e] - stems} hidden`));
    bars.append(line);
  }
  const barHint = h('p', 'hint', 'Solid: the eight visible characters (each stem, and each branch by its main element). Faded: extra weight from the hidden stems.');

  // The Day Master leads; the rest fold into labelled groups with a one-line teaser.
  const byId = (id: string) => r.findings.find((f) => f.id === id)!;
  const fold = (title: string, teaser: string, ...content: Node[]) => {
    const d = h('details', 'fold');
    const sum = h('summary');
    sum.append(h('span', 'fold-title', title), ' ');
    const t = h('span', 'fold-teaser');
    t.append(rich(teaser, script));
    sum.append(t);
    d.append(sum, ...content);
    return d;
  };
  const els = ['木', '火', '土', '金', '水'] as Element[];
  const top = Math.max(...els.map((e) => r.counts[e]));
  const missing = els.filter((e) => r.counts[e] === 0);
  const gods = [...new Set(r.pillars.filter((p) => p.god).map((p) => p.god!))];
  const dayBranch = r.pillars.find((p) => p.key === 'day')!.branch;
  const sec = h('section', 'an-section');
  const fig = h('figure', 'pentagon-fig');
  const cap = h('figcaption', 'hint');
  cap.append(
    rich('Solid disc: the eight visible characters. Dashed ring: with hidden stems (the number in brackets). Outer arrows: feeds (相生). Inner star: checks (相剋). Labels give each element’s role to your Day Master.', script),
  );
  fig.append(pentagon(r, script), cap);
  sec.append(
    finding(byId('bazi.daymaster'), script),
    fig,
    finding(byId('bazi.cycle'), script),
    fold('Element balance', `most ${els.filter((e) => r.counts[e] === top).map((e) => ELEMENT_EN[e]).join(', ')}${missing.length ? ` · none visible: ${missing.map((e) => ELEMENT_EN[e]).join(', ')}` : ''}`, bars, barHint, finding(byId('bazi.elements'), script)),
    fold('Ten Gods', gods.map((g) => `⟨${g}⟩`).join(' '), finding(byId('bazi.tengods'), script)),
    fold('Spouse palace and star', `day branch ⟨${dayBranch}⟩`, finding(byId('bazi.spouse'), script)),
  );

  const warn: HTMLElement[] = [];
  if (notes.nearTerm) {
    const p = h('p', 'warn-inline');
    p.append(rich(notes.nearTerm, script));
    warn.push(p);
  }
  const lim = h('details', 'bazi-limits');
  lim.append(h('summary', undefined, 'What this 八字 section leaves out'));
  const ul = h('ul');
  for (const t of [
    'Strength of the Day Master (身強/身弱) and its useful element (用神). The classics judge both, but schools disagree on how, so the app shows the counts and leaves the judgement out.',
    'The 10-year luck pillars (大運) and yearly readings. The 紫微斗數 periods above cover timing.',
    'Patterns (格局) and the many minor spirits (神煞). Several 紫微斗數 stars come from them: 天魁 and 天鉞 are the 天乙貴人, 天馬 is the 驛馬, 擎羊 is the 羊刃.',
    notes.lateZi
      ? 'Births from 23:00 count as the next day here (the Late 子 hour setting), which changes the day pillar. Schools disagree; the setting is under Advanced settings.'
      : 'Births from 23:00 count as the same day here (the Late 子 hour setting). Many 八字 practitioners count them as the next day; the setting is under Advanced settings.',
    'Exact solar-term times. The month pillar changes at a solar term (節氣) to the minute; within a day of one, check the time.',
  ]) {
    const li = h('li');
    li.append(rich(t, script));
    ul.append(li);
  }
  lim.append(ul);

  root.replaceChildren(head, intro, ...warn, wrap, sec, lim);
}
