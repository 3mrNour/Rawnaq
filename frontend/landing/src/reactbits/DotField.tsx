import { memo, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * DotField, adapted from React Bits (https://reactbits.dev/backgrounds/dot-field).
 * Changes from upstream: cobalt palette instead of the purple defaults, and a
 * prefers-reduced-motion path that paints one static frame with no rAF loop and
 * no pointer listeners.
 */

const TWO_PI = Math.PI * 2;

type DotFieldProps = {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  bulgeStrength?: number;
  sparkle?: boolean;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
  className?: string;
};

type Dot = { ax: number; ay: number; sx: number; sy: number };

const DotField = memo(function DotField({
  dotRadius = 1.4,
  dotSpacing = 17,
  cursorRadius = 320,
  bulgeStrength = 26,
  sparkle = true,
  gradientFrom = 'rgba(111, 143, 255, 0.34)',
  gradientTo = 'rgba(47, 95, 224, 0.16)',
  glowColor = '#2f5fe0',
  className = '',
}: DotFieldProps) {
  const reduce = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 });
  const glowOpacity = useRef(0);
  const engagement = useRef(0);
  // Unique per instance so two DotFields on one page do not share a gradient.
  // Lazy initializer, so the random call happens once and never during render.
  const [glowId] = useState(() => `dot-field-glow-${Math.random().toString(36).slice(2, 9)}`);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const step = dotRadius + dotSpacing;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;
    let speedTimer: ReturnType<typeof setInterval> | undefined;

    const buildDots = (w: number, h: number) => {
      const cols = Math.floor(w / step);
      const rows = Math.floor(h / step);
      const padX = (w % step) / 2;
      const padY = (h % step) / 2;
      const dots: Dot[] = [];
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          const ax = padX + col * step + step / 2;
          const ay = padY + row * step + step / 2;
          dots.push({ ax, ay, sx: ax, sy: ay });
        }
      }
      dotsRef.current = dots;
    };

    const doResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = {
        w: rect.width,
        h: rect.height,
        offsetX: rect.left + window.scrollX,
        offsetY: rect.top + window.scrollY,
      };
      buildDots(rect.width, rect.height);
    };

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(doResize, 100);
    };

    // Reduced motion: one static paint, no animation loop at all.
    if (reduce) {
      doResize();
      const { w, h } = sizeRef.current;
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, gradientFrom);
      grad.addColorStop(1, gradientTo);
      ctx.fillStyle = grad;
      const rad = dotRadius / 2;
      ctx.beginPath();
      for (const d of dotsRef.current) {
        ctx.moveTo(d.ax + rad, d.ay);
        ctx.arc(d.ax, d.ay, rad, 0, TWO_PI);
      }
      ctx.fill();
      window.addEventListener('resize', onResize);
      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
      };
    }

    const onMouseMove = (event: MouseEvent) => {
      const s = sizeRef.current;
      mouseRef.current.x = event.pageX - s.offsetX;
      mouseRef.current.y = event.pageY - s.offsetY;
    };

    speedTimer = setInterval(() => {
      const m = mouseRef.current;
      const dist = Math.hypot(m.prevX - m.x, m.prevY - m.y);
      m.speed += (dist - m.speed) * 0.5;
      if (m.speed < 0.001) m.speed = 0;
      m.prevX = m.x;
      m.prevY = m.y;
    }, 20);

    let frame = 0;
    const tick = () => {
      frame += 1;
      const dots = dotsRef.current;
      const m = mouseRef.current;
      const { w, h } = sizeRef.current;
      const cr = cursorRadius;
      const crSq = cr * cr;
      const rad = dotRadius / 2;

      const target = Math.min(m.speed / 5, 1);
      engagement.current += (target - engagement.current) * 0.06;
      if (engagement.current < 0.001) engagement.current = 0;
      const eng = engagement.current;
      glowOpacity.current += (eng - glowOpacity.current) * 0.08;

      if (glowRef.current) {
        glowRef.current.setAttribute('cx', String(m.x));
        glowRef.current.setAttribute('cy', String(m.y));
        glowRef.current.style.opacity = String(glowOpacity.current);
      }

      ctx.clearRect(0, 0, w, h);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, gradientFrom);
      grad.addColorStop(1, gradientTo);
      ctx.fillStyle = grad;
      ctx.beginPath();

      for (let i = 0; i < dots.length; i += 1) {
        const d = dots[i];
        const dx = m.x - d.ax;
        const dy = m.y - d.ay;
        const distSq = dx * dx + dy * dy;

        if (distSq < crSq && eng > 0.01) {
          const dist = Math.sqrt(distSq);
          const push = (1 - dist / cr) ** 2 * bulgeStrength * eng;
          const angle = Math.atan2(dy, dx);
          d.sx += (d.ax - Math.cos(angle) * push - d.sx) * 0.15;
          d.sy += (d.ay - Math.sin(angle) * push - d.sy) * 0.15;
        } else {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }

        const sparkleNow = sparkle && ((i * 2654435761) ^ (frame >> 3)) % 100 < 3;
        const r = sparkleNow ? rad * 1.8 : rad;
        ctx.moveTo(d.sx + r, d.sy);
        ctx.arc(d.sx, d.sy, r, 0, TWO_PI);
      }

      ctx.fill();
      rafRef.current = requestAnimationFrame(tick);
    };

    doResize();
    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      clearInterval(speedTimer);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [reduce, dotRadius, dotSpacing, cursorRadius, bulgeStrength, sparkle, gradientFrom, gradientTo]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor={glowColor} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <circle
          ref={glowRef}
          cx="-9999"
          cy="-9999"
          r={160}
          fill={`url(#${glowId})`}
          style={{ opacity: 0 }}
        />
      </svg>
    </div>
  );
});

export default DotField;
