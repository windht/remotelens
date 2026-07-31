# Installing and running the client locally

The RemoteLens GitHub repository owns the package. Install the named skill with
the Skills CLI:

```bash
npx skills add windht/remotelens
```

Select the supported agent and scope when prompted. Start a new agent task after
installation, then reference `remotelens`. Do not copy credentials into the
package.

## Generic SKILL.md-compatible agent

If an agent does not support the Skills CLI, provide the absolute path to
`skills/remotelens/SKILL.md` in its documented local skill configuration. Then
provide a local YAML profile based on `examples/profile.yaml`.

## Review checklist

Before any comparison, confirm the user-selected `cv_path`, the explicit
`api_base_url`, and that no private key is configured. After comparison, show
job IDs, source URLs, evidence, gaps, uncertainty, and next actions. Keep the
CV text and path out of transcripts, logs, API requests, and generated public
artifacts.
