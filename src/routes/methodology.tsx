import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/methodology')({
  beforeLoad: () => {
    // TanStack Router represents redirects as response-like thrown values.
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect({ hash: 'methodology', statusCode: 301, to: '/' })
  },
})
