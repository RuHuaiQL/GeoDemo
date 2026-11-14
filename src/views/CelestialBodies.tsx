import {useLoader} from '@react-three/fiber';
import {useMemo} from 'react';
import {AdditiveBlending, TextureLoader, SRGBColorSpace, Vector3, type Mesh} from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

type Direction = [number,number,number];
function CityLights({surface, sunDirection}: {surface: Mesh; sunDirection: Direction}) {
  const night = useLoader(TextureLoader,'/textures/earth-night.jpg');
  night.colorSpace = SRGBColorSpace;
  const uniforms = useMemo(()=>({lights:{value:night}, sun:{value:new Vector3()}}),[night]);
  uniforms.sun.value.set(...sunDirection).normalize();
  return <mesh geometry={surface.geometry} scale={1.0002} renderOrder={1} dispose={null}>
    <shaderMaterial transparent depthWrite={false} blending={AdditiveBlending} uniforms={uniforms}
      vertexShader={`
        varying vec3 localDirection;
        varying vec3 worldDirection;
        void main() {
          localDirection = position;
          worldDirection = mat3(modelMatrix) * position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
        }`}
      fragmentShader={`
        uniform sampler2D lights;
        uniform vec3 sun;
        varying vec3 localDirection;
        varying vec3 worldDirection;
        void main() {
          vec3 n = normalize(localDirection);
          // The GLB's prime meridian is a quarter turn from the map's origin.
          vec2 uv = vec2(fract(atan(-n.z,n.x)/6.2831853 + .25), asin(clamp(n.y,-1.,1.))/3.14159265 + .5);
          vec3 color = texture2D(lights,uv).rgb;
          float darkness = 1. - smoothstep(-.20,.025,dot(normalize(worldDirection),sun));
          // Keep warm city clusters visible even when the globe is small on screen.
          float lamps = smoothstep(.001,.045,color.r - .65 * color.b) * smoothstep(.003,.055,color.r);
          vec3 glow = mix(vec3(.88,.42,.12),vec3(1.,.81,.49),smoothstep(.035,.45,color.r));
          gl_FragColor = vec4(glow,lamps * darkness * .9);
          #include <colorspace_fragment>
        }`}/>
  </mesh>;
}

export function Earth({radius,sunDirection}: {radius:number; sunDirection?:Direction}) {
  const {scene} = useLoader(GLTFLoader, '/models/earth.glb');
  const surface = scene.children[0] as Mesh;
  return <group rotation={[0,-0.9,0]} scale={radius / 500}>
    <primitive object={scene}/>
    {sunDirection && <CityLights surface={surface} sunDirection={sunDirection}/>}
  </group>;
}

export function Moon({radius, color = 'white'}: {radius: number; color?: string}) {
  const surface = useLoader(TextureLoader, '/textures/moon.jpg');
  surface.colorSpace = SRGBColorSpace;
  return <mesh>
    <sphereGeometry args={[radius,64,48]}/>
    <meshStandardMaterial map={surface} roughness={1} color={color}/>
  </mesh>;
}
