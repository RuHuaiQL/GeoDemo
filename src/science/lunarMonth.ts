import {calculate, PHASES, SYNODIC_MONTH} from './model';

export const dayNames = [
  '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十',
];

export function lunarDay(progress: number) {
  const index = Math.floor(progress * SYNODIC_MONTH + 1e-10);
  return {number: index + 1, name: dayNames[index]};
}

export const phaseSamples = PHASES.map((name, index) => {
  const days = SYNODIC_MONTH * index / 8;
  const model = calculate(days, 12);
  return {name, days, date: lunarDay(model.progress).name, model};
});
