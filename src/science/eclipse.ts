export const MOON_ANGLE=969.8/3600;
export const UMBRA=.7400/MOON_ANGLE, PENUMBRA=1.2691/MOON_ANGLE;
export const IMPACT=.2721/MOON_ANGLE;
export const INCLINATION=5.145;
export const CONTACTS=[['P1','半影食始','15:28:06.0'],['U1','初亏','16:26:51.0'],['U2','食既','17:30:36.6'],['MAX','食甚','18:11:46.1'],['U3','生光','18:53:18.0'],['U4','复圆','19:56:53.3'],['P4','半影食终','20:55:27.9']].map(([id,name,time])=>{const [h,m,s]=time.split(':').map(Number);return {id,name,time,seconds:h*3600+m*60+s}});
export const START=CONTACTS[0].seconds, END=CONTACTS[6].seconds;
const distances=[PENUMBRA+1,UMBRA+1,UMBRA-1,IMPACT,UMBRA-1,UMBRA+1,PENUMBRA+1];
export function eclipseAt(seconds:number,away=false){
 const t=Math.max(START,Math.min(END,seconds));let i=0;while(i<5&&t>CONTACTS[i+1].seconds)i++;
 const x=(j:number)=>Math.sqrt(Math.max(0,distances[j]**2-IMPACT**2))*(j<3?1:j>3?-1:0);
 const fraction=(t-CONTACTS[i].seconds)/(CONTACTS[i+1].seconds-CONTACTS[i].seconds);
 const cx=x(i)+(x(i+1)-x(i))*fraction,cy=away?384400*Math.sin(INCLINATION*Math.PI/180)/1737.4:-IMPACT;
 const distance=Math.hypot(cx,cy);const magnitude=Math.max(0,(UMBRA+1-distance)/2);
 const stage=away?'远离交点 · 无月食':t>=END?'半影食终':t<CONTACTS[1].seconds?'半影食阶段':t<CONTACTS[2].seconds?'初亏 → 食既':t<CONTACTS[4].seconds?'全食阶段':t<CONTACTS[5].seconds?'生光 → 复圆':'复圆 → 半影食终';
 return {seconds:t,cx,cy,distance,magnitude,stage,total:distance<=UMBRA-1,away};
}
export type EclipseState=ReturnType<typeof eclipseAt>;
export function clock(seconds:number){const n=Math.round(seconds);return [Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(x=>String(x).padStart(2,'0')).join(':')}
export function shadowRadii(distance:number){return {umbra:6378.137-distance*(695700-6378.137)/149597870.7,penumbra:6378.137+distance*(695700+6378.137)/149597870.7}}
