import {useEffect,useRef,useState,type InputHTMLAttributes} from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {value:number; min:number; max:number};
const bars = Array.from({length:49},(_,i)=>i/48);

export default function WakeSlider({value,min,max,...props}:Props) {
  const progress = (value-min)/(max-min);
  const previous = useRef({value,at:0});
  const [lift,setLift] = useState(0);
  useEffect(()=>{
    const now = performance.now();
    const delta = (value-previous.current.value)/(max-min);
    const elapsed = Math.max(16,now-previous.current.at);
    previous.current = {value,at:now};
    if (!delta || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setLift(Math.sign(delta)*Math.min(1,.25+Math.abs(delta)*1600/elapsed));
    const timer = window.setTimeout(()=>setLift(0),130);
    return ()=>clearTimeout(timer);
  },[value,max,min]);
  return <div className="wake-slider">
    <div className="wake-bars" aria-hidden="true">{bars.map((p,i)=>{
      const tail = (p-progress)*Math.sign(lift)<0 ? .17 : .08;
      const height = 5+15*Math.abs(lift)*Math.max(0,1-Math.abs(p-progress)/tail)**2;
      return <i key={i} data-lit={p<=progress} style={{height}}/>;
    })}</div>
    <i className="wake-cursor" style={{left:progress*100+'%'}} aria-hidden="true"/>
    <input {...props} type="range" min={min} max={max} value={value}/>
  </div>;
}
