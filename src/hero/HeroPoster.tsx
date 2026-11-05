import { useState } from 'react';
import { posterUrl } from './heroAssets';

interface HeroPosterProps {
  which: 'intro' | 'final';
  /** Fade out once a live visual has taken over. */
  hidden?: boolean;
  onAvailable?: (available: boolean) => void;
}

const PORTRAIT_MEDIA = '(max-aspect-ratio: 9/10)';

/** First paint of the hero: a still rendered from the scene, preloaded as the LCP image. */
export function HeroPoster({ which, hidden = false, onAvailable }: HeroPosterProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <picture>
      <source media={PORTRAIT_MEDIA} type="image/avif" srcSet={posterUrl(which, 'portrait', 'avif')} />
      <source media={PORTRAIT_MEDIA} type="image/webp" srcSet={posterUrl(which, 'portrait', 'webp')} />
      <source type="image/avif" srcSet={posterUrl(which, 'landscape', 'avif')} />
      <img
        src={posterUrl(which, 'landscape', 'webp')}
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms]"
        style={{ opacity: hidden ? 0 : 1 }}
        onLoad={() => onAvailable?.(true)}
        onError={() => {
          setFailed(true);
          onAvailable?.(false);
        }}
      />
    </picture>
  );
}
