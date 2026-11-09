import './style.css';
import { buildChart, decadeOverlay, SIHUA_LABEL, SIHUA_TABLES } from './engine/chart';
import { fmtDate, fmtTime, resolveExact, SHICHEN, timeIndexFor, type LocalDateTime, type ResolvedBirth } from './input/solarTime';
import { drawLines, renderChart, renderDecades, type ChartView } from './ui/chartGrid';
import { setupForm, storeSetting, type BirthInput } from './ui/form';
import { analyse } from './analysis/evaluate';
import { readDecades } from './analysis/decades';
import { readYears } from './analysis/years';
import { toModel } from './analysis/model';
import { renderAnalysis, showDecade } from './ui/analysis';
import { toScript } from './ui/zhText';
import { renderCompat } from './ui/compat';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('birth-form');
const result = $<HTMLElement>('result');
const grid = $<HTMLElement>('chart');
const lines = document.getElementById('chart-lines') as unknown as SVGSVGElement;
const decadeList = $<HTMLElement>('decade-list');
const warning = $<HTMLElement>('boundary-warning');
const notices = $<HTMLElement>('chart-notices');
const analysisRoot = $<HTMLElement>('analysis');
const compatRoot = $<HTMLElement>('compat');
const chartCard = document.querySelector<HTMLElement>('.chart-card')!;

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
  showNotices(input, birth, chart);
  document.documentElement.dataset.script = input.settings.script;
  // The static legend is written in Traditional; convert it for Simplified display.
  const legend = document.querySelector<HTMLElement>('.legend')!;
  legend.dataset.orig ??= legend.innerHTML;
  legend.innerHTML = toScript(legend.dataset.orig, input.settings.script);
  result.hidden = false;
  draw();
  // Rules are written against Traditional names, so analyse a zh-TW build of the same chart.
  const trad = input.settings.script === 'zh-TW' ? chart : buildChart(birth.dateStr, birth.timeIndex, input.gender, { ...input.settings, script: 'zh-TW' });
  const model = toModel(trad, input.gender, birth.timeIndex, {
    overrides: SIHUA_TABLES[input.settings.sihua],
    label: SIHUA_LABEL[input.settings.sihua],
  });
  const analysis = analyse(model);
  let nowAge: number | undefined;
  try {
    nowAge = chart.horoscope(new Date(), birth.timeIndex).age.nominalAge;
  } catch {
    nowAge = undefined;
  }
  const focusChart = () => chartCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  renderAnalysis(
    analysisRoot,
    analysis,
    input.settings.script,
    (palaces) => {
      if (!view) return;
      view.selected = undefined;
      view.highlight = palaces;
      draw();
      focusChart();
    },
    {
      decades: readDecades(model),
      years: (i) => readYears(model, i),
      nowAge: nowAge !== undefined && nowAge > 0 ? nowAge : undefined,
      onPick: (i) => {
        if (!view) return;
        view.decade = decadeOverlay(view.chart, i, view.birth.timeIndex);
        view.highlight = undefined;
        draw();
        focusChart();
      },
    },
  );
  const sihua = { overrides: SIHUA_TABLES[input.settings.sihua], label: SIHUA_LABEL[input.settings.sihua] };
  renderCompat(
    compatRoot,
    model,
    (p) => toModel(buildChart(p.date, p.timeIndex, p.gender, { ...input.settings, script: 'zh-TW' }), p.gender, p.timeIndex, sihua),
    input.settings.script,
  );
}

const detailsToggle = $<HTMLInputElement>('details-toggle');
detailsToggle.addEventListener('change', () => {
  if (!view) return;
  view.settings = { ...view.settings, showDetails: detailsToggle.checked };
  form.querySelector<HTMLInputElement>('input[name="showDetails"]')!.checked = detailsToggle.checked;
  storeSetting('showDetails', detailsToggle.checked);
  draw();
});

/** Change one Advanced setting in the form and recalculate. */
function switchSetting(name: string, value: string): void {
  const sel = form.querySelector<HTMLSelectElement>(`select[name="${name}"]`)!;
  sel.value = value;
  form.requestSubmit();
}

/**
 * Notes for births where a disputed rule actually changes the chart: births between Lunar New Year
 * and 立春, and leap-month births. Each compares the chart with the alternative setting.
 */
function showNotices(input: BirthInput, birth: ResolvedBirth, chart: ReturnType<typeof buildChart>): void {
  const items: HTMLElement[] = [];
  const s = input.settings;
  const signature = (c: ReturnType<typeof buildChart>) =>
    c.chineseDate + c.palaces.map((p) => p.name + p.majorStars.map((x) => x.name).join('')).join('|');
  const note = (text: string, label: string, act: () => void) => {
    const p = document.createElement('p');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'link';
    btn.textContent = label;
    btn.addEventListener('click', act);
    p.append(toScript(text, s.script), ' ', btn);
    items.push(p);
  };

  const otherYear = s.yearDivide === 'normal' ? 'exact' : 'normal';
  const altYear = buildChart(birth.dateStr, birth.timeIndex, input.gender, { ...s, yearDivide: otherYear });
  const yp = chart.chineseDate.split(' ')[0];
  const ayp = altYear.chineseDate.split(' ')[0];
  if (yp !== ayp) {
    const name = (d: string) => (d === 'normal' ? 'Lunar New Year' : '立春');
    note(
      `Born between Lunar New Year and 立春: counting the year from ${name(s.yearDivide)} gives a ${yp} year, but counting from ${name(otherYear)} gives ${ayp}. This changes the chart.`,
      `Use ${name(otherYear)} instead`,
      () => switchSetting('yearDivide', otherYear),
    );
  }

  const ld = chart.rawDates.lunarDate;
  if (ld.isLeap) {
    const altLeap = buildChart(birth.dateStr, birth.timeIndex, input.gender, { ...s, fixLeap: !s.fixLeap });
    if (signature(altLeap) !== signature(chart)) {
      note(
        `Born in a leap month (閏${ld.lunarMonth}月, day ${ld.lunarDay}). Schools differ here: this chart ${s.fixLeap ? 'splits the leap month at the 15th, so it counts as the next month' : 'counts the whole leap month as the previous month'}, and the other reading gives a different chart.`,
        s.fixLeap ? 'Count it as the previous month instead' : 'Split at the 15th instead',
        () => switchSetting('fixLeap', String(!s.fixLeap)),
      );
    }
  }

  notices.hidden = items.length === 0;
  notices.replaceChildren(...items);
}

function draw(): void {
  if (!view) return;
  detailsToggle.checked = view.settings.showDetails;
  document.querySelectorAll<HTMLElement>('.legend-detail').forEach((e) => (e.hidden = !view!.settings.showDetails));
  renderChart(grid, view, (i) => {
    view!.selected = view!.selected === i ? undefined : i;
    view!.highlight = undefined;
    draw();
  });
  renderDecades(decadeList, view, (i) => {
    view!.decade = i === undefined ? undefined : decadeOverlay(view!.chart, i, view!.birth.timeIndex);
    // Keep the written reading on the same period as the chart.
    if (i !== undefined) showDecade(i);
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

// --- Export -------------------------------------------------------------------------------
const saveBtn = $<HTMLButtonElement>('save-png');
saveBtn.addEventListener('click', async () => {
  if (!view) return;
  const label = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving…';
  try {
    // Loaded on demand so the main bundle stays smaller.
    const { toPng } = await import('html-to-image');
    const node = document.querySelector<HTMLElement>('.chart-wrap')!;
    const bg = getComputedStyle(document.body).backgroundColor;
    // Render at a fixed desktop width so phone exports are not cramped. The ResizeObserver
    // redraws the 三方四正 lines for the new size before the capture.
    const prev = node.style.width;
    node.style.width = '900px';
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    drawLines(lines, grid, view.selected);
    let url: string;
    try {
      url = await toPng(node, { pixelRatio: 2, backgroundColor: bg, cacheBust: true });
    } finally {
      node.style.width = prev;
      drawLines(lines, grid, view.selected);
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = `ziwei-chart-${view.birth.dateStr}.png`;
    a.click();
  } catch (err) {
    alert(`Could not create the image: ${String(err)}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = label;
  }
});
$<HTMLButtonElement>('print-page').addEventListener('click', () => {
  // Open every reading so the printout is complete, then restore.
  const closed = [...document.querySelectorAll<HTMLDetailsElement>('#analysis details:not([open])')].filter((d) => !d.classList.contains('why'));
  closed.forEach((d) => (d.open = true));
  window.print();
  closed.forEach((d) => (d.open = false));
});

// --- Offline -------------------------------------------------------------------------------
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {
    /* offline support is optional */
  });
}
