import { Key, DeviceMobile, ArrowsLeftRight, SignOut } from '@phosphor-icons/react';
import { SECURITY } from '../content/copy';
import { Section, SectionHeading } from '../components/Section';
import { Reveal, RevealItem } from '../motion/Reveal';

const ICONS = [Key, DeviceMobile, ArrowsLeftRight, SignOut] as const;

export function SecurityGrid() {
  return (
    <Section id="security" label="الترخيص والأمان" className="py-20 sm:py-28">
      <Reveal>
        <SectionHeading title={SECURITY.headline} body={SECURITY.body} />
      </Reveal>

      <Reveal className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2" stagger={0.08}>
        {SECURITY.items.map((item, index) => {
          const Icon = ICONS[index] ?? Key;
          return (
            <RevealItem key={item.title} className="rounded-panel border border-hairline bg-surface p-6 sm:p-7">
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-control bg-accent/12 text-accent-bright">
                <Icon size={20} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-ink">{item.title}</h3>
              <p className="mt-2.5 text-sm leading-[1.85] text-ink-muted">{item.body}</p>
            </RevealItem>
          );
        })}
      </Reveal>
    </Section>
  );
}
