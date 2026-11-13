import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {TextureLoader,SRGBColorSpace,PerspectiveCamera} from 'three';
import {Component, Suspense, useState, useEffect, type ReactNode} from 'react';
import {Canvas,useThree,useLoader} from '@react-three/fiber';
import type {AstronomyState} from '../science/model';
const map=(v:number[],r=1):[number,number,number]=>[v[0]*r,v[2]*r,-v[1]*r];
class Boundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return {failed:true}}render(){return this.state.failed?<p>三维视图不可用，请启用浏览器 WebGL；其他视图仍可使用。</p>:this.props.children}}
function CameraControls(){const {camera,gl,invalidate}=useThree();useEffect(()=>{const c=new OrbitControls(camera,gl.domElement);c.enablePan=false;c.minDistance=6;c.maxDistance=25;c.addEventListener('change',()=>invalidate());const reset=()=>{c.reset();invalidate()};gl.domElement.addEventListener('dblclick',reset);return()=>{c.dispose();gl.domElement.removeEventListener('dblclick',reset)}},[camera,gl,invalidate]);return null;}
function FitCamera() {
 const {camera,size,invalidate}=useThree();
 useEffect(()=>{
   if (!(camera instanceof PerspectiveCamera) || !size.width || !size.height) return;
   const aspect=size.width/size.height;
   camera.fov=Math.max(38,2*Math.atan(8.9/(camera.position.length()*aspect))*180/Math.PI);
   // Place the orbit slightly left of centre, clear of the lunar portrait.
   camera.setViewOffset(size.width,size.height,size.width*(size.width>760 ? 0.105 : 0.075),0,size.width,size.height);
   camera.updateProjectionMatrix();
   invalidate();
 },[camera,size.width,size.height,invalidate]);
 return null;
}
function Scene({m}:{m:AstronomyState}){
 const texture=useLoader(TextureLoader,'/textures/moon.jpg');
 texture.colorSpace=SRGBColorSpace;
 const [earth,sun]=useLoader(GLTFLoader,['/models/earth.glb','/models/sun.glb']);
 // Both NASA scenes have a bounding radius of 500 in model coordinates.
 return <>
   <ambientLight intensity={0.8}/><directionalLight position={map(m.sunDirection,10)} intensity={3.2}/>
   <group rotation={[0,-0.9,0]} scale={0.79/500}><primitive object={earth.scene}/></group>
   <mesh position={map(m.moonPosition,3)} rotation={[0,Math.PI+m.moonLongitude,0]}>
     <sphereGeometry args={[0.32,48,32]}/><meshStandardMaterial map={texture} roughness={1}/>
   </mesh>
   <group rotation={[0,m.sunLongitude,0]}>
     <group position={[7.2,0,0]} scale={1.12/500}><primitive object={sun.scene}/></group>
     {[-0.46,0,0.46].map(z=><group key={z} position={[0,0,z]}>
       <mesh position={[4.03,0,0]} rotation={[0,0,Math.PI/2]}>
         <cylinderGeometry args={[0.012,0.012,3.7,8]}/><meshBasicMaterial color="#af8439"/>
       </mesh>
       <mesh position={[2.1,0,0]} rotation={[0,0,Math.PI/2]}>
         <coneGeometry args={[0.078,0.23,12]}/><meshBasicMaterial color="#af8439"/>
       </mesh>
     </group>)}
   </group>
   <mesh rotation={[-Math.PI/2,0,0]}><torusGeometry args={[3,0.012,8,128]}/><meshBasicMaterial color="#55675a"/></mesh>
 </>;
}
export default function SpaceView({model}:{model:AstronomyState}){
 const [top,setTop]=useState(false);
 return <section className="space-panel"><div className="flex justify-between items-center"><h2>日地月空间</h2><button onClick={()=>setTop(!top)}>{top?'倾斜观察':'北极俯视'}</button></div><div className="space-canvas" data-testid="space-view"><Boundary><Suspense fallback={<p>正在加载空间模型…</p>}><Canvas frameloop="demand" dpr={[1,1.5]} key={String(top)} camera={{position:top?[0,12,0.01]:[0,8,9],fov:38}} onCreated={({camera})=>camera.lookAt(0,0,0)} fallback={<p>浏览器不支持 WebGL。</p>}><FitCamera/><CameraControls/><Scene m={model}/></Canvas></Suspense></Boundary></div></section>;
}
