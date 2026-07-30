---
status: accepted
---

# Provider suspension is non-destructive

Disabling a data provider immediately withholds its source-only jobs from RemoteLens public discovery without mass-closing or deleting the provider's records. This makes the feature flag a safe operational and policy kill switch while preserving auditability and allowing a later re-enable; canonical jobs with another enabled provider remain public.
