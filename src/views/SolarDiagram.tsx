import {SITE_CONSTANTS as dims, formatDegrees, formatMeters, formatPercent, panelTilt, shadowLength, daylightDepth, shadingAt, spacingLength, type SiteDefinition} from '../science/solarSites';

const rad = Math.PI / 180;
const ground = 124;

function Rule({x, end, y, label}: {x: number; end: number; y: number; label: string}) {
  return <g className="section-rule">
    <path d={`M${x} ${y}H${end} M${x} ${y-3}v6 M${end} ${y-3}v6`}/>
    <text x={(x+end)/2} y={y+16} textAnchor="middle">{label}</text>
  </g>;
}

function Building({x, height}: {x: number; height: number}) {
  return <g>
    <rect className="section-wall" x={x} y={ground-height} width="44" height={height}/>
    {[0,1,2].filter(row => height > 14+row*11).map(row => <path key={row} stroke="#8ba1a0" strokeWidth="6" strokeDasharray="6 4" d={`M${x+8} ${ground-height+10+row*11}h29`}/>)}
  </g>;
}

function Section({site, noon, winter, summer, altitude}: {site: SiteDefinition; noon: number; winter: number; summer: number; altitude: number}) {
  if (site.id === 'spacing') {
    const gap = spacingLength(winter);
    const scale = Math.min(75/dims.buildingHeight, 166/Math.max(gap ?? 0,0.001));
    const h = dims.buildingHeight*scale, front = 58+(gap ?? 120/scale)*scale;
    return <>
      <Building x={14} height={h}/><Building x={front} height={h}/>
      <text x="14" y={ground-h-9}>后楼</text><text x={front} y={ground-h-9}>前楼</text>
      {gap !== null && <><path className="section-ray" d={`M${front} ${ground-h}L58 ${ground}`}/><path fill="none" stroke="#af7927" d={`M74 124 A16 16 0 0 0 ${58+16*Math.cos(winter*rad)} ${124-16*Math.sin(winter*rad)}`}/><text x="10" y="19">H冬 {formatDegrees(winter)}</text></>}
      <text x="286" y="19" textAnchor="end">h {formatMeters(dims.buildingHeight,0)}</text>
      <Rule x={58} end={front} y={135} label={gap === null ? '冬至正午无直射光' : `最小间距 L  ${formatMeters(gap)}`}/>
    </>;
  }
  if (site.id === 'waterHeater') {
    const tilt = panelTilt(noon) ?? 0;
    const dx = 94 * Math.cos(tilt * rad), dy = 94 * Math.sin(tilt * rad);
    const cx = 111 + dx/2, cy = ground - dy/2;
    return <>
      <path stroke="#426576" strokeWidth="6" d={`M111 ${ground}l${dx} ${-dy}`}/>
      {noon > 0 && <g transform={`translate(${cx} ${cy}) rotate(${-tilt})`}>
        <path className="section-ray" d="M0 -65V0" markerEnd="url(#site-ray-tip)"/>
        <path fill="none" stroke="#526a68" d="M0 -7h7v7"/>
      </g>}
      <text x="12" y="32">{noon > 0 ? `正午光线  H ${formatDegrees(noon)}` : '正午无直射光'}</text>
      <path fill="none" stroke="#7b8c80" d={`M133 124 A22 22 0 0 0 ${111+22*Math.cos(tilt*rad)} ${124-22*Math.sin(tilt*rad)}`}/>
      <text x="210" y="102">集热板</text>
      <text x="150" y="149" textAnchor="middle">{noon > 0 ? `板面与水平面夹角 α  ${formatDegrees(tilt)}` : '无直射集热角'}</text>
    </>;
  }
  if (site.id === 'shadow') {
    const length = shadowLength(dims.poleHeight, altitude);
    // Fit the whole triangle, even when the Sun is close to the horizon.
    const scale = Math.min(74/dims.poleHeight, 170/Math.max(length ?? 0, 0.001));
    const top = ground - dims.poleHeight * scale, end = 84 + (length ?? 0)*scale;
    return <>
      <text x="12" y="27">此刻太阳高度 H  {formatDegrees(altitude)}</text>
      <path stroke="#395957" strokeWidth="4" d={`M84 ${ground}V${top}`}/>
      <text x="10" y="94">杆高 {dims.poleHeight} m</text>
      {length !== null && <><path className="section-ray" d={`M${84-21*Math.cos(altitude*rad)} ${top-21*Math.sin(altitude*rad)}L${end} ${ground}`}/>
        <circle cx={84-21*Math.cos(altitude*rad)} cy={top-21*Math.sin(altitude*rad)} r="3" fill="#c89432"/><path stroke="#607475" strokeWidth="5" d={`M84 ${ground}H${end}`}/></>}
      <Rule x={84} end={end} y={135} label={length === null ? '地平线下或线上，无日影' : `影长  ${formatMeters(length)}`}/>
    </>;
  }
  if (site.id === 'daylight') {
    const depths = [daylightDepth(winter),daylightDepth(summer),daylightDepth(noon)];
    const scale = Math.min(65/dims.windowTop, 190/Math.max(...depths.map(value => value ?? 0),0.001));
    const top = ground-dims.windowTop*scale;
    return <>
      <text x="12" y="23">窗顶高 {formatMeters(dims.windowTop)} · 当日进深 {formatMeters(depths[2])}</text>
      <path className="section-masonry" d={`M72 34V${top} M72 ${ground-dims.windowBottom*scale}V${ground}`}/>
      {depths.map((depth,i) => depth !== null && <path key={i} className={['section-winter','section-ray','section-now'][i]} d={`M72 ${top} L${72+depth*scale} ${ground}`}/>)}
      <text x="10" y="150" fill="#426a83">冬至 {depths[0] === null ? '无直射光' : formatMeters(depths[0])}</text>
      <text x="158" y="150" fill="#935d11">夏至 {depths[1] === null ? '无直射光' : formatMeters(depths[1])}</text>
    </>;
  }
  return <>{[summer,winter].map((angle,i) => {
    const shade = shadingAt(angle), x = i*150+73, scale = 23;
    const edge = shade?.shadowEdge ?? dims.boardHeight;
    const reach = Math.min(dims.boardDepth, dims.boardHeight/Math.max(Math.tan(angle*rad),0.00001));
    return <g key={i}>
      <text x={x} y="23" textAnchor="middle">{i ? '冬至' : '夏至'} {formatDegrees(angle)}</text>
      <path className="section-masonry" d={`M${x} 40V${ground}`}/>
      <rect x={x-3} y={ground-dims.windowTop*scale} width="6" height={(dims.windowTop-dims.windowBottom)*scale} fill="#92c3cf"/>
      {shade && <rect x={x-3} y={ground-dims.windowTop*scale} width="6" height={shade.blockedHeight*scale} fill="#4d667c"/>}
      <path stroke="#456a64" strokeWidth="4" d={`M${x} ${ground-dims.boardHeight*scale}h${-dims.boardDepth*scale}`}/>
      {shade && <path className={i ? 'section-winter':'section-ray'} d={`M${x-dims.boardDepth*scale-22*Math.cos(angle*rad)} ${ground-dims.boardHeight*scale-22*Math.sin(angle*rad)}l${22*Math.cos(angle*rad)} ${22*Math.sin(angle*rad)} l${reach*scale} ${Math.min(dims.boardHeight,dims.boardHeight-edge)*scale}`}/>}
      <text x={x} y="149" textAnchor="middle">{shade ? `遮窗 ${formatPercent(shade.blockedFraction)}` : '正午无直射光'}</text>
    </g>;
  })}</>;
}

export default function SolarDiagram(props: Parameters<typeof Section>[0]) {
  const caption = props.site.id === 'shading'
    ? `板深 ${formatMeters(dims.boardDepth)}，安装高 ${formatMeters(dims.boardHeight)}，窗底至窗顶 ${dims.windowBottom.toFixed(1)}–${formatMeters(dims.windowTop)}`
    : props.site.id === 'shadow'
      ? `正午影长对照　冬至 ${formatMeters(shadowLength(dims.poleHeight,props.winter))} ／ 夏至 ${formatMeters(shadowLength(dims.poleHeight,props.summer))}`
      : props.site.id === 'daylight' ? '蓝线为冬至，金线为夏至，虚线为当日正午。' : null;
  return <figure className="solar-diagram">
    <svg viewBox="0 0 300 162" role="img" aria-label={`${props.site.title}示意图`}>
      <defs><marker id="site-ray-tip" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path fill="#af7927" d="M0 0l8 4-8 4z"/></marker></defs>
      <path stroke="#849088" d={`M8 ${ground}H292`}/>
      <Section {...props}/>
    </svg>
    <figcaption>图 {props.site.order}　{props.site.title} · 示意剖面{caption && <span>{caption}</span>}</figcaption>
  </figure>;
}
