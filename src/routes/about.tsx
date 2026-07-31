import { createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '~/components/page-intro'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
  pageMeta,
} from '~/lib/seo'
import { stablePageIsrHeaders } from '~/lib/rendering'

export const Route = createFileRoute('/about')({
  headers: stablePageIsrHeaders,
  head: () => ({
    meta: pageMeta({
      title: 'About RemoteLens',
      description:
        'Learn how RemoteLens collects, normalizes, filters, and attributes public remote developer-job data.',
      path: '/about',
    }),
    links: [{ rel: 'canonical', href: absoluteUrl('/about') }],
    scripts: [
      jsonLdScript(
        breadcrumbJsonLd([
          { name: 'RemoteLens', path: '/' },
          { name: 'About', path: '/about' },
        ]),
      ),
    ],
  }),
  component: AboutPage,
})

function AboutPage() {
  return (
    <main className="narrow-shell" id="main-content" tabIndex={-1}>
      <PageIntro
        eyebrow="About"
        title="A data provider, not an application machine."
      >
        RemoteLens collects, normalizes, filters, and serves attributed public
        remote developer-job data.
      </PageIntro>
      <div className="content-prose py-12">
        <p>
          It has no accounts, subscriptions, ads, employer posting, hosted CVs,
          saved jobs, hosted application tracking, auto-apply, or server-side
          application decisions.
        </p>
        <p>
          A future Mac client may own local application decisions, tracking, and
          user-approved execution. Those responsibilities do not move into
          RemoteLens services or D1.
        </p>
      </div>
    </main>
  )
}
