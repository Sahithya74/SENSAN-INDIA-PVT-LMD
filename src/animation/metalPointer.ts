import { pointer } from '../lib/store';

/**
 * One rAF-throttled pointer listener for the whole site. It writes --mx/--my
 * (0–1) to :root for CSS metal and publishes the normalised position for the
 * canvas. Touch-only devices are skipped: there is no cursor to respond to.
 */
export function initMetalPointer(): () => void {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => {};

  const root = document.documentElement;
  let frame = 0;
  let nx = 0.5;
  let ny = 0.5;

  const apply = () => {
    frame = 0;
    root.style.setProperty('--mx', nx.toFixed(3));
    root.style.setProperty('--my', ny.toFixed(3));
    pointer.set({ x: nx * 2 - 1, y: 1 - ny * 2 });
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    nx = event.clientX / window.innerWidth;
    ny = event.clientY / window.innerHeight;
    if (!frame) frame = requestAnimationFrame(apply);
  };

  window.addEventListener('pointermove', onMove, { passive: true });
  return () => {
    window.removeEventListener('pointermove', onMove);
    cancelAnimationFrame(frame);
  };
}
