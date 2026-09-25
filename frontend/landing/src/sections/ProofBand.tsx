import { PROOF } from '../content/copy';
import { Section } from '../components/Section';
import CountUp from '../reactbits/CountUp';
import { Reveal, RevealItem } from '../motion/Reveal';
import { spring } from '../motion/tokens';

export function ProofBand() {
  return (
    <Section label="أرقام النظام" className="py-20 sm:py-24">
      <Reveal className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-hairline bg-hairline lg:grid-cols-4">
        {PROOF.map((stat) => (
          <RevealItem
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: spring },
            }}
            className="bg-canvas p-6 sm:p-8"
          >
            <p className="flex items-baseline gap-1.5 text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              <CountUp to={stat.value} duration={0.8} />
              {stat.unit ? <span className="text-2xl text-accent-bright">{stat.unit}</span> : null}
            </p>
            <p className="mt-3 text-sm font-semibold text-ink">{stat.label}</p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{stat.note}</p>
          </RevealItem>
        ))}
      </Reveal>
    </Section>
  );
}
