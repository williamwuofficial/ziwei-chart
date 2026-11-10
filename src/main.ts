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
import { toScript, ui } from './ui/zhText';
import { applyStatic, setupLang } from './ui/langSwitch';
import { L } from './i18n/lang';
import { renderCompat } from './ui/compat';
import { renderBazi } from './ui/bazi';
import { setupTabs, showTab } from './ui/tabs';
import { renderGlance } from './ui/glance';
import { parsePillars, readBazi, type Pillars } from './analysis/bazi';
import type { Settings } from './engine/chart';

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
const baziRoot = $<HTMLElement>('bazi');
const glanceRoot = $<HTMLElement>('glance');

/** 八字 pillars: the year from 立春 and months from the solar terms, whatever the 斗數 setting. */
function pillarsFor(date: string, timeIndex: number, gender: 'male' | 'female', s: Settings): Pillars {
  return parsePillars(buildChart(date, timeIndex, gender, { ...s, yearDivide: 'exact', script: 'zh-TW' }).chineseDate);
}
const shiftDate = (date: string, days: number) => new Date(Date.parse(`${date}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
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
  const decades = readDecades(model);
  const age = nowAge !== undefined && nowAge > 0 ? nowAge : undefined;
  const nowDecade = age === undefined ? undefined : decades.find((d) => age >= d.range[0] && age <= d.range[1]);
  const nowYear = nowDecade && readYears(model, nowDecade.index).find((y) => y.age === age);
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
      decades,
      years: (i) => readYears(model, i),
      nowAge: age,
      onPick: (i) => {
        if (!view) return;
        view.decade = decadeOverlay(view.chart, i, view.birth.timeIndex);
        view.highlight = undefined;
        draw();
        focusChart();
      },
    },
  );
  const pillars = pillarsFor(birth.dateStr, birth.timeIndex, input.gender, input.settings);
  // A solar term on the day before or after means the month pillar may hinge on the exact time.
  const month = (d: string) => pillarsFor(d, birth.timeIndex, input.gender, input.settings).month;
  const same = (a: Pillars['month'], b: Pillars['month']) => a.stem === b.stem && a.branch === b.branch;
  const prev = month(shiftDate(birth.dateStr, -1));
  const next = month(shiftDate(birth.dateStr, 1));
  const nearTerm =
    !same(prev, pillars.month) || !same(next, pillars.month)
      ? L(
          `This birth is within a day of a solar term (節氣), where the month pillar changes${!same(prev, pillars.month) ? ` (the day before is ⟨${prev.stem}${prev.branch}⟩)` : ` (the day after is ⟨${next.stem}${next.branch}⟩)`}. The app goes by date, so check the month pillar against the term’s exact time.`,
          `出生日期在節氣前後一天內，月柱會在節氣時改變${!same(prev, pillars.month) ? `（前一天是⟨${prev.stem}${prev.branch}⟩）` : `（後一天是⟨${next.stem}${next.branch}⟩）`}。本工具以日期為準，請以節氣的精確時刻核對月柱。`,
        )
      : undefined;
  renderBazi(baziRoot, readBazi(pillars, input.gender), input.settings.script, { nearTerm, lateZi: input.settings.dayDivide === 'forward' });
  const sihua = { overrides: SIHUA_TABLES[input.settings.sihua], label: SIHUA_LABEL[input.settings.sihua] };
  renderCompat(
    compatRoot,
    { c: model, pillars },
    (p) => ({
      c: toModel(buildChart(p.date, p.timeIndex, p.gender, { ...input.settings, script: 'zh-TW' }), p.gender, p.timeIndex, sihua),
      pillars: pillarsFor(p.date, p.timeIndex, p.gender, input.settings),
    }),
    input.settings.script,
  );
  setupTabs($<HTMLElement>('result-tabs'), input.settings.script);
  renderGlance(glanceRoot, model, nowYear, nowDecade, input.settings.script, () => {
    // Open this year inside its 10-year period and bring it into view.
    showTab('decades');
    if (nowDecade) showDecade(nowDecade.index);
    requestAnimationFrame(() => {
      const row = document.querySelector<HTMLDetailsElement>('[data-panel="decades"] .year-row.now');
      if (!row) return;
      const years = row.closest<HTMLDetailsElement>('details.years');
      if (years) years.open = true;
      row.open = true;
      row.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
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
    const name = (d: string) => (d === 'normal' ? ui('Lunar New Year', '農曆新年') : '立春');
    note(
      ui(
        `Born between Lunar New Year and 立春: counting the year from ${name(s.yearDivide)} gives a ${yp} year, but counting from ${name(otherYear)} gives ${ayp}. This changes the chart.`,
        `出生在農曆新年與立春之間：從${name(s.yearDivide)}起算是${yp}年，從${name(otherYear)}起算則是${ayp}年。命盤會因此不同。`,
      ),
      ui(`Use ${name(otherYear)} instead`, `改用${name(otherYear)}`),
      () => switchSetting('yearDivide', otherYear),
    );
  }

  const ld = chart.rawDates.lunarDate;
  if (ld.isLeap) {
    const altLeap = buildChart(birth.dateStr, birth.timeIndex, input.gender, { ...s, fixLeap: !s.fixLeap });
    if (signature(altLeap) !== signature(chart)) {
      note(
        ui(
          `Born in a leap month (閏${ld.lunarMonth}月, day ${ld.lunarDay}). Schools differ here: this chart ${s.fixLeap ? 'splits the leap month at the 15th, so it counts as the next month' : 'counts the whole leap month as the previous month'}, and the other reading gives a different chart.`,
          `出生在閏月（閏${ld.lunarMonth}月${ld.lunarDay}日）。各派做法不同：這張命盤${s.fixLeap ? '以十五日為界，十五日後算作下個月' : '把整個閏月算作上個月'}，另一種算法會排出不同的命盤。`,
        ),
        s.fixLeap ? ui('Count it as the previous month instead', '改為算作上個月') : ui('Split at the 15th instead', '改為以十五日為界'),
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
    ui(
      `The ${birth.solar ? 'true solar' : 'clock'} time ${fmtTime(t)} is ${birth.nearBoundaryMin} min from a 時辰 boundary. `,
      `${birth.solar ? '真太陽時' : '鐘錶時間'}${fmtTime(t)}距離時辰交界只有${birth.nearBoundaryMin}分鐘。`,
    ),
    ui('A small error in the recorded time would give a different chart. ', '記錄的時間只要稍有誤差，就會排出不同的命盤。'),
  );
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'link';
  let showingAlt = false;
  const label = () =>
    (btn.textContent = showingAlt
      ? ui(`Back to ${SHICHEN[birth.timeIndex].zh}時 (${fmtTime(t)})`, `回到${SHICHEN[birth.timeIndex].zh}時（${fmtTime(t)}）`)
      : ui(`View the ${SHICHEN[n.timeIndex].zh}時 chart instead`, `改看${SHICHEN[n.timeIndex].zh}時的命盤`));
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

// Language first: the form reads it for the chart's script, and the readings are written in it.
let formApi: ReturnType<typeof setupForm> | undefined;
setupLang(() => {
  formApi?.relabel();
  // Redraw everything the code writes: the chart, the readings and the notes.
  formApi?.submitIfReady();
});

formApi = setupForm(form, (input, auto) => {
  const birth = resolve(input);
  show(input, birth);
  showWarning(input, birth);
  if (!auto) result.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// The form adds its 時辰 options in code; convert them with the rest of the static text.
applyStatic();
new ResizeObserver(() => view && drawLines(lines, grid, view.selected)).observe(grid);
formApi.submitIfReady();

// --- Export -------------------------------------------------------------------------------
const saveBtn = $<HTMLButtonElement>('save-png');
saveBtn.addEventListener('click', async () => {
  if (!view) return;
  const label = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = ui('Saving…', '儲存中…');
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
    alert(ui(`Could not create the image: ${String(err)}`, `無法產生圖片：${String(err)}`));
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = label;
  }
});
$<HTMLButtonElement>('print-page').addEventListener('click', () => {
  // Open every reading so the printout is complete, then restore.
  const closed = [...document.querySelectorAll<HTMLDetailsElement>('#result details:not([open])')].filter((d) => !d.classList.contains('why'));
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
