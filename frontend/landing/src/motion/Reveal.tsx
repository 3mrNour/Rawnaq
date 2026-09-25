import { motion, useReducedMotion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';
import { EASE_OUT_EXPO, revealVariants, staggerContainer } from './tokens';

type RevealProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
  as?: 'div' | 'ul' | 'section';
};

/**
 * Scroll-triggered reveal. Staggers direct children through variants.
 * Collapses to a plain static container under prefers-reduced-motion.
 */
export function Reveal({ children, className, stagger = 0.07, delay = 0, as = 'div' }: RevealProps) {
  const reduce = useReducedMotion();
  const Component = motion[as];

  if (reduce) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Component
      className={className}
      variants={staggerContainer(stagger, delay)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
    >
      {children}
    </Component>
  );
}

type RevealItemProps = {
  children: ReactNode;
  className?: string;
  variants?: Variants;
};

export function RevealItem({ children, className, variants = revealVariants }: RevealItemProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  );
}
