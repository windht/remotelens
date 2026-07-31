import { Link } from '@tanstack/react-router'
import { BrandMark } from './brand-mark'

const links = [
  { label: 'Index', to: '/jobs' },
  { label: 'Agent Skill', to: '/skills/install' },
  { label: 'API', to: '/api' },
] as const

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav
      aria-label={mobile ? 'Mobile navigation' : 'Primary navigation'}
      className={mobile ? 'border-line grid border-t' : 'flex items-center'}
    >
      {links.map((link) => (
        <Link
          activeProps={{ 'aria-current': 'page', className: 'text-pine' }}
          className={
            mobile
              ? 'border-line flex min-h-11 items-center border-b py-2 text-sm font-semibold'
              : 'flex min-h-11 items-center px-3 text-sm font-semibold underline-offset-4 hover:underline'
          }
          key={link.to}
          to={link.to}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}

export function SiteHeader() {
  return (
    <header className="border-line border-b">
      <div className="page-shell flex min-h-18 items-center justify-between gap-4 py-3">
        <Link
          aria-label="RemoteLens home"
          className="text-ink inline-flex min-h-11 items-center gap-3 font-semibold no-underline"
          to="/"
        >
          <BrandMark />
          <span>RemoteLens</span>
        </Link>
        <div className="hidden md:block">
          <NavigationLinks />
        </div>
        <details className="relative md:hidden">
          <summary className="border-line-strong focus-visible:outline-pine flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-[var(--radius-control)] border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-3">
            Menu
          </summary>
          <div className="border-line-strong bg-paper-raised absolute top-[calc(100%+0.5rem)] right-0 z-20 min-w-56 border px-4">
            <NavigationLinks mobile />
          </div>
        </details>
      </div>
    </header>
  )
}
