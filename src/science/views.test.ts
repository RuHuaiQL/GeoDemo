import {it,expect} from 'vitest';
import {calculate,SYNODIC_MONTH as S} from './model';
import {phaseStrips} from '../views/PhaseView';
it('月面投影面积与核心照明一致，盈亏方向正确',()=>{for(let i=0;i<32;i++){const m=calculate(i*S/32,12),strips=phaseStrips(m);expect(strips.reduce((a,r)=>a+r.width*r.height,0)/Math.PI).toBeCloseTo(m.illumination,4)}const waxing=phaseStrips(calculate(S/4,12))[200];const waning=phaseStrips(calculate(3*S/4,12))[200];expect(waxing.x).toBeCloseTo(0);expect(waning.x+waning.width).toBeCloseTo(0)});
it('自转只改变观测者，惯性位置和光照不变',()=>{const a=calculate(7,6),b=calculate(7,18);expect(a.moonPosition).toEqual(b.moonPosition);expect(a.moonLight).toEqual(b.moonLight);expect(b.observerLongitude-a.observerLongitude).toBeCloseTo(Math.PI);expect(a.enu[2]).toBeCloseTo(-b.enu[2])});
