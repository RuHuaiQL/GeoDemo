import {it, expect} from 'vitest';
import {
  SITE_CONSTANTS, compassDirection, daylightDepth, litStripDepth, panelTilt,
  shadingAt, shadowAzimuth, shadowLength, spacingLength,
} from './solarSites';

it('最小楼间距随正午太阳高度变化', () => {
  expect(spacingLength(45, 24)).toBeCloseTo(24, 8);
  expect(spacingLength(26.565, 24)).toBeCloseTo(48, 2);
  expect(spacingLength(0, 24)).toBeNull();
  expect(spacingLength(-10, 24)).toBeNull();
  expect(spacingLength(30)).toBeCloseTo(SITE_CONSTANTS.buildingHeight / Math.tan(30 * Math.PI / 180), 8);
});

it('集热板倾角与正午太阳高度互余', () => {
  expect(panelTilt(73.5)).toBeCloseTo(16.5, 6);
  expect(panelTilt(26.6)).toBeCloseTo(63.4, 6);
  expect(panelTilt(-5)).toBe(90);
  expect(panelTilt(Number.NaN)).toBeNull();
});

it('影长随太阳高度降低而变长', () => {
  expect(shadowLength(10, 45)).toBeCloseTo(10, 8);
  expect(shadowLength(10, 26.565)).toBeCloseTo(20, 2);
  expect(shadowLength(10, 90)).toBeCloseTo(0, 8);
  expect(shadowLength(10, 0)).toBeNull();
  expect(shadowLength(10, -1)).toBeNull();
  expect(shadowAzimuth(90)).toBe(270);
  expect(shadowAzimuth(null)).toBeNull();
  expect(compassDirection(0)).toBe('北');
  expect(compassDirection(90)).toBe('东');
  expect(compassDirection(225)).toBe('西南');
});

it('室内采光进深与遮阳板遮挡', () => {
  const winter = 26.565;
  const summer = 73.5;
  expect(daylightDepth(winter, 2.4)).toBeCloseTo(4.8, 2);
  expect(daylightDepth(summer, 2.4)).toBeLessThan(daylightDepth(winter, 2.4)!);
  expect(litStripDepth(winter, 2.4, 1.0)).toBeCloseTo(2.8, 2);
  expect(daylightDepth(-3)).toBeNull();
  const shadeWinter = shadingAt(winter)!;
  const shadeSummer = shadingAt(summer)!;
  expect(shadeWinter.blockedHeight).toBeCloseTo(0.25, 2);
  expect(shadeWinter.blockedFraction).toBeCloseTo(0.25 / 1.4, 4);
  expect(shadeSummer.blockedFraction).toBe(1);
  expect(shadeWinter.openHeight).toBeGreaterThan(shadeSummer.openHeight);
  expect(shadingAt(-1)).toBeNull();
});
