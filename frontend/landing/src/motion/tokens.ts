import type { Transition, Variants } from 'motion/react';

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const spring: Transition = { type: 'spring', stiffness: 100, damping: 20 };
export const springSnappy: Transition = { type: 'spring', stiffness: 300, damping: 30 };
export const springSoft: Transition = { type: 'spring', stiffness: 120, damping: 18 };

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const staggerContainer = (stagger = 0.07, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

export const fadeVariant: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};
