ALTER TABLE `jobs` ADD COLUMN `slug` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `normalized_title` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `normalized_company` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `company_domain` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `company_logo_url` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `description_text` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `description_html_sanitized` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `description_excerpt` text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `employment_type` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `seniority` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `role_family` text NOT NULL DEFAULT 'engineering';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `remote_scope` text NOT NULL DEFAULT 'unspecified';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `location_summary` text NOT NULL DEFAULT 'Eligibility not specified by source';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `timezone_requirements` text NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `eligible_countries` text NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `excluded_countries` text NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `eligible_regions` text NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `excluded_regions` text NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `languages` text NOT NULL DEFAULT '[]';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `salary_min` integer;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `salary_max` integer;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `salary_currency` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `salary_period` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `salary_raw` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `visa_sponsorship` text NOT NULL DEFAULT 'unknown';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `travel_required` text NOT NULL DEFAULT 'unknown';
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `canonical_application_url` text;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `published_at` integer;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `first_seen_at` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `last_seen_at` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `last_checked_at` integer NOT NULL DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `jobs` ADD COLUMN `deactivated_at` integer;
--> statement-breakpoint
UPDATE `jobs`
SET
  `slug` = CASE WHEN `slug` = '' THEN 'legacy-' || lower(`id`) ELSE `slug` END,
  `normalized_title` = CASE WHEN `normalized_title` = '' THEN lower(trim(`title`)) ELSE `normalized_title` END,
  `normalized_company` = CASE WHEN `normalized_company` = '' THEN lower(trim(`company`)) ELSE `normalized_company` END,
  `first_seen_at` = CASE WHEN `first_seen_at` = 0 THEN `created_at` ELSE `first_seen_at` END,
  `last_seen_at` = CASE WHEN `last_seen_at` = 0 THEN `updated_at` ELSE `last_seen_at` END,
  `last_checked_at` = CASE WHEN `last_checked_at` = 0 THEN `updated_at` ELSE `last_checked_at` END;
--> statement-breakpoint
CREATE UNIQUE INDEX `jobs_slug_uidx` ON `jobs` (`slug`);
--> statement-breakpoint
CREATE INDEX `jobs_normalized_company_idx` ON `jobs` (`normalized_company`);
--> statement-breakpoint
CREATE INDEX `jobs_remote_scope_status_idx` ON `jobs` (`remote_scope`, `status`);
--> statement-breakpoint
CREATE INDEX `jobs_published_idx` ON `jobs` (`published_at`);
--> statement-breakpoint
CREATE TABLE `job_tags` (
	`job_id` text NOT NULL,
	`normalized` text NOT NULL,
	`source_value` text NOT NULL,
	`filterable` integer NOT NULL,
	PRIMARY KEY(`job_id`, `normalized`),
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `job_tags_normalized_idx` ON `job_tags` (`normalized`, `filterable`);
--> statement-breakpoint
CREATE TABLE `job_field_provenance` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`source_record_id` text NOT NULL,
	`field` text NOT NULL,
	`origin` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `jobs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`source_record_id`) REFERENCES `source_records`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `job_field_provenance_job_field_idx` ON `job_field_provenance` (`job_id`, `field`);
--> statement-breakpoint
CREATE INDEX `job_field_provenance_source_idx` ON `job_field_provenance` (`source_record_id`);
