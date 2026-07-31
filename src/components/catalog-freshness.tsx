import type { CatalogMeta } from '~/api/catalog'

function providerLabel(key: CatalogMeta['providers'][number]['key']) {
  return key === 'wwr' ? 'We Work Remotely' : 'Remote OK'
}

function timestamp(value: string | null) {
  if (!value) return 'Not completed yet'
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(value))
}

export function CatalogFreshness({ meta }: { meta: CatalogMeta | null }) {
  if (!meta || meta.providers.length === 0) {
    return (
      <p className="text-ink-muted text-sm">
        Provider freshness is not available right now.
      </p>
    )
  }

  return (
    <div className="border-line-strong border-t">
      {meta.providers.map((provider) => (
        <div className="provider-row" key={provider.key}>
          <div className="grid gap-1">
            <strong>{providerLabel(provider.key)}</strong>
            <span className="text-ink-muted text-sm">
              {provider.enabled ? provider.status : 'suspended'} ·{' '}
              {provider.active_count} active source records
            </span>
          </div>
          <span className="data-text text-right text-xs">
            {timestamp(provider.last_successful_at)} UTC
          </span>
        </div>
      ))}
    </div>
  )
}
