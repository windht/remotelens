import { createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '~/components/page-intro'

const METHODS = [
  {
    title: 'Admit developer jobs deterministically',
    body: 'Remote OK requires both a clear developer-role title marker and a qualifying source-provided tag. Descriptions never decide admission. The four WWR programming feeds define that provider’s V1 cohort.',
  },
  {
    title: 'Keep source identity stable',
    body: 'Remote OK uses its source ID when present. WWR uses the feed GUID or listing URL, so one listing across configured feeds remains one WWR source record with every observed category.',
  },
  {
    title: 'Normalize without guessing',
    body: 'Source-stated values are preserved. Deterministic parsers may normalize exact countries, IANA timezones, salary facts, and lexical tags. Ambiguous values remain unknown and visible as provenance.',
  },
  {
    title: 'Treat partial runs as incomplete evidence',
    body: 'A failed WWR feed makes the provider run partial. Successful observations remain useful, but no WWR missing or closed count advances during that cycle.',
  },
  {
    title: 'Close conservatively',
    body: 'A record becomes missing only after two complete successful provider checks do not see it. It can close only after a complete check at least 72 hours after last seen. Closed records retain for 30 days.',
  },
  {
    title: 'Keep one live catalog',
    body: 'D1 is the single mutable source of truth. A cache epoch rotates after successful and partial cycles, but not fully failed cycles. V1 has no public snapshots or catalog revisions.',
  },
  {
    title: 'Defer semantic decisions until deterministic evidence ends',
    body: 'Phase 1 records unresolved cross-source candidates. The later narrow DeepSeek path may evaluate at most 50 per run for merge, separate, or uncertain outcomes. It never tags jobs, processes CVs, or powers search.',
  },
]

export const Route = createFileRoute('/methodology')({
  head: () => ({
    meta: [
      { title: 'Methodology — RemoteLens' },
      {
        name: 'description',
        content:
          'How RemoteLens admits, normalizes, deduplicates, refreshes, and retires attributed remote jobs.',
      },
    ],
  }),
  component: MethodologyPage,
})

function MethodologyPage() {
  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <PageIntro
        eyebrow="Methodology / V1"
        title="Boring systems. Visible evidence."
      >
        RemoteLens favors deterministic rules, conservative lifecycle changes,
        and explicit unknowns over guessed coverage. The result should be easy
        for a person—or an agent—to inspect.
      </PageIntro>

      <div className="method-list mt-section">
        {METHODS.map((method) => (
          <section key={method.title}>
            <div className="grid max-w-3xl gap-4">
              <h2 className="!text-[clamp(2rem,4vw,3.5rem)]">{method.title}</h2>
              <p className="lede">{method.body}</p>
            </div>
          </section>
        ))}
      </div>

      <section className="mt-section border-line grid gap-8 border-y py-12 lg:grid-cols-12">
        <div className="grid gap-4 lg:col-span-4">
          <p className="eyebrow">Known limitation</p>
          <h2>No generic search.</h2>
        </div>
        <div className="content-prose lg:col-span-7 lg:col-start-6">
          <p>
            RemoteLens does not search titles, descriptions, keywords, vectors,
            or semantic representations. Discovery uses documented exact
            structured fields.
          </p>
          <p>
            A valid unknown exact company or tag returns an empty result. A
            malformed country, timezone, enum, or source returns a stable
            <code> invalid_filter </code> error.
          </p>
        </div>
      </section>
    </main>
  )
}
