import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { JOURNEY } from '../content/copy';
import { Section } from '../components/Section';
import { JourneyArt } from '../components/JourneyArt';

/**
 * The only file in the app that imports GSAP. Nothing above it renders a
 * Motion component, so the two animation engines never share a transform.
 *
 * Why a single sticky stage instead of one sticky element per card: sibling
 * `position: sticky` elements that share the same `top` all pin at the same
 * moment, so the stack collapses and only the highest z-index card is ever
 * visible. Here there is exactly one sticky stage, the cards are stacked inside
 * it, and a single scrubbed timeline cross-fades between them. Card 1 is fully
 * visible at progress 0, so there is no blank entrance, and the last card holds
 * until the section ends, so nothing is left stranded.
 *
 * Mobile and reduced-motion render a plain vertical list.
 */

const ART = [
  { file: '1', alt: 'صورة توضيحية لخطوة الاستلام', width: 1080, height: 1080 },
  { file: '2', alt: 'صورة توضيحية لخطوة الطباعة', width: 1080, height: 1080 },
  { file: '3', alt: 'صورة توضيحية لخطوة التوزيع', width: 1080, height: 1080 },
  { file: '4', alt: 'صورة توضيحية لخطوة الغسيل', width: 1080, height: 1080 },
] as const;

/** Matches the `lg` breakpoint, where the pinned stage takes over.
 *  Initialised synchronously so a desktop visitor never paints the long static
 *  list first and then jumps into the pinned stage. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const sync = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return isDesktop;
}

function StepBody({ index, step }: { index: number; step: (typeof JOURNEY)[number] }) {
  const art = ART[index];

  return (
    <article
      className={`grid w-full items-center gap-8 rounded-panel border border-hairline bg-surface p-6 sm:p-9 lg:gap-12 lg:p-12 ${
        art ? 'lg:grid-cols-12' : 'mx-auto max-w-3xl text-center'
      }`}
    >
      <div className={art ? 'lg:col-span-6' : ''}>
        <span aria-hidden="true" className="block font-mono text-sm text-accent-bright">
          {String(index + 1).padStart(2, '0')}
        </span>

        <h3 className="mt-4 text-[2.25rem] font-bold leading-tight text-ink sm:text-5xl">{step.verb}</h3>

        {step.meta ? (
          <span className="mt-4 inline-block rounded-control border border-hairline px-3 py-1 text-xs text-ink-muted">
            {step.meta}
          </span>
        ) : null}

        <p
          className={`mt-6 text-base leading-[1.9] text-ink-muted sm:text-lg ${
            art ? 'max-w-[52ch]' : 'mx-auto max-w-[54ch]'
          }`}
        >
          {step.detail}
        </p>
      </div>

      {art ? (
        <div className="lg:col-span-6">
          <div className="mx-auto max-w-sm">
            <JourneyArt file={art.file} alt={art.alt} width={art.width} height={art.height} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function StaticStep({ step, index }: { step: (typeof JOURNEY)[number]; index: number }) {
  const art = ART[index];

  return (
    <li className="flex gap-5 border-b border-hairline py-8 last:border-0">
      <span aria-hidden="true" className="font-mono text-sm text-ink-faint">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-3">
          <h3 className="text-2xl font-bold text-ink">{step.verb}</h3>
          {step.meta ? <span className="text-xs text-ink-faint">{step.meta}</span> : null}
        </div>
        <p className="mt-3 text-base leading-[1.9] text-ink-muted">{step.detail}</p>
        {art ? (
          <div className="mt-6 max-w-sm">
            <JourneyArt file={art.file} alt={art.alt} width={art.width} height={art.height} />
          </div>
        ) : null}
      </div>
    </li>
  );
}

export function GarmentJourney() {
  const reduce = useReducedMotion();
  const isDesktop = useIsDesktop();
  const stage = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLSpanElement>(null);
  const readout = useRef<HTMLSpanElement>(null);

  const pinned = isDesktop && !reduce;
  const count = JOURNEY.length;

  useEffect(() => {
    if (!pinned) return;
    const container = stage.current;
    if (!container) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    void (async () => {
      const { default: gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const panels = gsap.utils.toArray<HTMLElement>('[data-panel]', container);

        // Start state: first card settled, the rest parked off-stage below.
        gsap.set(panels, { autoAlpha: 0, yPercent: 8 });
        gsap.set(panels[0], { autoAlpha: 1, yPercent: 0 });

        const HANDOVER = 0.25;
        const slice = 1 / (panels.length - 1);

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: container,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.4,
            // Driven off the timeline's own playhead rather than raw scroll
            // ratio. The counter names whichever card is dominant on screen, so
            // it flips to the incoming card halfway through the cross-fade,
            // where the two are at equal opacity.
            onUpdate: () => {
              const t = timeline.time();
              const sliceIndex = Math.floor(t / slice);
              const intoSlice = t - sliceIndex * slice;
              const pastMidpoint = intoSlice >= slice - HANDOVER / 2;
              const step = Math.min(sliceIndex + (pastMidpoint ? 2 : 1), panels.length);
              if (readout.current) readout.current.textContent = `${step} / ${panels.length}`;
            },
          },
        });

        // One hand-off per card boundary, laid out on a timeline normalised to
        // exactly 1 so the scrub maps 1:1 onto scroll progress.
        //
        // slice = 0.25, so each boundary hands over over the last quarter of its
        // slice. Card 1 holds from progress 0, and card 5 holds through the
        // final slice, so the section always resolves on real content.
        for (let i = 1; i < panels.length; i += 1) {
          const at = (i - 1) * slice + (slice - HANDOVER);
          timeline.to(panels[i - 1], { autoAlpha: 0, yPercent: -8, duration: HANDOVER, ease: 'power2.inOut' }, at);
          timeline.fromTo(
            panels[i],
            { autoAlpha: 0, yPercent: 8 },
            { autoAlpha: 1, yPercent: 0, duration: HANDOVER, ease: 'power2.inOut' },
            at,
          );
        }

        if (rail.current) {
          gsap.fromTo(
            rail.current,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: { trigger: container, start: 'top top', end: 'bottom bottom', scrub: 0.4 },
            },
          );
        }
      }, container);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [pinned, count]);

  if (!pinned) {
    return (
      <Section id="journey" label="رحلة القطعة" className="py-20 sm:py-28">
        <h2 className="max-w-[24ch] text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          رحلة القطعة من الباب للتسليم
        </h2>
        <ul className="mt-10">
          {JOURNEY.map((step, index) => (
            <StaticStep key={step.verb} step={step} index={index} />
          ))}
        </ul>
      </Section>
    );
  }

  return (
    <Section id="journey" label="رحلة القطعة" className="px-0 sm:px-0">
      {/* Scroll length: one viewport per card, which is what the stage scrubs across. */}
      <div ref={stage} className="relative" style={{ height: `${count * 100}dvh` }}>
        <div className="sticky top-0 flex h-[100dvh] flex-col overflow-hidden px-4 sm:px-6">
          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
            <div className="flex shrink-0 flex-wrap items-end justify-between gap-4 pt-24">
              <h2 className="max-w-[24ch] text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                رحلة القطعة من الباب للتسليم
              </h2>
              <span className="font-mono text-xs text-ink-faint" dir="ltr">
                <span ref={readout}>1 / {count}</span>
              </span>
            </div>

            <div className="relative flex flex-1 items-center py-8 lg:ps-16">
              <span
                aria-hidden="true"
                className="absolute inset-y-0 start-[0.3rem] hidden w-px bg-hairline lg:block"
              >
                <span ref={rail} className="block h-full w-full origin-top bg-accent" />
              </span>

              {JOURNEY.map((step, index) => (
                <div key={step.verb} data-panel className="absolute inset-0 flex items-center">
                  <StepBody index={index} step={step} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
