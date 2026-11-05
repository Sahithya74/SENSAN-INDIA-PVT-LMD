import { useEffect, useRef } from 'react';
import { heroProgress } from '../lib/store';
import { viewportOrientation, type Orientation } from '../lib/deviceTier';
import { frameUrl, manifestUrl, supportsAvif, type FrameManifest } from './heroAssets';

interface FrameSequenceProps {
  onReady: () => void;
  onFail: () => void;
}

/** Every 8th frame first, then every 4th, 2nd, the rest — the sequence is scrubbable almost immediately. */
function strideOrder(count: number): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  for (const stride of [8, 4, 2, 1]) {
    for (let i = 0; i < count; i += stride) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  if (!seen.has(count - 1)) order.splice(1, 0, count - 1);
  return order;
}

/**
 * Scroll-scrubbed canvas frame sequence for phones and devices without
 * WebGL. Frames are pre-rendered from the live scene; adjacent frames are
 * cross-faded so ~60 images scrub smoothly.
 */
export function FrameSequence({ onReady, onFail }: FrameSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({ onReady, onFail });
  callbacks.current = { onReady, onFail };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { alpha: false });
    if (!canvas || !ctx) return;

    let disposed = false;
    let raf = 0;
    let frames: (ImageBitmap | undefined)[] = [];
    let manifest: FrameManifest | null = null;
    let orientation: Orientation = viewportOrientation();
    let generation = 0;
    let announced = false;

    const nearest = (index: number, direction: 1 | -1) => {
      for (let d = 0; d < frames.length; d++) {
        const forward = frames[index + d * direction];
        if (forward) return forward;
        const backward = frames[index - d * direction];
        if (backward) return backward;
      }
      return undefined;
    };

    const drawCover = (image: ImageBitmap) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const scale = Math.max(cw / image.width, ch / image.height);
      const w = image.width * scale;
      const h = image.height * scale;
      ctx.drawImage(image, (cw - w) / 2, (ch - h) / 2, w, h);
    };

    /** Frame index and fraction towards the next frame for progress p. */
    const locate = (p: number, m: FrameManifest): [number, number] => {
      const stops = m.stops;
      if (!stops || stops.length !== m.count) {
        const position = p * (m.count - 1);
        const i = Math.min(m.count - 2, Math.floor(position));
        return [i, position - i];
      }
      let lo = 0;
      let hi = stops.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (stops[mid] <= p) lo = mid;
        else hi = mid;
      }
      return [lo, (p - stops[lo]) / Math.max(1e-6, stops[lo + 1] - stops[lo])];
    };

    const draw = () => {
      raf = 0;
      if (!manifest || !frames.length) return;
      const [i0, f] = locate(heroProgress.get(), manifest);
      const i1 = Math.min(manifest.count - 1, i0 + 1);
      const a = nearest(f < 0.5 ? i0 : i1, f < 0.5 ? -1 : 1);
      if (!a) return;
      ctx.globalAlpha = 1;
      drawCover(a);
      // Blend only through the middle of the interval: a crisp single frame
      // most of the time, no double images during fast motion.
      const blend = Math.min(1, Math.max(0, (f - 0.3) / 0.4));
      const other = f < 0.5 ? frames[i1] : frames[i0];
      const weight = f < 0.5 ? blend : 1 - blend;
      if (other && other !== a && weight > 0.02) {
        ctx.globalAlpha = weight;
        drawCover(other);
        ctx.globalAlpha = 1;
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
      schedule();
    };

    const load = async () => {
      const current = ++generation;
      frames.forEach((f) => f?.close());
      frames = [];
      const response = await fetch(manifestUrl(orientation));
      if (!response.ok) throw new Error(`No frame manifest for ${orientation}`);
      const loaded = (await response.json()) as FrameManifest;
      if (disposed || current !== generation) return;
      manifest = loaded;
      frames = new Array(loaded.count);
      const format = loaded.formats.includes('avif') && (await supportsAvif()) ? 'avif' : 'webp';
      const queue = strideOrder(loaded.count);
      let cursor = 0;

      const worker = async () => {
        while (!disposed && current === generation && cursor < queue.length) {
          const index = queue[cursor++];
          try {
            const blob = await (await fetch(frameUrl(orientation, index, loaded, format))).blob();
            const bitmap = await createImageBitmap(blob);
            if (disposed || current !== generation) {
              bitmap.close();
              return;
            }
            frames[index] = bitmap;
            if (!announced && index === 0) {
              announced = true;
              callbacks.current.onReady();
            }
            schedule();
          } catch {
            // A missing frame is covered by its neighbours.
          }
        }
      };
      await Promise.all([worker(), worker(), worker(), worker()]);
      if (!frames.some(Boolean)) throw new Error('No frames could be decoded');
    };

    const start = () =>
      load().catch((error) => {
        if (disposed) return;
        console.warn('[hero] Frame sequence unavailable.', error);
        callbacks.current.onFail();
      });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const onOrientation = () => {
      const next = viewportOrientation();
      if (next !== orientation) {
        orientation = next;
        start();
      }
    };
    window.addEventListener('resize', onOrientation);
    const unsubscribe = heroProgress.subscribe(schedule);
    start();

    return () => {
      disposed = true;
      unsubscribe();
      resizeObserver.disconnect();
      window.removeEventListener('resize', onOrientation);
      cancelAnimationFrame(raf);
      frames.forEach((f) => f?.close());
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />;
}
