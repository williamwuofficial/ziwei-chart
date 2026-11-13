import { describe, expect, it } from 'vitest';
import { partOrder, toIso } from '../src/ui/dateInput';

describe('date entry', () => {
  it('orders the fields the way each locale writes dates', () => {
    expect(partOrder('en-AU')).toEqual(['day', 'month', 'year']);
    expect(partOrder('en-GB')).toEqual(['day', 'month', 'year']);
    expect(partOrder('en-US')).toEqual(['month', 'day', 'year']);
    expect(partOrder('zh-TW')).toEqual(['year', 'month', 'day']);
  });
  it('accepts only real dates in range', () => {
    expect(toIso('20', '6', '1979')).toBe('1979-06-20');
    expect(toIso('29', '2', '2000')).toBe('2000-02-29');
    expect(toIso('29', '2', '1999')).toBe('');
    expect(toIso('31', '4', '1990')).toBe('');
    expect(toIso('1', '1', '1899')).toBe('');
    expect(toIso('', '6', '1979')).toBe('');
    expect(toIso('5', '', '1979')).toBe('');
    expect(toIso('5', '6', '79')).toBe('');
  });
});
