import {useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';

// One painted site plan keeps the paths, paving, and shoreline legible at any camera angle.
function sitePlan() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1536;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(24,24);
  ctx.translate(32,32);
  ctx.fillStyle = '#c5d0ae';
  ctx.fillRect(-32,-32,64,64);
  ctx.beginPath();
  ctx.moveTo(-32,18);
  ctx.bezierCurveTo(-13,21,-13,11,-2,11);
  ctx.bezierCurveTo(10,11,9,7,14,1);
  ctx.bezierCurveTo(20,-5,15,-21,24,-32);
  ctx.lineTo(32,-32); ctx.lineTo(32,32); ctx.lineTo(-32,32); ctx.closePath();
  ctx.fillStyle = '#a6cbd3'; ctx.fill();
  ctx.strokeStyle = '#e8e2ca'; ctx.lineWidth = 0.44; ctx.stroke();
  let seed = 379;
  const random = () => ((seed = (1664525*seed+1013904223)>>>0)/4294967296);
  for (let i=0;i<22000;i++) {
    const x=random()*64-32, z=random()*64-32;
    ctx.fillStyle = i%2 ? 'rgba(63,87,68,.13)' : 'rgba(255,255,249,.35)';
    ctx.fillRect(x,z,0.05+random()*0.23,0.04);
  }
  // Topographic contours and planted beds around the red waterfront walk.
  ctx.lineWidth=0.045;
  for (let i=0;i<14;i++) {
    const x=-12-i*0.52;
    ctx.beginPath(); ctx.moveTo(x-6,-24);
    ctx.bezierCurveTo(x+6,-12,x-5,-8,x+2,-1);
    ctx.bezierCurveTo(x+6,6,x-1,9,x-3,13);
    ctx.strokeStyle=i%3 ? '#b1bea0' : '#e3e6d0'; ctx.stroke();
  }
  for (const [x,z,rx,rz] of [[-2,-4.7,1.7,0.56],[2.9,2.4,1.35,0.62],[-2.7,2,1.1,0.55],[4,-2.4,1.3,0.42]]) {
    ctx.beginPath(); ctx.ellipse(x,z,rx,rz,-0.25,0,Math.PI*2);
    ctx.fillStyle='#a5b994'; ctx.fill();
    ctx.strokeStyle='#e7e4d1'; ctx.lineWidth=0.12; ctx.stroke();
    for(let i=0;i<65;i++) {
      const a=random()*Math.PI*2, r=Math.sqrt(random())*0.88;
      ctx.fillStyle=i%3 ? '#93aa86' : '#cfcd9f';
      ctx.fillRect(x+Math.cos(a)*rx*r,z+Math.sin(a)*rz*r,0.06,0.035);
    }
  }
  for (const [x,z] of [[-3,15],[16,5],[5,13]]) {
    for(let i=0;i<18;i++){
      const offset=(random()-0.5)*2.4;
      ctx.beginPath(); ctx.moveTo(x+offset,z+i*0.08);
      ctx.quadraticCurveTo(x+offset+0.8,z+i*0.08-0.10,x+offset+1.6,z+i*0.08);
      ctx.strokeStyle='rgba(232,246,241,.58)'; ctx.lineWidth=0.035; ctx.stroke();
    }
  }
  const promenade = new Path2D('M-26 -9 Q-14 -11 -7 -8 Q0 -6 7 -8 Q12 -8 11 1 Q10 7 4 9 Q-5 12 -10 6 Q-13 1 -10 -5 Q-9 -8 -7 -8');
  const walks = new Path2D('M-10 1 Q-6 -1 0 0 T10 2 M-3 -7 Q-2 -3 0 0 Q1 3 1 9 M-9 6 Q-3 4 4 4 T10 3 M-9 -5 Q0 -3 8 -6');
  ctx.lineCap='round'; ctx.lineJoin='round';
  for (const [path,width] of [[promenade,0.92],[walks,0.50]] as const) {
    ctx.strokeStyle='#899387'; ctx.lineWidth=width; ctx.stroke(path);
    ctx.strokeStyle='#ebe5d3'; ctx.lineWidth=width-0.10; ctx.stroke(path);
  }
  ctx.strokeStyle='#bd7461'; ctx.lineWidth=0.095; ctx.stroke(promenade);
  for (const [x,z,w,d] of [[-5.4,0,3,8],[5.4,0.4,3.4,3],[-5.6,-5.2,4,3.3],[5.4,-4.6,4,2.8],[0,6.4,9,3.9]]) {
    ctx.fillStyle='#dfdbcc'; ctx.fillRect(x-w/2,z-d/2,w,d);
    ctx.strokeStyle='#a2a99c'; ctx.lineWidth=0.04; ctx.strokeRect(x-w/2,z-d/2,w,d);
  }
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace; map.anisotropy=4;
  return map;
}

const BLOCKS = [
  // x, z, width, depth, height, yaw
  [-6.4,6.3,3.5,1.6,1.6,-0.28],[-3.6,6.9,2.2,1.9,2.8,-0.17],
  [1.6,6.5,2.3,1.5,3.2,0.15],[3.9,5.7,2.5,1.65,2.5,0.28],
  [6.7,4.2,2.8,1.7,1.55,0.46],[8.4,1.3,1.6,2.1,1.2,0.18],
];

function facadeMap() {
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=256;
  const ctx=canvas.getContext('2d')!;
  const wash=ctx.createLinearGradient(0,0,160,256);
  wash.addColorStop(0,'#dac58b'); wash.addColorStop(0.5,'#d8ddcd'); wash.addColorStop(1,'#9bb6c7');
  ctx.fillStyle=wash; ctx.fillRect(0,0,256,256);
  ctx.fillStyle='#697e84';
  for(let y=0;y<256;y+=16) ctx.fillRect(0,y,256,2);
  ctx.fillStyle='#ebeadc';
  for(let x=0;x<256;x+=16) ctx.fillRect(x,0,1,256);
  const map=new THREE.CanvasTexture(canvas);
  map.colorSpace=THREE.SRGBColorSpace; map.anisotropy=8;
  return map;
}

function Tower({map, nightGlow}: {map: THREE.Texture; nightGlow: number}) {
  // The curved elevation rises towards the waterfront end of the tower.
  const shell=useMemo(() => {
    const positions:number[]=[], uv:number[]=[], roof:number[]=[];
    const section=(t:number) => {
      const a=-1.18+2.36*t, h=3.65+2.75*t*t;
      return [1.85,2.8].map(r=>[Math.sin(a)*r,h,(Math.cos(a)-1)*r+(r-1.85)]);
    };
    for(let i=0;i<32;i++) {
      const a=section(i/32), b=section((i+1)/32);
      for(let side=0;side<2;side++) {
        const [x,h,z]=a[side], [u,k,v]=b[side];
        positions.push(x,0,z,u,0,v,u,k,v,x,0,z,u,k,v,x,h,z);
        uv.push(i/32,0,(i+1)/32,0,(i+1)/32,k/6.4,i/32,0,(i+1)/32,k/6.4,i/32,h/6.4);
      }
      roof.push(...a[0],...a[1],...b[1],...a[0],...b[1],...b[0]);
    }
    for(const t of [0,1]) {
      const [a,b]=section(t);
      positions.push(a[0],0,a[2],...a,...b,a[0],0,a[2],...b,b[0],0,b[2]);
      uv.push(0,0,0,1,0.2,1,0,0,0.2,1,0.2,0);
    }
    const geometry=(points:number[])=>{
      const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(points,3)); g.computeVertexNormals(); return g;
    };
    const walls=geometry(positions); walls.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    return {walls,roof:geometry(roof)};
  },[]);
  useEffect(()=>()=>{shell.walls.dispose();shell.roof.dispose();},[shell]);
  return <group position={[-0.5,0,6.8]}>
    <mesh geometry={shell.walls} castShadow receiveShadow><meshStandardMaterial map={map} side={THREE.DoubleSide} emissive="#efc67c" emissiveMap={map} emissiveIntensity={nightGlow*0.24}/></mesh>
    <mesh geometry={shell.roof} castShadow><meshStandardMaterial color="#f1ecdc" side={THREE.DoubleSide}/></mesh>
  </group>;
}

function Plantings() {
  const leaves=useRef<THREE.InstancedMesh>(null), trunks=useRef<THREE.InstancedMesh>(null);
  const count=64;
  useLayoutEffect(()=>{
    const dummy=new THREE.Object3D(), color=new THREE.Color();
    for(let i=0;i<count;i++) {
      const a=i*2*Math.PI/count, r=8.9+0.55*Math.sin(i*4.7);
      const x=Math.cos(a)*r, z=Math.sin(a)*r, h=0.65+0.3*(1+Math.cos(i*3.1));
      dummy.position.set(x,h*0.38,z); dummy.scale.set(0.07,h*0.76,0.07); dummy.updateMatrix();
      trunks.current!.setMatrixAt(i,dummy.matrix);
      dummy.position.y=h; dummy.scale.set(h*0.43,h*0.58,h*0.49); dummy.rotation.y=i; dummy.updateMatrix();
      leaves.current!.setMatrixAt(i,dummy.matrix);
      leaves.current!.setColorAt(i,color.set(['#819e73','#9eae82','#859e88','#b3bd8e'][i%4]));
    }
    leaves.current!.instanceMatrix.needsUpdate=trunks.current!.instanceMatrix.needsUpdate=true;
    leaves.current!.instanceColor!.needsUpdate=true;
  },[]);
  return <>
    <instancedMesh ref={leaves} args={[undefined,undefined,count]} castShadow receiveShadow><icosahedronGeometry args={[1,1]}/><meshStandardMaterial flatShading/></instancedMesh>
    <instancedMesh ref={trunks} args={[undefined,undefined,count]} castShadow><cylinderGeometry args={[0.7,1,1,6]}/><meshStandardMaterial color="#877a62"/></instancedMesh>
  </>;
}

export default function SolarCampus({overview,nightGlow}: {overview:boolean; nightGlow:number}) {
  const plan=useMemo(sitePlan,[]), facade=useMemo(facadeMap,[]);
  useEffect(()=>()=>{plan.dispose();facade.dispose();},[plan,facade]);
  return <>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><planeGeometry args={[64,64]}/><meshStandardMaterial map={plan} roughness={1}/></mesh>
    <mesh position={[0,0.014,0]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[1.42,48]}/><meshStandardMaterial color="#e3d7bc"/></mesh>
    {overview && <>
      <Tower map={facade} nightGlow={nightGlow}/>
      {BLOCKS.map(([x,z,w,d,h,yaw])=><group key={x} position={[x,0,z]} rotation={[0,yaw,0]}>
        <mesh position={[0,h/2,0]} castShadow receiveShadow><boxGeometry args={[w,h,d]}/><meshStandardMaterial map={facade} emissive="#ddb776" emissiveMap={facade} emissiveIntensity={nightGlow*0.22}/></mesh>
        <mesh position={[0,h+0.04,0]} castShadow><boxGeometry args={[w+0.12,0.08,d+0.12]}/><meshStandardMaterial color="#f3eddf"/></mesh>
        <mesh position={[0,h+0.14,0]} castShadow><boxGeometry args={[w*0.7,0.16,d*0.66]}/><meshStandardMaterial color="#c5ceba"/></mesh>
      </group>)}
      <Plantings/>
    </>}
  </>;
}
