import * as SelectPrimitive from '@radix-ui/react-select'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '~/lib/utils'

export type SelectOption = {
  label: string
  value: string
}

function ChevronDown() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
    >
      <path
        d="m4 6 4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  )
}

function Check() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      viewBox="0 0 16 16"
      width="14"
    >
      <path
        d="m3 8 3 3 7-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
    </svg>
  )
}

export function EnhancedSelect({
  className,
  defaultValue,
  label,
  name,
  onValueChange,
  options,
}: {
  className?: string
  defaultValue: string
  label: string
  name: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
}) {
  return (
    <EnhancedSelectControl
      defaultValue={defaultValue}
      key={defaultValue}
      label={label}
      name={name}
      options={options}
      {...(className ? { className } : {})}
      {...(onValueChange ? { onValueChange } : {})}
    />
  )
}

const EMPTY_VALUE = '__remotelens_any__'

function EnhancedSelectControl({
  className,
  defaultValue,
  label,
  name,
  onValueChange,
  options,
}: {
  className?: string
  defaultValue: string
  label: string
  name: string
  onValueChange?: (value: string) => void
  options: SelectOption[]
}) {
  const initialValue = options.some((option) => option.value === defaultValue)
    ? defaultValue
    : ''
  const [value, setValue] = useState(initialValue || EMPTY_VALUE)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) inputRef.current.disabled = false
  }, [])

  return (
    <>
      <SelectPrimitive.Root
        onValueChange={(nextValue) => {
          setValue(nextValue)
          onValueChange?.(nextValue === EMPTY_VALUE ? '' : nextValue)
        }}
        value={value}
      >
        <SelectPrimitive.Trigger
          aria-label={label}
          className={cn(
            'select-trigger border-line-strong bg-paper-raised text-ink focus-visible:border-pine focus-visible:outline-pine',
            className,
          )}
        >
          <span>
            {
              options.find((option) => (option.value || EMPTY_VALUE) === value)
                ?.label
            }
          </span>
          <SelectPrimitive.Icon className="text-ink-muted">
            <ChevronDown />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="select-content border-line-strong bg-paper-raised text-ink"
            position="popper"
            sideOffset={6}
          >
            <SelectPrimitive.Viewport className="select-viewport">
              {options.map((option) => (
                <SelectPrimitive.Item
                  className="select-item"
                  key={option.value}
                  value={option.value || EMPTY_VALUE}
                >
                  <SelectPrimitive.ItemText>
                    {option.label}
                  </SelectPrimitive.ItemText>
                  <SelectPrimitive.ItemIndicator className="select-indicator">
                    <Check />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      <input
        disabled
        name={name}
        ref={inputRef}
        type="hidden"
        value={value === EMPTY_VALUE ? '' : value}
      />
      <noscript>
        <label className="grid gap-2 text-sm font-semibold">
          <span>{label}</span>
          <select
            className={cn(
              'border-line-strong bg-paper-raised min-h-11 w-full border px-3',
              className,
            )}
            defaultValue={defaultValue}
            name={name}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </noscript>
    </>
  )
}

export function SelectField({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="filter-field">
      <span className="filter-label">{label}</span>
      {children}
    </div>
  )
}
