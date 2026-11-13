import {phaseSamples} from '../science/lunarMonth';
import {formatTime, type AstronomyState} from '../science/model';

function Disc({index}: {index: number}) {
  const r = 12;
  const cosine = Math.cos(index * Math.PI / 4);
  const terminator = Math.abs(cosine) < 1e-8
    ? 'L0 -12'
    : `A${Math.abs(cosine)*r} 12 0 0 ${cosine > 0 ? 0 : 1} 0 -12`;
  return <g transform={index > 4 ? 'scale(-1 1)' : undefined}>
    <circle r={r} fill="#39433f"/>
    {index === 4 ? <circle r={r} fill="#fcf3d7"/> :
      index !== 0 && <path d={`M0 -12 A12 12 0 0 1 0 12 ${terminator}Z`} fill="#fcf3d7"/>}
    <circle r={r} fill="none" stroke="#646b5c" strokeWidth=".8"/>
  </g>;
}

export function PhaseAtlas({model, select}: {model: AstronomyState; select: (days: number) => void}) {
  const cx = 168, cy = 131;
  return <figure className="lunar-atlas">
    <svg viewBox="0 0 336 280" aria-label="北极上空所见的月球轨道与地球所见的八种月相">
      <defs><marker id="atlas-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0l8 4-8 4z" fill="#967032"/></marker></defs>
      <circle cx={cx} cy={cy} r="55" fill="none" stroke="#9aab99"/>
      <path d="M209 94a55 55 0 0 0 -21 -15" fill="none" stroke="#967032" markerEnd="url(#atlas-arrow)"/>
      <circle cx={cx} cy={cy} r="12" fill="#597863"/>
      <path d={`M${cx} ${cy-12}a12 12 0 0 1 0 24z`} fill="#b9c9a4"/>
      <text x={cx} y={cy+26}>地球</text>
      <g stroke="#aa843f" markerEnd="url(#atlas-arrow)">
        {[-1,0,1].map(i => <path key={i} d={`M330 ${cy+i*11}h-21`}/>)}
      </g>
      <text x="317" y={cy-21}>日光</text>
      {phaseSamples.map(({name,date,days},i) => {
        const a = i*Math.PI/4, x = Math.cos(a), y = -Math.sin(a);
        const gx = cx + 111*x, gy = cy + 105*y;
        return <g key={name}>
          <g transform={`translate(${cx+55*x} ${cy+55*y})`}>
            <circle r="5" fill="#414d47"/><path d="M0 -5a5 5 0 0 1 0 10z" fill="#f3ddaa" stroke="#8b8d77" strokeWidth=".5"/>
          </g>
          <g transform={`translate(${gx} ${gy})`} role="button" tabIndex={0} aria-label={`定位到${name}，农历${date}`}
            aria-pressed={model.name === name} className="atlas-stop"
            onClick={() => select(days)} onKeyDown={e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();select(days);}}}>
            <rect x="-24" y="-18" width="48" height="63" rx="5" fill="transparent"/>
            {model.name === name && <circle r="16" fill="none" stroke="#657a60" strokeWidth="1.5"/>}
            <Disc index={i}/><text y="27">{name}</text><text y="40" className="atlas-date">{date}</text>
          </g>
        </g>;
      })}
      <circle cx={cx+55*Math.cos(model.elongation)} cy={cy-55*Math.sin(model.elongation)} r="8" fill="none" stroke="#9a6628" strokeWidth="2"/>
    </svg>
    <figcaption>内圈是轨道位置，亮面朝向右侧太阳。外圈是地球所见的月相。点选月相可定位到示例农历日。</figcaption>
  </figure>;
}

function eventTime(hour: number, rise: number) {
  const minutesAfterStart = Math.round((hour < rise ? hour + 24 : hour) * 60);
  return (minutesAfterStart >= 1440 && Math.round(rise * 60) < 1440 ? '次日 ' : '') + formatTime(hour);
}

export function LunarEvents({model}: {model: AstronomyState}) {
  const signedAngle = model.progress > 0.5 ? (model.progress-1)*360 : model.progress*360;
  const degrees = Math.abs(signedAngle);
  const offset = Math.abs(signedAngle/15);
  return <section className="lunar-events">
    <h3>{model.name} · 理想时刻</h3>
    <dl>{[['月出',formatTime(model.rise)],['上中天',eventTime(model.transit,model.rise)],['月落',eventTime(model.set,model.rise)]].map(([label,time]) =>
      <div key={label}><dt>{label}</dt><dd>{time}</dd></div>)}</dl>
    <h4>为什么会在这些时刻？</h4>
    <figure className="transit-clock">
      <svg viewBox="0 0 104 94" role="img" aria-label={`太阳正午上中天，月球约 ${formatTime(model.transit)} 上中天`}>
        <circle cx="52" cy="47" r="29" fill="#eeeddf" stroke="#a5ad9b"/>
        {['12','18','00','06'].map((hour,i)=><text key={hour} x={[52,94,52,10][i]} y={[13,50,90,50][i]} textAnchor="middle">{hour}</text>)}
        <path d="M52 47V20" stroke="#b08236" strokeWidth="3"/>
        <path transform={`rotate(${model.progress*360} 52 47)`} d="M52 47V26m-3 5 3-6 3 6" fill="none" stroke="#426653" strokeWidth="2.5"/>
        <circle cx="52" cy="47" r="2.6" fill="#426653"/>
      </svg>
      <figcaption><b>上中天时差</b><span>金针　太阳 12:00</span><span>绿针　月球 {formatTime(model.transit)}</span></figcaption>
    </figure>
    <p>地球自转让天体东升西落。太阳在当地正午经过子午线，地球每转约 15°，约经过 1 小时。</p>
    <p>{degrees < 0.05 ? '此时月球与太阳同向，两者约同时升起、上中天和落下。新月的亮面背向地球。' :
      `此时月球在太阳以${signedAngle > 0 ? '东' : '西'}约 ${degrees.toFixed(0)}°，所以它比太阳约${signedAngle > 0 ? '晚' : '早'} ${offset.toFixed(1)} 小时上中天。`}</p>
    <p>在赤道、月球赤纬为零的模型中，月出至上中天、上中天至月落各约 6 小时。表中为当地太阳时，实际钟表时刻随地点和日期而变。</p>
    <details><summary>八种典型月相时刻对照</summary>
      <table><thead><tr>{['月相','月出','上中天','月落'].map(t=><th key={t}>{t}</th>)}</tr></thead>
        <tbody>{phaseSamples.map(({name,model:m})=><tr key={name}><th>{name}</th>{[m.rise,m.transit,m.set].map((t,i)=><td key={i}>{eventTime(t,m.rise)}</td>)}</tr>)}</tbody></table>
    </details>
    <p className="caption">资料　<a href="https://science.nasa.gov/moon/moon-phases/" target="_blank" rel="noreferrer">NASA 月相</a> · <a href="https://astronomy.swin.edu.au/cosmos/p/Phases" target="_blank" rel="noreferrer">斯威本科技大学时刻对照</a></p>
  </section>;
}
