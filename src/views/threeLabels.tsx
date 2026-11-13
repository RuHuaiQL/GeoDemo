import {useFrame} from '@react-three/fiber';
import {useEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';

export type Vec3 = [number, number, number];

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function makeLabel(text: string, color: string, background?: string) {
  const font = '600 32px "Noto Sans SC","Microsoft YaHei",system-ui,sans-serif';
  const measureCanvas = document.createElement('canvas');
  const measure = measureCanvas.getContext('2d')!;
  measure.font = font;
  const width = Math.ceil(measure.measureText(text).width) + 36;
  const height = 64;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (background) {
    ctx.fillStyle = background;
    roundRect(ctx, 1, 1, width - 2, height - 2, 16);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.fillText(text, width / 2, height / 2 + 1);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return {texture, aspect: width / height};
}

export function LabelSprite({text, position, height = 0.55, color = '#f3e8cd', background = 'rgba(7,12,22,0.78)', onClick, constantSize}: {
  text: string;
  position: Vec3;
  height?: number;
  color?: string;
  background?: string;
  onClick?: () => void;
  constantSize?: number;
}) {
  const {texture, aspect} = useMemo(() => makeLabel(text, color, background), [text, color, background]);
  const ref = useRef<THREE.Sprite>(null);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(({camera}) => {
    if (!constantSize || !ref.current) return;
    const distance = camera.position.distanceTo(ref.current.position);
    const size = Math.max(0.28, distance * constantSize);
    ref.current.scale.set(size * aspect, size, 1);
  });
  return <sprite
    ref={ref}
    position={position}
    scale={[height * aspect, height, 1]}
    renderOrder={20}
    onClick={onClick ? event => {event.stopPropagation(); onClick();} : undefined}
    onPointerOver={onClick ? () => {document.body.style.cursor = 'pointer';} : undefined}
    onPointerOut={onClick ? () => {document.body.style.cursor = 'default';} : undefined}
  >
    <spriteMaterial map={texture} transparent depthWrite={false} depthTest={false} toneMapped={false}/>
  </sprite>;
}
