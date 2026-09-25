import { useInView, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useCallback, useEffect, useRef } from 'react';

/**
 * CountUp, from React Bits (https://reactbits.dev/text-animations/count-up).
 * Already used motion/react upstream; only types were added. The animated value
 * is written straight to textContent, so no per-frame React render happens.
 */

type CountUpProps = {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
};

const decimalPlaces = (num: number) => {
  const str = num.toString();
  if (str.includes('.')) {
    const decimals = str.split('.')[1];
    if (parseInt(decimals, 10) !== 0) return decimals.length;
  }
  return 0;
};

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(direction === 'down' ? to : from);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });

  const isInView = useInView(ref, { once: true, margin: '0px' });
  const maxDecimals = Math.max(decimalPlaces(from), decimalPlaces(to));

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;
      const options: Intl.NumberFormatOptions = {
        useGrouping: Boolean(separator),
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };
      const formatted = new Intl.NumberFormat('en-US', options).format(latest);
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [maxDecimals, separator],
  );

  useEffect(() => {
    if (ref.current) ref.current.textContent = formatValue(reduce ? to : direction === 'down' ? to : from);
  }, [from, to, direction, formatValue, reduce]);

  useEffect(() => {
    if (!isInView || !startWhen) return;
    // Reduced motion: land on the final value, no spring.
    if (reduce) {
      motionValue.set(to);
      return;
    }
    onStart?.();
    const timeoutId = setTimeout(() => motionValue.set(direction === 'down' ? from : to), delay * 1000);
    const durationTimeoutId = setTimeout(() => onEnd?.(), delay * 1000 + duration * 1000);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(durationTimeoutId);
    };
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration, reduce]);

  useEffect(() => {
    if (reduce) return;
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) ref.current.textContent = formatValue(latest as number);
    });
    return () => unsubscribe();
  }, [springValue, formatValue, reduce]);

  return <span className={className} ref={ref} />;
}
