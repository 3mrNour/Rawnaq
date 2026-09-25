import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react';

/**
 * Magnet, from React Bits (https://reactbits.dev/animations/magnet).
 *
 * One deliberate change from upstream: the original tracks a window-level
 * mousemove listener and calls setState on every move, which re-renders React
 * per pointer event. Here the offset lives in motion values and the listener is
 * scoped to the wrapper, so the subtree never re-renders. Props and behaviour
 * are otherwise the same.
 */

type MagnetProps = {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  wrapperClassName?: string;
  innerClassName?: string;
} & HTMLAttributes<HTMLDivElement>;

export default function Magnet({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  wrapperClassName = '',
  innerClassName = '',
  ...rest
}: MagnetProps) {
  const reduce = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || disabled || reduce) {
      x.set(0);
      y.set(0);
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const box = node.getBoundingClientRect();
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;

      if (
        Math.abs(centerX - event.clientX) < box.width / 2 + padding &&
        Math.abs(centerY - event.clientY) < box.height / 2 + padding
      ) {
        x.set((event.clientX - centerX) / magnetStrength);
        y.set((event.clientY - centerY) / magnetStrength);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const onPointerLeave = () => {
      x.set(0);
      y.set(0);
    };

    node.addEventListener('pointermove', onPointerMove, { passive: true });
    node.addEventListener('pointerleave', onPointerLeave);
    return () => {
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [padding, disabled, magnetStrength, reduce, x, y]);

  return (
    <div ref={wrapperRef} className={wrapperClassName} style={{ position: 'relative', display: 'inline-block' }} {...rest}>
      <motion.div className={innerClassName} style={{ x: springX, y: springY }}>
        {children}
      </motion.div>
    </div>
  );
}
