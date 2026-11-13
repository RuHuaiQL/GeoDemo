import {useEffect, useMemo} from 'react';
import * as THREE from 'three';
import {type ShadingState, type SiteId} from '../science/solarSites';
import {LabelSprite, type Vec3} from './threeLabels';

const RAD = Math.PI / 180;

export const OVERVIEW_CAMERA: Vec3 = [10, 16, -22];
export const OVERVIEW_TARGET: Vec3 = [0, 3.4, 0];
export const HORIZON_RADIUS = 12.5;

export const SITE_ANCHORS: Record<SiteId, Vec3> = {
  spacing: [-5.4, 0, 0],
  waterHeater: [5.4, 0, 0.4],
  shadow: [0, 0, 0],
  daylight: [-5.6, 0, -5.2],
  shading: [5.4, 0, -4.6],
};

export const SITE_FOCUS: Record<SiteId, {camera: Vec3; target: Vec3}> = {
  spacing: {camera: [-0.5, 4.6, -6.2], target: [-5.4, 1.4, 0.2]},
  waterHeater: {camera: [5.4, 3.8, 6.4], target: [5.4, 1.4, 0.4]},
  shadow: {camera: [2.4, 2.6, -4.0], target: [0, 0.55, 0]},
  daylight: {camera: [-5.6, 3.6, -8.8], target: [-5.6, 1.0, -5.2]},
  shading: {camera: [5.4, 3.4, 0.8], target: [5.4, 1.5, -4.6]},
};

export type StationVisualData = {
  nightGlow: number;
  spacingGap: number;
  panelRotation: number;
  panelTilt: number;
  panelSign: number;
  shadowVisual: number | null;
  shadowMeters: number | null;
  shadowAzimuth: number | null;
  daylightVisual: number;
  daylightMeters: number | null;
  shading: ShadingState | null;
};

function makeWindowTextures() {
  const day = document.createElement('canvas');
  const night = document.createElement('canvas');
  day.width = night.width = 128;
  day.height = night.height = 256;
  const dayCtx = day.getContext('2d')!;
  const nightCtx = night.getContext('2d')!;
  const margin = 10;
  const gap = 7;
  const columns = 4;
  const rows = 8;
  const cellWidth = (128 - margin * 2 - gap * (columns - 1)) / columns;
  const cellHeight = (256 - margin * 2 - gap * (rows - 1)) / rows;
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const x = margin + column * (cellWidth + gap);
      const y = margin + row * (cellHeight + gap);
      dayCtx.fillStyle = 'rgba(91,125,145,0.85)';
      dayCtx.fillRect(x, y, cellWidth, cellHeight);
      const lit = (row * columns + column) % 6 === 0;
      nightCtx.fillStyle = lit ? '#ffe0a0' : 'rgba(255,205,135,0.24)';
      nightCtx.fillRect(x, y, cellWidth, cellHeight);
    }
  }
  const dayTexture = new THREE.CanvasTexture(day);
  const nightTexture = new THREE.CanvasTexture(night);
  for (const texture of [dayTexture, nightTexture]) {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
  }
  return {day: dayTexture, night: nightTexture};
}

function WindowPlane({width, height, position, rotation, day, night, nightGlow}: {
  width: number;
  height: number;
  position: Vec3;
  rotation: Vec3;
  day: THREE.Texture;
  night: THREE.Texture;
  nightGlow: number;
}) {
  return <mesh position={position} rotation={rotation}>
    <planeGeometry args={[width, height]}/>
    <meshStandardMaterial
      map={day}
      transparent
      alphaTest={0.15}
      side={THREE.DoubleSide}
      roughness={0.9}
      metalness={0}
      emissive="#ffd08a"
      emissiveMap={night}
      emissiveIntensity={nightGlow * 1.7}
    />
  </mesh>;
}

function DetailedBuilding({position = [0, 0, 0], width, height, depth, color, windows, nightGlow, floors = 4}: {
  position?: Vec3;
  width: number;
  height: number;
  depth: number;
  color: string;
  windows: {day: THREE.Texture; night: THREE.Texture};
  nightGlow: number;
  floors?: number;
}) {
  const floorHeight = height / floors;
  return <group position={position}>
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[width, height, depth]}/>
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.04}/>
    </mesh>
    {Array.from({length: Math.max(1, floors - 1)}, (_, index) => <mesh key={index} position={[0, floorHeight * (index + 1), 0]} castShadow receiveShadow>
      <boxGeometry args={[width + 0.07, 0.035, depth + 0.07]}/>
      <meshStandardMaterial color="#889999" roughness={0.92}/>
    </mesh>)}
    <WindowPlane width={width * 0.86} height={height * 0.76} position={[0, height * 0.52, depth / 2 + 0.012]} rotation={[0, 0, 0]} day={windows.day} night={windows.night} nightGlow={nightGlow}/>
    <WindowPlane width={width * 0.86} height={height * 0.76} position={[0, height * 0.52, -depth / 2 - 0.012]} rotation={[0, Math.PI, 0]} day={windows.day} night={windows.night} nightGlow={nightGlow}/>
    <WindowPlane width={depth * 0.86} height={height * 0.76} position={[width / 2 + 0.012, height * 0.52, 0]} rotation={[0, Math.PI / 2, 0]} day={windows.day} night={windows.night} nightGlow={nightGlow}/>
    <WindowPlane width={depth * 0.86} height={height * 0.76} position={[-width / 2 - 0.012, height * 0.52, 0]} rotation={[0, -Math.PI / 2, 0]} day={windows.day} night={windows.night} nightGlow={nightGlow}/>
    <mesh position={[0, height + 0.06, 0]} castShadow>
      <boxGeometry args={[width + 0.14, 0.12, depth + 0.14]}/>
      <meshStandardMaterial color="#d6d6c8" roughness={0.9}/>
    </mesh>
    <mesh position={[width * 0.24, height + 0.22, depth * 0.18]} castShadow>
      <boxGeometry args={[0.32, 0.28, 0.32]}/>
      <meshStandardMaterial color="#7a828b" roughness={0.86}/>
    </mesh>
    <mesh position={[-width * 0.2, height + 0.42, -depth * 0.14]}>
      <cylinderGeometry args={[0.018, 0.018, 0.7, 6]}/>
      <meshStandardMaterial color="#9aa3ad" roughness={0.5} metalness={0.5}/>
    </mesh>
  </group>;
}

function Beam({from, to, radius = 0.015, color = '#e7c787', opacity = 1}: {
  from: Vec3;
  to: Vec3;
  radius?: number;
  color?: string;
  opacity?: number;
}) {
  const {position, quaternion, length} = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const direction = end.clone().sub(start);
    const beamLength = direction.length();
    const midpoint = start.clone().add(end).multiplyScalar(0.5);
    const beamQuaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.normalize(),
    );
    return {position: midpoint.toArray() as Vec3, quaternion: beamQuaternion, length: beamLength};
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);
  return <mesh position={position} quaternion={quaternion}>
    <cylinderGeometry args={[radius, radius, length, 8]}/>
    <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} depthWrite={false} toneMapped={false}/>
  </mesh>;
}

function SpacingStation({gap, focused, windows, nightGlow}: {
  gap: number;
  focused: boolean;
  windows: {day: THREE.Texture; night: THREE.Texture};
  nightGlow: number;
}) {
  const width = 1.7;
  const depth = 1.1;
  const height = 2.4;
  const center = gap / 2 + depth / 2;
  return <group position={SITE_ANCHORS.spacing}>
    <DetailedBuilding position={[0, 0, center]} width={width} height={height} depth={depth} color="#dbcda7" windows={windows} nightGlow={nightGlow} floors={4}/>
    <DetailedBuilding position={[0, 0, -center]} width={width} height={height} depth={depth} color="#ccd8ce" windows={windows} nightGlow={nightGlow} floors={4}/>
    <Beam from={[0.95, 0.07, center - depth / 2]} to={[0.95, 0.07, -center + depth / 2]} radius={0.018}/>
    <mesh position={[0.95, 0.08, center - depth / 2]}>
      <sphereGeometry args={[0.045, 10, 8]}/>
      <meshBasicMaterial color="#e7c787" toneMapped={false}/>
    </mesh>
    <mesh position={[0.95, 0.08, -center + depth / 2]}>
      <sphereGeometry args={[0.045, 10, 8]}/>
      <meshBasicMaterial color="#e7c787" toneMapped={false}/>
    </mesh>
    {focused && <>
      <LabelSprite text="前楼" position={[0, height + 0.5, center]} height={0.46} color="#f1e3c4" constantSize={0.028}/>
      <LabelSprite text="后楼" position={[0, height + 0.5, -center]} height={0.46} color="#f1e3c4" constantSize={0.028}/>
      <LabelSprite text="最小间距 L" position={[0.95, 0.75, 0]} height={0.46} color="#ffe1a4" constantSize={0.028}/>
    </>}
  </group>;
}

function WaterHeaterStation({panelRotation, panelTilt, panelSign, focused, windows, nightGlow}: {
  panelRotation: number;
  panelTilt: number;
  panelSign: number;
  focused: boolean;
  windows: {day: THREE.Texture; night: THREE.Texture};
  nightGlow: number;
}) {
  const roof = 1.15;
  return <group position={SITE_ANCHORS.waterHeater}>
    <DetailedBuilding width={2.6} height={roof} depth={2.0} color="#c9cec2" windows={windows} nightGlow={nightGlow} floors={3}/>
    <group position={[0, roof + 0.08, 0]} rotation={[panelSign * panelRotation * RAD, 0, 0]}>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.08, 1.1]}/>
        <meshStandardMaterial color="#205a82" metalness={0.38} roughness={0.3} emissive="#0b2a45" emissiveIntensity={0.45}/>
      </mesh>
      {[-0.68, 0.68].map(x => <mesh key={x} position={[x, 0.12, 0]} castShadow>
        <boxGeometry args={[0.055, 0.08, 1.12]}/>
        <meshStandardMaterial color="#b9c2ca" metalness={0.6} roughness={0.35}/>
      </mesh>)}
      {[-0.42, 0.42].map(z => <mesh key={z} position={[0, 0.12, z]} castShadow>
        <boxGeometry args={[1.52, 0.08, 0.055]}/>
        <meshStandardMaterial color="#b9c2ca" metalness={0.6} roughness={0.35}/>
      </mesh>)}
      <mesh position={[0, 0.34, -0.54]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 1.2, 18]}/>
        <meshStandardMaterial color="#cbd2d8" metalness={0.72} roughness={0.22}/>
      </mesh>
      <mesh position={[0, 0.16, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.95, 8]}/>
        <meshStandardMaterial color="#b88a55" metalness={0.6} roughness={0.4}/>
      </mesh>
    </group>
    {[-0.54, 0.54].map(x => <mesh key={x} position={[x, roof + 0.18, 0.36]} castShadow>
      <cylinderGeometry args={[0.035, 0.045, 0.4, 8]}/>
      <meshStandardMaterial color="#8e969e" metalness={0.5} roughness={0.5}/>
    </mesh>)}
    {focused && <LabelSprite text={`α = ${panelTilt.toFixed(1)}°`} position={[0, roof + 1.15, 0.85]} height={0.5} color="#ffe1a4" constantSize={0.028}/>}
  </group>;
}

function ShadowStation({shadowVisual, shadowMeters, shadowAzimuth, focused}: {
  shadowVisual: number | null;
  shadowMeters: number | null;
  shadowAzimuth: number | null;
  focused: boolean;
}) {
  const anchor = SITE_ANCHORS.shadow;
  const poleHeight = 1.0;
  const direction = shadowAzimuth === null
    ? null
    : [Math.sin(shadowAzimuth * RAD), 0, -Math.cos(shadowAzimuth * RAD)] as Vec3;
  const tip = shadowVisual !== null && direction
    ? [anchor[0] + direction[0] * shadowVisual, 0.075, anchor[2] + direction[2] * shadowVisual] as Vec3
    : null;
  return <group>
    <mesh position={[anchor[0], poleHeight / 2, anchor[2]]} castShadow>
      <cylinderGeometry args={[0.035, 0.055, poleHeight, 12]}/>
      <meshStandardMaterial color="#e2d4b4" metalness={0.35} roughness={0.55}/>
    </mesh>
    <mesh position={[anchor[0], poleHeight + 0.06, anchor[2]]}>
      <sphereGeometry args={[0.075, 12, 10]}/>
      <meshBasicMaterial color="#e7c787" toneMapped={false}/>
    </mesh>
    {tip && direction && <>
      <mesh
        position={[
          anchor[0] + direction[0] * shadowVisual! / 2,
          0.065,
          anchor[2] + direction[2] * shadowVisual! / 2,
        ]}
        rotation={[0, Math.atan2(direction[0], direction[2]), 0]}
      >
        <boxGeometry args={[0.17, 0.018, Math.max(0.18, shadowVisual!)]}/>
        <meshBasicMaterial color="#1b2415" transparent opacity={0.45} depthWrite={false}/>
      </mesh>

    </>}
    {focused && <LabelSprite
      text={shadowMeters === null ? '夜间无日影' : `影长 ${shadowMeters.toFixed(1)} m`}
      position={tip && direction
        ? [tip[0] + direction[0] * 0.9, 0.45, tip[2] + direction[2] * 0.9]
        : [anchor[0], 0.55, anchor[2]]}
      height={0.46}
      color="#ffe1a4"
      constantSize={0.026}
    />}
  </group>;
}

function DaylightStation({depth, depthMeters, focused, windows, nightGlow}: {
  depth: number;
  depthMeters: number | null;
  focused: boolean;
  windows: {day: THREE.Texture; night: THREE.Texture};
  nightGlow: number;
}) {
  const width = 3.0;
  const roomDepth = 2.6;
  const wallHeight = 2.1;
  const wallZ = roomDepth / 2;
  const windowWidth = 1.4;
  const windowBottom = 0.7;
  const windowTop = 1.8;
  const patchDepth = Math.max(0.2, Math.min(roomDepth - 0.25, depth));
  return <group position={SITE_ANCHORS.daylight}>
    <mesh position={[0, 0.04, 0]} receiveShadow>
      <boxGeometry args={[width, 0.08, roomDepth]}/>
      <meshStandardMaterial color="#b7ac95" roughness={0.92}/>
    </mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * (width / 2 - 0.04), wallHeight / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.08, wallHeight, roomDepth]}/>
      <meshStandardMaterial color="#c9bd9f" roughness={0.9}/>
    </mesh>)}
    {[-1, 1].map(side => <mesh key={side} position={[side * (windowWidth / 2 + 0.4), wallHeight / 2, wallZ]} castShadow receiveShadow>
      <boxGeometry args={[0.8, wallHeight, 0.08]}/>
      <meshStandardMaterial color="#c9bd9f" roughness={0.9}/>
    </mesh>)}
    <mesh position={[0, windowBottom / 2, wallZ]} castShadow receiveShadow>
      <boxGeometry args={[windowWidth, windowBottom, 0.08]}/>
      <meshStandardMaterial color="#c9bd9f" roughness={0.9}/>
    </mesh>
    <mesh position={[0, (windowTop + wallHeight) / 2, wallZ]} castShadow receiveShadow>
      <boxGeometry args={[windowWidth, wallHeight - windowTop, 0.08]}/>
      <meshStandardMaterial color="#c9bd9f" roughness={0.9}/>
    </mesh>
    <mesh position={[0, (windowTop + windowBottom) / 2, wallZ + 0.05]}>
      <boxGeometry args={[windowWidth, windowTop - windowBottom, 0.02]}/>
      <meshStandardMaterial color="#8db7c9" transparent opacity={0.4} roughness={0.2} metalness={0.1}/>
    </mesh>
    {depthMeters !== null && <>
    <mesh position={[0, 0.09, wallZ - patchDepth / 2]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[windowWidth, patchDepth]}/>
      <meshBasicMaterial color="#ffd27a" transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} toneMapped={false}/>
    </mesh>
    <Beam from={[0, windowTop, wallZ + 0.04]} to={[0, 0.1, wallZ - patchDepth]} radius={0.012} color="#ffe1a4" opacity={0.75}/>
    </>}
    <mesh position={[width * 0.28, 0.38, -roomDepth * 0.2]} castShadow>
      <boxGeometry args={[0.7, 0.08, 0.5]}/>
      <meshStandardMaterial color="#7d6a52" roughness={0.8}/>
    </mesh>
    <mesh position={[width * 0.28, 0.74, -roomDepth * 0.2]} castShadow>
      <boxGeometry args={[0.65, 0.7, 0.45]}/>
      <meshStandardMaterial color="#8c7a61" roughness={0.85}/>
    </mesh>
    {focused && <LabelSprite text={`进深 ${depthMeters === null ? '—' : `${depthMeters.toFixed(1)} m`}`} position={[0, 0.5, wallZ - patchDepth]} height={0.46} color="#ffe1a4" constantSize={0.026}/>}
  </group>;
}

function ShadingStation({shading, focused}: {shading: ShadingState | null; focused: boolean}) {
  const wallWidth = 3.2;
  const wallHeight = 2.9;
  const windowWidth = 1.4;
  const windowBottom = 0.8;
  const windowTop = 2.0;
  const blockedFraction = shading?.blockedFraction ?? 0;
  const blockedHeight = (windowTop - windowBottom) * blockedFraction;
  const shadowEdgeY = windowTop - blockedHeight;
  return <group position={SITE_ANCHORS.shading}>
    <mesh position={[0, 0.06, 0.4]} receiveShadow>
      <boxGeometry args={[wallWidth + 0.5, 0.12, 1.7]}/>
      <meshStandardMaterial color="#8e8776" roughness={0.95}/>
    </mesh>
    {[-1, 1].map(side => <mesh key={side} position={[side * (wallWidth + windowWidth) / 4, wallHeight / 2, 0]} castShadow receiveShadow>
      <boxGeometry args={[(wallWidth - windowWidth) / 2, wallHeight, 0.12]}/>
      <meshStandardMaterial color="#e0d2af" roughness={0.9}/>
    </mesh>)}
    {[[windowBottom / 2, windowBottom], [(windowTop + wallHeight) / 2, wallHeight - windowTop]].map(([y, height]) =>
      <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
        <boxGeometry args={[windowWidth, height, 0.12]}/><meshStandardMaterial color="#e0d2af"/>
      </mesh>)}
    <mesh position={[0, (windowTop + windowBottom) / 2, 0]}>
      <boxGeometry args={[windowWidth, windowTop - windowBottom, 0.025]}/>
      <meshStandardMaterial color="#8db7c9" transparent opacity={0.55} roughness={0.25}/>
    </mesh>
    {[-windowWidth / 2, 0, windowWidth / 2].map(x => <mesh key={x} position={[x, (windowTop + windowBottom) / 2, 0]}>
      <boxGeometry args={[0.04, windowTop - windowBottom, 0.085]}/><meshStandardMaterial color="#7f8d86"/>
    </mesh>)}
    {blockedHeight > 0.01 && <mesh position={[0, windowTop - blockedHeight / 2, 0.09]}>
      <planeGeometry args={[windowWidth, blockedHeight]}/>
      <meshBasicMaterial color="#152231" transparent opacity={0.76} side={THREE.DoubleSide} depthWrite={false}/>
    </mesh>}
    <mesh position={[0, 2.55, 0.55]} castShadow receiveShadow>
      <boxGeometry args={[1.8, 0.08, 1.1]}/>
      <meshStandardMaterial color="#6e5842" roughness={0.82}/>
    </mesh>
    {[-0.76, 0.76].map(x => <Beam key={x} from={[x, 2.48, 0.02]} to={[x, 2.48, 1.08]} radius={0.02} color="#5d4b38"/>)}
    {blockedHeight > 0.01 && <Beam from={[0, 2.55, 1.1]} to={[0, shadowEdgeY, 0.1]} radius={0.012} color="#ffe1a4" opacity={0.8}/>}
    {focused && <LabelSprite
      text={shading === null ? '正午无直射光' : blockedFraction >= 0.999 ? '全窗遮住' : blockedFraction <= 0.001 ? '全窗进光' : `遮住 ${(blockedFraction * 100).toFixed(0)}%`}
      position={[0.98, Math.max(windowBottom + 0.12, shadowEdgeY), 0.18]}
      height={0.44}
      color="#d9e6f5"
      constantSize={0.024}
    />}
  </group>;
}

export function StationWorld({focusId, data}: {
  focusId: SiteId | null;
  data: StationVisualData;
}) {
  const windows = useMemo(makeWindowTextures, []);
  useEffect(() => () => {
    windows.day.dispose();
    windows.night.dispose();
  }, [windows]);
  return <group>
    {(focusId === null || focusId === 'spacing') && <SpacingStation gap={data.spacingGap} focused={focusId === 'spacing'} windows={windows} nightGlow={data.nightGlow}/>}
    {(focusId === null || focusId === 'waterHeater') && <WaterHeaterStation panelRotation={data.panelRotation} panelTilt={data.panelTilt} panelSign={data.panelSign} focused={focusId === 'waterHeater'} windows={windows} nightGlow={data.nightGlow}/>}
    {(focusId === null || focusId === 'shadow') && <ShadowStation shadowVisual={data.shadowVisual} shadowMeters={data.shadowMeters} shadowAzimuth={data.shadowAzimuth} focused={focusId === 'shadow'}/>}
    {(focusId === null || focusId === 'daylight') && <DaylightStation depth={data.daylightVisual} depthMeters={data.daylightMeters} focused={focusId === 'daylight'} windows={windows} nightGlow={data.nightGlow}/>}
    {(focusId === null || focusId === 'shading') && <ShadingStation shading={data.shading} focused={focusId === 'shading'}/>}
  </group>;
}
