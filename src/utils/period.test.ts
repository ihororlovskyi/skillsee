import { describe, expect, it } from 'vitest';
import { parsePeriod, periodToDate } from './period';

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('parsePeriod', () => {
  it('parses seconds (s)', () => expect(parsePeriod('5s')).toBe(5 * SEC));
  it('parses 60s', () => expect(parsePeriod('60s')).toBe(60 * SEC));
  it('parses minutes (m = minute, not month)', () => expect(parsePeriod('30m')).toBe(30 * MIN));
  it('1m equals MINUTE_MS, not 30 days', () => expect(parsePeriod('1m')).toBe(MIN));
  it('parses hours', () => expect(parsePeriod('24h')).toBe(24 * HOUR));
  it('parses days', () => expect(parsePeriod('30d')).toBe(30 * DAY));
  it('parses weeks', () => expect(parsePeriod('2w')).toBe(14 * DAY));
  it('parses months (mo = 30 days)', () => expect(parsePeriod('1mo')).toBe(30 * DAY));
  it('6mo equals 180 days', () => expect(parsePeriod('6mo')).toBe(180 * DAY));
  it('1m is still 1 minute, not 1 month', () => expect(parsePeriod('1m')).toBe(MIN));
  it('parses "all" as infinity', () => expect(parsePeriod('all')).toBe(Number.POSITIVE_INFINITY));
  it('throws on invalid format', () => expect(() => parsePeriod('foo')).toThrow('Invalid period'));
  it('throws on unknown unit', () => expect(() => parsePeriod('5x')).toThrow('Invalid period'));
  it('throws on 30sec (old format)', () =>
    expect(() => parsePeriod('30sec')).toThrow('Invalid period'));
  it('throws on 5min (old format)', () =>
    expect(() => parsePeriod('5min')).toThrow('Invalid period'));
  it('throws on 1y (removed unit)', () =>
    expect(() => parsePeriod('1y')).toThrow('Invalid period'));
  it('error message hints at mo', () => expect(() => parsePeriod('1y')).toThrow(/6mo/));
});

describe('periodToDate', () => {
  it('returns a Date in the past', () => {
    const d = periodToDate('7d');
    expect(d.getTime()).toBeLessThan(Date.now());
    expect(d.getTime()).toBeGreaterThan(Date.now() - 8 * DAY);
  });
  it('"all" returns epoch', () => expect(periodToDate('all').getTime()).toBe(0));
});
