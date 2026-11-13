import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {Component, Suspense, useEffect, useMemo, useRef, useState, type RefObject, type ReactNode} from 'react';
import * as THREE from 'three';
import {CITIES} from '../science/cities';
import {localDay, lunarDate} from '../science/localDay';
import {moonSky} from '../science/moonSky';
import {
   altAzToENU, formatDuration, parseISODate, solarDay, solarPosition, sunPath, toISODate,
  type DayEvents, type SolarPosition, type SunPath, type SunPathPoint,
} from '../science/solar';
import {
  SITES, SITE_CONSTANTS, compassDirection, daylightDepth, formatDegrees, formatMeters, formatPercent,
  panelTilt, shadingAt, shadowAzimuth, shadowLength, spacingLength, type SiteId,
} from '../science/solarSites';
import {useSolar} from '../store/solar';
import {HORIZON_RADIUS, OVERVIEW_CAMERA, OVERVIEW_TARGET, SITE_ANCHORS, SITE_FOCUS, StationWorld, type StationVisualData} from './SolarStations';
import SolarCampus from './SolarCampus';
import SolarDiagram from './SolarDiagram';
import {LabelSprite, type Vec3} from './threeLabels';

const RAD = Math.PI / 180;
const PATH_RADIUS = HORIZON_RADIUS;

function enuToScene([east, north, up]: Vec3, radius: number): Vec3 {
  return [east * radius, up * radius, -north * radius];
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function skyPalette(altitude: number) {
  const dayTop = new THREE.Color('#adc6ce');
  const dayHorizon = new THREE.Color('#e3e7d9');
  const duskTop = new THREE.Color('#18264b');
  const duskHorizon = new THREE.Color('#e08a58');
  const nightTop = new THREE.Color('#040812');
  const nightHorizon = new THREE.Color('#0d1626');
  const top = nightTop.clone();
  const horizon = nightHorizon.clone();
  if (altitude >= 8) {
    top.copy(dayTop);
    horizon.copy(dayHorizon);
  } else if (altitude >= 0) {
    const t = altitude / 8;
    top.copy(duskTop).lerp(dayTop, t);
    horizon.copy(duskHorizon).lerp(dayHorizon, t);
  } else if (altitude >= -10) {
    const t = (altitude + 10) / 10;
    top.copy(nightTop).lerp(duskTop, t);
    horizon.copy(nightHorizon).lerp(duskHorizon, t);
  }
  return {top: `#${top.getHexString()}`, horizon: `#${horizon.getHexString()}`};
}

function makeSkyTexture(top: string, horizon: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, top);
  gradient.addColorStop(1, horizon);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 128);
  ctx.fillStyle = horizon;
  ctx.fillRect(0, 128, 2, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,250,220,0.95)');
  gradient.addColorStop(0.18, 'rgba(255,232,160,0.7)');
  gradient.addColorStop(0.5, 'rgba(255,190,95,0.22)');
  gradient.addColorStop(1, 'rgba(255,170,70,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

class Boundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = {failed: false};
  static getDerivedStateFromError() {
    return {failed: true};
  }
  render() {
    return this.state.failed
      ? <p>太阳视运动三维场景不可用，请启用浏览器 WebGL。</p>
      : this.props.children;
  }
}

type CameraAnimation = {
  fromPosition: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toPosition: THREE.Vector3;
  toTarget: THREE.Vector3;
  elapsed: number;
  duration: number;
};

function CameraRig({focusId, onReset}: {focusId: SiteId | null; onReset: () => void}) {
  const {camera, gl, invalidate, size} = useThree();
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationRef = useRef<CameraAnimation | null>(null);
  const onResetRef = useRef(onReset);
  useEffect(() => {onResetRef.current = onReset;}, [onReset]);

  const animateTo = (position: Vec3, target: Vec3) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const toPosition = new THREE.Vector3(...position);
    const toTarget = new THREE.Vector3(...target);
    if (camera.position.distanceTo(toPosition) < 0.002 && controls.target.distanceTo(toTarget) < 0.002) {
      controls.enabled = true;
      animationRef.current = null;
      return;
    }
    animationRef.current = {
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition,
      toTarget,
      elapsed: 0,
      duration: 0.85,
    };
    controls.enabled = false;
    invalidate();
  };

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.minDistance = 2.5;
    controls.maxDistance = 55;
    controls.minPolarAngle = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.03;
    controls.target.set(...OVERVIEW_TARGET);
    controls.update();
    controlsRef.current = controls;
    const onChange = () => invalidate();
    controls.addEventListener('change', onChange);
    const reset = () => {
      onResetRef.current();
      animateTo(OVERVIEW_CAMERA, OVERVIEW_TARGET);
    };
    gl.domElement.addEventListener('dblclick', reset);
    return () => {
      controls.removeEventListener('change', onChange);
      gl.domElement.removeEventListener('dblclick', reset);
      controls.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl, invalidate]);

  useEffect(() => {
    const preset = focusId ? SITE_FOCUS[focusId] : {camera: OVERVIEW_CAMERA, target: OVERVIEW_TARGET};
    animateTo(preset.camera, preset.target);
  }, [focusId]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    const animation = animationRef.current;
    if (!controls || !animation) return;
    animation.elapsed += Math.min(delta, 0.05);
    const progress = Math.min(1, animation.elapsed / animation.duration);
    const eased = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    camera.position.lerpVectors(animation.fromPosition, animation.toPosition, eased);
    controls.target.lerpVectors(animation.fromTarget, animation.toTarget, eased);
    controls.update();
    invalidate();
    if (progress >= 1) {
      controls.enabled = true;
      animationRef.current = null;
    }
  });

  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const aspect = Math.max(0.3, size.width / Math.max(1, size.height));
      const distance = new THREE.Vector3(...OVERVIEW_CAMERA).distanceTo(new THREE.Vector3(...OVERVIEW_TARGET));
      const vertical = 2 * Math.atan(13 / (distance * Math.min(1, aspect))) * 180 / Math.PI;
      camera.fov = clamp(vertical, 46, 108);
      // Leave room for the floating settings while keeping the canvas edge to edge.
      if (size.width > 760) {
        camera.setViewOffset(size.width, size.height, size.width * (focusId ? -0.16 : 0.075), 0, size.width, size.height);
      } else {
        camera.clearViewOffset();
      }
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [camera, size.width, size.height, invalidate, focusId]);
  return null;
}

function SkyDome({top, horizon}: {top: string; horizon: string}) {
  const texture = useMemo(() => makeSkyTexture(top, horizon), [top, horizon]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh>
    <sphereGeometry args={[38, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}/>
    <meshBasicMaterial map={texture} side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false}/>
  </mesh>;
}

function Stars({opacity}: {opacity: number}) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(600);
    let seed = 23;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 200; i++) {
      const azimuth = random() * Math.PI * 2;
      const altitude = Math.asin(0.04 + random() * 0.95);
      const radius = 31;
      const horizontal = Math.cos(altitude) * radius;
      positions[i * 3] = horizontal * Math.sin(azimuth);
      positions[i * 3 + 1] = Math.sin(altitude) * radius;
      positions[i * 3 + 2] = -horizontal * Math.cos(azimuth);
    }
    const result = new THREE.BufferGeometry();
    result.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return result;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <points geometry={geometry} visible={opacity > 0.01}>
    <pointsMaterial size={0.15} sizeAttenuation color="#e8f0ff" transparent opacity={opacity} depthWrite={false} toneMapped={false}/>
  </points>;
}

function SkyGrid() {
  return <group>
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[HORIZON_RADIUS, 0.018, 6, 128]}/>
      <meshBasicMaterial color="#c9b07b" transparent opacity={0.6} toneMapped={false}/>
    </mesh>
    {[30, 60].map(altitude => {
      const radius = HORIZON_RADIUS * Math.cos(altitude * RAD);
      const height = HORIZON_RADIUS * Math.sin(altitude * RAD);
      return <mesh key={altitude} position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.009, 6, 96]}/>
        <meshBasicMaterial color="#9fb6cf" transparent opacity={0.22} toneMapped={false}/>
      </mesh>;
    })}
    {[['北', 0], ['东', 90], ['南', 180], ['西', 270]].map(([label, azimuth]) => {
      const point = enuToScene(altAzToENU(0, Number(azimuth)), HORIZON_RADIUS + 2.2);
      return <LabelSprite key={String(label)} text={String(label)} position={[point[0], 0.85, point[2]]} height={0.62} color="#d3e2f2" background="rgba(7,12,22,0.4)" constantSize={0.027}/>;
    })}
  </group>;
}

function SkyPathArc({path, color = '#ffcf78'}: {path: SunPath; color?: string}) {
  const geometry = useMemo(() => {
    if (path.points.length < 2) return null;
    const points = path.points.map(point => new THREE.Vector3(...enuToScene(altAzToENU(point.altitude, point.azimuth), PATH_RADIUS)));
    const curve = new THREE.CatmullRomCurve3(points, path.closed, 'centripetal', 0.5);
    return new THREE.TubeGeometry(curve, Math.max(64, path.points.length * 2), 0.04, 6, path.closed);
  }, [path]);
  useEffect(() => () => {geometry?.dispose();}, [geometry]);
  if (!geometry) return null;
  return <mesh geometry={geometry}>
    <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false}/>
  </mesh>;
}

function SunDisc({position}: {position: SolarPosition}) {
  const glow = useMemo(makeGlowTexture, []);
  useEffect(() => () => glow.dispose(), [glow]);
  if (!position.aboveHorizon) return null;
  const point = enuToScene(altAzToENU(position.altitude, position.azimuth ?? 180), PATH_RADIUS);
  return <group position={point}>
    <mesh>
      <sphereGeometry args={[0.34, 24, 16]}/>
      <meshBasicMaterial color="#fff4c9" toneMapped={false}/>
    </mesh>
    <sprite scale={[3.1, 3.1, 1]}>
      <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}/>
    </sprite>
  </group>;
}

function HorizonMarker({azimuth, label}: {azimuth: number; label: string}) {
  const point = enuToScene(altAzToENU(0, azimuth), HORIZON_RADIUS);
  return <group>
    <mesh position={point}>
      <sphereGeometry args={[0.13, 12, 10]}/>
      <meshBasicMaterial color="#ffb066" toneMapped={false}/>
    </mesh>
    <LabelSprite text={label} position={[point[0] * 1.05, 1.7, point[2] * 1.05]} height={0.46} color="#ffd5a3" constantSize={0.028}/>
  </group>;
}

function MoonMarker({position}: {position: SunPathPoint}) {
  if (position.altitude <= 0) return null;
  const point = enuToScene(altAzToENU(position.altitude, position.azimuth), PATH_RADIUS);
  return <>
    <mesh position={point}>
      <sphereGeometry args={[0.23, 24, 16]}/>
      <meshBasicMaterial color="#caefea" toneMapped={false}/>
    </mesh>
    <LabelSprite text="月球" position={[point[0], point[1] + 0.57, point[2]]}
      color="#d8f3eb" background="rgba(30,59,61,0.9)" constantSize={0.025}/>
  </>;
}

function Scene({position, day, path, moonPosition, moonPaths, clock, focusId, stationData}: {
  position: SolarPosition;
  day: DayEvents;
  path: SunPath;
  moonPosition: SunPathPoint | null;
  moonPaths: SunPath[];
  clock: (hours: number) => string;
  focusId: SiteId | null;
  stationData: StationVisualData;
}) {
  const palette = useMemo(() => skyPalette(position.altitude), [position.altitude]);
  const daylight = Math.max(0, Math.sin(position.altitude * RAD));
  const nightGlow = clamp(1 - daylight * 5, 0, 1);
  const starOpacity = clamp((6 - position.altitude) / 14, 0, 1);
  const lightPoint = position.aboveHorizon
    ? enuToScene(altAzToENU(position.altitude, position.azimuth ?? 180), 26)
    : [0, 24, 0] as Vec3;
  return <>
    <color attach="background" args={[palette.horizon]}/>
    <fog attach="fog" args={[palette.horizon, 29, 58]}/>
    <SkyDome top={palette.top} horizon={palette.horizon}/>
    <Stars opacity={starOpacity}/>
    <ambientLight intensity={0.13 + daylight * 0.42}/>
    <hemisphereLight color={palette.top} groundColor="#3b3529" intensity={0.26 + daylight * 0.7}/>
    <directionalLight position={[10, 10, -16]} color="#cfe0f0" intensity={0.4 + daylight * 0.8}/>
    <directionalLight
      position={lightPoint}
      color={position.altitude < 12 ? '#ffb26e' : '#fff2d5'}
      intensity={position.aboveHorizon ? 0.25 + 3.1 * Math.pow(daylight, 0.55) : 0}
      castShadow={position.aboveHorizon}
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-left={-18}
      shadow-camera-right={18}
      shadow-camera-top={18}
      shadow-camera-bottom={-18}
      shadow-camera-near={1}
      shadow-camera-far={80}
      shadow-bias={-0.0006}
      shadow-normalBias={0.025}
    />
    <directionalLight position={[-12, 15, 10]} intensity={0.12 * (1 - daylight)} color="#7897cd"/>
    <SolarCampus overview={focusId === null} nightGlow={nightGlow}/>
    <StationWorld focusId={focusId} data={stationData}/>
    {focusId === null && <SkyGrid/>}
    {focusId === null && <SkyPathArc path={path}/>}
    {focusId === null && moonPaths.map(arc => <SkyPathArc key={arc.points[0].time} path={arc} color="#5ca7aa"/>)}
    {moonPosition && <MoonMarker position={moonPosition}/>}
    {focusId === null && day.rise !== null && day.set !== null && day.riseAzimuth !== null && day.setAzimuth !== null && <>
      <HorizonMarker azimuth={day.riseAzimuth} label={`日出 ${clock(day.rise)}`}/>
      <HorizonMarker azimuth={day.setAzimuth} label={`日落 ${clock(day.set)}`}/>
    </>}
    <SunDisc position={position}/>
  </>;
}

function AngleField({label, value, max, onChange}: {
  label: string; value: number; max: number; onChange: (n: number) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  return <input aria-label={label} type="number" inputMode="numeric" min={0} max={max} step={1}
    value={editing ?? value}
    onChange={event => {
      const {value: draft, valueAsNumber: n} = event.target;
      setEditing(draft);
      if (Number.isInteger(n) && n >= 0 && n <= max) onChange(n);
    }}
    onBlur={() => setEditing(null)}/>;
}

function CoordInput({axis, value, onChange}: {
  axis: 'latitude' | 'longitude'; value: number; onChange: (n: number) => void;
}) {
  const lat = axis === 'latitude';
  const label = lat ? '纬度' : '经度';
  const max = lat ? 90 : 180;
  const negative = value < 0 || Object.is(value, -0);
  const arcMinutes = Math.round(Math.abs(value) * 60);
  const degrees = Math.floor(arcMinutes / 60);
  const minutes = arcMinutes % 60;
  function update(deg: number, min: number) {
    const magnitude = deg + (deg === max ? 0 : min / 60);
    onChange(negative ? -magnitude : magnitude);
  }
  return <fieldset className="coordinate">
    <legend>{label}</legend>
    <div>
      <AngleField label={label + '度数'} value={degrees} max={max} onChange={n => update(n, minutes)}/>
      <span>°</span>
      <AngleField label={label + '分数'} value={minutes} max={degrees === max ? 0 : 59} onChange={n => update(degrees, n)}/>
      <span>′</span>
      <select aria-label={label + '方向'} value={negative ? 'negative' : 'positive'}
        onChange={event => onChange(event.target.value === 'negative' ? -Math.abs(value) : Math.abs(value))}>
        <option value="positive">{lat ? 'N 北纬' : 'E 东经'}</option>
        <option value="negative">{lat ? 'S 南纬' : 'W 西经'}</option>
      </select>
    </div>
  </fieldset>;
}

const hotspotHeights = {spacing: 2.9, waterHeater: 2.1, shadow: 1.4, daylight: 2.4, shading: 3.2};

function ProjectHotspots({layer}: {layer: RefObject<HTMLDivElement | null>}) {
  const point = useMemo(() => new THREE.Vector3(), []);
  useFrame(({camera, size}) => {
    if (!layer.current) return;
    camera.updateMatrixWorld();
    for (const button of Array.from(layer.current.children)) {
      const element = button as HTMLButtonElement;
      const id = element.dataset.site as SiteId;
      const [x,,z] = SITE_ANCHORS[id];
      point.set(x, hotspotHeights[id], z);
      point.project(camera);
      element.hidden = Math.abs(point.x)>1 || Math.abs(point.y)>1 || Math.abs(point.z)>1;
      element.style.left = `${(1+point.x)*size.width/2}px`;
      element.style.top = `${(1-point.y)*size.height/2}px`;
    }
  });
  return null;
}

const SEASONS = [['春分', '03-20'], ['夏至', '06-21'], ['秋分', '09-23'], ['冬至', '12-21']] as const;
const SOUTHERN_SEASONS = [['秋分', '03-20'], ['冬至', '06-21'], ['春分', '09-23'], ['夏至', '12-21']] as const;

export default function SolarLab() {
  const {date: dateISO, time: elapsed, latitude, longitude, cityId, setDate, setTime, setCity, setLatitude, setLongitude} = useSolar();
  const date = parseISODate(dateISO) ?? {year: 2000, month: 1, day: 1};
  const city = CITIES.find(item => item.id === cityId);
  const civil = useMemo(() => localDay(dateISO, longitude, city?.timeZone), [dateISO, longitude, city]);
  const time = Math.min(elapsed, civil.hours);
  const atEnd = time === civil.hours;
  const calendarDate = atEnd ? new Date(Date.parse(dateISO + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10) : dateISO;
  const zone = civil.baseOffset;
  const [showMoon, setShowMoon] = useState(false);
  const moon = useMemo(() => showMoon ? moonSky(dateISO, latitude, longitude, civil.start, civil.hours) : null,
    [showMoon, dateISO, latitude, longitude, civil]);
  const moonPaths = useMemo(() => moon?.visiblePaths() ?? [], [moon]);
  const moonPosition = useMemo(() => moon?.position(time) ?? null, [moon, time]);
  const day = useMemo(
    () => solarDay(date, latitude, longitude, zone),
    [date.year, date.month, date.day, latitude, longitude, zone],
  );
  const position = useMemo(
    () => atEnd ? solarPosition(parseISODate(calendarDate)!, latitude, longitude, civil.offset(civil.start + time * 3600000), 0) : solarPosition(date, latitude, longitude, zone, time),
    [date.year, date.month, date.day, latitude, longitude, time, civil, atEnd, calendarDate, zone],
  );
  const path = useMemo(
    () => sunPath(date, latitude, longitude, zone),
    [date.year, date.month, date.day, latitude, longitude, zone],
  );
  const winterMonth = latitude < 0 ? 6 : 12;
  const summerMonth = latitude < 0 ? 12 : 6;
  const winterDay = useMemo(
    () => solarDay({year: date.year, month: winterMonth, day: 21}, latitude, longitude, zone),
    [date.year, latitude, longitude, zone],
  );
  const summerDay = useMemo(
    () => solarDay({year: date.year, month: summerMonth, day: 21}, latitude, longitude, zone),
    [date.year, latitude, longitude, zone],
  );
  const [focusId, setFocusId] = useState<SiteId | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  const hotspotLayer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusId === null) return;
    detailRef.current?.scrollTo({top: 0});
  }, [focusId]);
  const {clock} = civil;
  const riseLabel = day.polarDay ? '极昼' : day.polarNight ? '极夜' : day.rise !== null ? clock(day.rise) : '—';
  const setLabel = day.polarDay ? '太阳不落' : day.polarNight ? '太阳不升' : day.set !== null ? clock(day.set) : '—';
  const lengthLabel = day.polarDay ? '24小时00分' : day.polarNight ? '0小时00分' : formatDuration(day.dayLength);

  const currentTilt = panelTilt(day.noonAltitude) ?? 90;
  const winterTilt = panelTilt(winterDay.noonAltitude);
  const summerTilt = panelTilt(summerDay.noonAltitude);
  const panelSign = day.noonAzimuth !== null && day.noonAzimuth > 90 && day.noonAzimuth < 270 ? 1 : -1;
  const spacingWinter = spacingLength(winterDay.noonAltitude);
  const spacingGap = spacingWinter === null
    ? 2.2
    : clamp(spacingWinter / SITE_CONSTANTS.metersPerSceneUnit, 2.2, 5.2);
  const shadowMeters = shadowLength(SITE_CONSTANTS.poleHeight, position.altitude);
  const shadowVisual = shadowMeters === null ? null : clamp(shadowMeters / SITE_CONSTANTS.metersPerSceneUnit, 0.15, 5.5);
  const shadowDirection = shadowAzimuth(position.azimuth);
  const winterShadow = shadowLength(SITE_CONSTANTS.poleHeight, winterDay.noonAltitude);
  const summerShadow = shadowLength(SITE_CONSTANTS.poleHeight, summerDay.noonAltitude);
  const daylightMeters = daylightDepth(day.noonAltitude);
  const daylightVisual = daylightMeters === null ? 0.25 : clamp(daylightMeters / 4, 0.2, 2.2);
  const winterDaylight = daylightDepth(winterDay.noonAltitude);
  const summerDaylight = daylightDepth(summerDay.noonAltitude);
  const currentShade = shadingAt(day.noonAltitude);
  const winterShade = shadingAt(winterDay.noonAltitude);
  const summerShade = shadingAt(summerDay.noonAltitude);
  const nightGlow = clamp(1 - Math.max(0, Math.sin(position.altitude * RAD)) * 5, 0, 1);
  const stationData: StationVisualData = {
    nightGlow,
    spacingGap,
    panelRotation: currentTilt,
    panelTilt: currentTilt,
    panelSign,
    shadowVisual,
    shadowMeters,
    shadowAzimuth: shadowDirection,
    daylightVisual,
    daylightMeters,
    shading: currentShade,
  };
  const focusSite = focusId === null ? null : SITES.find(site => site.id === focusId) ?? null;
  const openSite = (id: SiteId) => {setFocusId(id); setSettingsOpen(false);};
  const returnToOverview = () => {setFocusId(null); setSettingsOpen(false);};
  const setSolstice = (season: 'winter' | 'summer') => {
    const target = {year: date.year, month: season === 'winter' ? winterMonth : summerMonth, day: 21};
    setDate(toISODate(target));
    const targetDay = localDay(toISODate(target), longitude, city?.timeZone);
    setTime(solarDay(target, latitude, longitude, targetDay.baseOffset).noon, targetDay.hours);
  };
  const detailValues: [string, string][] = focusId === null ? [] : focusId === 'spacing' ? [
    ['冬至正午高度 H冬', formatDegrees(winterDay.noonAltitude)],
    ['楼高 h', formatMeters(SITE_CONSTANTS.buildingHeight, 0)],
    ['最小楼间距 L', formatMeters(spacingWinter)],
    ['当前正午高度', formatDegrees(day.noonAltitude)],
  ] : focusId === 'waterHeater' ? [
    ['当前正午高度 H', formatDegrees(day.noonAltitude)],
    ['当前板面倾角 α', formatDegrees(currentTilt)],
    ['冬至建议倾角', formatDegrees(winterTilt)],
    ['夏至建议倾角', formatDegrees(summerTilt)],
  ] : focusId === 'shadow' ? [
    ['当前太阳高度 H', formatDegrees(position.altitude)],
    ['杆高 h', formatMeters(SITE_CONSTANTS.poleHeight, 0)],
    ['当前影长', formatMeters(shadowMeters)],
    ['影子朝向', shadowDirection === null ? '—' : `${compassDirection(shadowDirection)}方向`],
  ] : focusId === 'daylight' ? [
    ['当前正午高度 H', formatDegrees(day.noonAltitude)],
    ['窗顶高', formatMeters(SITE_CONSTANTS.windowTop)],
    ['当前采光进深', formatMeters(daylightMeters)],
    ['冬至 / 夏至', `${formatMeters(winterDaylight)} / ${formatMeters(summerDaylight)}`],
  ] : [
    ['当前正午高度 H', formatDegrees(day.noonAltitude)],
    ['板深 / 安装高', `${formatMeters(SITE_CONSTANTS.boardDepth)} / ${formatMeters(SITE_CONSTANTS.boardHeight)}`],
    ['当前遮住窗高', currentShade === null ? '—' : formatMeters(currentShade.blockedHeight, 2)],
    ['当前遮挡比例', formatPercent(currentShade === null ? null : currentShade.blockedFraction)],
  ];
  const detailNote = focusId === 'spacing'
    ? `L = ${SITE_CONSTANTS.buildingHeight.toFixed(0)} × cot H冬。纬度越高，冬至太阳越低，所需楼间距越大；三维间距按计算值压缩显示。`
    : focusId === 'waterHeater'
      ? 'α + H = 90°。比较当地两个至日的正午高度，太阳越高，集热板越接近水平。'
      : focusId === 'shadow'
        ? `影长 = ${SITE_CONSTANTS.poleHeight.toFixed(0)} × cot H。正午影子最短；冬至正午影长 ${formatMeters(winterShadow)}，夏至正午 ${formatMeters(summerShadow)}。`
        : focusId === 'daylight'
          ? `太阳越低，光线越斜、进屋越深。冬至 / 夏至正午进深分别为 ${formatMeters(winterDaylight)} / ${formatMeters(summerDaylight)}。场景按当前日期正午绘制。`
          : `同一块板，夏至遮住 ${summerShade === null ? '—' : formatPercent(summerShade.blockedFraction)} 的窗口，冬至只遮住 ${winterShade === null ? '—' : formatPercent(winterShade.blockedFraction)}。板越长、装得越低，遮得越多。`;

  return <div className="solar-lab" data-night={position.altitude < -6}>
    <div className="solar-heading">
      <div>
        <p className="eyebrow">{city ? city.name + '　／　' + city.zone : '自定义观测点'}</p>
        <h2>太阳周日视运动</h2>
      </div>
    </div>
    <div className="solar-main">
      <div className="solar-stage" data-testid="solar-stage" data-focus={focusId ?? ''}>
        <Boundary>
          <Suspense fallback={<p>正在加载太阳视运动场景…</p>}>
            <Canvas
              shadows
              dpr={[1, 1.5]}
              frameloop="demand"
              camera={{position: OVERVIEW_CAMERA, fov: 46, near: 0.1, far: 120}}
              onCreated={({camera}) => camera.lookAt(...OVERVIEW_TARGET)}
              fallback={<p>浏览器不支持 WebGL。</p>}
            >
              <CameraRig focusId={focusId} onReset={returnToOverview}/>
              {!focusId && <ProjectHotspots layer={hotspotLayer}/>}
              <Scene
                position={position}
                day={day}
                path={path}
                moonPosition={moonPosition}
                moonPaths={moonPaths}
                clock={clock}
                focusId={focusId}
                stationData={stationData}
              />
            </Canvas>
          </Suspense>
        </Boundary>
        {!focusId && <div className="solar-hotspots" ref={hotspotLayer}>
          {SITES.map(site => <button key={site.id} className="solar-dot" data-site={site.id} aria-label={`查看${site.title}示意图`} title={site.title} onClick={() => openSite(site.id)}/>)}
        </div>}
      </div>
        {focusSite && <div className="solar-detail" ref={detailRef} role="region" aria-label={`${focusSite.title}知识数据`}>
          <div className="solar-detail-head">
            <div>
              <p className="eyebrow">地景观察</p>
              <h3>{focusSite.title}</h3>
            </div>
            <button onClick={returnToOverview}>返回全景</button>
          </div>
          <SolarDiagram site={focusSite} noon={day.noonAltitude} winter={winterDay.noonAltitude} summer={summerDay.noonAltitude} altitude={position.altitude}/>
          <p className="solar-detail-formula">{focusSite.formula}</p>
          <dl className="solar-detail-grid">
            {detailValues.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          <p className="solar-detail-note">{detailNote}</p>
          <div className="solar-detail-tabs">
            {SITES.map(site => <button key={site.id} aria-label={`切换到${site.title}`} aria-pressed={focusId === site.id} onClick={() => openSite(site.id)}>{site.short.split(' ')[0]}</button>)}
          </div>
          <div className="solar-detail-actions">
            {focusId === 'spacing' && <button onClick={() => setSolstice('winter')}>设为冬至正午</button>}
            {(focusId === 'waterHeater' || focusId === 'daylight' || focusId === 'shading') && <>
              <button onClick={() => setSolstice('winter')}>冬至正午</button>
              <button onClick={() => setSolstice('summer')}>夏至正午</button>
            </>}
            {focusId === 'shadow' && <>
              <button onClick={() => setSolstice('winter')}>冬至正午</button>
              <button onClick={() => setSolstice('summer')}>夏至正午</button>
              <button onClick={() => setTime(day.noon)}>当前正午</button>
            </>}
          </div>
        </div>}
        <div className="solar-sites">
          <h3>地景观察</h3>
          <div className="solar-site-list">
            {SITES.map(site => <button key={site.id} aria-pressed={focusId === site.id} onClick={() => openSite(site.id)}>{site.short}</button>)}
          </div>
        </div>
      <section className="timegroup" aria-label="当地观测时间">
        <label htmlFor="solar-time">当地时间 <strong>{clock(time)}</strong></label>
        <p>{calendarDate}　农历{lunarDate(calendarDate)}</p>
        <input id="solar-time" type="range" min={0} max={civil.hours} step="0.05" value={time}
          aria-valuetext={clock(time)} onChange={e => setTime(Number(e.target.value), civil.hours)}/>
        <dl className="solar-times">
          <div><dt>日出</dt><dd>{riseLabel}</dd></div>
          <div><dt>上中天</dt><dd>{clock(day.noon)}</dd></div>
          <div><dt>日落</dt><dd>{setLabel}</dd></div>
        </dl>
      <button className="solar-sheet-toggle" aria-controls="solar-settings" aria-expanded={settingsOpen}
        onClick={() => setSettingsOpen(value => !value)}>{settingsOpen ? '收起面板' : '观测设置'} <span aria-hidden="true">{settingsOpen ? '−' : '＋'}</span></button>
      </section>
      <section id="solar-settings" className="solar-controls" data-open={settingsOpen}>
        <div className="solar-controls-head"><h2>观测设置</h2></div>
        <label>典型城市
          <select value={cityId} onChange={event => setCity(event.target.value)}>
            {CITIES.map(city => <option key={city.id} value={city.id}>{city.name}（{city.zone}）</option>)}
            <option value="custom">自定义坐标</option>
          </select>
        </label>
        <div className="solar-coords">
          <CoordInput axis="latitude" value={latitude} onChange={setLatitude}/>
          <CoordInput axis="longitude" value={longitude} onChange={setLongitude}/>
        </div>
        <p className="solar-hint">{city ? '采用当地民用时间，含夏令时。' : '自定义坐标按经度就近采用整点区时。'}</p>
        <label>日期
          <input type="date" value={dateISO} onChange={event => {if (parseISODate(event.target.value)) setDate(event.target.value);}}/>
        </label>
        <p className="selected-lunar-date">农历{lunarDate(dateISO)}</p>
        <div className="solar-seasons">
          {(latitude < 0 ? SOUTHERN_SEASONS : SEASONS).map(([label, monthDay]) => <button key={label} onClick={() => setDate(`${String(date.year).padStart(4, '0')}-${monthDay}`)} title={`当地季节 · 约 ${monthDay}`}>{label}</button>)}
        </div>
        <label className="moon-layer-toggle"><input type="checkbox" checked={showMoon} onChange={event => setShowMoon(event.target.checked)}/>显示月球视运动</label>
        {moonPosition && <p className="moon-position" aria-label="月球位置">
          {moonPosition.altitude > 0 ? '地平线上' : '地平线下'} · 高度 {moonPosition.altitude.toFixed(1)}° · 方位 {moonPosition.azimuth.toFixed(1)}°
        </p>}
        <p className="solar-summary">昼长 {lengthLabel}</p>
        <p className="caption">几何模型：忽略大气折射，日出日落指太阳中心位于地平线的时刻。直射点纬度约 {day.declination.toFixed(1)}°。</p>
      </section>
    </div>
    <p className="solar-footnote">建筑、草地、星空与天色为教学场景；阴影由太阳方向实时投射，距离和尺度均为示意，不用于真实天象预报。</p>
    <details className="help"><summary>使用帮助与模型边界</summary>
      <p>先选日期和城市或手动经纬度，再用当地时间滑块扫描一天；轨迹只绘制地平线以上部分。极昼、极夜会直接显示在日出日落栏。</p>
      <p>勾选“显示月球视运动”后，青色弧线表示当天的月球轨迹。月球标记给出该时刻的位置，月心落到几何地平线下时消失。四季快捷键按观测点所在半球命名。</p>
      <p>日出、日落采用太阳中心位于地平线的几何时刻，忽略大气折射，城市钟表采用当地民用时间。</p>
      <p>建筑、草地、星空和天色为示意场景，阴影由太阳方向实时投射。模型不用于真实天象预报、摄影计划或导航。</p>
    </details>
  </div>;
}
