import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/sources')({
  beforeLoad: () => {
    // TanStack Router represents redirects as response-like thrown values.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ hash: 'sources', statusCode: 301, to: '/' })
  },
})
