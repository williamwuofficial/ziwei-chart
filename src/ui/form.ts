import { DEFAULT_SETTINGS, type Gender, type Settings } from '../engine/chart';
import { placeDetail, placeLabel, searchPlaces, type Place } from '../input/geocode';
import { SHICHEN } from '../input/solarTime';
import { scriptOf } from '../i18n/lang';
import { ui } from './zhText';
import { dateField } from './dateInput';

export interface BirthInput {
  gender: Gender;
  date: string; // YYYY-MM-DD
  timeMode: 'exact' | 'shichen';
  time?: string; // HH:MM
  shichen?: number; // 0–12
  place?: Place;
  settings: Settings;
}

const STORAGE_KEY = 'ziwei-chart:last-input';

function load(): Partial<BirthInput> | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<BirthInput>) : undefined;
  } catch {
    return undefined;
  }
}

/** Update one stored setting without recalculating (used by the chart's quick toggle). */
export function storeSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  const prev = load();
  if (!prev?.settings) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, settings: { ...prev.settings, [key]: value } }));
  } catch {
    /* storage unavailable */
  }
}

function save(input: BirthInput): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(input));
  } catch {
    /* storage unavailable: nothing to remember */
  }
}

export function setupForm(form: HTMLFormElement, onSubmit: (input: BirthInput, auto: boolean) => void): { submitIfReady(): void; relabel(): void } {
  const el = <T extends Element>(sel: string) => form.querySelector<T>(sel)!;
  const timeInput = el<HTMLInputElement>('input[name="time"]');
  const shichenSelect = el<HTMLSelectElement>('select[name="shichen"]');
  const placeInput = el<HTMLInputElement>('#place-input');
  const placeList = el<HTMLUListElement>('#place-list');
  const placeStatus = el<HTMLParagraphElement>('#place-status');
  const errorBox = el<HTMLParagraphElement>('#form-error');
  const placeHint = () => ui('Needed with an exact time, to work out the time zone and true solar time.', '填寫準確時間時需要，用來推算時區和真太陽時。');

  const dateHidden = el<HTMLInputElement>('input[name="date"]');
  const date = dateField(dateHidden, 'date-label');
  el<HTMLElement>('#date-parts').replaceWith(date.el);

  for (const [i, s] of SHICHEN.entries()) shichenSelect.add(new Option(`${s.zh}時 · ${s.range}`, String(i)));

  let place: Place | undefined;

  const setTimeMode = (mode: 'exact' | 'shichen') => {
    timeInput.hidden = mode !== 'exact';
    shichenSelect.hidden = mode !== 'shichen';
  };
  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'timeMode') setTimeMode(t.value as 'exact' | 'shichen');
  });

  const showPlace = (p: Place | undefined) => {
    place = p;
    placeStatus.textContent = p
      ? `${placeLabel(p)} · ${placeDetail(p).split(' · ')[1]} · ${p.timezone}`
      : placeHint();
    placeStatus.classList.toggle('ok', !!p);
  };

  // --- Place autocomplete -------------------------------------------------------------
  let results: Place[] = [];
  let active = -1;
  let timer: number | undefined;
  let inflight: AbortController | undefined;

  const closeList = () => {
    placeList.hidden = true;
    placeInput.setAttribute('aria-expanded', 'false');
    placeInput.removeAttribute('aria-activedescendant');
    active = -1;
  };
  const renderList = () => {
    placeList.replaceChildren(
      ...results.map((p, i) => {
        const li = document.createElement('li');
        li.id = `place-opt-${i}`;
        li.role = 'option';
        const detail = document.createElement('small');
        detail.textContent = placeDetail(p);
        li.append(placeLabel(p), detail);
        li.setAttribute('aria-selected', String(i === active));
        li.addEventListener('mousedown', (ev) => {
          ev.preventDefault(); // keep focus on the input
          choose(i);
        });
        return li;
      }),
    );
    placeList.hidden = results.length === 0;
    placeInput.setAttribute('aria-expanded', String(results.length > 0));
    if (active >= 0) placeInput.setAttribute('aria-activedescendant', `place-opt-${active}`);
  };
  const choose = (i: number) => {
    const p = results[i];
    if (!p) return;
    placeInput.value = placeLabel(p);
    showPlace(p);
    closeList();
  };

  placeInput.addEventListener('input', () => {
    showPlace(undefined);
    window.clearTimeout(timer);
    const q = placeInput.value;
    if (q.trim().length < 2) {
      results = [];
      closeList();
      return;
    }
    timer = window.setTimeout(async () => {
      inflight?.abort();
      inflight = new AbortController();
      try {
        results = await searchPlaces(q, inflight.signal);
        active = -1;
        renderList();
        if (results.length === 0) placeStatus.textContent = ui('No matching place found. Try the nearest city.', '找不到相符的地點，請試試最近的城市。');
      } catch (err) {
        if ((err as Error).name !== 'AbortError') placeStatus.textContent = ui('Place search is unavailable right now. Try again shortly.', '地點搜尋暫時無法使用，請稍後再試。');
      }
    }, 300);
  });
  placeInput.addEventListener('keydown', (e) => {
    if (placeList.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
      renderList();
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape') {
      closeList();
    }
  });
  placeInput.addEventListener('blur', () => window.setTimeout(closeList, 100));

  // --- Restore the last input -------------------------------------------------------
  const prev = load();
  const settings: Settings = { ...DEFAULT_SETTINGS, ...prev?.settings };
  if (prev?.gender) el<HTMLInputElement>(`input[name="gender"][value="${prev.gender}"]`).checked = true;
  if (prev?.date) date.set(prev.date);
  if (prev?.time) timeInput.value = prev.time;
  if (prev?.shichen !== undefined) shichenSelect.value = String(prev.shichen);
  const mode = prev?.timeMode ?? 'exact';
  el<HTMLInputElement>(`input[name="timeMode"][value="${mode}"]`).checked = true;
  setTimeMode(mode);
  if (prev?.place) {
    placeInput.value = placeLabel(prev.place);
    showPlace(prev.place);
  } else showPlace(undefined);
  el<HTMLInputElement>('input[name="useSolar"]').checked = settings.useSolar;
  el<HTMLInputElement>('input[name="showDetails"]').checked = settings.showDetails;
  el<HTMLSelectElement>('select[name="dayDivide"]').value = settings.dayDivide;
  el<HTMLSelectElement>('select[name="algorithm"]').value = settings.algorithm;
  el<HTMLSelectElement>('select[name="sihua"]').value = settings.sihua;
  el<HTMLSelectElement>('select[name="yearDivide"]').value = settings.yearDivide;
  el<HTMLSelectElement>('select[name="fixLeap"]').value = String(settings.fixLeap);
  el<HTMLSelectElement>('select[name="astroType"]').value = settings.astroType;
  el<HTMLSelectElement>('select[name="tianma"]').value = settings.tianma;
  // The 天盤/地盤/人盤 choice only exists in 中州派 placement.
  const astroField = el<HTMLElement>('#astro-type-field');
  const algo = el<HTMLSelectElement>('select[name="algorithm"]');
  const syncAstro = () => (astroField.hidden = algo.value !== 'zhongzhou');
  algo.addEventListener('change', syncAstro);
  syncAstro();

  // --- Read and validate --------------------------------------------------------------
  const read = (): BirthInput | string => {
    const data = new FormData(form);
    const gender = data.get('gender') as Gender | null;
    const date = String(data.get('date') ?? '');
    const timeMode = data.get('timeMode') as 'exact' | 'shichen';
    if (!gender) return ui('Choose a gender.', '請選擇性別。');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return ui('Enter a full date of birth: day, month and year (1900–2099).', '請完整輸入出生日期：年、月、日（1900至2099年）。');
    const year = Number(date.slice(0, 4));
    if (year < 1900 || year > 2099) return ui('Dates from 1900 to 2099 are supported.', '支援1900至2099年的日期。');
    const s: Settings = {
      useSolar: data.get('useSolar') === 'on',
      showDetails: data.get('showDetails') === 'on',
      dayDivide: data.get('dayDivide') as Settings['dayDivide'],
      algorithm: data.get('algorithm') as Settings['algorithm'],
      // The chart's Chinese script follows the display language (English uses Traditional terms).
      script: scriptOf(),
      sihua: data.get('sihua') as Settings['sihua'],
      yearDivide: data.get('yearDivide') as Settings['yearDivide'],
      fixLeap: data.get('fixLeap') !== 'false',
      astroType: data.get('astroType') as Settings['astroType'],
      tianma: data.get('tianma') as Settings['tianma'],
    };
    if (timeMode === 'exact') {
      const time = String(data.get('time') ?? '');
      if (!/^\d{2}:\d{2}$/.test(time)) return ui('Enter the time of birth, or switch to “Only the 時辰”.', '請輸入出生時間，或改選「只知時辰」。');
      if (!place) return ui('Choose the place of birth from the list.', '請從清單中選擇出生地。');
      return { gender, date, timeMode, time, place, settings: s };
    }
    return { gender, date, timeMode, shichen: Number(data.get('shichen')), place, settings: s };
  };

  const submit = (auto = false) => {
    const r = read();
    errorBox.hidden = typeof r !== 'string';
    if (typeof r === 'string') {
      errorBox.textContent = r;
      return;
    }
    save(r);
    onSubmit(r, auto);
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit();
  });

  return {
    submitIfReady() {
      if (typeof read() !== 'string') submit(true);
    },
    /** Redraw the text the form writes itself, after a language switch. */
    relabel() {
      date.relabel();
      showPlace(place);
      if (!errorBox.hidden) {
        const r = read();
        if (typeof r === 'string') errorBox.textContent = r;
      }
    },
  };
}
