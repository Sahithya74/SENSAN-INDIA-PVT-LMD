import { useEffect, useRef, useState } from 'react';
import { heroProgress, pointer } from '../lib/store';
import type { HeroSceneController, Quality } from './scene/createHeroScene';

interface HeroCanvasProps {
  quality: Quality;
  onReady: () => void;
  onFail: () => void;
}

/**
 * Lazy-loads the Three.js scene (its own chunk) and binds it to the hero's
 * scroll progress and the pointer. Rendering pauses whenever the canvas is
 * off-screen or the tab is hidden.
 */
export function HeroCanvas({ quality, onReady, onFail }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const callbacks = useRef({ onReady, onFail });
  callbacks.current = { onReady, onFail };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let disposed = false;
    let controller: HeroSceneController | null = null;
    const cleanups: (() => void)[] = [];

    const fail = (error: unknown) => {
      if (disposed) return;
      console.warn('[hero] WebGL scene unavailable, falling back to frames.', error);
      callbacks.current.onFail();
    };

    import('./scene/createHeroScene')
      .then(async ({ createHeroScene }) => {
        if (disposed) return;
        controller = createHeroScene(canvas, { quality, onContextLost: () => fail('context lost') });
        controller.setProgress(heroProgress.get());
        cleanups.push(
          heroProgress.subscribe((p) => controller?.setProgress(p)),
          pointer.subscribe(({ x, y }) => controller?.setPointer(x, y)),
        );
        const io = new IntersectionObserver(([entry]) => controller?.setActive(entry.isIntersecting));
        io.observe(canvas);
        cleanups.push(() => io.disconnect());

        await controller.ready;
        if (disposed) return;
        setVisible(true);
        callbacks.current.onReady();
      })
      .catch(fail);

    return () => {
      disposed = true;
      cleanups.forEach((fn) => fn());
      controller?.dispose();
    };
  }, [quality]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full transition-opacity duration-[1400ms] ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    />
  );
}
