INSERT INTO `source_health` (`provider`, `enabled`, `status`, `updated_at`)
VALUES ('jsguru', 1, 'never_run', 0)
ON CONFLICT(`provider`) DO NOTHING;
