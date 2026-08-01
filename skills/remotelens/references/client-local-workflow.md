# Installing and running the client locally

The RemoteLens GitHub repository owns the package. Install the named skill with
the Skills CLI:

```bash
npx skills add windht/remotelens
```

Select the supported agent and scope when prompted. Start a new agent task after
installation, then reference `remotelens`. Do not copy credentials into the
package.

The example profile already points at the public RemoteLens API:
`https://remotelens.co/api/v1`. Leave that value unchanged for normal use. Only
override it when intentionally using a local checkout or another deployment.

## Generic SKILL.md-compatible agent

If an agent does not support the Skills CLI, provide the absolute path to
`skills/remotelens/SKILL.md` in its documented local skill configuration. Then
provide a local YAML profile based on `examples/profile.yaml`.

## Set up the local CV/profile

Select one existing CV/profile file yourself. If you do not have one, ask the
agent to guide you through creating a local CV/profile from facts you provide,
save it locally, and then set `cv_path` to that file. See `cv-setup.md` for the
minimum sections and the manual application-form workflow. The agent must not
search for the file or infer missing facts.

## Review checklist

Before any comparison, confirm the user-selected `cv_path`, that the public
`api_base_url` is still `https://remotelens.co/api/v1` unless an intentional
override was chosen, and that no private key is configured. After comparison,
show job IDs, source URLs, evidence, gaps, uncertainty, and next actions. Keep
the CV text and path out of transcripts, logs, API requests, and generated
public artifacts.

When helping with an application form, draft one field at a time from the
selected local CV and user-provided facts. Mark missing information as unknown.
The user opens the form, enters and reviews the answer, and makes the final
submission.
