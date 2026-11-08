// Birth clock time + place → true solar time → 時辰 index.
//
// 1. Local clock time is converted to UTC with the IANA zone's offset *on the birth date*
//    (covers DST and historic offsets such as China 1986–91 or Singapore before 1982).
// 2. True solar time = UTC + longitude × 4 min/° + equation of time (NOAA approximation, ±16 min).
// 3. The 時辰 index follows iztro: 0 early 子 (00–01), 1 丑 (01–03) … 11 亥 (21–23), 12 late 子 (23–24).

export interface LocalDateTime {
  year: number;
  month: number; // 1–12
  day: number;
  hour: number;
  minute: number;
}

const MIN = 60_000;

/** UTC offset of `zone` at the instant `utcMs`, in minutes (east positive). */
export function offsetMinutes(utcMs: number, zone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(utcMs));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - Math.floor(utcMs / 1000) * 1000) / MIN);
}

/**
 * UTC instant for a wall-clock time in `zone`. For times skipped by a DST jump the result lands
 * an hour later; for repeated times it picks the first (daylight) occurrence. Both are rare for
 * birth records, and the UI shows the offset it used.
 */
export function zonedToUtc(t: LocalDateTime, zone: string): { utcMs: number; offset: number } {
  const naive = Date.UTC(t.year, t.month - 1, t.day, t.hour, t.minute);
  let offset = offsetMinutes(naive, zone);
  for (let i = 0; i < 3; i++) {
    const next = offsetMinutes(naive - offset * MIN, zone);
    if (next === offset) break;
    offset = next;
  }
  return { utcMs: naive - offset * MIN, offset };
}

/** Equation of time in minutes (apparent − mean solar time), NOAA fractional-year formula. */
export function equationOfTime(utcMs: number): number {
  const d = new Date(utcMs);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((utcMs - start) / 86_400_000) + 1;
  const isLeap = new Date(Date.UTC(d.getUTCFullYear(), 1, 29)).getUTCMonth() === 1;
  const g = ((2 * Math.PI) / (isLeap ? 366 : 365)) * (dayOfYear - 1 + (d.getUTCHours() - 12) / 24);
  return (
    229.18 *
    (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  );
}

/** True (apparent) solar time at `longitude` for the UTC instant, as calendar fields. */
export function trueSolarTime(utcMs: number, longitude: number): LocalDateTime {
  const lmt = utcMs + longitude * 4 * MIN;
  const eot = equationOfTime(utcMs);
  const solar = new Date(lmt + Math.round(eot * 60) * 1000);
  return {
    year: solar.getUTCFullYear(),
    month: solar.getUTCMonth() + 1,
    day: solar.getUTCDate(),
    hour: solar.getUTCHours(),
    minute: solar.getUTCMinutes(),
  };
}

/** iztro 時辰 index (0–12) for a clock hour. */
export function timeIndexFor(hour: number): number {
  return hour === 23 ? 12 : Math.floor((hour + 1) / 2);
}

/** Minutes from `hour:minute` to the nearest 時辰 boundary (odd hours: 23, 1, 3 … 21). */
export function minutesToBoundary(hour: number, minute: number): number {
  const t = hour * 60 + minute;
  let best = Infinity;
  for (let b = 1; b <= 25; b += 2) best = Math.min(best, Math.abs(t - b * 60), Math.abs(t - (b - 24) * 60));
  return best;
}

export const SHICHEN = [
  { zh: '早子', range: '00:00–00:59' },
  { zh: '丑', range: '01:00–02:59' },
  { zh: '寅', range: '03:00–04:59' },
  { zh: '卯', range: '05:00–06:59' },
  { zh: '辰', range: '07:00–08:59' },
  { zh: '巳', range: '09:00–10:59' },
  { zh: '午', range: '11:00–12:59' },
  { zh: '未', range: '13:00–14:59' },
  { zh: '申', range: '15:00–16:59' },
  { zh: '酉', range: '17:00–18:59' },
  { zh: '戌', range: '19:00–20:59' },
  { zh: '亥', range: '21:00–22:59' },
  { zh: '晚子', range: '23:00–23:59' },
] as const;

export interface ResolvedBirth {
  /** Date passed to iztro (solar calendar, of the true solar time when used). */
  dateStr: string;
  timeIndex: number;
  clock: LocalDateTime;
  utcOffsetMin?: number;
  solar?: LocalDateTime;
  /** Total shift from clock time to solar time, in minutes. */
  solarShiftMin?: number;
  /** Set when the time used is within 10 minutes of a 時辰 boundary. */
  nearBoundaryMin?: number;
}

const pad = (n: number) => String(n).padStart(2, '0');
export const fmtDate = (t: LocalDateTime) => `${t.year}-${pad(t.month)}-${pad(t.day)}`;
export const fmtTime = (t: LocalDateTime) => `${pad(t.hour)}:${pad(t.minute)}`;

/** Resolve an exact clock time at a place to the date + 時辰 index used for the chart. */
export function resolveExact(clock: LocalDateTime, place: { longitude: number; timezone: string }, useSolar: boolean): ResolvedBirth {
  const { utcMs, offset } = zonedToUtc(clock, place.timezone);
  const used = useSolar ? trueSolarTime(utcMs, place.longitude) : clock;
  const clockAsUtc = Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute);
  const usedAsUtc = Date.UTC(used.year, used.month - 1, used.day, used.hour, used.minute);
  const toBoundary = minutesToBoundary(used.hour, used.minute);
  return {
    dateStr: fmtDate(used),
    timeIndex: timeIndexFor(used.hour),
    clock,
    utcOffsetMin: offset,
    solar: useSolar ? used : undefined,
    solarShiftMin: useSolar ? Math.round((usedAsUtc - clockAsUtc) / MIN) : undefined,
    nearBoundaryMin: toBoundary <= 10 ? toBoundary : undefined,
  };
}
