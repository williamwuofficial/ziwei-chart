import { describe, expect, it } from 'vitest';
import { equationOfTime, minutesToBoundary, offsetMinutes, resolveExact, timeIndexFor, zonedToUtc } from '../src/input/solarTime';

describe('historic UTC offsets', () => {
  it('Beijing in July 1988 was on DST (+9)', () => {
    expect(zonedToUtc({ year: 1988, month: 7, day: 1, hour: 12, minute: 0 }, 'Asia/Shanghai').offset).toBe(540);
  });
  it('Beijing in 1995 is +8', () => {
    expect(zonedToUtc({ year: 1995, month: 7, day: 1, hour: 12, minute: 0 }, 'Asia/Shanghai').offset).toBe(480);
  });
  it('Sydney in January is on DST (+11)', () => {
    expect(zonedToUtc({ year: 2001, month: 1, day: 15, hour: 8, minute: 30 }, 'Australia/Sydney').offset).toBe(660);
  });
  it('Singapore before 1982 was +7:30', () => {
    expect(offsetMinutes(Date.UTC(1975, 5, 1), 'Asia/Singapore')).toBe(450);
  });
  it('converts New York EDT clock time to UTC', () => {
    const { utcMs } = zonedToUtc({ year: 2020, month: 7, day: 4, hour: 9, minute: 15 }, 'America/New_York');
    expect(new Date(utcMs).toISOString()).toBe('2020-07-04T13:15:00.000Z');
  });
});

describe('equation of time (NOAA reference values, ±1 min)', () => {
  it('about +16.4 min in early November', () => expect(equationOfTime(Date.UTC(2023, 10, 3, 12))).toBeCloseTo(16.4, 0));
  it('about −14.2 min in mid February', () => expect(equationOfTime(Date.UTC(2023, 1, 11, 12))).toBeCloseTo(-14.2, 0));
  it('about 0 in mid April', () => expect(Math.abs(equationOfTime(Date.UTC(2023, 3, 15, 12)))).toBeLessThan(1));
});

describe('時辰 index', () => {
  it.each([
    [0, 0], [1, 1], [2, 1], [3, 2], [11, 6], [12, 6], [13, 7], [21, 11], [22, 11], [23, 12],
  ])('hour %i → %i', (h, i) => expect(timeIndexFor(h)).toBe(i));
  it('measures distance to the nearest boundary', () => {
    expect(minutesToBoundary(12, 55)).toBe(5);
    expect(minutesToBoundary(23, 4)).toBe(4);
    expect(minutesToBoundary(0, 58)).toBe(2);
    expect(minutesToBoundary(2, 0)).toBe(60);
  });
});

describe('resolveExact', () => {
  it('Queensland DST trial: Brisbane February 1990 was +11, so solar time is about an hour behind', () => {
    const r = resolveExact({ year: 1990, month: 2, day: 11, hour: 12, minute: 0 }, { longitude: 153.03, timezone: 'Australia/Brisbane' }, true);
    expect(r.utcOffsetMin).toBe(660);
    expect(r.solarShiftMin).toBe(-63);
  });
  it('Urumqi noon on Beijing time is 巳 hour in solar time', () => {
    const r = resolveExact({ year: 2000, month: 6, day: 1, hour: 12, minute: 0 }, { longitude: 87.6, timezone: 'Asia/Urumqi' }, true);
    // Asia/Urumqi is +6 in IANA; the clock time entered is local civil time, so 12:00 local (+6).
    // UTC 06:00 + 350.4 min (87.6°×4) + ~2 min EoT ≈ 11:52.
    expect(r.solar?.hour).toBe(11);
    expect(r.timeIndex).toBe(6);
    expect(r.nearBoundaryMin).toBeUndefined(); // 52 min past the 11:00 boundary
  });
  it('Brisbane: solar shift is longitude minus zone meridian plus EoT', () => {
    const r = resolveExact({ year: 1995, month: 2, day: 11, hour: 12, minute: 0 }, { longitude: 153.03, timezone: 'Australia/Brisbane' }, true);
    // (153.03 − 150) × 4 = +12.1 min, EoT ≈ −14.2 → about −2 min
    expect(r.solarShiftMin).toBeGreaterThanOrEqual(-3);
    expect(r.solarShiftMin).toBeLessThanOrEqual(-1);
  });
  it('can roll the solar date back across midnight', () => {
    const r = resolveExact({ year: 1990, month: 2, day: 11, hour: 0, minute: 10 }, { longitude: 116.4, timezone: 'Asia/Shanghai' }, true);
    expect(r.dateStr).toBe('1990-02-10');
    expect(r.timeIndex).toBe(12); // late 子 of the previous day
  });
  it('clock mode keeps the entered time', () => {
    const r = resolveExact({ year: 1990, month: 2, day: 11, hour: 0, minute: 10 }, { longitude: 116.4, timezone: 'Asia/Shanghai' }, false);
    expect(r.dateStr).toBe('1990-02-11');
    expect(r.timeIndex).toBe(0);
    expect(r.solar).toBeUndefined();
  });
});
