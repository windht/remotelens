# RemoteLens Context

RemoteLens is a public, read-only index of remote jobs. It preserves attributed source observations while presenting one canonical representation of the same underlying opening.

## Language

**Canonical Job**:
The stable RemoteLens representation of one underlying job opening, linked to one or more source records. Its ID and public slug are assigned once and never changed by later observations or merges.
_Avoid_: Listing, posting

**Job Summary**:
A compact public representation of a canonical job used in lists and feeds. It includes an excerpt, not the full description or complete provenance.
_Avoid_: Job detail, full record

**Closed Job**:
A canonical job with no active source record after the closure grace period. It remains available as a clearly labeled historical result for the configured retention period.
_Avoid_: Deleted job, active job

**Stale Job**:
A canonical job with no active source record while at least one source record remains within its closure grace period. It is a clearly labeled historical result, distinct from a closed job.
_Avoid_: Closed job, active job

**Source Record**:
One source-specific observation of a job listing, retaining its raw values, source identity, URLs, and provenance.
_Avoid_: Canonical job, duplicate

**Source Observation**:
A time-stamped successful read of a source record used to establish freshness; it is not itself the identity of a listing.
_Avoid_: Job version, duplicate key

**Publication Time**:
A time explicitly stated by a provider for publication of a listing. It is distinct from the time RemoteLens first observed the listing.
_Avoid_: Discovery time, estimated publication date

**Source Freshness**:
The reported state and latest successful observation time for one data provider. It conveys source-specific evidence rather than a generic catalog-freshness claim.
_Avoid_: Global freshness badge, guessed freshness

**Complete Source Run**:
A successful read of all configured feed coverage needed to assess absence for one data provider. A partial or failed run is not evidence that a source record has disappeared.
_Avoid_: Feed omission, closure signal

**Data Provider**:
An external publisher whose public API or configured feeds supply source records. A provider can have multiple feeds but one provider identity.
_Avoid_: Feed, source record

**Provider Suspension**:
A non-destructive state in which a data provider's source records are withheld from public discovery. Its records remain available for audit and re-enablement, while a job backed by another active provider remains public.
_Avoid_: Deletion, job closure

**Feed**:
An explicitly configured endpoint belonging to one data provider. New feeds are never discovered and enabled implicitly.
_Avoid_: Data provider, source

**Cross-source Candidate**:
Two or more source records from different sources that may represent the same underlying opening.
_Avoid_: Confirmed duplicate, merge

**Semantic Deduplication**:
DeepSeek-assisted evaluation of an unresolved cross-source candidate after deterministic matching cannot make a decision. It produces an auditable `merge`, `separate`, or `uncertain` determination while retaining every source record.
_Avoid_: LLM tagging, semantic search

**Application Destination**:
The source-provided URL through which a person can pursue a canonical job. RemoteLens preserves every permitted destination and chooses a primary one only under the documented routing policy.
_Avoid_: Canonical job URL, source record

**Local Application Record**:
A user-controlled application-tracking entry kept on the future client Mac, outside RemoteLens services and D1.
_Avoid_: RemoteLens application, server-side application

**Client-local Execution**:
User-approved CV drafting, process work, application decisions, and tracking performed on a user's computer. It is not a RemoteLens service operation or public API capability.
_Avoid_: RemoteLens execution, hosted workflow

**Eligibility Filter**:
A client-supplied constraint on jobs that RemoteLens has already collected globally. It is never derived from a visitor's IP address and does not limit source ingestion.
_Avoid_: Geographic collection scope, geofencing

**Timezone Requirement**:
An employer-stated availability condition that becomes a filter value only when it can be deterministically normalized to an IANA timezone. Ambiguous wording remains provenance, not an eligibility match.
_Avoid_: Guessed timezone, geographic eligibility

**Developer Cohort**:
The V1 catalog subset: listings from the approved WWR programming feeds and Remote OK listings that pass deterministic developer admission. Ambiguous or non-developer listings are outside this cohort.
_Avoid_: All remote jobs, broad catalog

**Role Family**:
The broad category assigned to a canonical job. `engineering` is the only V1 value; additional families require an explicit catalog expansion.
_Avoid_: Tag, inferred role

**Structured Discovery**:
Finding jobs through explicit normalized fields such as category, company, and geographic eligibility. It never performs generic keyword, job-title, or description full-text search.
_Avoid_: Full-text search, keyword search

**Field Provenance**:
The record of whether a canonical job value is source-stated, deterministically parsed, or normalized, and which source record supports it. It never represents a guessed job value.
_Avoid_: Inferred field, estimated value

**Source Label**:
A tag or category value stated by a data provider and retained with its source record, whether or not it can filter results.
_Avoid_: Inferred tag, keyword

**Job Tag**:
A source label attached to a canonical job with a lexical normalized value and explicit filterability. Only documented developer category or technology labels are filterable; generic or non-developer labels remain provenance-only.
_Avoid_: Free-text label, semantic tag

**Live Catalog Cache Epoch**:
A single token attached to derived public-response cache keys. It changes after a completed refresh to invalidate caches, but RemoteLens retains no historical catalog versions.
_Avoid_: Catalog revision, snapshot
