-- Disposable local-D1 seed used by the Phase 4 live-catalog browser smoke.
-- It contains sanitized, repository-owned data only and is never used in
-- production.
INSERT OR REPLACE INTO source_records (
  id, provider, source_key, attribution, listing_url, raw_title, title,
  company, description_html, description_text, role_family,
  source_published_at, payload_hash, status, first_seen_at, last_seen_at,
  last_checked_at, missing_count, missing_since, closed_at
) VALUES
  ('src_wwr_live-proof', 'wwr', 'live-proof-wwr', 'We Work Remotely',
   'https://weworkremotely.com/remote-jobs/live-proof',
   'Senior Backend Engineer: Kumo Systems', 'Senior Backend Engineer',
   'Kumo Systems', '<p>Build dependable services for a distributed team.</p>',
   'Build dependable services for a distributed team.', 'engineering',
   1785225600000, 'live-proof-wwr-hash', 'active', 1785226320000,
   1785312480000, 1785312480000, 0, NULL, NULL),
  ('src_remote_ok_live-proof', 'remote_ok', 'live-proof-remote-ok', 'Remote OK',
   'https://remoteok.com/remote-jobs/live-proof',
   'Senior Backend Engineer', 'Senior Backend Engineer', 'Kumo Systems',
   '<p>Build dependable services for a distributed team.</p>',
   'Build dependable services for a distributed team.', 'engineering',
   1785139200000, 'live-proof-remote-ok-hash', 'active', 1785226320000,
   1785312180000, 1785312180000, 0, NULL, NULL);

INSERT OR REPLACE INTO source_labels
  (source_record_id, normalized, source_value, kind)
VALUES
  ('src_wwr_live-proof', 'backend', 'Backend', 'filterable'),
  ('src_wwr_live-proof', 'async-team', 'Async team', 'provenance'),
  ('src_remote_ok_live-proof', 'backend', 'Backend', 'filterable'),
  ('src_remote_ok_live-proof', 'rust', 'Rust', 'filterable');

INSERT OR REPLACE INTO jobs (
  id, slug, title, normalized_title, company, normalized_company,
  company_domain, company_logo_url, description_text,
  description_html_sanitized, description_excerpt, employment_type, seniority,
  role_family, remote_scope, location_summary, timezone_requirements,
  eligible_countries, excluded_countries, eligible_regions, excluded_regions,
  languages, salary_min, salary_max, salary_currency, salary_period, salary_raw,
  visa_sponsorship, travel_required, canonical_application_url, published_at,
  first_seen_at, last_seen_at, last_checked_at, deactivated_at, status,
  created_at, updated_at
) VALUES (
  '01JRLKUM0F6TQ7N29J4AX1ZP8R',
  'senior-backend-engineer-kumo-01JRLKUM0F6T',
  'Senior Backend Engineer', 'senior backend engineer', 'Kumo Systems',
  'kumo systems', 'kumo.example', NULL,
  'Build dependable services for a distributed team.',
  '<p>Build dependable services for a distributed team.</p>',
  'Build dependable services for a distributed team.', 'full_time', 'senior',
  'engineering', 'worldwide', 'Worldwide, except the United States', '[]',
  '[]', '["US"]', '[]', '[]', '[]', 160000, 210000, 'USD', 'year',
  'USD 160,000-210,000 per year', 'unknown', 'no',
  'https://weworkremotely.com/remote-jobs/live-proof',
  1785225600000, 1785226320000, 1785312480000, 1785312480000, NULL, 'active',
  1785226320000, 1785312480000);

INSERT OR REPLACE INTO job_tags (job_id, normalized, source_value, filterable)
VALUES
  ('01JRLKUM0F6TQ7N29J4AX1ZP8R', 'backend', 'Backend', 1),
  ('01JRLKUM0F6TQ7N29J4AX1ZP8R', 'rust', 'Rust', 1),
  ('01JRLKUM0F6TQ7N29J4AX1ZP8R', 'async-team', 'Async team', 0);

INSERT OR REPLACE INTO job_provenance (job_id, source_record_id, attached_at)
VALUES
  ('01JRLKUM0F6TQ7N29J4AX1ZP8R', 'src_wwr_live-proof', 1785312480000),
  ('01JRLKUM0F6TQ7N29J4AX1ZP8R', 'src_remote_ok_live-proof', 1785312480000);

INSERT OR REPLACE INTO job_field_provenance
  (id, job_id, source_record_id, field, origin, value, created_at)
VALUES
  ('live-proof-field-title', '01JRLKUM0F6TQ7N29J4AX1ZP8R',
   'src_wwr_live-proof', 'title', 'source-stated', 'Senior Backend Engineer',
   1785312480000),
  ('live-proof-field-eligibility', '01JRLKUM0F6TQ7N29J4AX1ZP8R',
   'src_wwr_live-proof', 'remote eligibility', 'parsed',
   'Worldwide, except the United States', 1785312480000),
  ('live-proof-field-salary', '01JRLKUM0F6TQ7N29J4AX1ZP8R',
   'src_remote_ok_live-proof', 'salary', 'source-stated',
   'USD 160,000-210,000 per year', 1785312480000),
  ('live-proof-field-role', '01JRLKUM0F6TQ7N29J4AX1ZP8R',
   'src_wwr_live-proof', 'role family', 'normalized', 'engineering',
   1785312480000);

UPDATE source_health
SET enabled = 1, status = 'healthy', last_attempt_at = 1785312480000,
    last_successful_at = 1785312480000, last_complete_at = 1785312480000,
    active_count = 1, updated_at = 1785312480000
WHERE provider IN ('remote_ok', 'wwr');

INSERT OR REPLACE INTO ingestion_cycles
  (id, cycle_key, status, started_at, finished_at, cache_epoch_before,
   cache_epoch_after)
VALUES
  ('cycle:live-proof', 'live-proof', 'successful', 1785312480000,
   1785312480000, 'initial', 'epoch:live-proof');

INSERT OR REPLACE INTO ingestion_source_runs
  (id, cycle_id, provider, status, started_at, finished_at, fetched_count,
   admitted_count, inserted_count, updated_count, unchanged_count,
   rejected_count, response_hash, error_code, error_message)
VALUES
  ('run:live-proof:remote_ok', 'cycle:live-proof', 'remote_ok', 'successful',
   1785312480000, 1785312480000, 1, 1, 1, 0, 0, 0, 'live-proof-remote-ok',
   NULL, NULL),
  ('run:live-proof:wwr', 'cycle:live-proof', 'wwr', 'successful',
   1785312480000, 1785312480000, 1, 1, 1, 0, 0, 0, 'live-proof-wwr', NULL,
   NULL);

UPDATE catalog_state
SET cache_epoch = 'epoch:live-proof', updated_at = 1785312480000
WHERE key = 'live';
