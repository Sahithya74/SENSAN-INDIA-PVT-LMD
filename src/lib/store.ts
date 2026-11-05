/**
 * Minimal observable value. Used for high-frequency signals (scroll progress,
 * pointer) that drive canvas and DOM updates directly, without React renders.
 */
export interface Store<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: (value: T) => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<(value: T) => void>();
  return {
    get: () => value,
    set(next) {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener(next));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** Smoothed progress (0–1) of the pinned hero construction sequence. */
export const heroProgress = createStore(0);

/** Pointer position normalised to −1…1 (y up). Stays at 0,0 on touch devices. */
export const pointer = createStore({ x: 0, y: 0 });
