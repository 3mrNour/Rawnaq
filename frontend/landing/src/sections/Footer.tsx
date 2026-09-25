import { BRAND, CONTACT, FOOTER } from '../content/copy';
import { APP_URLS } from '../lib/app';

export function Footer() {
  return (
    <footer aria-label="تذييل الصفحة" className="border-t border-hairline px-4 pb-10 pt-16 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <a href="#top" className="flex items-center gap-2.5 text-lg font-bold text-ink">
              <span aria-hidden="true" className="grid size-8 place-items-center rounded-control bg-accent text-sm text-white">
                ر
              </span>
              {BRAND.wordmark}
            </a>
            <p className="mt-4 max-w-[40ch] text-sm leading-[1.85] text-ink-muted">{FOOTER.blurb}</p>
            <p className="mt-5 font-mono text-xs text-ink-faint" dir="ltr">
              {FOOTER.licenseNote}
            </p>
          </div>

          {FOOTER.columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="lg:col-span-2">
              <h2 className="text-sm font-bold text-ink">{column.title}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={`${column.title}-${link.label}`}>
                    <a href={link.href} className="text-sm text-ink-muted transition-colors duration-200 hover:text-ink">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="lg:col-span-3">
            <h2 className="text-sm font-bold text-ink">تواصل مع المبيعات</h2>
            <a
              href={`mailto:${CONTACT.email}`}
              className="mt-4 block text-sm text-ink-muted transition-colors duration-200 hover:text-ink"
              dir="ltr"
            >
              {CONTACT.email}
            </a>
            <a
              href={`https://wa.me/${CONTACT.whatsappNumber}`}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 block text-sm text-ink-muted transition-colors duration-200 hover:text-ink"
              dir="ltr"
            >
              {CONTACT.whatsappDisplay}
            </a>
            <a
              href={APP_URLS.adminLogin}
              className="mt-5 inline-block text-sm text-ink-muted underline decoration-hairline underline-offset-4 transition-colors duration-200 hover:text-ink"
            >
              دخول الإدارة
            </a>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-6 text-xs text-ink-faint">
          <p>
            © <span className="font-mono">{new Date().getFullYear()}</span> {BRAND.wordmark}. {FOOTER.rights}
          </p>
          <p>صُنع في مصر، للمغالس المصرية.</p>
        </div>
      </div>
    </footer>
  );
}
