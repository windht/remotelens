# Source Policy

RemoteLens treats each publisher as a **data provider** and every configured endpoint as a **feed**. A provider may be disabled independently; source records and their attribution are retained according to that provider's documented public-source policy.

## Initial providers

| Provider         | Key         | Feed model                                                                                      | Production status                                         |
| ---------------- | ----------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| JS Guru Jobs     | `jsguru`    | Server-rendered HTML from exactly `/jobs`, `/jobs?page=2`, and `/jobs?page=3`                   | Approved for next deployment; attribution required        |
| Remote OK        | `remote_ok` | JSON API at `https://remoteok.com/api`                                                          | Approved active V1 provider; visible attribution required |
| We Work Remotely | `wwr`       | Explicit allow-list of category RSS feeds from `https://weworkremotely.com/remote-job-rss-feed` | Approved active V1 provider; visible attribution required |

JS Guru Jobs is intentionally bounded to its first three server-rendered result
pages. RemoteLens does not execute client JavaScript, crawl pagination beyond
page 3, or fetch listing-detail pages. The numeric `/jobs/:id` path is the
source-local identity. The source listing remains the attributed destination,
and job-card technologies and work-format labels are retained as source labels.
Its current `robots.txt` allows `/` but disallows `page` query URLs for crawler
traffic. The owner explicitly approved this low-frequency, three-page
integration; operators must suspend `jsguru` if the publisher's access policy
changes or requests removal.

WWR category feeds are feeds within the single `wwr` provider, not independent providers. Records found in more than one WWR feed are deduplicated within `wwr` before cross-provider matching. RemoteLens never discovers and enables new feeds implicitly.

## Provider suspension

Disabling a provider is a non-destructive public-discovery pause, not a mass closure or deletion. Its source-only jobs are withheld immediately; source records remain for audit and re-enablement, and canonical jobs stay public whenever another enabled provider still supports them.

## Enablement gate

A future provider cannot be enabled until it has an adapter, sanitized fixtures and tests, a stable identity strategy, documented public access and storage rules, attribution and application-routing rules, an independently controllable feature flag, and an operations owner.

## Content and routing

RemoteLens retains and renders full sanitized descriptions from Remote OK and
WWR with visible attribution, while JS Guru Jobs contributes only the bounded
excerpt present in its result card. When a canonical job has competing
permitted application destinations, all remain visible. The primary action
uses a verified direct ATS URL when available; otherwise it uses the provider
with the clearest permitted application path.

V1 does not retain successful or failed live feed payloads in R2. It retains only payload hashes, response metadata, counts, and bounded error summaries; sanitized repository fixtures are the replay and test mechanism.
