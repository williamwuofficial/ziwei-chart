// A Gregorian date entered as separate day, month and year fields, in the order the browser's
// locale writes dates (day/month/year in Australia and the UK, month/day/year in the US, year/
// month/day in China and Taiwan). The native <input type="date"> follows the browser's interface
// language instead, which often isn't the reader's own convention. The value is kept as
// YYYY-MM-DD in a hidden input, so forms read it as before.

import { getLang, isZh } from '../i18n/lang';

type Part = 'day' | 'month' | 'year';

/** The browser's own locale, for the order of the fields and for showing dates. */
const userLocale = () => globalThis.navigator?.languages?.[0] ?? globalThis.navigator?.language ?? 'en-AU';

/** Day, month and year in the order the locale writes them. */
export function partOrder(locale = userLocale()): Part[] {
  try {
    const parts = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date(Date.UTC(2000, 10, 22)));
    const order = parts.map((p) => p.type).filter((t): t is Part => t === 'day' || t === 'month' || t === 'year');
    if (order.length === 3) return order;
  } catch {
    /* unknown locale */
  }
  return ['day', 'month', 'year'];
}

/** The display locale for month names and written dates: the app's language, in the browser's region for English. */
const displayLocale = () => (getLang() === 'zh-CN' ? 'zh-CN' : isZh() ? 'zh-TW' : userLocale());

/** A YYYY-MM-DD date written the reader's way, e.g. 20 Jun 1979, Jun 20, 1979 or 1979年6月20日. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  try {
    return new Intl.DateTimeFormat(displayLocale(), { year: 'numeric', month: isZh() ? 'long' : 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d)));
  } catch {
    return iso;
  }
}

/** YYYY-MM-DD if the three parts make a real date in range, else ''. */
export function toIso(day: string, month: string, year: string, min = 1900, max = 2099): string {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!/^\d{1,2}$/.test(day.trim()) || !m || !/^\d{4}$/.test(year.trim()) || y < min || y > max) return '';
  const t = new Date(Date.UTC(y, m - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export interface DateField {
  /** The wrapper to place in the form. */
  el: HTMLElement;
  set(iso: string): void;
  /** Redraw month names and hints after a language switch. */
  relabel(): void;
}

/**
 * Build the field. `hidden` carries the form value (YYYY-MM-DD, or '' while incomplete or invalid);
 * `labelId` names the visible label for screen readers.
 */
export function dateField(hidden: HTMLInputElement, labelId: string): DateField {
  const el = document.createElement('div');
  el.className = 'date-parts';
  el.setAttribute('role', 'group');
  el.setAttribute('aria-labelledby', labelId);

  const num = (len: number) => {
    const i = document.createElement('input');
    i.type = 'text';
    i.inputMode = 'numeric';
    i.autocomplete = 'off';
    i.maxLength = len;
    i.className = len === 4 ? 'dp-year' : 'dp-day';
    return i;
  };
  const day = num(2);
  const year = num(4);
  const month = document.createElement('select');
  month.className = 'dp-month';
  const inputs: Record<Part, HTMLInputElement | HTMLSelectElement> = { day, month, year };
  for (const p of partOrder()) el.append(inputs[p]);

  const sync = () => {
    hidden.value = toIso(day.value, month.value, year.value);
    hidden.dispatchEvent(new Event('change', { bubbles: true }));
  };
  for (const i of [day, month, year]) i.addEventListener('input', sync);

  const relabel = () => {
    const zh = isZh();
    const chosen = month.value;
    const names = new Intl.DateTimeFormat(displayLocale(), { month: zh ? 'numeric' : 'long', timeZone: 'UTC' });
    month.replaceChildren(new Option(zh ? '月' : 'Month', ''), ...Array.from({ length: 12 }, (_, k) => new Option(names.format(new Date(Date.UTC(2000, k, 1))), String(k + 1))));
    month.value = chosen;
    day.placeholder = zh ? '日' : 'Day';
    year.placeholder = zh ? '年' : 'Year';
    day.setAttribute('aria-label', zh ? '日' : 'Day');
    month.setAttribute('aria-label', zh ? '月' : 'Month');
    year.setAttribute('aria-label', zh ? '年（西元）' : 'Year');
  };
  relabel();

  return {
    el,
    set(iso: string) {
      const [y, m, d] = iso.split('-');
      year.value = y ?? '';
      month.value = m ? String(Number(m)) : '';
      day.value = d ? String(Number(d)) : '';
      hidden.value = toIso(day.value, month.value, year.value);
    },
    relabel,
  };
}
