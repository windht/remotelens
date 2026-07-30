import { Link, createFileRoute } from '@tanstack/react-router'
import { PageIntro } from '~/components/page-intro'
import { Badge } from '~/components/ui/badge'

export const Route = createFileRoute('/skills/install')({
  head: () => ({
    meta: [
      { title: 'Agent Skill installation preview — RemoteLens' },
      {
        name: 'description',
        content:
          'How the future RemoteLens Agent Skill will query public job data while keeping a selected CV local.',
      },
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
        The RemoteLens Agent Skill is an API-only client. It will query public
        jobs, read only a CV file you explicitly select, and explain strengths,
        gaps, and eligibility on your own computer.
      </PageIntro>

      <section className="mt-section grid gap-10 lg:grid-cols-12">
        <div className="grid gap-4 lg:col-span-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="eyebrow">Installation</p>
            <Badge tone="warning">Phase 5 preview</Badge>
          </div>
          <h2>No invented package command.</h2>
        </div>
        <div className="content-prose lg:col-span-7 lg:col-start-6">
          <p>
            The executable skill package is not published during Phase 0–1.
            RemoteLens will document exact Codex and Claude Code installation
            commands only after the repository-owned <code>SKILL.md</code> and
            references exist in Phase 5.
          </p>
          <pre className="paper-code">
            <code>{`# Preview only — do not run yet
skills/remotelens/
├── SKILL.md
├── references/
└── examples/`}</code>
          </pre>
          <p>
            Until then, use the fixture-backed website to review the intended
            product boundary and the{' '}
            <Link className="text-pine underline" to="/api">
              public API contract
            </Link>
            .
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
