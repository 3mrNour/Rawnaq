import { motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * BlurText, from React Bits (https://reactbits.dev/text-animations/blur-text).
 * Converted to TypeScript. The upstream IntersectionObserver is kept, since
 * that is what avoids a scroll listener.
 */

const buildKeyframes = (from: Record<string, number | string>, steps: Record<string, number | string>[]) => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap((s) => Object.keys(s))]);
  const keyframes: Record<string, (number | string)[]> = {};
  keys.forEach((k) => {
    keyframes[k] = [from[k], ...steps.map((s) => s[k])];
  });
  return keyframes;
};

type BlurTextProps = {
  text?: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  animationFrom?: Record<string, number | string>;
  animationTo?: Record<string, number | string>[];
  easing?: (t: number) => number;
  onAnimationComplete?: () => void;
  stepDuration?: number;
  /** Upstream hardcodes a <p>. Added so the text can sit inside a heading. */
  as?: 'p' | 'span';
};

export default function BlurText({
  text = '',
  delay = 90,
  className = '',
  animateBy = 'words',
  direction = 'top',
  threshold = 0.1,
  rootMargin = '0px',
  animationFrom,
  animationTo,
  easing = (t) => t,
  onAnimationComplete,
  stepDuration = 0.35,
  as = 'p',
}: BlurTextProps) {
  const reduce = useReducedMotion();
  const elements = animateBy === 'words' ? text.split(' ') : text.split('');
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  const Wrapper = as;

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(ref.current as Element);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(
    () =>
      direction === 'top' ? { filter: 'blur(10px)', opacity: 0, y: -40 } : { filter: 'blur(10px)', opacity: 0, y: 40 },
    [direction],
  );

  const defaultTo = useMemo(
    () => [
      { filter: 'blur(5px)', opacity: 0.5, y: direction === 'top' ? 4 : -4 },
      { filter: 'blur(0px)', opacity: 1, y: 0 },
    ],
    [direction],
  );

  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;

  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, i) => (stepCount === 1 ? 0 : i / (stepCount - 1)));

  if (reduce) {
    return <Wrapper className={className}>{text}</Wrapper>;
  }

  return (
    <Wrapper ref={ref as never} className={className} style={{ display: 'flex', flexWrap: 'wrap' }}>
      {elements.map((segment, index) => {
        const keyframes = buildKeyframes(fromSnapshot, toSnapshots);
        const transition: Record<string, unknown> = {
          duration: totalDuration,
          times,
          delay: (index * delay) / 1000,
          ease: easing,
        };

        return (
          <motion.span
            className="inline-block will-change-[transform,filter,opacity]"
            key={`${index}-${segment}`}
            initial={fromSnapshot}
            animate={inView ? keyframes : fromSnapshot}
            transition={transition as never}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
          >
            {segment === ' ' ? '\u00A0' : segment}
            {animateBy === 'words' && index < elements.length - 1 ? '\u00A0' : null}
          </motion.span>
        );
      })}
    </Wrapper>
  );
}
