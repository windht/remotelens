# Cross-source semantic deduplication

RemoteLens will use deterministic source-local identity first: a provider key plus stable source job ID, or the normalized listing URL when no stable ID exists; timestamps only establish freshness. Automatic cross-source matching follows, and an unresolved cross-source candidate goes to DeepSeek for an auditable `merge`, `separate`, or `uncertain` determination. This is a narrowly scoped V1 exception to the plan's general no-LLM-ingestion rule, chosen to improve multi-source coverage without replacing raw provenance or deterministic processing.

## Consequences

- Semantic evaluation applies only to cross-source candidates, never to a provider's normal idempotent upsert path. Each twice-daily ingestion run evaluates at most 50 pending candidates synchronously; overflow remains pending for a later run.
- Only high-confidence `merge` determinations are applied automatically. A `separate`, `uncertain`, or failed evaluation keeps records distinct and is final for its candidate input hash; reconsider it only after material candidate data changes.
- The server selects DeepSeek through `DEEPSEEK_MODEL`; outputs must satisfy the versioned JSON decision schema. One malformed-response retry is allowed, after which the candidate remains distinct until its material data changes.
- DeepSeek receives only a minimal sanitized candidate packet, never raw feed payloads, CVs, user data, or executable text from job descriptions. RemoteLens retains the verdict and evidence summary, not a full prompt transcript.
- Every automatic or semantic merge must retain its reason and its original source records in an append-only decision history. A correction supersedes a prior decision rather than deleting it. V1 has no manual deduplication review queue or UI; any rare correction is an audited operator data action.
- LLM tagging, CV processing, and application decisions remain outside this ingestion decision.
