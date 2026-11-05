import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/** Ambient sound is off until the visitor asks for it. */
export function SoundToggle({ className = '' }: { className?: string }) {
  const [on, setOn] = useState(false);

  const toggle = async () => {
    const next = !on;
    setOn(next);
    const { setAmbience } = await import('../audio/ambience');
    await setAmbience(next).catch(() => setOn(false));
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Turn ambient sound off' : 'Turn ambient sound on'}
      className={`grid h-9 w-9 place-items-center rounded-full text-fog transition-colors hover:text-porcelain ${className}`}
    >
      {on ? <Volume2 size={16} strokeWidth={1.5} /> : <VolumeX size={16} strokeWidth={1.5} />}
    </button>
  );
}
