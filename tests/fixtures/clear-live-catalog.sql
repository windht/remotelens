-- Remove only the repository-owned Phase 4 local browser-smoke seed.
DELETE FROM job_field_provenance
WHERE job_id = '01JRLKUM0F6TQ7N29J4AX1ZP8R';
DELETE FROM job_tags
WHERE job_id = '01JRLKUM0F6TQ7N29J4AX1ZP8R';
DELETE FROM job_provenance
WHERE job_id = '01JRLKUM0F6TQ7N29J4AX1ZP8R';
DELETE FROM jobs
WHERE id = '01JRLKUM0F6TQ7N29J4AX1ZP8R';
DELETE FROM source_labels
WHERE source_record_id IN ('src_wwr_live-proof', 'src_remote_ok_live-proof');
DELETE FROM source_records
WHERE id IN ('src_wwr_live-proof', 'src_remote_ok_live-proof');
DELETE FROM ingestion_source_runs
WHERE cycle_id = 'cycle:live-proof';
DELETE FROM ingestion_cycles
WHERE id = 'cycle:live-proof';
UPDATE source_health
SET enabled = 1, status = 'never_run', last_attempt_at = NULL,
    last_successful_at = NULL, last_complete_at = NULL,
    last_error_code = NULL, last_error_message = NULL,
    consecutive_failures = 0, active_count = 0, updated_at = 0
WHERE provider IN ('remote_ok', 'wwr');
UPDATE source_health
SET enabled = 1, status = 'never_run', last_attempt_at = NULL,
    last_successful_at = NULL, last_complete_at = NULL,
    last_error_code = NULL, last_error_message = NULL,
    consecutive_failures = 0, active_count = 0, updated_at = 0
WHERE provider IN ('remotejobs', 'remotive', 'jobicy');
UPDATE catalog_state
SET cache_epoch = 'initial', updated_at = 0
WHERE key = 'live';
