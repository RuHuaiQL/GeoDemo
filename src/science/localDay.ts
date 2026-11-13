import {dayNames} from './lunarMonth';
import {formatTime} from './model';

const HOUR = 3600000;
const lunarCalendar = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {month: 'long', day: 'numeric', timeZone: 'UTC'});

export function lunarDate(iso: string) {
  const parts = lunarCalendar.formatToParts(new Date(iso + 'T12:00:00Z'));
  const month = parts.find(p => p.type === 'month')?.value;
  const day = Number(parts.find(p => p.type === 'day')?.value);
  return month + dayNames[day - 1];
}

/** Slider hours are elapsed hours from local midnight, even on a DST transition. */
export function localDay(iso: string, longitude: number, timeZone?: string) {
  const utcDate = Date.parse(iso + 'T00:00:00Z');
  const zone = timeZone && new Intl.DateTimeFormat('en-US', {timeZone, timeZoneName: 'longOffset'});
  function offset(instant: number) {
    if (!zone) return Math.round(longitude / 15);
    const part = zone.formatToParts(instant).find(p => p.type === 'timeZoneName')!.value;
    const match = /GMT([+-])(\d+):(\d+)/.exec(part);
    return match ? (Number(match[2]) + Number(match[3]) / 60) * (match[1] === '-' ? -1 : 1) : 0;
  }
  function midnight(date: number) {
    const guess = date - offset(date) * HOUR;
    return date - offset(guess) * HOUR;
  }
  const start = midnight(utcDate);
  const hours = (midnight(utcDate + 24 * HOUR) - start) / HOUR;
  const baseOffset = (utcDate - start) / HOUR;
  function clock(elapsed: number) {
    if (elapsed === hours) return '00:00';
    return formatTime(elapsed - baseOffset + offset(start + elapsed * HOUR));
  }
  return {start, hours, baseOffset, clock, offset};
}
