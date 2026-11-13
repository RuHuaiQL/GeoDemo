import {create} from 'zustand';
import {SYNODIC_MONTH,wrap} from '../science/model';

type State = {
  days: number; hidden: boolean; playing: 'phase' | null; speed: number;
  setDays: (days:number) => void; toggle: () => void; reset: () => void;
  play: (mode:'phase'|null) => void; setSpeed: (speed:number) => void; advance: (seconds:number) => void;
};
const defaults = {days:0, hidden:false, playing:null, speed:1};
export const useLab = create<State>(set => ({
  ...defaults,
  setDays: days => set({days,playing:null}),
  toggle: () => set(s=>({hidden:!s.hidden})),
  reset: () => set(defaults),
  play: mode => set(s=>({playing:s.playing===mode?null:mode})),
  setSpeed: speed => set({speed}),
  advance: seconds => set(s => {
    if (!s.playing || !Number.isFinite(seconds) || seconds <= 0) return {};
    return {days:wrap(s.days + Math.min(seconds,0.25)*s.speed*SYNODIC_MONTH/30,SYNODIC_MONTH)};
  }),
}));
