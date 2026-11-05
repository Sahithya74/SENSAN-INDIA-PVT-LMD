import { Fragment, type ElementType } from 'react';

interface FragmentTextProps {
  text: string;
  className?: string;
  as?: ElementType;
  /** chrome on dark surfaces, ink (gunmetal) on porcelain. */
  tone?: 'chrome' | 'ink' | 'plain';
}

/**
 * Text built from fragments. Every character is rendered twice and clipped
 * along a shared diagonal — two metal pieces that a timeline can scatter and
 * reassemble (see animation/fragments.ts). Screen readers get the plain
 * sentence; the pieces are aria-hidden.
 */
export function FragmentText({ text, className = '', as: Tag = 'span', tone = 'chrome' }: FragmentTextProps) {
  const toneClass = tone === 'chrome' ? 'metal-text' : tone === 'ink' ? 'metal-text-ink' : '';
  const words = text.split(' ');
  return (
    <Tag className={`frag ${className}`}>
      <span className="sr-only">{text}</span>
      <span className="frag-visual" aria-hidden="true">
        {words.map((word, wi) => (
          <Fragment key={wi}>
            <span className="frag-word">
              {Array.from(word).map((ch, ci) => (
                <span key={ci} className="frag-char">
                  <span className={`frag-a ${toneClass}`}>{ch}</span>
                  <span className={`frag-b ${toneClass}`}>{ch}</span>
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
