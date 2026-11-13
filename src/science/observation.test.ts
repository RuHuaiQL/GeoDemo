import {it,expect} from 'vitest';
import {inObservationWindow,matchesWindow} from './observation';
import {calculate,SYNODIC_MONTH as S} from './model';
it('跨午夜与边界',()=>{expect(matchesWindow(S/2,18,6)).toBe(true);expect(matchesWindow(S/2,6,18)).toBe(false);expect(inObservationWindow(S/2,23)).toBe(true);expect(inObservationWindow(S/2,1)).toBe(true);expect(inObservationWindow(S/2,12)).toBe(false);expect(inObservationWindow(S/2,18)).toBe(false);expect(inObservationWindow(S/2,6)).toBe(false)});
it('升落区间与地平高度统一',()=>{for(let d=0;d<S;d+=.73)for(let h=0;h<24;h+=.37)expect(inObservationWindow(d,h)).toBe(calculate(d,h).aboveHorizon)});
