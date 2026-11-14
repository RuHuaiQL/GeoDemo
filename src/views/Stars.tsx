import {useEffect, useRef} from 'react';

export const starDefaults = {density:52, size:2, light:68, twinkle:88, speed:6};
export type StarSettings = typeof starDefaults;
export default function Stars({settings = starDefaults, paused = false}: {settings?: StarSettings; paused?: boolean}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(settings);
  latest.current = settings;
  const stopped = useRef(paused);
  stopped.current = paused;
  const redraw = useRef<() => void>(() => {});
  useEffect(() => {
    const el = canvas.current!;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const sky = Array.from({length: 900}, () => ({
      x: Math.random(), y: Math.random(), depth: .22 + .78 * Math.random(), phase: Math.random()*2*Math.PI,
    }));
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let width = 1, height = 1, frame = 0, last = 0, distance = 0, time = 0;
    let targetX = 0, targetY = 0, offsetX = 0, offsetY = 0;
    const host = el.parentElement!;
    function pointer(event: PointerEvent) {
      if (event.pointerType === 'touch' || media.matches || stopped.current) return;
      const rect = host.getBoundingClientRect();
      targetX = event.type === 'pointerleave' ? 0 : ((event.clientX-rect.left)/width-.5)*40;
      targetY = event.type === 'pointerleave' ? 0 : ((event.clientY-rect.top)/height-.5)*40;
      wake();
    }
    function draw(now: number) {
      frame = 0;
      if (document.hidden || !el.getClientRects().length) {last = 0; return;}
      const p = latest.current;
      const dt = last ? Math.min((now-last)/1000,.05) : 0;
      last = now;
      if (media.matches) {offsetX = offsetY = targetX = targetY = 0;}
      else if (!stopped.current) {
        distance += dt*p.speed; time += dt;
        const follow = 1 - Math.exp(-dt*9);
        offsetX += (targetX-offsetX)*follow; offsetY += (targetY-offsetY)*follow;
      }
      const count = Math.min(sky.length, Math.round(width*height/2000*p.density/100));
      ctx!.clearRect(0,0,width,height);
      for(let i=0; i<count; i++) {
        const star = sky[i];
        const x = (star.x*width + (distance+offsetX)*star.depth + width) % width;
        const y = (star.y*height + (distance*.18+offsetY)*star.depth + height) % height;
        const r = p.size * star.depth;
        const pulse = (1 + Math.sin(time*(.6+star.depth) + star.phase)) / 2;
        ctx!.globalAlpha = p.light/100 * (.35+.65*star.depth) * (1-p.twinkle/100*pulse*.85);
        ctx!.fillStyle = ['#e3f1ff','#f6d7ae','#cad8ed'][i%3];
        ctx!.beginPath(); ctx!.arc(x,y,r,0,Math.PI*2); ctx!.fill();
        if (star.depth > .92) {
          ctx!.globalAlpha *= .12;
          ctx!.beginPath(); ctx!.arc(x,y,r*2.4,0,Math.PI*2); ctx!.fill();
        }
      }
      const following = Math.hypot(targetX-offsetX,targetY-offsetY) > .05;
      if (!media.matches && !stopped.current && count && p.light && (p.speed || p.twinkle || following)) frame = requestAnimationFrame(draw);
      else last = 0;
    }
    function wake() {if (!frame) frame = requestAnimationFrame(draw);}
    const resize = new ResizeObserver(() => {
      width = Math.max(1,el.clientWidth); height = Math.max(1,el.clientHeight);
      const ratio = Math.min(devicePixelRatio || 1,1.5);
      el.width = Math.round(width*ratio); el.height = Math.round(height*ratio);
      ctx.setTransform(ratio,0,0,ratio,0,0); wake();
    });
    resize.observe(el);
    host.addEventListener('pointermove',pointer);
    host.addEventListener('pointerleave',pointer);
    redraw.current = wake;
    media.addEventListener('change',wake);
    document.addEventListener('visibilitychange',wake);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect();
      host.removeEventListener('pointermove',pointer); host.removeEventListener('pointerleave',pointer);
      media.removeEventListener('change',wake); document.removeEventListener('visibilitychange',wake);
    };
  }, []);
  useEffect(() => redraw.current(), [settings, paused]);
  return <canvas className="space-stars" ref={canvas} aria-hidden="true"/>;
}
