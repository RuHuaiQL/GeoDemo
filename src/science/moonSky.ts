import {AstroTime, Body, Equator, Horizon, Observer, SearchAltitude} from 'astronomy-engine';
import type {SunPath} from './solar';

/** Evaluate a local civil day using elapsed hours from its UTC start. */
export function moonSky(date: string, latitude: number, longitude: number, start = Date.parse(date + "T00:00:00+08:00"), hours = 24) {
  const midnight = new AstroTime(new Date(start));
  const observer = new Observer(latitude, longitude, 0);

  function position(hours: number) {
    const instant = midnight.AddDays(hours / 24);
    const equatorial = Equator(Body.Moon, instant, observer, true, true);
    const {altitude, azimuth} = Horizon(instant, observer, equatorial.ra, equatorial.dec);
    return {altitude, azimuth, time: hours};
  }

  function visiblePaths(): SunPath[] {
    const boundaries = [0, hours];
    const end = midnight.ut + hours / 24;
    // Geometric centre crossings include short grazing arcs at high latitudes.
    for (const direction of [-1, 1]) {
      let start = midnight;
      while (start.ut < end) {
        const event = SearchAltitude(Body.Moon, observer, direction, start, end - start.ut, 0);
        if (!event || event.ut >= end) break;
        boundaries.push((event.ut - midnight.ut) * 24);
        start = event.AddDays(1 / 86400);
      }
    }
    boundaries.sort((a, b) => a - b);
    const paths: SunPath[] = [];
    for (let i = 1; i < boundaries.length; i++) {
      const from = boundaries[i - 1], to = boundaries[i];
      if (to <= from || position((from + to) / 2).altitude <= 0) continue;
      const steps = Math.max(1, Math.ceil((to - from) * 6));
      const points = Array.from({length: steps + 1}, (_, n) => position(from + (to - from) * n / steps));
      if (from > 0) points[0].altitude = 0;
      if (to < hours) points[steps].altitude = 0;
      paths.push({points, closed: false});
    }
    return paths;
  }

  return {position, visiblePaths};
}
