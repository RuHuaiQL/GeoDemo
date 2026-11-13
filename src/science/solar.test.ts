import {describe, it, expect} from 'vitest';
import {
  SOLAR_TIMEZONE, altAzToENU, dayOfYear, formatDuration, parseISODate, solarDay,
  solarParameters, solarPosition, sunPath, toISODate,
} from './solar';

const beijing = {latitude: 39.9042, longitude: 116.4074};
const summer = {year: 2026, month: 6, day: 21};
const winter = {year: 2026, month: 12, day: 21};

describe('太阳视运动核心', () => {
  it('日期与年积日', () => {
    expect(dayOfYear(2026, 1, 1)).toBe(1);
    expect(dayOfYear(2026, 12, 31)).toBe(365);
    expect(dayOfYear(2024, 12, 31)).toBe(366);
    expect(parseISODate('2026-06-21')).toEqual(summer);
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(toISODate(summer)).toBe('2026-06-21');
  });

  it('二分二至赤纬与正午高度', () => {
    const june = solarParameters(summer);
    const december = solarParameters(winter);
    const equinox = solarParameters({year: 2026, month: 3, day: 20});
    expect(june.declination).toBeCloseTo(23.44, 0);
    expect(december.declination).toBeCloseTo(-23.44, 0);
    expect(Math.abs(equinox.declination)).toBeLessThan(1);
    const summerDay = solarDay(summer, beijing.latitude, beijing.longitude);
    const winterDay = solarDay(winter, beijing.latitude, beijing.longitude);
    expect(summerDay.noonAltitude).toBeCloseTo(73.5, 0);
    expect(winterDay.noonAltitude).toBeCloseTo(26.6, 0);
  });

  it('北京夏至日出日落、昼长和方位', () => {
    const day = solarDay(summer, beijing.latitude, beijing.longitude);
    expect(day.polarDay).toBe(false);
    expect(day.polarNight).toBe(false);
    expect(day.noon).toBeCloseTo(12.27, 1);
    expect(day.dayLength).toBeCloseTo(14.84, 1);
    expect(day.rise).toBeCloseTo(4.85, 1);
    expect(day.set).toBeCloseTo(19.68, 1);
    const rise = solarPosition(summer, beijing.latitude, beijing.longitude, SOLAR_TIMEZONE, day.rise!);
    expect(rise.altitude).toBeCloseTo(0, 6);
    expect(rise.azimuth).toBeCloseTo(58.8, 0);
    const noon = solarPosition(summer, beijing.latitude, beijing.longitude, SOLAR_TIMEZONE, day.noon);
    expect(noon.altitude).toBeCloseTo(day.noonAltitude, 8);
    expect(noon.azimuth).toBeCloseTo(180, 4);
  });

  it('上午偏东、下午偏西且关于正午对称', () => {
    const day = solarDay(summer, beijing.latitude, beijing.longitude);
    const morning = solarPosition(summer, beijing.latitude, beijing.longitude, SOLAR_TIMEZONE, day.noon - 6);
    const afternoon = solarPosition(summer, beijing.latitude, beijing.longitude, SOLAR_TIMEZONE, day.noon + 6);
    expect(morning.azimuth).not.toBeNull();
    expect(afternoon.azimuth).not.toBeNull();
    expect(morning.azimuth!).toBeLessThan(180);
    expect(afternoon.azimuth!).toBeGreaterThan(180);
    expect(morning.azimuth! + afternoon.azimuth!).toBeCloseTo(360, 4);
    expect(morning.altitude).toBeCloseTo(afternoon.altitude, 8);
  });

  it('极昼、极夜与极点方位未定义', () => {
    const polarDay = solarDay(summer, 80, 0);
    const polarNight = solarDay(winter, 80, 0);
    expect(polarDay.polarDay).toBe(true);
    expect(polarDay.rise).toBeNull();
    expect(polarDay.dayLength).toBe(24);
    expect(polarDay.noonAltitude).toBeCloseTo(33.6, 0);
    expect(polarNight.polarNight).toBe(true);
    expect(polarNight.noonAltitude).toBeCloseTo(-13.4, 0);
    const pole = solarPosition(summer, 90, 0, 0, 3);
    expect(pole.altitude).toBeCloseTo(23.44, 1);
    expect(pole.azimuth).toBeNull();
    expect(solarDay(summer, 90, 0).polarDay).toBe(true);
  });

  it('轨迹只取地平线以上且端点日出日落', () => {
    const path = sunPath(summer, beijing.latitude, beijing.longitude, SOLAR_TIMEZONE, 90);
    expect(path.closed).toBe(false);
    expect(path.points.length).toBe(90);
    expect(path.points[0].altitude).toBeCloseTo(0, 5);
    expect(path.points[path.points.length - 1].altitude).toBeCloseTo(0, 5);
    expect(path.points.every(point => point.altitude >= -1e-6)).toBe(true);
    const polarPath = sunPath(summer, 80, 0, SOLAR_TIMEZONE, 72);
    expect(polarPath.closed).toBe(true);
    expect(Math.min(...polarPath.points.map(point => point.altitude))).toBeGreaterThan(13);
    expect(sunPath(winter, 80, 0).points).toEqual([]);
  });

  it('赤道春分接近天顶，ENU 为单位向量', () => {
    const day = solarDay({year: 2026, month: 3, day: 20}, 0, 0, 0);
    expect(day.noonAltitude).toBeGreaterThan(89);
    expect(day.dayLength).toBeCloseTo(12, 0);
    for (const pair of [[0, 90], [45, 180], [73.5, 58.8], [90, 0]]) {
      const vector = altAzToENU(pair[0], pair[1]);
      expect(vector.reduce((sum, value) => sum + value * value, 0)).toBeCloseTo(1, 10);
    }
  });

  it('非法输入与时长格式', () => {
    expect(() => solarPosition(summer, 91, 0, 8, 12)).toThrow(RangeError);
    expect(() => solarPosition(summer, 0, 181, 8, 12)).toThrow(RangeError);
    expect(() => solarPosition(summer, 0, 0, 8, NaN)).toThrow(RangeError);
    expect(() => solarDay({year: 2026, month: 2, day: 30}, 0, 0)).toThrow(RangeError);
    expect(() => sunPath(summer, 0, 0, 8, 1)).toThrow(RangeError);
    expect(formatDuration(24)).toBe('24小时00分');
    expect(formatDuration(14.835)).toBe('14小时50分');
  });
});
