import './style.css';
import { buildChart, decadeOverlay } from './engine/chart';
import { fmtDate, fmtTime, resolveExact, SHICHEN, timeIndexFor, type LocalDateTime, type ResolvedBirth } from './input/solarTime';
import { drawLines, renderChart, renderDecades, type ChartView } from './ui/chartGrid';
import { setupForm, type BirthInput } from './ui/form';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('birth-form');
const result = $<HTMLElement>('result');
const grid = $<HTMLElement>('chart');
const lines = document.getElementById('chart-lines') as unknown as SVGSVGElement;
const decadeList = $<HTMLElement>('decade-list');
const warning = $<HTMLElement>('boundary-warning');

let view: ChartView | undefined;

function resolve(input: BirthInput): ResolvedBirth {
  const [year, month, day] = input.date.split('-').map(Number);
  if (input.timeMode === 'exact' && input.time && input.place) {
    const [hour, minute] = input.time.split(':').map(Number);
    return resolveExact({ year, month, day, hour, minute }, input.place, input.settings.useSolar);
  }
  const idx = input.shichen ?? 0;
  return { dateStr: input.date, timeIndex: idx, clock: { year, month, day, hour: 0, minute: 0 } };
}

/** The chart on the other side of the nearest 時辰 boundary. */
function neighbour(b: ResolvedBirth): { dateStr: string; timeIndex: number; at: LocalDateTime } {
  const t = b.solar ?? b.clock;
  const ms = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute);
  const pastBoundary = t.hour % 2 === 1 && t.minute < 30; // e.g. 11:04 has just crossed 11:00
  const shift = ((b.nearBoundaryMin ?? 0) + 1) * 60_000 * (pastBoundary ? -1 : 1);
  const d = new Date(ms + shift);
  const at = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
  return { dateStr: fmtDate(at), timeIndex: timeIndexFor(at.hour), at };
}

function show(input: BirthInput, birth: ResolvedBirth): void {
  const chart = buildChart(birth.dateStr, birth.timeIndex, input.gender, input.settings);
  view = { chart, birth, gender: input.gender, place: input.place, settings: input.settings };
  document.documentElement.dataset.script = input.settings.script;
  result.hidden = false;
  draw();
}

function draw(): void {
  if (!view) return;
  renderChart(grid, view, (i) => {
    view!.selected = view!.selected === i ? undefined : i;
    draw();
  });
  renderDecades(decadeList, view, (i) => {
    view!.decade = i === undefined ? undefined : decadeOverlay(view!.chart, i, view!.birth.timeIndex);
    draw();
  });
  drawLines(lines, grid, view.selected);
}

function showWarning(input: BirthInput, birth: ResolvedBirth): void {
  if (birth.nearBoundaryMin === undefined) {
    warning.hidden = true;
    return;
  }
  const t = birth.solar ?? birth.clock;
  const n = neighbour(birth);
  warning.hidden = false;
  warning.replaceChildren();
  const p = document.createElement('p');
  p.append(
    `The ${birth.solar ? 'true solar' : 'clock'} time ${fmtTime(t)} is ${birth.nearBoundaryMin} min from a 時辰 boundary. `,
    'A small error in the recorded time would give a different chart. ',
  );
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'link';
  let showingAlt = false;
  const label = () =>
    (btn.textContent = showingAlt
      ? `Back to ${SHICHEN[birth.timeIndex].zh}時 (${fmtTime(t)})`
      : `View the ${SHICHEN[n.timeIndex].zh}時 chart instead`);
  label();
  btn.addEventListener('click', () => {
    showingAlt = !showingAlt;
    const alt: ResolvedBirth = showingAlt ? { ...birth, dateStr: n.dateStr, timeIndex: n.timeIndex, solar: birth.solar ? n.at : undefined, solarShiftMin: undefined } : birth;
    show(input, alt);
    label();
  });
  p.append(btn);
  warning.append(p);
}

const formApi = setupForm(form, (input, auto) => {
  const birth = resolve(input);
  show(input, birth);
  showWarning(input, birth);
  if (!auto) result.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

new ResizeObserver(() => view && drawLines(lines, grid, view.selected)).observe(grid);
formApi.submitIfReady();
