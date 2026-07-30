import type * as React from 'react'
import { cn } from '~/lib/utils'

export function Field({
  children,
  className,
  description,
  label,
}: {
  children: React.ReactNode
  className?: string
  description?: string
  label: string
}) {
  return (
    <label className={cn('grid gap-2 text-sm font-semibold', className)}>
      <span>{label}</span>
      {children}
      {description ? (
        <span className="text-ink-muted text-xs leading-5 font-normal">
          {description}
        </span>
      ) : null}
    </label>
  )
}

export const controlClassName =
  'min-h-11 w-full rounded-[var(--radius-control)] border border-line-strong bg-paper-raised px-3 text-base text-ink outline-none transition-colors focus-visible:border-pine focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pine'
