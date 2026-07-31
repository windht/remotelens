import { createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '~/components/page-intro'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
  pageMeta,
} from '~/lib/seo'
import { stablePageIsrHeaders } from '~/lib/rendering'

export const Route = createFileRoute('/privacy')({
  headers: stablePageIsrHeaders,
  head: () => ({
    meta: pageMeta({
      title: 'Privacy — RemoteLens',
      description:
        'RemoteLens serves public job data without accounts, CV uploads, advertising profiles, or personal-data sales.',
      path: '/privacy',
    }),
    links: [{ rel: 'canonical', href: absoluteUrl('/privacy') }],
    scripts: [
      jsonLdScript(
        breadcrumbJsonLd([
          { name: 'RemoteLens', path: '/' },
          { name: 'Privacy', path: '/privacy' },
        ]),
      ),
    ],
  }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <main className="narrow-shell" id="main-content" tabIndex={-1}>
      <PageIntro
        eyebrow="Privacy"
        title="Public job data. No personal profile."
      >
        RemoteLens does not need an account, a CV upload, or an advertising
        identity to serve a public job index.
      </PageIntro>
      <div className="content-prose py-12">
        <h2>No CV collection</h2>
        <p>
          RemoteLens does not ask users to upload a CV. The future Agent Skill
          reads a file locally inside the user’s selected agent environment.
          Local agent providers may have their own data-handling policies.
        </p>
        <h2>Operational data</h2>
        <p>
          RemoteLens retains ordinary infrastructure logs and bounded
          ingestion-error summaries for 30 days. It does not retain raw source
          payloads, CV data, advertising profiles, or prompt transcripts.
        </p>
        <h2>No sale or advertising profile</h2>
        <p>
          RemoteLens does not sell personal data and does not create advertising
          profiles.
        </p>
      </div>
    </main>
  )
}
