import type * as React from 'react'
import { cn } from '~/lib/utils'

type BadgeProps = React.ComponentProps<'span'> & {
  tone?: 'neutral' | 'positive' | 'warning' | 'closed'
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center rounded-[var(--radius-label)] border px-2 py-1 text-[0.6875rem] leading-none font-semibold tracking-[0.045em] uppercase',
        tone === 'neutral' && 'border-line bg-paper-raised text-ink-muted',
        tone === 'positive' && 'border-pine/35 bg-pine-soft text-pine-strong',
        tone === 'warning' && 'border-ochre/40 bg-ochre-soft text-ochre',
        tone === 'closed' && 'border-rust/40 bg-rust-soft text-rust',
        className,
      )}
      {...props}
    />
  )
}
