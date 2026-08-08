INSERT INTO `source_health` (`provider`, `enabled`, `status`, `updated_at`)
VALUES ('remotejobs', 1, 'never_run', 0)
ON CONFLICT(`provider`) DO NOTHING;
--> statement-breakpoint
INSERT INTO `source_health` (`provider`, `enabled`, `status`, `updated_at`)
VALUES ('remotive', 1, 'never_run', 0)
ON CONFLICT(`provider`) DO NOTHING;
--> statement-breakpoint
INSERT INTO `source_health` (`provider`, `enabled`, `status`, `updated_at`)
VALUES ('jobicy', 1, 'never_run', 0)
ON CONFLICT(`provider`) DO NOTHING;
