import { motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import { EASE_OUT_EXPO, spring } from './tokens';

type MaskedLinesProps = {
  lines: readonly string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  play?: 'mount' | 'inView';
  as?: 'h1' | 'h2' | 'p' | 'span';
};

/**
 * Reveals each line of a headline from behind a mask, so the type lands with
 * weight instead of fading in flat. Collapses to static markup under
 * prefers-reduced-motion.
 */
export function MaskedLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  play = 'mount',
  as = 'span',
}: MaskedLinesProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    const Static = as;
    return (
      <Static className={className}>
        {lines.map((line) => (
          <span key={line} className={`block ${lineClassName ?? ''}`}>
            {line}
          </span>
        ))}
      </Static>
    );
  }

  const Wrapper = motion[as];
  const trigger =
    play === 'inView'
      ? { whileInView: 'visible' as const, viewport: { once: true, amount: 0.6 } }
      : { animate: 'visible' as const };

  return (
    <Wrapper
      className={className}
      initial="hidden"
      {...trigger}
      variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: delay } } }}
    >
      {lines.map((line) => (
        <span key={line} className="block overflow-hidden pb-[0.12em]">
          <motion.span
            className={`block ${lineClassName ?? ''}`}
            variants={{
              hidden: { y: '110%' },
              visible: { y: '0%', transition: { ...spring, stiffness: 90, damping: 22 } },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Wrapper>
  );
}

type TypeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  as?: 'h1' | 'h2' | 'p' | 'span' | 'div';
};

export function TypeIn({ children, className, delay = 0, duration = 0.6, as = 'span' }: TypeInProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  const Wrapper = motion[as];
  return (
    <Wrapper
      className={className}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </Wrapper>
  );
}
