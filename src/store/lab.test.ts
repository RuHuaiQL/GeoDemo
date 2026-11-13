import {beforeEach,expect,it} from 'vitest';
import {useLab} from './lab';
import {calculate,SYNODIC_MONTH} from '../science/model';
import {lunarDay} from '../science/lunarMonth';

beforeEach(()=>useLab.getState().reset());
it('播放推进月龄，手动选日暂停',()=>{
  const s=useLab.getState();
  s.play('phase'); s.advance(.1);
  expect(useLab.getState().days).toBeGreaterThan(0);
  s.setDays(7);
  s.advance(.1);
  expect(useLab.getState().days).toBe(7);
  expect(useLab.getState().playing).toBeNull();
});
it('朔望月播放循环并可重置',()=>{
  useLab.setState({days:SYNODIC_MONTH-.01,playing:'phase',speed:2});
  useLab.getState().advance(.1);
  expect(useLab.getState().days).toBeLessThan(1);
  useLab.getState().reset();
  expect(useLab.getState().speed).toBe(1);
});
it('农历滑块每一档对应同一日期，下一轮回到初一',()=>{
  for(let day=1;day<=30;day++) expect(lunarDay(calculate(day-1,12).progress).number).toBe(day);
  expect(lunarDay(calculate(SYNODIC_MONTH,12).progress).name).toBe('初一');
});
