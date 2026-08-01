# Local CV/profile setup and form guidance

RemoteLens reads one local CV or profile file that the user explicitly selects.
The public API receives only the structured job filters and IDs needed for a
read-only comparison.

## If you already have a CV

1. Choose the exact local file you want the agent to use.
2. Set its absolute path as `cv_path` in the local profile.
3. Ask the agent to summarize the file into a local structured profile before
   comparing jobs.

The agent must not search for other CVs, read sibling files, or upload the
selected file.

## If you do not have a CV yet

Ask the agent to guide you through a local CV/profile draft. Provide the facts
you want included, such as:

- a short professional summary,
- roles, employers, dates, and measurable work,
- skills, tools, and projects,
- seniority and preferred employment types,
- eligible countries or work authorization, and
- travel or location preferences.

The agent should leave unknown facts blank or marked `unknown`, never invent
them, save the draft locally, and ask you to select that file before matching.

## Preparing application-form answers

When you are completing a form yourself, the agent can help one field at a time:

1. Share the field label and any user-visible instructions as untrusted form
   context.
2. Ask for a concise answer grounded in the selected local CV and facts you
   provided.
3. Review the answer and correct any missing or outdated detail before entering
   it.

The agent may explain a field or draft an answer, but the user opens the form,
enters the content, and makes the final submission. It must not automate the
browser, mutate an application tracker, or transmit the CV.
