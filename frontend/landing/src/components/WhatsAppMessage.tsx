import { Checks, DotsThree, Phone, VideoCamera } from '@phosphor-icons/react';
import { WHATSAPP_MESSAGE as MSG } from '../content/copy';

/**
 * A chat surface, not a document: header with the contact, a patterned
 * wallpaper, and outgoing bubbles on the start edge with tails and read
 * receipts. All copy comes from WHATSAPP_MESSAGE, which mirrors the text
 * buildOrderReadyMessage() actually sends.
 */
export function WhatsAppMessage() {
  return (
    <div
      dir="rtl"
      className="relative isolate overflow-hidden rounded-panel border border-hairline bg-raised"
    >
      {/* Wallpaper. Tinted geometric weave, kept under 6% contrast so it reads
          as texture and never competes with the bubble text. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.055]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, var(--color-ink) 1px, transparent 0)',
          backgroundSize: '14px 14px',
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 border-b border-hairline bg-raised/80 px-4 py-3 backdrop-blur-sm">
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-ready-surface text-sm font-bold text-ready"
        >
          ر
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink">{MSG.sender}</span>
          <span className="block text-[11px] text-ink-faint">حساب أعمال</span>
        </span>

        <span className="ms-auto flex items-center gap-3 text-ink-faint">
          <VideoCamera size={17} aria-hidden="true" />
          <Phone size={17} aria-hidden="true" />
          <DotsThree size={18} aria-hidden="true" />
        </span>
      </div>

      {/* Conversation */}
      <ol className="space-y-2.5 px-3 py-4">
        <li>
          <Bubble>
            <p>{MSG.greeting}</p>
          </Bubble>
        </li>

        <li>
          <Bubble>
            <p>{MSG.headline}</p>

            <p className="mt-3 font-semibold text-ink">{MSG.itemsLabel}</p>
            <ul className="mt-1.5 space-y-1">
              {MSG.items.map((item) => (
                <li key={item} className="text-ink-muted">
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-ink/10 pt-2.5">
              <span className="font-semibold text-ink">{MSG.totalLabel}</span>
              <span className="font-mono text-sm font-bold text-ink" dir="ltr">
                {MSG.total}
              </span>
            </div>

            <p className="mt-3 text-ink-muted">{MSG.signOff}</p>
            <p className="mt-1 text-ink-muted">{MSG.address}</p>

            <Meta time={MSG.timestamp} />
          </Bubble>
        </li>
      </ol>
    </div>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <div className="relative max-w-[92%] rounded-2xl rounded-es-sm bg-[#1f2c24] px-3.5 py-2.5 text-sm leading-[1.85] text-ink shadow-[0_1px_1px_rgba(0,0,0,0.28)]">
        {children}
      </div>
    </div>
  );
}

function Meta({ time }: { time: string }) {
  return (
    <span className="mt-2 flex items-center justify-end gap-1 text-[10px] text-ink-muted">
      <span dir="ltr">{time}</span>
      <Checks size={13} className="text-accent-bright" aria-label="تم القراءة" />
    </span>
  );
}
