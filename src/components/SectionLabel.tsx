interface SectionLabelProps {
  number: string;
  label: string;
  tone?: 'dark' | 'light';
  className?: string;
}

/** Metallic section identifier: "02 ——— Core construction domain". */
export function SectionLabel({ number, label, tone = 'dark', className = '' }: SectionLabelProps) {
  const ink = tone === 'dark' ? 'text-chrome' : 'text-graphite';
  const muted = tone === 'dark' ? 'text-fog' : 'text-ash';
  const rule = tone === 'dark' ? 'from-silver/70' : 'from-graphite/50';
  return (
    <p data-reveal className={`label flex items-center gap-4 ${muted} ${className}`}>
      <span className={tone === 'dark' ? 'metal-text font-medium' : 'metal-text-ink font-medium'}>{number}</span>
      <span className={`h-px w-12 bg-gradient-to-r ${rule} to-transparent`} aria-hidden="true" />
      <span className={ink}>{label}</span>
    </p>
  );
}
