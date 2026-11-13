export const SIDEREAL_MONTH = 27.32166;
export const YEAR = 365.25636;
export const SYNODIC_MONTH = 1 / (1 / SIDEREAL_MONTH - 1 / YEAR);
const TAU = 2 * Math.PI;
export function wrap(value: number, period: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(period) || period <= 0) throw new RangeError('参数必须有限且周期为正');
  const result = ((value % period) + period) % period;
  return Math.abs(result-period)<1e-12 || Math.abs(result)<1e-12 ? 0 : result;
}
export const PHASES = ['新月','娥眉月','上弦月','盈凸月','满月','亏凸月','下弦月','残月'] as const;
export function calculate(days: number, solarTime: number) {
  const progress = wrap(days, SYNODIC_MONTH) / SYNODIC_MONTH;
  const elongation = progress * TAU;
  const sunLongitude = wrap(days, YEAR) / YEAR * TAU;
  const moonLongitude = wrap(days, SIDEREAL_MONTH) / SIDEREAL_MONTH * TAU;
  const localSolarTime = wrap(solarTime,24);
  const hourAngle = (localSolarTime - 12) / 24 * TAU - elongation;
  const east = -Math.sin(hourAngle), up = Math.cos(hourAngle);
  const transit = wrap(12 + 24 * progress,24);
  return {progress, elongation, sunLongitude, moonLongitude, localSolarTime,
    observerLongitude: sunLongitude + (localSolarTime-12)/24*TAU,
    moonLight:[Math.sin(elongation),0,-Math.cos(elongation)],
    sunDirection:[Math.cos(sunLongitude),Math.sin(sunLongitude),0],
    moonPosition:[Math.cos(moonLongitude),Math.sin(moonLongitude),0],
    phaseAngle:Math.acos(-Math.cos(elongation)),
    illumination:(1-Math.cos(elongation))/2,
    name:PHASES[Math.floor(progress*8+0.5)%8],
    rise:wrap(transit-6,24), transit, set:wrap(transit+6,24),
    altitude:Math.asin(Math.max(-1,Math.min(1,up)))*180/Math.PI,
    azimuth:Math.abs(east)<1e-12 ? null : east>0 ? 90 : 270,
    enu:[east,0,up], aboveHorizon:up>1e-12};
}
export function formatTime(hours:number) {
  const minutes = Math.round(wrap(hours,24)*60)%1440;
  return `${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
}

export type AstronomyState = ReturnType<typeof calculate>;
