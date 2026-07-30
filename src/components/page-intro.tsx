import type { ReactNode } from 'react'

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  children: ReactNode
  eyebrow: string
  title: string
}) {
  return (
    <header className="editorial-intro">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <div className="lede">{children}</div>
    </header>
  )
}
