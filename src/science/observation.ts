import {calculate,wrap} from './model';
/** Open interval between ideal rise and set. Endpoints lie on the horizon. */
export function inObservationWindow(days:number,hour:number){const m=calculate(days,hour),elapsed=wrap(hour-m.rise,24);return elapsed>1e-9&&elapsed<12-1e-9;}
export function matchesWindow(days:number,start:number,end:number){const m=calculate(days,12);return Math.abs(wrap(start-m.rise+12,24)-12)<1e-8&&Math.abs(wrap(end-m.set+12,24)-12)<1e-8;}
