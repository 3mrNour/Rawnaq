import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { ArrowLeft, Sparkle } from '@phosphor-icons/react';
import { CONTACT, HERO } from '../content/copy';
import { APP_URLS } from '../lib/app';
import { Screenshot } from '../components/Screenshot';
import DotField from '../reactbits/DotField';
import Magnet from '../reactbits/Magnet';
import { MaskedLines, TypeIn } from '../motion/MaskedLines';

export function Hero() {
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);

  // Progress drives one transform pair. No per-frame React state.
  const { scrollYProgress } = useScroll({ target: frame, offset: ['start start', 'end start'] });
  const imageY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 90]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);

  return (
    <section
      id="top"
      aria-label="رونق في سطر"
      className="relative flex min-h-[100dvh] items-center overflow-hidden px-4 pb-16 pt-24 sm:px-6"
    >
      <DotField
        gradientFrom="rgba(111, 143, 255, 0.26)"
        gradientTo="rgba(47, 95, 224, 0.08)"
        glowColor="#2f5fe0"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 start-[-10%] size-[42rem] rounded-full bg-accent/12 blur-[120px]"
      />

      <div ref={frame} className="relative mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-12">
        <motion.div style={{ y: copyY }} className="lg:col-span-5">
          <TypeIn className="block text-sm text-ink-muted">{HERO.eyebrow}</TypeIn>

          <MaskedLines
            as="h1"
            play="mount"
            delay={0.08}
            lines={HERO.headline}
            className="mt-5 block text-[2.75rem] font-bold leading-[1.12] tracking-tight text-ink sm:text-6xl lg:text-[4.25rem]"
          />

          <TypeIn as="p" delay={0.34} className="mt-6 block max-w-[46ch] text-base leading-relaxed text-ink-muted sm:text-lg">
            {HERO.subtext}
          </TypeIn>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Magnet padding={40} magnetStrength={5} wrapperClassName="rounded-control">
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-2 rounded-control bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-16px_var(--color-accent)] transition-colors duration-200 hover:bg-accent-bright"
              >
                {HERO.primaryCta}
                <ArrowLeft size={17} />
              </a>
            </Magnet>

            <a
              href={APP_URLS.tenantLogin}
              className="inline-flex items-center gap-2 rounded-control border border-hairline px-6 py-3.5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink-faint hover:bg-raised"
            >
              {HERO.secondaryCta}
            </a>
          </div>
        </motion.div>

        <motion.div
          style={{ y: imageY }}
          className="relative lg:col-span-7"
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-accent/18 via-transparent to-transparent"
            />
            <Screenshot
              priority
              src="/screenshots/pos.webp"
              alt="شاشة نقطة البيع في رونق"
              width={1440}
              height={900}
              className="rounded-[1.25rem] shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]"
            />

            <motion.div
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -bottom-6 start-4 flex items-center gap-3 rounded-panel border border-hairline bg-raised/95 px-4 py-3 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.9)] backdrop-blur sm:start-8"
            >
              <span aria-hidden="true" className="grid size-9 place-items-center rounded-control bg-ready/15 text-ready">
                <Sparkle size={18} weight="fill" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{HERO.floatingChip.title}</span>
                <span className="block text-xs text-ink-muted">{HERO.floatingChip.body}</span>
              </span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
