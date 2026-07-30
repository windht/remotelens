CREATE TABLE `catalog_state` (
	`key` text PRIMARY KEY NOT NULL,
	`cache_epoch` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dedupe_candidates` (
	`id` text PRIMARY KEY NOT NULL,
	`left_source_record_id` text NOT NULL,
	`right_source_record_id` text NOT NULL,
	`evidence_hash` text NOT NULL,
	`status` text DEFAULT 'unresolved' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`left_source_record_id`) REFERENCES `source_records`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`right_source_record_id`) REFERENCES `source_records`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "dedupe_candidates_pair_order_check" CHECK("dedupe_candidates"."left_source_record_id" < "dedupe_candidates"."right_source_record_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dedupe_candidates_pair_uidx` ON `dedupe_candidates` (`left_source_record_id`,`right_source_record_id`);--> statement-breakpoint
CREATE INDEX `dedupe_candidates_status_created_idx` ON `dedupe_candidates` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `dedupe_decisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`candidate_id` text NOT NULL,
	`outcome` text NOT NULL,
	`model` text,
	`input_hash` text NOT NULL,
	`schema_version` text NOT NULL,
	`error_code` text,
	`decided_at` integer NOT NULL,
	FOREIGN KEY (`candidate_id`) REFERENCES `dedupe_candidates`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "dedupe_decisions_outcome_check" CHECK("dedupe_decisions"."outcome" in ('merge','separate','uncertain','failed'))
);
--> statement-breakpoint
CREATE INDEX `dedupe_decisions_candidate_decided_idx` ON `dedupe_decisions` (`candidate_id`,`decided_at`);--> statement-breakpoint
CREATE TABLE `ingestion_cycles` (
	`id` text PRIMARY KEY NOT NULL,
	`cycle_key` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`cache_epoch_before` text NOT NULL,
	`cache_epoch_after` text,
	CONSTRAINT "ingestion_cycles_status_check" CHECK("ingestion_cycles"."status" in ('running','successful','partial','failed'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ingestion_cycles_cycle_key_uidx` ON `ingestion_cycles` (`cycle_key`);--> statement-breakpoint
CREATE INDEX `ingestion_cycles_status_started_idx` ON `ingestion_cycles` (`status`,`started_at`);--> statement-breakpoint
CREATE TABLE `ingestion_locks` (
	`lock_key` text PRIMARY KEY NOT NULL,
	`owner_cycle_id` text NOT NULL,
	`claimed_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`owner_cycle_id`) REFERENCES `ingestion_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ingestion_locks_expiry_check" CHECK("ingestion_locks"."expires_at" > "ingestion_locks"."claimed_at")
);
--> statement-breakpoint
CREATE INDEX `ingestion_locks_expires_idx` ON `ingestion_locks` (`expires_at`);--> statement-breakpoint
CREATE TABLE `ingestion_source_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`cycle_id` text NOT NULL,
	`provider` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer NOT NULL,
	`fetched_count` integer DEFAULT 0 NOT NULL,
	`admitted_count` integer DEFAULT 0 NOT NULL,
	`inserted_count` integer DEFAULT 0 NOT NULL,
	`updated_count` integer DEFAULT 0 NOT NULL,
	`unchanged_count` integer DEFAULT 0 NOT NULL,
	`rejected_count` integer DEFAULT 0 NOT NULL,
	`response_hash` text,
	`response_status` integer,
	`error_code` text,
	`error_message` text,
	`completed_feed_count` integer,
	`configured_feed_count` integer,
	FOREIGN KEY (`cycle_id`) REFERENCES `ingestion_cycles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "ingestion_source_runs_status_check" CHECK("ingestion_source_runs"."status" in ('successful','partial','failed','suspended'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ingestion_source_runs_cycle_provider_uidx` ON `ingestion_source_runs` (`cycle_id`,`provider`);--> statement-breakpoint
CREATE INDEX `ingestion_source_runs_provider_finished_idx` ON `ingestion_source_runs` (`provider`,`finished_at`);--> statement-breakpoint
CREATE TABLE `job_provenance` (
	`job_id` text NOT NULL,
	`source_record_id` text NOT NULL,
	`attached_at` integer NOT NULL,
	PRIMARY KEY(`job_id`, `source_record_id`),
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_record_id`) REFERENCES `source_records`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "jobs_status_check" CHECK("jobs"."status" in ('active','stale','closed'))
);
--> statement-breakpoint
CREATE INDEX `jobs_status_updated_idx` ON `jobs` (`status`,`updated_at`);--> statement-breakpoint
CREATE TABLE `source_health` (
	`provider` text PRIMARY KEY NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`status` text DEFAULT 'never_run' NOT NULL,
	`last_attempt_at` integer,
	`last_successful_at` integer,
	`last_complete_at` integer,
	`last_error_code` text,
	`last_error_message` text,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	`active_count` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "source_health_status_check" CHECK("source_health"."status" in ('never_run','healthy','partial','failed','suspended'))
);
--> statement-breakpoint
CREATE TABLE `source_labels` (
	`source_record_id` text NOT NULL,
	`normalized` text NOT NULL,
	`source_value` text NOT NULL,
	`kind` text NOT NULL,
	PRIMARY KEY(`source_record_id`, `normalized`, `kind`),
	FOREIGN KEY (`source_record_id`) REFERENCES `source_records`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `source_labels_kind_normalized_idx` ON `source_labels` (`kind`,`normalized`);--> statement-breakpoint
CREATE TABLE `source_records` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`source_key` text NOT NULL,
	`attribution` text NOT NULL,
	`listing_url` text NOT NULL,
	`raw_title` text NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`description_html` text NOT NULL,
	`description_text` text NOT NULL,
	`role_family` text DEFAULT 'engineering' NOT NULL,
	`source_published_at` integer,
	`payload_hash` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`last_checked_at` integer NOT NULL,
	`missing_count` integer DEFAULT 0 NOT NULL,
	`missing_since` integer,
	`closed_at` integer,
	CONSTRAINT "source_records_status_check" CHECK("source_records"."status" in ('active','missing','closed')),
	CONSTRAINT "source_records_role_family_check" CHECK("source_records"."role_family" = 'engineering')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `source_records_provider_key_uidx` ON `source_records` (`provider`,`source_key`);--> statement-breakpoint
CREATE INDEX `source_records_provider_status_idx` ON `source_records` (`provider`,`status`);--> statement-breakpoint
CREATE INDEX `source_records_closed_at_idx` ON `source_records` (`closed_at`);--> statement-breakpoint
INSERT INTO `catalog_state` (`key`, `cache_epoch`, `updated_at`)
VALUES ('live', 'initial', 0);--> statement-breakpoint
INSERT INTO `source_health` (`provider`, `enabled`, `status`, `updated_at`)
VALUES
  ('remote_ok', 1, 'never_run', 0),
  ('wwr', 1, 'never_run', 0);
