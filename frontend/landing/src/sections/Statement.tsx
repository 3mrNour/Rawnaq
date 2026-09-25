import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { STATEMENT } from '../content/copy';
import { Section } from '../components/Section';
import BlurText from '../reactbits/BlurText';
import { EASE_OUT_EXPO } from '../motion/tokens';

export function Statement() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  return (
    <Section id="manifesto" label="مبدأ رونق" className="py-28 sm:py-36">
      <h2 className="max-w-[22ch] text-[2.25rem] font-bold leading-[1.2] tracking-tight text-ink sm:text-5xl lg:text-6xl">
        <BlurText
          as="span"
          text={STATEMENT.headline.join(' ')}
          delay={70}
          animateBy="words"
          direction="bottom"
        />
      </h2>

      <motion.p
        ref={ref}
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7, delay: 0.35, ease: EASE_OUT_EXPO }}
        className="mt-8 max-w-[64ch] text-lg leading-[1.9] text-ink-muted"
      >
        {STATEMENT.body}
      </motion.p>
    </Section>
  );
}
