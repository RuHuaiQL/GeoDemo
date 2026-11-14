import WakeSlider from './WakeSlider';
import {Suspense, useEffect, useState} from 'react';
import {Canvas} from '@react-three/fiber';
import {DoubleSide} from 'three';
import {CONTACTS, START, END, UMBRA, PENUMBRA, eclipseAt, clock, type EclipseState} from '../science/eclipse';
import {calculate, SYNODIC_MONTH} from '../science/model';
import {ExperimentTitle} from './ExperimentMotion';
import MoonDisc from './MoonDisc';
import Stars, {type StarSettings} from './Stars';
import {Earth, Moon} from './CelestialBodies';

const full = calculate(SYNODIC_MONTH / 2, 0);
const moonRadius = .3;
const earthRadius = 6378.137 / 1737.4 * moonRadius;
const shadows = [
  {radius:PENUMBRA * moonRadius, color:'#b7a27e', opacity:.12, rim:'#b7a27e'},
  {radius:UMBRA * moonRadius, color:'#492333', opacity:.45, rim:'#d79569'},
];

function EclipseScene({event}: {event: EclipseState}) {
  return <div className="eclipse-cone" aria-label="本影收敛与半影发散的三维示意">
    <Canvas frameloop="demand" dpr={[1,1.5]} camera={{position:[0,6,11],fov:40}} onCreated={({camera})=>camera.lookAt(0,0,0)}>
      <ambientLight intensity={1}/><directionalLight position={[-10,0,0]} intensity={2}/>
      <Suspense fallback={null}>
        <group position={[-3,0,0]}><Earth radius={earthRadius}/></group>
        {shadows.map(({radius,color,opacity,rim}) => <group key={color}>
          <mesh rotation={[0,0,-Math.PI/2]}>
            <cylinderGeometry args={[radius,earthRadius,6,64,1,true]}/>
            <meshBasicMaterial color={color} transparent opacity={opacity} side={DoubleSide} depthWrite={false}/>
          </mesh>
          <mesh position={[3,0,0]} rotation={[0,Math.PI/2,0]}>
            <torusGeometry args={[radius,.015,8,80]}/><meshBasicMaterial color={rim}/>
          </mesh>
        </group>)}
        <group position={[3,event.cy*moonRadius,event.cx*moonRadius]}>
          <Moon radius={moonRadius} color={event.total ? '#bc623f' : 'white'}/>
        </group>
      </Suspense>
    </Canvas>
  </div>;
}

export default function EclipseLab({stars,starsPaused}: {stars?: StarSettings; starsPaused?: boolean}) {
  const [time,setTime] = useState(START);
  const [playing,setPlaying] = useState(false);
  const event = eclipseAt(time);
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const step = (now-last)/1000 * 600;
      last = now;
      if (!document.hidden) setTime(t => Math.min(END,t+step));
    },50);
    return () => clearInterval(timer);
  },[playing]);
  useEffect(() => {if (time === END) setPlaying(false);}, [time]);

  function jump(seconds: number) {
    setPlaying(false);
    setTime(seconds);
  }
  function togglePlayback() {
    if (time === END) setTime(START);
    setPlaying(!playing);
  }
  return <div className="eclipse-lab">
    <Stars settings={stars} paused={starsPaused}/>
    <div className="eclipse-heading">
      <p className="eyebrow">ECLIPSE / 2025.09.07</p><ExperimentTitle>穿过地球的影子</ExperimentTitle>
    </div>
    <EclipseScene event={event}/>
    <section className="phase-preview eclipse-preview"><MoonDisc model={full} eclipse={event}/></section>
    <section className="eclipse-timeline">
      <div className="timeline-heading">
        <strong>{clock(time)} UT1</strong><span>2025-09-07 · {event.stage}</span>
        <button onClick={togglePlayback}>{playing?'暂停月食':'播放月食'}</button><span>×600</span>
      </div>
      <label htmlFor="eclipse-time">月食时间轴（真实时间）</label>
      <WakeSlider id="eclipse-time" min={START} max={END} step="1" value={time} onChange={ev=>jump(+ev.target.value)}/>
      <div className="contact-track">{CONTACTS.map(c =>
        <button key={c.id} style={{left:(c.seconds-START)/(END-START)*100+'%'}} onClick={()=>jump(c.seconds)} title={c.time+' UT1'}>
          <small>{c.id}</small>{c.name}
        </button>)}</div>
      <p className="caption">Eclipse Predictions by Fred Espenak · <a href="https://www.eclipsewise.com/lunar/LEprime/2001-2100/LE2025Sep07Tprime.html" target="_blank" rel="noreferrer">数据与方法</a> · 月食轴独立于地方太阳时，退出恢复原月相。</p>
    </section>
  </div>;
}
