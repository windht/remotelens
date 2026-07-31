import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '~/components/page-intro'
import { Badge } from '~/components/ui/badge'

export const Route = createFileRoute('/skills/install')({
  head: () => ({
    meta: [
      { title: 'Agent Skill installation — RemoteLens' },
      {
        name: 'description',
        content:
          'Install the repository-owned RemoteLens Agent Skill and compare public job data with a selected local CV.',
      },
    ],
    links: [{ rel: 'canonical', href: '/skills/install' }],
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
        only a CV file you explicitly select, and explains evidence, gaps, and
        eligibility on your own computer.
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
            Then open <code>skills/remotelens/examples/profile.yaml</code>, set
            an explicit <code>api_base_url</code> and user-selected{' '}
            <code>cv_path</code>, and use the{' '}
            <Link className="text-pine underline" to="/api">
              public API contract
            </Link>
            . No private RemoteLens key is required.
          </p>
        </div>
      </section>

      <section className="method-list mt-section">
        <section>
          <div className="grid gap-4">
            <h2 className="!text-[clamp(2rem,4vw,3.5rem)]">
              You select the CV file.
            </h2>
            <p className="lede">
              The skill never recursively scans your home directory and never
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
              You keep the final decision.
            </h2>
            <p className="lede">
              The initial skill does not mutate a tracker, automate a browser,
              apply for a job, or click a final submission control.
            </p>
          </div>
        </section>
      </section>
    </main>
  )
}
