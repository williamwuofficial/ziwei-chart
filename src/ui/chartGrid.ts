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
import { isZh } from '../i18n/lang';
import { tip, toScript, ui } from './zhText';
import { formatDate } from './dateInput';
import { BRANCH_ANIMAL, ELEMENT_COLOUR, ELEMENT_EN, JU_ELEMENT } from '../analysis/rules/elements';

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
  if (t && !isZh()) nameEl.title = t;
  line.append(nameEl);
  if (star.brightness && v.settings.showDetails) line.append(h('sup', 'bright', star.brightness));
  const kind = mutagenKind(star.mutagen);
  if (star.mutagen && kind) line.append(mutBadge(star.mutagen, ui(`Birth-year ${MUTAGEN_EN[kind]} (化${star.mutagen})`, `生年化${star.mutagen}`)));
  const dec = v.decade?.mutagens.get(star.name);
  if (dec) {
    const char = { lu: v.settings.script === 'zh-TW' ? '祿' : '禄', quan: v.settings.script === 'zh-TW' ? '權' : '权', ke: '科', ji: '忌' }[dec];
    line.append(mutBadge(char, ui(`10-year period ${MUTAGEN_EN[dec]}`, `大限化${char}`), 'dec'));
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
    if (p.majorStars.length === 0) major.append(h('span', 'empty', ui('No main star', '無主星')));
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
    if (!isZh()) pname.title = tip(p.name) ?? '';
    if (p.isBodyPalace) pname.append(zh(h('span', 'body-tag', '身'), settings.script));
    name.append(pname, zh(h('span', 'ganzhi', `${p.heavenlyStem}${p.earthlyBranch}`), settings.script));
    foot.append(left, name);

    cell.append(stars, foot);
    cell.setAttribute('aria-label', ui(`${p.name} palace, ${p.heavenlyStem}${p.earthlyBranch}, ages ${p.decadal.range.join(' to ')}`, `${p.name}宮，${p.heavenlyStem}${p.earthlyBranch}，${p.decadal.range.join('至')}歲`));
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

  row(ui('Gender', '性別'), v.gender === 'male' ? ui('Male', '男') : ui('Female', '女'));
  if (birth.utcOffsetMin !== undefined) {
    const off = birth.utcOffsetMin;
    const sign = off >= 0 ? '+' : '−';
    const abs = Math.abs(off);
    row(ui('Clock time', '國曆鐘錶時間'), `${formatDate(fmtDate(birth.clock))} ${fmtTime(birth.clock)} (UTC${sign}${Math.floor(abs / 60)}${abs % 60 ? ':' + String(abs % 60).padStart(2, '0') : ''})`);
  } else {
    row(ui('Date', '國曆日期'), formatDate(fmtDate(birth.clock)));
  }
  if (v.place) row(ui('Place', '出生地'), placeLabel(v.place));
  if (birth.solar) {
    const shift = birth.solarShiftMin;
    const note = shift === undefined ? ui('neighbouring 時辰', '相鄰時辰') : ui(`${shift >= 0 ? '+' : '−'}${Math.abs(shift)} min`, `${shift >= 0 ? '+' : '−'}${Math.abs(shift)}分鐘`);
    row(ui('True solar time', '真太陽時'), `${formatDate(fmtDate(birth.solar))} ${fmtTime(birth.solar)} (${toScript(note, settings.script)})`);
  }
  const hour = h('span');
  hour.append(zhText(chart.time), ` ${SHICHEN[birth.timeIndex].range}`);
  row(ui('Birth hour', '出生時辰'), hour);
  const ld = chart.rawDates.lunarDate;
  const lateZi = birth.timeIndex === 12 && settings.dayDivide === 'forward' ? ui(' (late 子 hour: stars are placed on the next day)', '（晚子時：星曜按次日安放）') : '';
  row(
    ui('Lunar date', '農曆'),
    ui(`Year ${ld.lunarYear}, ${ld.isLeap ? 'leap ' : ''}month ${ld.lunarMonth}, day ${ld.lunarDay}${lateZi}`, `${ld.lunarYear}年${ld.isLeap ? '閏' : ''}${ld.lunarMonth}月${ld.lunarDay}日${lateZi}`),
  );
  row(ui('Four pillars', '四柱'), zhText(chart.chineseDate));
  const yb = chart.chineseDate.split(' ')[0]?.[1] ?? '';
  const animal = BRANCH_ANIMAL[yb];
  if (animal) {
    const z = h('span');
    z.append(zhText(`${yb} ${animal.zh}`));
    if (!isZh()) z.append(` ${animal.en}`);
    row(ui('Zodiac', '生肖'), z);
  }
  const fe = h('span');
  fe.append(zhText(chart.fiveElementsClass));
  if (!isZh()) fe.append(` ${FIVE_ELEMENT_EN[chart.fiveElementsClass] ?? ''}`);
  const jel = JU_ELEMENT[chart.fiveElementsClass];
  if (jel) {
    const sw = h('span', 'swatch');
    sw.style.background = ELEMENT_COLOUR[jel].css;
    sw.title = ui(`Traditional colour of ${ELEMENT_EN[jel].toLowerCase()}: ${ELEMENT_COLOUR[jel].en}`, `${jel}的傳統顏色：${ELEMENT_COLOUR[jel].zh}`);
    fe.append(' ', sw);
  }
  row(ui('Element class', '五行局'), fe);
  const rulers = h('span');
  rulers.append(ui('Life ', '命主'), zhText(chart.soul), ui(' · Body ', '・身主'), zhText(chart.body));
  row(ui('Rulers', '命主身主'), rulers);
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
    btn(ui('Natal only', '只看本命'), !v.decade, undefined),
    ...order.map((d) => btn(`${d.from}–${d.to}`, v.decade?.palaceIndex === d.i, d.i, d.name)),
  );
}
