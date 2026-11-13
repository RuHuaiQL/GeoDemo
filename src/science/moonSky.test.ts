import {expect, it} from 'vitest';
import {moonSky} from './moonSky';

it('matches the Moon direction at the NASA 2024 total eclipse maximum', () => {
  // https://eclipse.gsfc.nasa.gov/SEhistory/SEplot/SE2024Apr08T.pdf
  const sky = moonSky('2024-04-09', 25 + 17.4 / 60, -(104 + 7.7 / 60));
  const moon = sky.position(2 + 17 / 60 + 15 / 3600);
  expect(Math.abs(moon.altitude - 69.8)).toBeLessThan(0.15);
  expect(Math.abs(moon.azimuth - 149.4)).toBeLessThan(0.2);
});

it('keeps the two visible parts of a day separate and rolls 24:00 into tomorrow', () => {
  const sky = moonSky('2026-06-30', 39.9042, 116.4074);
  const paths = sky.visiblePaths();
  expect(paths).toHaveLength(2);
  expect(paths[0].points[0].time).toBe(0);
  expect(paths[1].points.at(-1)?.time).toBe(24);
  expect(paths[0].points.at(-1)?.altitude).toBe(0);
  expect(paths[1].points[0].altitude).toBe(0);
  for (const path of paths) expect(path.points.every(p => p.altitude >= 0)).toBe(true);
  expect(sky.position(24).altitude).toBeCloseTo(moonSky('2026-07-01', 39.9042, 116.4074).position(0).altitude, 7);
});

it('supports a Moon continuously below or above the polar horizon', () => {
  expect(moonSky('2026-06-30', 90, 0).visiblePaths()).toHaveLength(0);
  const [arc] = moonSky('2026-06-30', -90, 0).visiblePaths();
  expect(arc.points[0].time).toBe(0);
  expect(arc.points.at(-1)?.time).toBe(24);
  expect(arc.closed).toBe(false);
});
