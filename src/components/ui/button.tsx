import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 text-sm font-semibold no-underline transition-[background-color,color,transform] duration-200 ease-[var(--ease-out)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-pine disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        primary: 'bg-pine text-paper-raised hover:bg-pine-strong',
        secondary:
          'border border-line-strong bg-paper-raised text-ink hover:bg-paper-muted',
        quiet: 'text-pine underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  },
)

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export function Button({
  asChild = false,
  className,
  variant,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      className={cn(buttonVariants({ variant }), className)}
      {...props}
    />
  )
}
