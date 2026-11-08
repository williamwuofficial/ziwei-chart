import { DEFAULT_SETTINGS, type Gender, type Settings } from '../engine/chart';
import { placeDetail, placeLabel, searchPlaces, type Place } from '../input/geocode';
import { SHICHEN } from '../input/solarTime';

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

export function setupForm(form: HTMLFormElement, onSubmit: (input: BirthInput, auto: boolean) => void): { submitIfReady(): void } {
  const el = <T extends Element>(sel: string) => form.querySelector<T>(sel)!;
  const timeInput = el<HTMLInputElement>('input[name="time"]');
  const shichenSelect = el<HTMLSelectElement>('select[name="shichen"]');
  const placeInput = el<HTMLInputElement>('#place-input');
  const placeList = el<HTMLUListElement>('#place-list');
  const placeStatus = el<HTMLParagraphElement>('#place-status');
  const errorBox = el<HTMLParagraphElement>('#form-error');
  const placeHint = placeStatus.textContent ?? '';

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
      : placeHint;
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
        if (results.length === 0) placeStatus.textContent = 'No matching place found. Try the nearest city.';
      } catch (err) {
        if ((err as Error).name !== 'AbortError') placeStatus.textContent = 'Place search is unavailable right now. Try again shortly.';
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
  if (prev?.date) el<HTMLInputElement>('input[name="date"]').value = prev.date;
  if (prev?.time) timeInput.value = prev.time;
  if (prev?.shichen !== undefined) shichenSelect.value = String(prev.shichen);
  const mode = prev?.timeMode ?? 'exact';
  el<HTMLInputElement>(`input[name="timeMode"][value="${mode}"]`).checked = true;
  setTimeMode(mode);
  if (prev?.place) {
    placeInput.value = placeLabel(prev.place);
    showPlace(prev.place);
  }
  el<HTMLInputElement>('input[name="useSolar"]').checked = settings.useSolar;
  el<HTMLInputElement>('input[name="showDetails"]').checked = settings.showDetails;
  el<HTMLSelectElement>('select[name="dayDivide"]').value = settings.dayDivide;
  el<HTMLSelectElement>('select[name="algorithm"]').value = settings.algorithm;
  el<HTMLSelectElement>('select[name="script"]').value = settings.script;
  el<HTMLSelectElement>('select[name="sihua"]').value = settings.sihua;

  // --- Read and validate --------------------------------------------------------------
  const read = (): BirthInput | string => {
    const data = new FormData(form);
    const gender = data.get('gender') as Gender | null;
    const date = String(data.get('date') ?? '');
    const timeMode = data.get('timeMode') as 'exact' | 'shichen';
    if (!gender) return 'Choose a gender.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Enter a date of birth.';
    const year = Number(date.slice(0, 4));
    if (year < 1900 || year > 2099) return 'Dates from 1900 to 2099 are supported.';
    const s: Settings = {
      useSolar: data.get('useSolar') === 'on',
      showDetails: data.get('showDetails') === 'on',
      dayDivide: data.get('dayDivide') as Settings['dayDivide'],
      algorithm: data.get('algorithm') as Settings['algorithm'],
      script: data.get('script') as Settings['script'],
      sihua: data.get('sihua') as Settings['sihua'],
    };
    if (timeMode === 'exact') {
      const time = String(data.get('time') ?? '');
      if (!/^\d{2}:\d{2}$/.test(time)) return 'Enter the time of birth, or switch to “Only the 時辰”.';
      if (!place) return 'Choose the place of birth from the list.';
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
  };
}
