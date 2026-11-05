import { useState, type ReactNode } from 'react';
import { asset } from '../lib/asset';

interface RenderImageProps {
  /** Base name in /public/images/renders, e.g. "viaduct-dawn" → viaduct-dawn-960.avif … */
  name: string;
  alt: string;
  sizes: string;
  className?: string;
  /** Shown if the render has not been generated yet. */
  fallback?: ReactNode;
  parallax?: number;
}

const WIDTHS = [960, 1600];

/** A still rendered from the hero scene (`node scripts/render-still.mjs --export <name>`), AVIF with WebP fallback. */
export function RenderImage({ name, alt, sizes, className = '', fallback = null, parallax }: RenderImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <>{fallback}</>;
  const set = (ext: string) => WIDTHS.map((w) => `${asset(`images/renders/${name}-${w}.${ext}`)} ${w}w`).join(', ');
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes={sizes} />
      <img
        src={asset(`images/renders/${name}-1600.webp`)}
        srcSet={set('webp')}
        sizes={sizes}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
        data-parallax={parallax}
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
