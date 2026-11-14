import GlideSelect from './GlideSelect';
import {useEffect} from 'react';
import {useLab} from '../store/lab';
export default function PlaybackControls(){const s=useLab();
 useEffect(()=>{if(!s.playing)return;let previous=performance.now();const timer=window.setInterval(()=>{const now=performance.now();if(!document.hidden)useLab.getState().advance((now-previous)/1000);previous=now;},50);return()=>clearInterval(timer)},[s.playing]);
 return <div className="playback"><button aria-pressed={s.playing==='phase'} onClick={()=>s.play('phase')}>{s.playing==='phase'?'暂停朔望月':'播放朔望月'}</button><div className="speed-select"><span>播放速度</span><GlideSelect label="播放速度" value={String(s.speed)} onChange={v=>s.setSpeed(Number(v))} options={['0.5','1','2'].map(v=>({value:v,label:v+'×'}))}/></div><p className="caption">1×：30 秒演示一个朔望月。</p></div>;
}
