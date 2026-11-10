// Four Pillars (八字) card: the pillars table with Ten Gods and hidden stems, element counts, and the
// cited readings.

import { BRANCH_EL, CYCLE, elementRole, PILLAR_LABEL, ROLE, STEM_EL, TEN_GOD, type BaziReading } from '../analysis/bazi';
import { ELEMENT_COLOUR, ELEMENT_EN, type Element } from '../analysis/rules/elements';
import type { Script } from '../engine/chart';
import { finding } from './analysis';
import { isZh, tr } from '../i18n/lang';
import { rich, toScript, ui } from './zhText';

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
    ui(
      `Five-element pentagon. ${CYCLE.map((e) => `${ELEMENT_EN[e]} ${r.counts[e]} visible, ${r.countsHidden[e]} with hidden stems, ${ROLE[elementRole(dmEl, e)].en}`).join('; ')}.`,
      `五行圖。${CYCLE.map((e) => `${e}：明面${r.counts[e]}個，連藏干${r.countsHidden[e]}個，${ROLE[elementRole(dmEl, e)].zh}`).join('；')}。`,
    ),
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
    l1.textContent = `${isZh() ? toScript(p.e, script) : ELEMENT_EN[p.e]} ${r.counts[p.e]}${r.countsHidden[p.e] > r.counts[p.e] ? ` (+${r.countsHidden[p.e] - r.counts[p.e]})` : ''}`;
    const l2 = svg('text', { x: lx, y: ly + dy + 14, class: `pg-role${p.e === dmEl ? ' dm' : ''}`, 'text-anchor': anchor });
    l2.textContent = isZh() ? (p.e === dmEl ? `日主・${toScript(role.zh, script)}` : toScript(role.zh, script)) : p.e === dmEl ? `Day Master · ${toScript(role.zh, script)}` : `${role.en} · ${toScript(role.zh, script)}`;
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
  const head = h('h2', undefined, ui('Four Pillars', ''));
  head.append(zh(isZh() ? '八字' : ' 八字', script));
  const intro = h('p', 'hint');
  intro.append(
    rich(
      ui(
        '八字 is a separate system from 紫微斗數, built from the same birth moment: four pillars of a heavenly stem over an earthly branch. It is read from the day stem, the Day Master (日主). Months follow the solar terms (節氣) and the year starts at 立春.',
        '八字是與紫微斗數不同的另一套系統，用同一個出生時刻排出：四柱，每柱上為天干、下為地支。以日干，也就是日主為中心來解讀。月份依節氣劃分，年份從立春起算。',
      ),
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
    if (isZh()) th.append(zh(PILLAR_LABEL[p.key].zh, script));
    else th.append(PILLAR_LABEL[p.key].en, ' ', zh(PILLAR_LABEL[p.key].zh, script, 'zh small'));
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
  const elName = (e: Element) => (isZh() ? toScript(e, script) : ELEMENT_EN[e]);
  row(ui('Ten God', '十神'), (p) => {
    if (!p.god) {
      const s = h('span', 'god dm');
      s.append(zh('日主', script));
      if (!isZh()) s.append(' Day Master');
      return s;
    }
    const s = h('span', 'god');
    s.title = toScript(tr(TEN_GOD[p.god].text), script);
    s.append(zh(p.god, script));
    if (!isZh()) s.append(` ${TEN_GOD[p.god].en}`);
    return s;
  });
  row(ui('Stem', '天干'), (p) => {
    const s = h('span', `char ${elCls(STEM_EL[p.stem])}`);
    s.append(zh(p.stem, script, 'zh big'), h('small', undefined, elName(STEM_EL[p.stem])));
    return s;
  });
  row(ui('Branch', '地支'), (p) => {
    const s = h('span', `char ${elCls(BRANCH_EL[p.branch])}`);
    s.append(zh(p.branch, script, 'zh big'), h('small', undefined, elName(BRANCH_EL[p.branch])));
    return s;
  });
  row(ui('Hidden stems', '藏干'), (p) => {
    const ul = h('ul', 'hidden');
    for (const x of p.hidden) {
      const li = h('li', elCls(STEM_EL[x.stem]));
      li.title = isZh() ? toScript(tr(TEN_GOD[x.god].text), script) : `${TEN_GOD[x.god].en}: ${TEN_GOD[x.god].text}`;
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
  bars.setAttribute('aria-label', ui('Element counts across the eight characters', '八字的五行數量'));
  const max = Math.max(...Object.values(r.countsHidden), 1);
  for (const e of ['木', '火', '土', '金', '水'] as Element[]) {
    const line = h('div', 'el-bar');
    const name = h('span', 'el-name');
    name.append(zh(e, script));
    if (!isZh()) name.append(` ${ELEMENT_EN[e]}`);
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
    line.append(name, track, h('span', 'n', ui(`${r.counts[e]} · ${r.countsHidden[e] - stems} hidden`, `${r.counts[e]}・藏${r.countsHidden[e] - stems}`)));
    bars.append(line);
  }
  const barHint = h('p', 'hint', ui('Solid: the eight visible characters (each stem, and each branch by its main element). Faded: extra weight from the hidden stems.', '實色：明面的八個字（每個天干，以及每個地支的本氣）。淡色：藏干額外增加的分量。'));

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
    rich(
      ui(
        'Solid disc: the eight visible characters. Dashed ring: with hidden stems (the number in brackets). Outer arrows: feeds (相生). Inner star: checks (相剋). Labels give each element’s role to your Day Master.',
        '實心圓：明面的八個字。虛線圈：連藏干（括號內的數字）。外圈箭頭：相生。內部星形：相剋。標籤顯示每一行對你日主的角色。',
      ),
      script,
    ),
  );
  fig.append(pentagon(r, script), cap);
  sec.append(
    finding(byId('bazi.daymaster'), script),
    fig,
    finding(byId('bazi.cycle'), script),
    fold(
      ui('Element balance', '五行分布'),
      isZh()
        ? `最多：${els.filter((e) => r.counts[e] === top).join('、')}${missing.length ? `・明面缺：${missing.join('、')}` : ''}`
        : `most ${els.filter((e) => r.counts[e] === top).map((e) => ELEMENT_EN[e]).join(', ')}${missing.length ? ` · none visible: ${missing.map((e) => ELEMENT_EN[e]).join(', ')}` : ''}`,
      bars,
      barHint,
      finding(byId('bazi.elements'), script),
    ),
    fold(ui('Ten Gods', '十神'), gods.map((g) => `⟨${g}⟩`).join(' '), finding(byId('bazi.tengods'), script)),
    fold(ui('Spouse palace and star', '夫妻宮與配偶星'), isZh() ? `日支⟨${dayBranch}⟩` : `day branch ⟨${dayBranch}⟩`, finding(byId('bazi.spouse'), script)),
  );

  const warn: HTMLElement[] = [];
  if (notes.nearTerm) {
    const p = h('p', 'warn-inline');
    p.append(rich(notes.nearTerm, script));
    warn.push(p);
  }
  const lim = h('details', 'bazi-limits');
  lim.append(h('summary', undefined, ui('What this 八字 section leaves out', '本八字部分沒有涵蓋的內容')));
  const ul = h('ul');
  for (const t of [
    ui(
      'Strength of the Day Master (身強/身弱) and its useful element (用神). The classics judge both, but schools disagree on how, so the app shows the counts and leaves the judgement out.',
      '日主強弱（身強／身弱）和用神。古書兩者都要判斷，但各派做法不同，所以本工具只列出數量，不作判斷。',
    ),
    ui('The 10-year luck pillars (大運) and yearly readings. The 紫微斗數 periods above cover timing.', '大運和流年。運勢的時間由前面的紫微斗數大限來看。'),
    ui(
      'Patterns (格局) and the many minor spirits (神煞). Several 紫微斗數 stars come from them: 天魁 and 天鉞 are the 天乙貴人, 天馬 is the 驛馬, 擎羊 is the 羊刃.',
      '格局和眾多神煞。紫微斗數有幾顆星就源自神煞：天魁、天鉞即天乙貴人，天馬即驛馬，擎羊即羊刃。',
    ),
    notes.lateZi
      ? ui(
          'Births from 23:00 count as the next day here (the Late 子 hour setting), which changes the day pillar. Schools disagree; the setting is under Advanced settings.',
          '這裡23:00以後出生算作次日（晚子時設定），日柱因此改變。各派看法不一；可在進階設定中更改。',
        )
      : ui(
          'Births from 23:00 count as the same day here (the Late 子 hour setting). Many 八字 practitioners count them as the next day; the setting is under Advanced settings.',
          '這裡23:00以後出生算作當日（晚子時設定）。很多八字命理師算作次日；可在進階設定中更改。',
        ),
    ui('Exact solar-term times. The month pillar changes at a solar term (節氣) to the minute; within a day of one, check the time.', '節氣的精確時刻。月柱在節氣交接的那一分鐘改變；出生在節氣前後一天內，請核對時間。'),
  ]) {
    const li = h('li');
    li.append(rich(t, script));
    ul.append(li);
  }
  lim.append(ul);

  root.replaceChildren(head, intro, ...warn, wrap, sec, lim);
}
