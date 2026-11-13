import {describe,it,expect} from 'vitest';
import {calculate,SYNODIC_MONTH as S,SIDEREAL_MONTH as M,PHASES,wrap,formatTime} from './model';
describe('教学天文核心',()=>{
 it.each([[0,0,6,12,18],[1,0.5,12,18,0],[2,1,18,0,6],[3,0.5,0,6,12]])('主要月相 %i',(i,k,r,t,s)=>{const m=calculate(i*S/4,12);expect(m.illumination).toBeCloseTo(k,10);expect(m.rise).toBeCloseTo(r);expect(m.transit).toBeCloseTo(t);expect(m.set).toBeCloseTo(s);expect(calculate(i*S/4,t).altitude).toBeCloseTo(90);expect(calculate(i*S/4,r).altitude).toBeCloseTo(0);expect(calculate(i*S/4,s).altitude).toBeCloseTo(0)});
 it.each(PHASES.map((n,i)=>[n,i] as const))('八中心 %s',(name,i)=>expect(calculate(i*S/8,12).name).toBe(name));
 it('区分恒星月与朔望月',()=>{expect(calculate(M,12).moonLongitude).toBeCloseTo(0);expect(calculate(M,12).illumination).toBeGreaterThan(0.01);expect(calculate(S,12).illumination).toBeCloseTo(0);expect(calculate(S,12).moonLongitude).toBeGreaterThan(0.1)});
 it('太阳时独立、方位与天顶',()=>{expect(calculate(S/4,3).illumination).toBe(calculate(S/4,19).illumination);expect(calculate(0,6).azimuth).toBe(90);expect(calculate(0,18).azimuth).toBe(270);expect(calculate(0,12).azimuth).toBeNull()});
 it('周期及向量不变量',()=>{for(let d=-60;d<60;d+=0.37){const m=calculate(d,15);expect(m.illumination).toBeGreaterThanOrEqual(0);expect(m.illumination).toBeLessThanOrEqual(1);expect(calculate(d+S,15).illumination).toBeCloseTo(m.illumination,8);expect(m.enu.reduce((a,b)=>a+b*b,0)).toBeCloseTo(1);expect(Math.cos(m.moonLongitude-m.sunLongitude)).toBeCloseTo(Math.cos(m.elongation),8)}});
 it('输入与时间边界',()=>{expect(wrap(-1,24)).toBe(23);expect(formatTime(24)).toBe('00:00');expect(calculate(0,24).localSolarTime).toBe(0);expect(()=>calculate(NaN,12)).toThrow();expect(()=>calculate(0,Infinity)).toThrow()});
});
