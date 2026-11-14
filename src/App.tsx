import WakeSlider from './views/WakeSlider';
import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {calculate} from './science/model';
import {lunarDay, phaseSamples} from './science/lunarMonth';
import {useLab} from './store/lab';
import FloatingPanel from './views/FloatingPanel';
import {LunarEvents, PhaseAtlas} from './views/LunarPanels';
import PhaseView from './views/PhaseView';
import PlaybackControls from './views/PlaybackControls';
import Stars, {type StarSettings} from './views/Stars';

const loadExperiment = {
  phase: () => import('./views/SpaceView'),
  eclipse: () => import('./views/EclipseLab'),
  solar: () => import('./views/SolarLab'),
};
const SpaceView = lazy(loadExperiment.phase);
const EclipseLab = lazy(loadExperiment.eclipse);
const SolarLab = lazy(loadExperiment.solar);
type Mode = keyof typeof loadExperiment;
const modes = [['phase','月相实验'],['solar','太阳视运动'],['eclipse','月食模拟']] as const;

export default function App({stars, starsPaused}: {stars?: StarSettings; starsPaused?: boolean}) {
  const [mode,setMode] = useState<Mode>('phase');
  const [target,setTarget] = useState<Mode>('phase');
  const [loadError,setLoadError] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLElement>(null);
  useEffect(() => window.GeoMotion.magnets(root.current!), []);
  const [layout,setLayout] = useState(0);
  const s = useLab();
  const model = calculate(s.days,12);
  const date = lunarDay(model.progress);
  useEffect(() => {
    if (target === mode) return;
    let cancelled = false;
    let fade: Animation | undefined;
    async function switchExperiment() {
      // Keep the current experiment visible while fetching the next one.
      try {
        await loadExperiment[target]();
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setTarget(mode);
        }
        return;
      }
      if (cancelled) return;
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const element = content.current;
        if (element) {
          fade = element.animate(
            [{opacity: getComputedStyle(element).opacity}, {opacity: 0}],
            {duration: 160, easing: 'ease-in', fill: 'forwards'},
          );
          await Promise.allSettled([fade.finished]);
        }
      }
      if (!cancelled) setMode(target);
    }
    void switchExperiment();
    return () => {
      cancelled = true;
      fade?.cancel();
    };
  }, [mode, target]);
  function resetLayout() {
    try {for (const key of ['lunar-events','lunar-atlas']) localStorage.removeItem(key);} catch { /* private browsing */ }
    setLayout(value => value+1);
  }
  return <main ref={root} className="observatory" data-mode={mode}>
    <header className="observatory-header">
      <div className="wordmark"><h1>GeoDemo</h1></div>
      <span className="lab-name">地理实验室</span>
      <nav aria-label="实验模块">{modes.map(([id,label]) => <button key={id} aria-pressed={target === id} onClick={() => {
        if (id !== 'phase') s.play(null);
        setLoadError(false);
        setTarget(id);
      }}><span>{label}</span></button>)}</nav>
      <button className="header-note" onClick={resetLayout}>恢复默认布局</button>
    </header>
    {loadError && <p className="module-error" role="alert">实验加载失败，请重新选择模块。</p>}
    <div key={mode} ref={content} className="experiment-content">
    {mode === 'solar' ? <Suspense fallback={<p>加载太阳视运动模型…</p>}><SolarLab/></Suspense> :
     mode === 'eclipse' ? <Suspense fallback={<p>加载月食模型…</p>}><EclipseLab stars={stars} starsPaused={starsPaused}/></Suspense> :
      <div className="phase-lab">
        <Stars settings={stars} paused={starsPaused}/>
        <div className="main-stage">
          <Suspense fallback={<p>加载三维视图…</p>}><SpaceView model={model}/></Suspense>
          <PhaseView model={model} hidden={s.hidden}/>
        </div>
        <aside className="phase-instruments" aria-label="观测面板">
          <FloatingPanel key={`events-${layout}`} id="lunar-events" title="月出、中天与月落"><LunarEvents model={model}/></FloatingPanel>
          <FloatingPanel key={`atlas-${layout}`} id="lunar-atlas" title="一月月相图"><PhaseAtlas model={model} select={s.setDays}/></FloatingPanel>
        </aside>
        <div className="controls-grid"><section className="lunar-dock">
          <div className="lunar-timeline">
            <label htmlFor="lunar-date">农历 <strong>{date.name}</strong></label>
            <WakeSlider id="lunar-date" min={1} max={30} step={1} value={date.number} aria-valuetext={`农历${date.name}`} onChange={e=>s.setDays(Number(e.target.value)-1)}/>
          </div>
          <div className="phase-presets" aria-label="主要月相">{phaseSamples.filter((_,i)=>i%2===0).map(p =>
            <button key={p.name} onClick={()=>s.setDays(p.days)}>{p.name}</button>)}</div>
          <PlaybackControls/>
          <div className="lunar-actions"><button aria-pressed={s.hidden} onClick={s.toggle}>{s.hidden?'显示月相':'隐藏月相'}</button><button onClick={s.reset}>重置</button></div>
        </section></div>
      </div>}
    {mode !== 'solar' && <>
      <details className="help"><summary>使用帮助与模型边界</summary>
        {mode === 'phase' ? <>
          <p>拖动农历日期或播放朔望月，观察月球位置与受光面的变化。初一对应本次模拟的朔，农历日用于表示月龄，实际朔望和上下弦所在的日期会变化。</p>
          <p>拖动模型旋转，滚轮缩放，双击复位。太阳光按平行光处理，三维场景中的天体大小与距离均为示意。</p>
          <p>太阳与地球模型来自 <a href="https://science.nasa.gov/learn/heat/resource/sun-3d-model/">NASA 太阳模型</a>、<a href="https://science.nasa.gov/resource/earth-with-clouds-3d-model/">NASA 带云层地球模型</a>。</p>
        </> : <p>拖动月食时间轴或选择接触节点，可查看各阶段的月面变化。</p>}
      </details>
      <footer>月面纹理：NASA SVS / LRO。尺寸与距离为教学示意。</footer>
    </>}
    </div>
  </main>;
}
