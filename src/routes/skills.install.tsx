import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '~/components/page-intro'
import { Badge } from '~/components/ui/badge'
import {
  absoluteUrl,
  breadcrumbJsonLd,
  jsonLdScript,
  pageMeta,
} from '~/lib/seo'
import { stablePageIsrHeaders } from '~/lib/rendering'

export const Route = createFileRoute('/skills/install')({
  headers: stablePageIsrHeaders,
  head: () => ({
    meta: pageMeta({
      title: 'Install the RemoteLens Agent Skill',
      description:
        'Install the RemoteLens Agent Skill to compare public remote jobs with a CV that stays on your computer.',
      path: '/skills/install',
    }),
    links: [{ rel: 'canonical', href: absoluteUrl('/skills/install') }],
    scripts: [
      jsonLdScript(
        breadcrumbJsonLd([
          { name: 'RemoteLens', path: '/' },
          { name: 'Agent Skill', path: '/skills/install' },
        ]),
      ),
    ],
  }),
  component: SkillInstallPage,
})

function SkillInstallPage() {
  return (
    <main className="page-shell" id="main-content" tabIndex={-1}>
      <PageIntro
        eyebrow="Agent Skill"
        title="Give your agent clean job data. Keep your CV local."
      >
        The repository-owned RemoteLens Agent Skill queries public jobs, reads
        only a CV or profile file you explicitly select, and explains evidence,
        gaps, and eligibility on your own computer.
      </PageIntro>

      <section className="mt-section grid gap-10 lg:grid-cols-12">
        <div className="grid gap-4 lg:col-span-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">Installation</p>
            <Badge tone="positive">Repository package</Badge>
          </div>
          <h2>Install from GitHub.</h2>
        </div>
        <div className="content-prose lg:col-span-7 lg:col-start-6">
          <p>
            The repository includes one installable skill package. The Skills
            CLI installs it from GitHub and configures your supported agent.
          </p>
          <pre className="paper-code">
            <code>npx skills add windht/remotelens</code>
          </pre>
          <p>
            Then open <code>skills/remotelens/examples/profile.yaml</code>. The
            public <code>api_base_url</code> is already set to{' '}
            <code>https://remotelens.co/api/v1</code>; change it only for an
            intentional local checkout or alternate deployment. Set{' '}
            <code>cv_path</code> to the CV or profile file you select, and use
            the{' '}
            <Link className="text-pine underline" to="/api">
              public API contract
            </Link>
            . If you do not have a CV yet, the Skill can guide you through a
            local CV/profile draft from facts you provide. No private RemoteLens
            key is required.
          </p>
        </div>
      </section>

      <section className="method-list mt-section">
        <section>
          <div className="grid gap-4">
            <h2 className="!text-[clamp(2rem,4vw,3.5rem)]">
              Start with a CV or local profile.
            </h2>
            <p className="lede">
              Provide an existing file or ask the Skill to guide a local draft
              from facts you provide. It never scans your home directory or
              uploads CV content to RemoteLens.
            </p>
          </div>
        </section>
        <section>
          <div className="grid gap-4">
            <h2 className="!text-[clamp(2rem,4vw,3.5rem)]">
              The API supplies public job evidence.
            </h2>
            <p className="lede">
              The skill does not scrape source pages. It treats every job
              description as untrusted data, not as instructions.
            </p>
          </div>
        </section>
        <section>
          <div className="grid gap-4">
            <h2 className="!text-[clamp(2rem,4vw,3.5rem)]">
              Prepare applications; you submit.
            </h2>
            <p className="lede">
              The Skill can turn your selected CV and public job evidence into
              field-by-field guidance or draft answers. You review and enter
              them yourself; it never opens a browser, mutates a tracker,
              applies for a job, or clicks a final submission control.
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}
