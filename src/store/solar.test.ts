import {beforeEach, it, expect} from 'vitest';
import {useSolar} from './solar';
import {CITIES} from '../science/cities';

beforeEach(() => useSolar.getState().reset());

it('城市预设与自定义坐标', () => {
  const city = CITIES.find(candidate => candidate.id === 'sydney')!;
  useSolar.getState().setCity('sydney');
  expect(useSolar.getState().cityId).toBe('sydney');
  expect(useSolar.getState().longitude).toBe(city.longitude);
  useSolar.getState().setLatitude(80);
  expect(useSolar.getState().cityId).toBe('custom');
  expect(useSolar.getState().latitude).toBe(80);
  useSolar.getState().setLatitude(120);
  expect(useSolar.getState().latitude).toBe(90);
  useSolar.getState().setCity('custom');
  expect(useSolar.getState().cityId).toBe('custom');
});

it('日期校验和时间边界', () => {
  const initial = useSolar.getState().date;
  useSolar.getState().setDate('2026-02-30');
  expect(useSolar.getState().date).toBe(initial);
  useSolar.getState().setDate('2026-06-21');
  expect(useSolar.getState().date).toBe('2026-06-21');
  useSolar.getState().setTime(30);
  expect(useSolar.getState().time).toBe(24);
  useSolar.getState().setTime(NaN);
  expect(useSolar.getState().time).toBe(24);
});
