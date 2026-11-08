import {
  FIVE_ELEMENT_EN,
  MUTAGEN_EN,
  mutagenKind,
  sanFangSiZheng,
  type Astrolabe,
  type DecadeOverlay,
  type Settings,
} from '../engine/chart';
import { fmtDate, fmtTime, SHICHEN, type ResolvedBirth } from '../input/solarTime';
import { placeLabel, type Place } from '../input/geocode';
import { tip } from './zhText';

// iztro palace index 0–11 = branches 寅卯辰巳午未申酉戌亥子丑. Grid (row, col) of each, 1-based,
// laid out the traditional way: 巳午未申 across the top, 寅丑子亥 across the bottom.
const GRID: [number, number][] = [
  [4, 1], [3, 1], [2, 1], [1, 1], [1, 2], [1, 3], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2],
];

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

const zh = (e: HTMLElement, script: Settings['script']) => {
  e.lang = script === 'zh-TW' ? 'zh-Hant' : 'zh-Hans';
  return e;
};

export interface ChartView {
  chart: Astrolabe;
  birth: ResolvedBirth;
  gender: 'male' | 'female';
  place?: Place;
  settings: Settings;
  decade?: DecadeOverlay;
  selected?: number;
  /** Palaces highlighted from the analysis ("Show on chart"). */
  highlight?: number[];
}

function mutBadge(zhChar: string, title: string, extra = ''): HTMLElement {
  const kind = mutagenKind(zhChar);
  const b = h('i', `mut ${kind ?? ''} ${extra}`.trim(), zhChar);
  b.title = title;
  return b;
}

function starLine(
  star: { name: string; brightness?: string; mutagen?: string },
  cls: string,
  v: ChartView,
): HTMLElement {
  const line = zh(h('span', `star ${cls}`), v.settings.script);
  const nameEl = h('span', 'star-name', star.name);
  const t = tip(star.name);
  if (t) nameEl.title = t;
  line.append(nameEl);
  if (star.brightness && v.settings.showDetails) line.append(h('sup', 'bright', star.brightness));
  const kind = mutagenKind(star.mutagen);
  if (star.mutagen && kind) line.append(mutBadge(star.mutagen, `Birth-year ${MUTAGEN_EN[kind]} (化${star.mutagen})`));
  const dec = v.decade?.mutagens.get(star.name);
  if (dec) {
    const char = { lu: v.settings.script === 'zh-TW' ? '祿' : '禄', quan: v.settings.script === 'zh-TW' ? '權' : '权', ke: '科', ji: '忌' }[dec];
    line.append(mutBadge(char, `10-year period ${MUTAGEN_EN[dec]}`, 'dec'));
  }
  return line;
}

export function renderChart(root: HTMLElement, v: ChartView, onSelect: (i: number) => void): void {
  const { chart, settings } = v;
  const cells: HTMLElement[] = [];
  const focus = v.selected !== undefined ? sanFangSiZheng(v.selected) : undefined;

  chart.palaces.forEach((p, i) => {
    const [row, col] = GRID[i];
    const cell = h('button', 'palace');
    cell.type = 'button';
    cell.style.gridRow = String(row);
    cell.style.gridColumn = String(col);
    cell.dataset.index = String(i);
    if (focus) {
      if (i === focus.self) cell.classList.add('sel');
      else if (focus.trines.includes(i) || i === focus.opposite) cell.classList.add('related');
      else cell.classList.add('dim');
    }
    if (v.highlight && !focus) cell.classList.add(v.highlight.includes(i) ? 'hl' : 'dim');
    if (v.decade?.palaceIndex === i) cell.classList.add('decade-ming');

    const stars = h('div', 'stars');
    const major = h('div', 'major');
    if (p.majorStars.length === 0) major.append(h('span', 'empty', 'No main star'));
    for (const s of p.majorStars) major.append(starLine(s, 'major-star', v));
    const minor = h('div', 'minor');
    for (const s of p.minorStars) minor.append(starLine(s, `minor-star ${s.type}`, v));
    stars.append(major, minor);
    if (settings.showDetails && p.adjectiveStars.length) {
      const adj = zh(h('div', 'adjective'), settings.script);
      adj.textContent = p.adjectiveStars.map((s) => s.name).join(' ');
      stars.append(adj);
    }

    const foot = h('div', 'palace-foot');
    const left = h('div', 'foot-left');
    left.append(h('span', 'ages', `${p.decadal.range[0]}–${p.decadal.range[1]}`));
    if (settings.showDetails) left.append(zh(h('span', 'cs12', `${p.changsheng12}`), settings.script));
    const name = h('div', 'foot-right');
    if (v.decade) name.append(zh(h('span', 'decade-name', `大${v.decade.palaceNames[i].replace(/宮|宫/, '')}`), settings.script));
    const pname = zh(h('span', 'palace-name', p.name), settings.script);
    pname.title = tip(p.name) ?? '';
    if (p.isBodyPalace) pname.append(zh(h('span', 'body-tag', '身'), settings.script));
    name.append(pname, zh(h('span', 'ganzhi', `${p.heavenlyStem}${p.earthlyBranch}`), settings.script));
    foot.append(left, name);

    cell.append(stars, foot);
    cell.setAttribute('aria-label', `${p.name} palace, ${p.heavenlyStem}${p.earthlyBranch}, ages ${p.decadal.range.join(' to ')}`);
    cell.setAttribute('aria-pressed', String(v.selected === i));
    cell.addEventListener('click', () => onSelect(i));
    cells.push(cell);
  });

  root.replaceChildren(...cells, centrePanel(v));
}

function centrePanel(v: ChartView): HTMLElement {
  const { chart, birth, settings } = v;
  const box = h('div', 'centre');
  const dl = h('dl');
  const row = (k: string, val: string | HTMLElement) => {
    dl.append(h('dt', undefined, k));
    const dd = h('dd');
    dd.append(val);
    dl.append(dd);
  };
  const zhText = (t: string) => zh(h('span', undefined, t), settings.script);

  row('Gender', v.gender === 'male' ? 'Male' : 'Female');
  if (birth.utcOffsetMin !== undefined) {
    const off = birth.utcOffsetMin;
    const sign = off >= 0 ? '+' : '−';
    const abs = Math.abs(off);
    row('Clock time', `${fmtDate(birth.clock)} ${fmtTime(birth.clock)} (UTC${sign}${Math.floor(abs / 60)}${abs % 60 ? ':' + String(abs % 60).padStart(2, '0') : ''})`);
  } else {
    row('Date', fmtDate(birth.clock));
  }
  if (v.place) row('Place', placeLabel(v.place));
  if (birth.solar) {
    const shift = birth.solarShiftMin;
    const note = shift === undefined ? 'neighbouring 時辰' : `${shift >= 0 ? '+' : '−'}${Math.abs(shift)} min`;
    row('True solar time', `${fmtDate(birth.solar)} ${fmtTime(birth.solar)} (${note})`);
  }
  const hour = h('span');
  hour.append(zhText(chart.time), ` ${SHICHEN[birth.timeIndex].range}`);
  row('Birth hour', hour);
  const ld = chart.rawDates.lunarDate;
  const lateZi = birth.timeIndex === 12 && settings.dayDivide === 'forward' ? ' (late 子 hour: stars are placed on the next day)' : '';
  row('Lunar date', `Year ${ld.lunarYear}, ${ld.isLeap ? 'leap ' : ''}month ${ld.lunarMonth}, day ${ld.lunarDay}${lateZi}`);
  row('Four pillars', zhText(chart.chineseDate));
  const fe = h('span');
  fe.append(zhText(chart.fiveElementsClass), ` ${FIVE_ELEMENT_EN[chart.fiveElementsClass] ?? ''}`);
  row('Element class', fe);
  const rulers = h('span');
  rulers.append('Life ', zhText(chart.soul), ' · Body ', zhText(chart.body));
  row('Rulers', rulers);
  box.append(dl);
  return box;
}

/** Draw the 三方四正 lines from the selected palace's cell centre. */
export function drawLines(svg: SVGSVGElement, grid: HTMLElement, selected: number | undefined): void {
  svg.replaceChildren();
  if (selected === undefined) return;
  const box = grid.getBoundingClientRect();
  svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
  const centre = (i: number) => {
    const r = grid.querySelector<HTMLElement>(`.palace[data-index="${i}"]`)!.getBoundingClientRect();
    // Pull each end towards the chart centre so the lines start at the inner edge of each cell.
    const cx = r.left + r.width / 2 - box.left;
    const cy = r.top + r.height / 2 - box.top;
    const mx = box.width / 2;
    const my = box.height / 2;
    const k = 0.62;
    return [mx + (cx - mx) * k, my + (cy - my) * k] as const;
  };
  const f = sanFangSiZheng(selected);
  const pts = [f.self, f.trines[0], f.trines[1]].map(centre);
  const ns = 'http://www.w3.org/2000/svg';
  const tri = document.createElementNS(ns, 'polygon');
  tri.setAttribute('points', pts.map((p) => p.join(',')).join(' '));
  tri.setAttribute('class', 'trine');
  // Presentation attributes inline (not only via CSS) so PNG export keeps them.
  const stroke = getComputedStyle(svg).getPropertyValue('--line').trim() || 'rgba(107,63,160,0.55)';
  tri.setAttribute('fill', 'none');
  tri.setAttribute('stroke', stroke);
  tri.setAttribute('stroke-width', '1.5');
  const opp = document.createElementNS(ns, 'line');
  const [a, b] = [centre(f.self), centre(f.opposite)];
  opp.setAttribute('x1', String(a[0]));
  opp.setAttribute('y1', String(a[1]));
  opp.setAttribute('x2', String(b[0]));
  opp.setAttribute('y2', String(b[1]));
  opp.setAttribute('class', 'opposite');
  opp.setAttribute('stroke', stroke);
  opp.setAttribute('stroke-width', '1.5');
  opp.setAttribute('stroke-dasharray', '5 4');
  svg.append(tri, opp);
}

export function renderDecades(root: HTMLElement, v: ChartView, onPick: (i: number | undefined) => void): void {
  const order = v.chart.palaces
    .map((p, i) => ({ i, from: p.decadal.range[0], to: p.decadal.range[1], name: p.name }))
    .sort((a, b) => a.from - b.from)
    .filter((d) => d.from <= 105);
  const btn = (label: string, pressed: boolean, idx: number | undefined, zhName?: string) => {
    const b = h('button', 'decade-btn', label);
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(pressed));
    if (zhName) b.append(zh(h('span', 'decade-palace', zhName), v.settings.script));
    b.addEventListener('click', () => onPick(idx));
    return b;
  };
  root.replaceChildren(
    btn('Natal only', !v.decade, undefined),
    ...order.map((d) => btn(`${d.from}–${d.to}`, v.decade?.palaceIndex === d.i, d.i, d.name)),
  );
}
