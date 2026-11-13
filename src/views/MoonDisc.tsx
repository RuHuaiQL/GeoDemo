import {useEffect,useRef,useState} from 'react';
import type {AstronomyState} from '../science/model';
import {UMBRA,PENUMBRA,type EclipseState} from '../science/eclipse';
export default function MoonDisc({model,eclipse}:{model:AstronomyState;eclipse?:EclipseState}){
 const ref=useRef<HTMLCanvasElement>(null),[map,setMap]=useState<ImageData|null>(null),[failed,setFailed]=useState(false);
 useEffect(()=>{let active=true;const im=new Image();im.onload=()=>{if(!active)return;const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const ctx=c.getContext('2d')!;ctx.drawImage(im,0,0);setMap(ctx.getImageData(0,0,c.width,c.height))};im.onerror=()=>{if(active)setFailed(true)};im.src='/textures/moon.jpg';return()=>{active=false}},[]);
 useEffect(()=>{const ctx=ref.current?.getContext('2d');if(!ctx)return;const n=320,out=ctx.createImageData(n,n);
 for(let py=0;py<n;py++)for(let px=0;px<n;px++){const x=(px+.5-n/2)/(n/2),y=(n/2-py-.5)/(n/2),r=x*x+y*y;if(r>1)continue;const z=Math.sqrt(1-r),longitude=Math.atan2(x,z),lat=Math.asin(y);
 const u=Math.min((map?.width??1)-1,Math.max(0,Math.floor((.5+longitude/(2*Math.PI))*(map?.width??1)))),v=Math.min((map?.height??1)-1,Math.max(0,Math.floor((.5-lat/Math.PI)*(map?.height??1))));const at=(v*(map?.width??1)+u)*4,idx=(py*n+px)*4;
 const dot=x*model.moonLight[0]+z*model.moonLight[2];let light=dot>0?Math.pow(dot,.35):.008;let rgb=[1,1,1];
 if(eclipse){light=1;const d=Math.hypot(x+eclipse.cx,y+eclipse.cy);if(d<PENUMBRA)light=.2+.8*Math.max(0,Math.min(1,(d-UMBRA)/(PENUMBRA-UMBRA)));if(d<UMBRA){const edge=Math.pow(d/UMBRA,3);light=.16+.65*edge;rgb=[1,.24+.13*edge,.075]}}
 for(let k=0;k<3;k++)out.data[idx+k]=(map?map.data[at+k]:145)*light*rgb[k];out.data[idx+3]=255;
 }ctx.putImageData(out,0,0)},[map,model.elongation,eclipse]);
 return <><canvas ref={ref} width="320" height="320" className="moon-disc" role="img" aria-label={eclipse?'月食地球观测：北上东左':`${model.name}，北上东左，固定近地月面`}/>{failed&&<small>纹理加载失败，使用灰色几何模型</small>}</>;
}
