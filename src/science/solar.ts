import {wrap} from './model';

/** All cities and manual coordinates display clock times in China Standard Time. */
export const SOLAR_TIMEZONE = 8;
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export type SolarDate = {year: number; month: number; day: number};

export type SolarParameters = {
  dayOfYear: number;
  declination: number;
  equationOfTime: number;
};

export type SolarPosition = {
  altitude: number;
  azimuth: number | null;
  hourAngle: number;
  declination: number;
  equationOfTime: number;
  trueSolarTime: number;
  aboveHorizon: boolean;
};

export type DayEvents = SolarParameters & {
  noon: number;
  noonAltitude: number;
  noonAzimuth: number | null;
  rise: number | null;
  set: number | null;
  riseAzimuth: number | null;
  setAzimuth: number | null;
  dayLength: number;
  polarDay: boolean;
  polarNight: boolean;
};

export type SunPathPoint = {altitude: number; azimuth: number; time: number};
export type SunPath = {points: SunPathPoint[]; closed: boolean};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

export function isLeapYear(year: number) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function daysInMonth(year: number, month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new RangeError('月份无效');
  if (month === 2 && isLeapYear(year)) return 29;
  return MONTH_DAYS[month - 1];
}

function assertDate(date: SolarDate) {
  if (!Number.isInteger(date.year) || !Number.isInteger(date.month) || !Number.isInteger(date.day)) {
    throw new RangeError('日期必须为整数');
  }
  if (date.month < 1 || date.month > 12) throw new RangeError('月份无效');
  if (date.day < 1 || date.day > daysInMonth(date.year, date.month)) throw new RangeError('日期无效');
}

function assertLocation(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new RangeError('纬度必须在 -90 到 90 之间');
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new RangeError('经度必须在 -180 到 180 之间');
}

function assertTime(value: number, name: string) {
  if (!Number.isFinite(value)) throw new RangeError(`${name}必须为有限数值`);
}

export function dayOfYear(year: number, month: number, day: number) {
  assertDate({year, month, day});
  let result = day;
  for (let m = 1; m < month; m++) result += daysInMonth(year, m);
  return result;
}

export function parseISODate(value: string): SolarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = {year: Number(match[1]), month: Number(match[2]), day: Number(match[3])};
  try {
    assertDate(date);
    return date;
  } catch {
    return null;
  }
}

export function toISODate(date: SolarDate) {
  assertDate(date);
  return `${String(date.year).padStart(4, '0')}-${pad(date.month)}-${pad(date.day)}`;
}

/** Spencer/NOAA approximations, accurate enough for a teaching path (not an ephemeris). */
export function solarParameters(date: SolarDate): SolarParameters {
  assertDate(date);
  const n = dayOfYear(date.year, date.month, date.day);
  const days = isLeapYear(date.year) ? 366 : 365;
  const gamma = (2 * Math.PI / days) * (n - 1);
  const equationOfTime = 229.18 * (
    0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma)
  );
  const declination = DEG * (
    0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma)
  );
  return {dayOfYear: n, declination, equationOfTime};
}

function positionAtHourAngle(parameters: SolarParameters, latitude: number, hourAngle: number) {
  const phi = latitude * RAD;
  const declination = parameters.declination * RAD;
  const hour = hourAngle * RAD;
  const sinAltitude = Math.sin(phi) * Math.sin(declination)
    + Math.cos(phi) * Math.cos(declination) * Math.cos(hour);
  const altitude = Math.asin(clamp(sinAltitude, -1, 1)) * DEG;
  const cosAltitude = Math.cos(altitude * RAD);
  let azimuth: number | null = null;
  if (Math.abs(cosAltitude) > 1e-9 && Math.abs(Math.cos(phi)) > 1e-9) {
    const cosAzimuth = clamp(
      (Math.sin(declination) - sinAltitude * Math.sin(phi)) / (cosAltitude * Math.cos(phi)),
      -1,
      1,
    );
    azimuth = Math.acos(cosAzimuth) * DEG;
    if (Math.sin(hour) > 1e-12) azimuth = 360 - azimuth;
    if (azimuth >= 360 - 1e-9) azimuth = 0;
  }
  return {altitude, azimuth, sinAltitude};
}

export function solarPosition(
  date: SolarDate,
  latitude: number,
  longitude: number,
  timezone: number,
  clock: number,
): SolarPosition {
  assertDate(date);
  assertLocation(latitude, longitude);
  assertTime(timezone, '时区');
  assertTime(clock, '时间');
  const parameters = solarParameters(date);
  const trueSolarTime = wrap(clock + parameters.equationOfTime / 60 + longitude / 15 - timezone, 24);
  const hourAngle = (trueSolarTime - 12) * 15;
  const position = positionAtHourAngle(parameters, latitude, hourAngle);
  return {
    altitude: position.altitude,
    azimuth: position.azimuth,
    hourAngle,
    declination: parameters.declination,
    equationOfTime: parameters.equationOfTime,
    trueSolarTime,
    aboveHorizon: position.sinAltitude > 1e-12,
  };
}

/**
 * Geometric sunrise/sunset (sun centre on the horizon), ignoring atmospheric refraction.
 * `rise`, `set` and `noon` are clock hours in the selected fixed timezone; they are wrapped to [0,24).
 */
export function solarDay(
  date: SolarDate,
  latitude: number,
  longitude: number,
  timezone: number = SOLAR_TIMEZONE,
): DayEvents {
  assertDate(date);
  assertLocation(latitude, longitude);
  assertTime(timezone, '时区');
  const parameters = solarParameters(date);
  const phi = latitude * RAD;
  const declination = parameters.declination * RAD;
  const noon = wrap(12 - parameters.equationOfTime / 60 - longitude / 15 + timezone, 24);
  const noonPosition = positionAtHourAngle(parameters, latitude, 0);
  const base = {
    ...parameters,
    noon,
    noonAltitude: noonPosition.altitude,
    noonAzimuth: noonPosition.azimuth,
  };
  if (Math.abs(Math.cos(phi)) < 1e-9) {
    const alwaysUp = Math.sin(phi) * Math.sin(declination) > 0;
    return {
      ...base,
      rise: null,
      set: null,
      riseAzimuth: null,
      setAzimuth: null,
      dayLength: alwaysUp ? 24 : 0,
      polarDay: alwaysUp,
      polarNight: !alwaysUp,
    };
  }
  const cosHourAngle = -Math.tan(phi) * Math.tan(declination);
  if (cosHourAngle < -1) {
    return {...base, rise: null, set: null, riseAzimuth: null, setAzimuth: null, dayLength: 24, polarDay: true, polarNight: false};
  }
  if (cosHourAngle > 1) {
    return {...base, rise: null, set: null, riseAzimuth: null, setAzimuth: null, dayLength: 0, polarDay: false, polarNight: true};
  }
  const hourAngle = Math.acos(cosHourAngle) * DEG;
  return {
    ...base,
    rise: wrap(noon - hourAngle / 15, 24),
    set: wrap(noon + hourAngle / 15, 24),
    riseAzimuth: positionAtHourAngle(parameters, latitude, -hourAngle).azimuth,
    setAzimuth: positionAtHourAngle(parameters, latitude, hourAngle).azimuth,
    dayLength: 2 * hourAngle / 15,
    polarDay: false,
    polarNight: false,
  };
}

/** Samples the above-horizon arc. Polar day produces a closed circle; polar night produces no points. */
export function sunPath(
  date: SolarDate,
  latitude: number,
  longitude: number,
  timezone: number = SOLAR_TIMEZONE,
  samples = 120,
): SunPath {
  if (!Number.isInteger(samples) || samples < 2) throw new RangeError('采样数必须为不小于 2 的整数');
  const day = solarDay(date, latitude, longitude, timezone);
  const parameters = solarParameters(date);
  if (day.polarNight) return {points: [], closed: false};
  const closed = day.polarDay;
  const halfArc = closed ? 180 : day.dayLength * 7.5;
  const points: SunPathPoint[] = [];
  for (let i = 0; i < samples; i++) {
    const fraction = closed ? i / samples : i / (samples - 1);
    const hourAngle = -halfArc + 2 * halfArc * fraction;
    const position = positionAtHourAngle(parameters, latitude, hourAngle);
    points.push({
      altitude: position.altitude,
      azimuth: position.azimuth ?? wrap(hourAngle + 180, 360),
      time: wrap(day.noon + hourAngle / 15, 24),
    });
  }
  return {points, closed};
}

/** East, north, zenith components of a unit vector on the celestial hemisphere. */
export function altAzToENU(altitude: number, azimuth: number): [number, number, number] {
  const alt = altitude * RAD;
  const az = azimuth * RAD;
  const horizontal = Math.cos(alt);
  return [horizontal * Math.sin(az), horizontal * Math.cos(az), Math.sin(alt)];
}

export function formatDuration(hours: number) {
  const totalMinutes = Math.round(hours * 60);
  return `${Math.floor(totalMinutes / 60)}小时${pad(totalMinutes % 60)}分`;
}
