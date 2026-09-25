type ShellProps = {
  id?: string;
  className?: string;
  children: React.ReactNode;
  label: string;
};

export function Section({ id, className = '', children, label }: ShellProps) {
  return (
    <section id={id} aria-label={label} className={`px-4 sm:px-6 ${className}`}>
      <div className="mx-auto w-full max-w-7xl">{children}</div>
    </section>
  );
}

export function SectionHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-[62ch]">
      <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">{title}</h2>
      <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">{body}</p>
    </div>
  );
}
