import { ArrowLeft, WhatsappLogo } from '@phosphor-icons/react';
import { CLOSING, CONTACT, CTA_LABEL } from '../content/copy';
import { Section } from '../components/Section';
import Magnet from '../reactbits/Magnet';
import { MaskedLines, TypeIn } from '../motion/MaskedLines';

export function CtaBand() {
  return (
    <Section label="احجز عرضاً" className="py-20 sm:py-28">
      <div className="relative overflow-hidden rounded-panel border border-accent-deep bg-accent px-6 py-14 sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 end-[-6%] size-[26rem] rounded-full bg-white/12 blur-[90px]"
        />

        <div className="relative max-w-[44ch]">
          <TypeIn as="p" className="block text-sm text-white/90">جاهز تشوفه على نظامك أنت؟</TypeIn>

          <MaskedLines
            as="h2"
            play="inView"
            lines={CLOSING.headline}
            className="mt-4 block text-[2.25rem] font-bold leading-[1.15] text-white sm:text-5xl"
          />

          <TypeIn as="p" delay={0.15} className="mt-5 block text-base leading-relaxed text-white/90 sm:text-lg">
            {CLOSING.body}
          </TypeIn>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Magnet padding={40} magnetStrength={5} wrapperClassName="rounded-control">
              <a
                href={`mailto:${CONTACT.email}`}
                className="inline-flex items-center gap-2 rounded-control bg-white px-7 py-3.5 text-sm font-bold text-accent-deep hover:bg-white/90"
              >
                {CTA_LABEL}
                <ArrowLeft size={17} />
              </a>
            </Magnet>

            <a
              href={`https://wa.me/${CONTACT.whatsappNumber}`}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-control border border-white/35 px-6 py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white/10"
            >
              <WhatsappLogo size={19} weight="fill" />
              <span dir="ltr">{CONTACT.whatsappDisplay}</span>
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
