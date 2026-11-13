import {expect, it} from 'vitest';
import {localDay, lunarDate} from './localDay';

it('steps across missing and repeated hours in Sydney', () => {
  const spring = localDay('2026-10-04', 151, 'Australia/Sydney');
  expect(spring.hours).toBe(23);
  expect(spring.clock(2)).toBe('03:00');
  expect(spring.clock(23)).toBe('00:00');
  const autumn = localDay('2026-04-05', 151, 'Australia/Sydney');
  expect(autumn.hours).toBe(25);
  expect(autumn.clock(2)).toBe('02:00');
  expect(autumn.clock(3)).toBe('02:00');
});

it('uses local midnight for custom longitudes and formats the civil lunar date', () => {
  const day = localDay('2026-06-21', -75);
  expect(new Date(day.start).toISOString()).toBe('2026-06-21T05:00:00.000Z');
  expect(lunarDate('2026-06-21')).toBe('五月初七');
});
