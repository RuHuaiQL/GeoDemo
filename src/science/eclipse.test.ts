import {it,expect} from 'vitest';
import {CONTACTS,START,END,UMBRA,PENUMBRA,eclipseAt,shadowRadii} from './eclipse';
it('真实时长',()=>{expect(END-START).toBeCloseTo(19641.9);expect(CONTACTS[4].seconds-CONTACTS[2].seconds).toBeCloseTo(4961.4)});
it('接触相切',()=>{const radii=[PENUMBRA+1,UMBRA+1,UMBRA-1,.2721/(969.8/3600),UMBRA-1,UMBRA+1,PENUMBRA+1];CONTACTS.forEach((c,i)=>expect(eclipseAt(c.seconds).distance).toBeCloseTo(radii[i],8))});
it('东缘先食与远交点无食',()=>{const e=eclipseAt(CONTACTS[1].seconds+10);expect(e.cx).toBeGreaterThan(0);expect(Math.hypot(e.cx-1,e.cy)).toBeLessThan(Math.hypot(e.cx+1,e.cy));for(const c of CONTACTS)expect(eclipseAt(c.seconds,true).magnitude).toBe(0)});
it('影锥比例',()=>{expect(shadowRadii(400000).umbra).toBeLessThan(shadowRadii(300000).umbra);expect(shadowRadii(400000).penumbra).toBeGreaterThan(shadowRadii(300000).penumbra);expect(UMBRA).toBeCloseTo(2.747,2);expect(PENUMBRA).toBeCloseTo(4.711,2)});
