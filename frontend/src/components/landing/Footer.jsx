export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="px-6 md:px-12 py-10 border-t border-[var(--color-border)]"
      style={{ backgroundColor: 'var(--color-ink)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <span className="flex flex-col gap-[3px]" aria-hidden="true">
            <span className="block w-4 h-[1.5px] bg-[var(--color-brass)]" />
            <span className="block w-2.5 h-[1.5px] bg-[var(--color-brass)] opacity-60" />
            <span className="block w-4 h-[1.5px] bg-[var(--color-brass)]" />
          </span>
          <span className="font-mono text-xs tracking-widest uppercase text-[var(--color-slate)]">
            Ledger
          </span>
        </div>

        {/* Copy */}
        <p className="font-mono text-xs text-[var(--color-slate)]">
          © {year} Backend Ledger. All debits balanced.
        </p>

        {/* Links */}
        <nav aria-label="Footer navigation">
          <ul className="flex items-center gap-5 list-none p-0 m-0">
            {['Docs', 'GitHub', 'Status'].map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="font-mono text-xs text-[var(--color-slate)] hover:text-[var(--color-brass)] transition-colors duration-150"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
