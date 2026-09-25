import { BENTO, type BentoItem } from '../content/copy';
import { Section, SectionHeading } from '../components/Section';
import { Screenshot } from '../components/Screenshot';
import { WhatsAppMessage } from '../components/WhatsAppMessage';
import { Reveal, RevealItem } from '../motion/Reveal';
import { spring } from '../motion/tokens';

const SPANS: Record<number, string> = {
  0: 'lg:col-span-3',
  1: 'lg:col-span-3',
  2: 'lg:col-span-2',
  3: 'lg:col-span-2',
  4: 'lg:col-span-2',
};

function Cell({ item, index }: { item: BentoItem; index: number }) {
  return (
    <RevealItem
      variants={{
        hidden: { opacity: 0, y: 28, scale: 0.985 },
        visible: { opacity: 1, y: 0, scale: 1, transition: spring },
      }}
      className={`group relative overflow-hidden rounded-panel border border-hairline bg-surface ${SPANS[index] ?? 'lg:col-span-2'}`}
    >
      {item.image ? (
        <div className="relative overflow-hidden">
          <Screenshot
            src={item.image.src}
            alt={item.image.alt}
            width={item.image.width}
            height={item.image.height}
            className="h-full w-full rounded-none border-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
        </div>
      ) : null}

      <div className="p-5 sm:p-6">
        {item.eyebrow ? (
          <p className="flex items-center gap-2.5 text-xs text-ink-faint">
            <span aria-hidden="true" className="h-px w-6 bg-hairline" />
            {item.eyebrow}
          </p>
        ) : null}

        <h3 className={`text-lg font-bold text-ink ${item.eyebrow ? 'mt-3' : ''}`}>{item.title}</h3>
        <p className="mt-2.5 text-sm leading-[1.85] text-ink-muted">{item.body}</p>

        {item.kind === 'message' ? <div className="mt-5"><WhatsAppMessage /></div> : null}
      </div>
    </RevealItem>
  );
}

export function CapabilityBento() {
  return (
    <Section id="capabilities" label="مزايا رونق" className="py-20 sm:py-28">
      <Reveal>
        <SectionHeading
          title="كل حاجة بتتعمل من غير ما تطلع من الشاشة"
          body="الطلب بيتسجل، والقطعة بتتوزّع، والسعر بيتقفل، والعميل بيعرف. كل خطوة ليها مكان واحد في النظام."
        />
      </Reveal>

      <Reveal className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-6" stagger={0.09}>
        {BENTO.map((item, index) => (
          <Cell key={item.title} item={item} index={index} />
        ))}
      </Reveal>
    </Section>
  );
}
