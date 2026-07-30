import { createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '~/components/page-intro'
import { Badge } from '~/components/ui/badge'

const WWR_FEEDS = [
  'remote-full-stack-programming-jobs.rss',
  'remote-back-end-programming-jobs.rss',
  'remote-front-end-programming-jobs.rss',
  'remote-programming-jobs.rss',
]

export const Route = createFileRoute('/sources')({
  head: () => ({
    meta: [
      { title: 'Sources and freshness — RemoteLens' },
      {
        name: 'description',
        content:
          'RemoteLens V1 source attribution, feed allow-list, freshness, and suspension policy.',
      },
    ],
  }),
  component: SourcesPage,
})

function SourcesPage() {
  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <PageIntro eyebrow="Source ledger" title="Sources and freshness">
        RemoteLens credits each publisher, reports freshness per provider, and
        treats a feature flag as a non-destructive suspension—not a reason to
        erase source evidence.
      </PageIntro>

      <section className="mt-section grid gap-10 lg:grid-cols-12">
        <div className="grid gap-4 lg:col-span-4">
          <p className="eyebrow">V1 providers</p>
          <h2>Two providers. Five approved feeds.</h2>
        </div>
        <div className="border-line-strong border-t lg:col-span-7 lg:col-start-6">
          <article className="provider-row">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <h3>Remote OK</h3>
                <Badge tone="positive">Enabled fixture</Badge>
              </div>
              <p className="text-ink-muted">
                Public JSON feed at{' '}
                <code className="data-text">https://remoteok.com/api</code>.
                Developer admission requires a positive title marker and a
                source-provided developer tag.
              </p>
            </div>
            <p className="data-text">Fixture checked 30 Jul · 14:43 UTC</p>
          </article>
          <article className="provider-row">
            <div className="grid gap-3">
              <div className="flex items-center gap-3">
                <h3>We Work Remotely</h3>
                <Badge tone="positive">Enabled fixture</Badge>
              </div>
              <p className="text-ink-muted">
                Four RSS category feeds operate as one <code>wwr</code>{' '}
                provider. A listing’s GUID or listing URL is its WWR-local
                identity.
              </p>
            </div>
            <p className="data-text">Fixture checked 30 Jul · 14:48 UTC</p>
          </article>
        </div>
      </section>

      <section className="mt-section grid gap-10 lg:grid-cols-12">
        <div className="grid gap-4 lg:col-span-4">
          <p className="eyebrow">Explicit WWR allow-list</p>
          <h2>New feeds never enable themselves.</h2>
        </div>
        <div className="lg:col-span-7 lg:col-start-6">
          <ol className="border-line-strong border-t">
            {WWR_FEEDS.map((feed, index) => (
              <li
                className="border-line grid grid-cols-[2rem_1fr] gap-3 border-b py-4"
                key={feed}
              >
                <span className="data-text text-pine">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <code className="data-text break-all">{feed}</code>
              </li>
            ))}
          </ol>
          <div className="border-rust bg-rust-soft mt-6 border p-5">
            <p className="text-rust font-semibold">
              DevOps/Sysadmin is outside V1.
            </p>
            <p className="mt-2 text-sm">
              <code>remote-devops-sysadmin-jobs.rss</code> is not configured,
              discovered, or enabled.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-section border-line border-y py-12">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="grid gap-4 lg:col-span-4">
            <p className="eyebrow">Suspension policy</p>
            <h2>Pause visibility, preserve the record.</h2>
          </div>
          <div className="content-prose lg:col-span-7 lg:col-start-6">
            <p>
              Disabling a provider immediately withholds jobs supported only by
              that provider from public discovery. It does not mass-close or
              delete its source records.
            </p>
            <p>
              A canonical job remains public when another enabled provider still
              supplies an active source record. Re-enabling a provider resumes
              from the same source-local identities.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
