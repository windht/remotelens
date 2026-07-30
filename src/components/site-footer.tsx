import { Link } from '@tanstack/react-router'

export function SiteFooter() {
  return (
    <footer className="mt-section border-line border-t">
      <div className="page-shell grid gap-8 py-10 text-sm md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-2">
          <p className="font-semibold">RemoteLens</p>
          <p className="text-ink-muted max-w-lg">
            A public, read-only remote developer-job index for people and AI
            agents. Source evidence stays visible; your CV stays local.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5">
          <Link className="footer-link" to="/privacy">
            Privacy
          </Link>
          <Link className="footer-link" to="/about">
            About
          </Link>
          <Link className="footer-link" to="/api">
            API
          </Link>
        </nav>
      </div>
    </footer>
  )
}
