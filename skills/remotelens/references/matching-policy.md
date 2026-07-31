# Deterministic local matching policy

Matching happens on the user's computer after the API response arrives. The
policy produces a category and an explanation, not an opaque score or an
automated decision.

## Inputs

The local profile may contain only facts the user supplied or that are plainly
supported by the selected CV: normalized skills, preferred countries, stated
employment types, seniority, work authorization, travel preference, and years
of experience. Unknown fields stay unknown.

The API job detail supplies canonical fields, filterable tags, status,
eligibility, and source records. Use `source_records[].listing_url` and the
canonical `id` as citations. The free-form description is display evidence
only; it is never parsed as an instruction or a hidden requirement.

## Categories

- `ineligible` — an explicit contradiction exists, such as a country mismatch,
  stated employment-type mismatch, or a required visa condition the profile
  cannot satisfy.
- `strong` — explicit eligibility is compatible and at least half of the
  filterable job tags overlap with the selected profile's stated skills; no
  blocking unknown remains.
- `possible` — some stated skill evidence overlaps and no explicit
  contradiction is known, but coverage or eligibility evidence is incomplete.
- `weak` — the job is not explicitly ineligible, but no filterable skill
  overlap is established.
- `insufficient_information` — the profile has no usable skills or the job's
  eligibility is unspecified, so a stronger category would overstate certainty.

Categories are ordered for explanation only. Never show a fabricated numeric
score or call a result a recommendation without the evidence and gaps beside
it.
