import { PLATFORM } from '../content/copy';
import { Section, SectionHeading } from '../components/Section';
import { Screenshot } from '../components/Screenshot';
import { Reveal, RevealItem } from '../motion/Reveal';

export function PlatformBand() {
  return (
    <Section id="platform" label="لوحة المنصة" className="py-20 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <SectionHeading title={PLATFORM.headline} body={PLATFORM.body} />
        </Reveal>

        <Reveal className="lg:col-span-7" stagger={0.08}>
          <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-panel border border-hairline bg-hairline sm:grid-cols-2">
            {PLATFORM.points.map((point) => (
              <RevealItem key={point.label} className="bg-surface p-5 sm:p-6">
                <dt className="text-sm font-bold text-ink">{point.label}</dt>
                <dd className="mt-2 text-sm leading-[1.8] text-ink-muted">{point.value}</dd>
              </RevealItem>
            ))}
          </dl>

          <div className="mt-6">
            <Screenshot
              src="/screenshots/admin-dashboard.webp"
              alt="لوحة إدارة المنصة في رونق تعرض المغاسل المشتركة وحالة اشتراكاتها"
              width={1440}
              height={900}
            />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
