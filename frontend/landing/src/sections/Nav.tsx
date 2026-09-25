import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { List, X } from '@phosphor-icons/react';
import { BRAND, CTA_LABEL } from '../content/copy';
import { CONTACT } from '../content/copy';
import { springSnappy } from '../motion/tokens';

const LINKS = [
  { label: 'المزايا', href: '#capabilities' },
  { label: 'رحلة القطعة', href: '#journey' },
  { label: 'لوحة المنصة', href: '#platform' },
  { label: 'الاشتراك', href: '#security' },
];

export function Nav() {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // Sentinel at the top of the document flips the bar once the page moves.
  // IntersectionObserver instead of a scroll listener, which would fire on
  // every frame.
  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), {
      rootMargin: '0px 0px 0px 0px',
      threshold: 0,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <div ref={sentinel} aria-hidden="true" className="absolute top-0 h-px w-full" />
      <header
        className={`fixed inset-x-0 top-0 z-50 h-16 transition-colors duration-300 ${
          scrolled ? 'border-b border-hairline bg-canvas/85 backdrop-blur-md' : 'border-b border-transparent'
        }`}
      >
        <nav aria-label="التنقل الرئيسي" className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-ink">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-control bg-accent text-sm text-white">
              ر
            </span>
            {BRAND.name}
          </a>

          <ul className="hidden items-center gap-7 text-sm text-ink-muted lg:flex">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors duration-200 hover:text-ink">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <a
            href={`mailto:${CONTACT.email}`}
            className="ms-auto hidden rounded-control bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_var(--color-accent)] transition-colors duration-200 hover:bg-accent-bright active:translate-y-px lg:inline-block"
          >
            {CTA_LABEL}
          </a>

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'اقفل القائمة' : 'افتح القائمة'}
            className="ms-auto grid size-10 place-items-center rounded-control border border-hairline text-ink lg:hidden"
          >
            {open ? <X size={20} /> : <List size={20} />}
          </button>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={reduce ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
              transition={springSnappy}
              className="border-b border-hairline bg-canvas/97 px-4 pb-5 backdrop-blur-md lg:hidden"
            >
              <ul className="flex flex-col text-ink-muted">
                {LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="block border-b border-hairline py-3.5 text-sm last:border-0"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href={`mailto:${CONTACT.email}`}
                onClick={() => setOpen(false)}
                className="mt-4 block rounded-control bg-accent px-5 py-3 text-center text-sm font-semibold text-white"
              >
                {CTA_LABEL}
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
