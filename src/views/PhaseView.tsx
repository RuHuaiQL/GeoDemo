import MoonDisc from './MoonDisc';
import {memo} from 'react';
import type {AstronomyState} from '../science/model';
// Equal-height strips sample the analytical terminator, not an artistic mask.
export function phaseStrips(m:AstronomyState, count=400){
 const c=-m.moonLight[2], waxing=m.moonLight[0]>=0;
 return Array.from({length:count},(_,i)=>{const y=-1+(i+0.5)*2/count,r=Math.sqrt(1-y*y);return {y:y-1/count,x:waxing?c*r:-r,width:(1-c)*r,height:2/count};});
}
function PhaseView({model,hidden}:{model:AstronomyState;hidden:boolean}){
 return <section className="phase-preview" aria-label="月相预览">{hidden?<p>月面已隐藏</p>:<div data-testid="phase-view" data-illumination={model.illumination}><MoonDisc model={model}/><strong>{model.name}</strong></div>}</section>;
}
export default memo(PhaseView,(a,b)=>a.hidden===b.hidden&&a.model.elongation===b.model.elongation);
