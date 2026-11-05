import { useEffect, useRef } from 'react';
import { createHeroScene } from './scene/createHeroScene';

declare global {
  interface Window {
    __hero?: { ready: Promise<void>; render: (p: number) => void };
  }
}

/**
 * `/?render=1&orient=landscape|portrait` — a bare full-viewport canvas used
 * by scripts/render-hero-frames.mjs to export the frame sequence and posters
 * from exactly the same scene the live hero renders.
 */
export default function RenderMode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const params = new URLSearchParams(window.location.search);
    const orientation = params.get('orient') === 'portrait' ? 'portrait' : 'landscape';
    const scene = createHeroScene(canvas, { quality: 'full', renderMode: true, orientation, maxPixelRatio: 1 });
    window.__hero = { ready: scene.ready, render: (p) => scene.renderAt(p) };
    return () => {
      delete window.__hero;
      scene.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', display: 'block' }} />;
}
