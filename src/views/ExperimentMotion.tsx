import {useLayoutEffect, useRef} from 'react';

declare global {
  interface Window {
    GeoMotion: {
      reveal(heading: HTMLElement): () => void;
      magnets(nav: HTMLElement): () => void;
      particles(canvas: HTMLCanvasElement): () => void;
    };
  }
}

export function ExperimentTitle({children}: {children: string}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => window.GeoMotion.reveal(ref.current!), [children]);
  return <h2 ref={ref} aria-label={children}>{Array.from(children, (letter, i) =>
    <span key={i} aria-hidden="true" style={{display:'inline-block'}}>{letter}</span>
  )}</h2>;
}
