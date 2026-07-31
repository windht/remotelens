import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const catalogState = sqliteTable('catalog_state', {
  key: text('key').primaryKey(),
  cacheEpoch: text('cache_epoch').notNull(),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
})

export const ingestionCycles = sqliteTable(
  'ingestion_cycles',
  {
    id: text('id').primaryKey(),
    cycleKey: text('cycle_key').notNull(),
    status: text('status', {
      enum: ['running', 'successful', 'partial', 'failed'],
    }).notNull(),
    startedAt: integer('started_at', { mode: 'number' }).notNull(),
    finishedAt: integer('finished_at', { mode: 'number' }),
    cacheEpochBefore: text('cache_epoch_before').notNull(),
    cacheEpochAfter: text('cache_epoch_after'),
  },
  (table) => [
    uniqueIndex('ingestion_cycles_cycle_key_uidx').on(table.cycleKey),
    index('ingestion_cycles_status_started_idx').on(
      table.status,
      table.startedAt,
    ),
    check(
      'ingestion_cycles_status_check',
      sql`${table.status} in ('running','successful','partial','failed')`,
    ),
  ],
)

export const ingestionSourceRuns = sqliteTable(
  'ingestion_source_runs',
  {
    id: text('id').primaryKey(),
    cycleId: text('cycle_id')
      .notNull()
      .references(() => ingestionCycles.id, { onDelete: 'cascade' }),
    provider: text('provider', {
      enum: ['jsguru', 'remote_ok', 'wwr'],
    }).notNull(),
    status: text('status', {
      enum: ['successful', 'partial', 'failed', 'suspended'],
    }).notNull(),
    startedAt: integer('started_at', { mode: 'number' }).notNull(),
    finishedAt: integer('finished_at', { mode: 'number' }).notNull(),
    fetchedCount: integer('fetched_count').notNull().default(0),
    admittedCount: integer('admitted_count').notNull().default(0),
    insertedCount: integer('inserted_count').notNull().default(0),
    updatedCount: integer('updated_count').notNull().default(0),
    unchangedCount: integer('unchanged_count').notNull().default(0),
    rejectedCount: integer('rejected_count').notNull().default(0),
    responseHash: text('response_hash'),
    responseStatus: integer('response_status'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    completedFeedCount: integer('completed_feed_count'),
    configuredFeedCount: integer('configured_feed_count'),
  },
  (table) => [
    uniqueIndex('ingestion_source_runs_cycle_provider_uidx').on(
      table.cycleId,
      table.provider,
    ),
    index('ingestion_source_runs_provider_finished_idx').on(
      table.provider,
      table.finishedAt,
    ),
    check(
      'ingestion_source_runs_status_check',
      sql`${table.status} in ('successful','partial','failed','suspended')`,
    ),
  ],
)

export const ingestionLocks = sqliteTable(
  'ingestion_locks',
  {
    lockKey: text('lock_key').primaryKey(),
    ownerCycleId: text('owner_cycle_id')
      .notNull()
      .references(() => ingestionCycles.id, { onDelete: 'cascade' }),
    claimedAt: integer('claimed_at', { mode: 'number' }).notNull(),
    expiresAt: integer('expires_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    index('ingestion_locks_expires_idx').on(table.expiresAt),
    check(
      'ingestion_locks_expiry_check',
      sql`${table.expiresAt} > ${table.claimedAt}`,
    ),
  ],
)

export const sourceHealth = sqliteTable(
  'source_health',
  {
    provider: text('provider', {
      enum: ['jsguru', 'remote_ok', 'wwr'],
    }).primaryKey(),
    enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
    status: text('status', {
      enum: ['never_run', 'healthy', 'partial', 'failed', 'suspended'],
    })
      .notNull()
      .default('never_run'),
    lastAttemptAt: integer('last_attempt_at', { mode: 'number' }),
    lastSuccessfulAt: integer('last_successful_at', { mode: 'number' }),
    lastCompleteAt: integer('last_complete_at', { mode: 'number' }),
    lastErrorCode: text('last_error_code'),
    lastErrorMessage: text('last_error_message'),
    consecutiveFailures: integer('consecutive_failures').notNull().default(0),
    activeCount: integer('active_count').notNull().default(0),
    updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    check(
      'source_health_status_check',
      sql`${table.status} in ('never_run','healthy','partial','failed','suspended')`,
    ),
  ],
)

export const sourceRecords = sqliteTable(
  'source_records',
  {
    id: text('id').primaryKey(),
    provider: text('provider', {
      enum: ['jsguru', 'remote_ok', 'wwr'],
    }).notNull(),
    sourceKey: text('source_key').notNull(),
    attribution: text('attribution').notNull(),
    listingUrl: text('listing_url').notNull(),
    rawTitle: text('raw_title').notNull(),
    title: text('title').notNull(),
    company: text('company').notNull(),
    descriptionHtml: text('description_html').notNull(),
    descriptionText: text('description_text').notNull(),
    roleFamily: text('role_family').notNull().default('engineering'),
    sourcePublishedAt: integer('source_published_at', { mode: 'number' }),
    payloadHash: text('payload_hash').notNull(),
    status: text('status', {
      enum: ['active', 'missing', 'closed'],
    })
      .notNull()
      .default('active'),
    firstSeenAt: integer('first_seen_at', { mode: 'number' }).notNull(),
    lastSeenAt: integer('last_seen_at', { mode: 'number' }).notNull(),
    lastCheckedAt: integer('last_checked_at', { mode: 'number' }).notNull(),
    missingCount: integer('missing_count').notNull().default(0),
    missingSince: integer('missing_since', { mode: 'number' }),
    closedAt: integer('closed_at', { mode: 'number' }),
  },
  (table) => [
    uniqueIndex('source_records_provider_key_uidx').on(
      table.provider,
      table.sourceKey,
    ),
    index('source_records_provider_status_idx').on(
      table.provider,
      table.status,
    ),
    index('source_records_closed_at_idx').on(table.closedAt),
    check(
      'source_records_status_check',
      sql`${table.status} in ('active','missing','closed')`,
    ),
    check(
      'source_records_role_family_check',
      sql`${table.roleFamily} = 'engineering'`,
    ),
  ],
)

export const sourceLabels = sqliteTable(
  'source_labels',
  {
    sourceRecordId: text('source_record_id')
      .notNull()
      .references(() => sourceRecords.id, { onDelete: 'cascade' }),
    normalized: text('normalized').notNull(),
    sourceValue: text('source_value').notNull(),
    kind: text('kind', {
      enum: ['filterable', 'provenance'],
    }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.sourceRecordId, table.normalized, table.kind],
      name: 'source_labels_pk',
    }),
    index('source_labels_kind_normalized_idx').on(table.kind, table.normalized),
  ],
)

export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    normalizedTitle: text('normalized_title').notNull(),
    company: text('company').notNull(),
    normalizedCompany: text('normalized_company').notNull(),
    companyDomain: text('company_domain'),
    companyLogoUrl: text('company_logo_url'),
    descriptionText: text('description_text').notNull().default(''),
    descriptionHtmlSanitized: text('description_html_sanitized')
      .notNull()
      .default(''),
    descriptionExcerpt: text('description_excerpt').notNull().default(''),
    employmentType: text('employment_type', {
      enum: [
        'full_time',
        'part_time',
        'contract',
        'temporary',
        'internship',
        'freelance',
      ],
    }),
    seniority: text('seniority', {
      enum: [
        'entry',
        'junior',
        'mid',
        'senior',
        'staff',
        'principal',
        'lead',
        'manager',
      ],
    }),
    roleFamily: text('role_family').notNull().default('engineering'),
    remoteScope: text('remote_scope', {
      enum: [
        'worldwide',
        'countries',
        'region',
        'timezone',
        'hybrid',
        'unspecified',
      ],
    })
      .notNull()
      .default('unspecified'),
    locationSummary: text('location_summary')
      .notNull()
      .default('Eligibility not specified by source'),
    timezoneRequirements: text('timezone_requirements').notNull().default('[]'),
    eligibleCountries: text('eligible_countries').notNull().default('[]'),
    excludedCountries: text('excluded_countries').notNull().default('[]'),
    eligibleRegions: text('eligible_regions').notNull().default('[]'),
    excludedRegions: text('excluded_regions').notNull().default('[]'),
    languages: text('languages').notNull().default('[]'),
    salaryMin: integer('salary_min'),
    salaryMax: integer('salary_max'),
    salaryCurrency: text('salary_currency'),
    salaryPeriod: text('salary_period', { enum: ['hour', 'month', 'year'] }),
    salaryRaw: text('salary_raw'),
    visaSponsorship: text('visa_sponsorship', {
      enum: ['yes', 'no', 'unknown'],
    })
      .notNull()
      .default('unknown'),
    travelRequired: text('travel_required', {
      enum: ['yes', 'no', 'unknown'],
    })
      .notNull()
      .default('unknown'),
    canonicalApplicationUrl: text('canonical_application_url'),
    publishedAt: integer('published_at', { mode: 'number' }),
    firstSeenAt: integer('first_seen_at', { mode: 'number' }).notNull(),
    lastSeenAt: integer('last_seen_at', { mode: 'number' }).notNull(),
    lastCheckedAt: integer('last_checked_at', { mode: 'number' }).notNull(),
    deactivatedAt: integer('deactivated_at', { mode: 'number' }),
    status: text('status', {
      enum: ['active', 'stale', 'closed'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    uniqueIndex('jobs_slug_uidx').on(table.slug),
    index('jobs_normalized_company_idx').on(table.normalizedCompany),
    index('jobs_remote_scope_status_idx').on(table.remoteScope, table.status),
    index('jobs_published_idx').on(table.publishedAt),
    index('jobs_status_updated_idx').on(table.status, table.updatedAt),
    check(
      'jobs_status_check',
      sql`${table.status} in ('active','stale','closed')`,
    ),
  ],
)

export const jobTags = sqliteTable(
  'job_tags',
  {
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    normalized: text('normalized').notNull(),
    sourceValue: text('source_value').notNull(),
    filterable: integer('filterable', { mode: 'boolean' }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.jobId, table.normalized],
      name: 'job_tags_pk',
    }),
    index('job_tags_normalized_idx').on(table.normalized, table.filterable),
  ],
)

export const jobFieldProvenance = sqliteTable(
  'job_field_provenance',
  {
    id: text('id').primaryKey(),
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    sourceRecordId: text('source_record_id')
      .notNull()
      .references(() => sourceRecords.id, { onDelete: 'restrict' }),
    field: text('field').notNull(),
    origin: text('origin', {
      enum: ['source-stated', 'parsed', 'normalized'],
    }).notNull(),
    value: text('value').notNull(),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    index('job_field_provenance_job_field_idx').on(table.jobId, table.field),
    index('job_field_provenance_source_idx').on(table.sourceRecordId),
  ],
)

export const jobProvenance = sqliteTable(
  'job_provenance',
  {
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    sourceRecordId: text('source_record_id')
      .notNull()
      .references(() => sourceRecords.id, { onDelete: 'restrict' }),
    attachedAt: integer('attached_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.jobId, table.sourceRecordId],
      name: 'job_provenance_pk',
    }),
  ],
)

export const dedupeCandidates = sqliteTable(
  'dedupe_candidates',
  {
    id: text('id').primaryKey(),
    leftSourceRecordId: text('left_source_record_id')
      .notNull()
      .references(() => sourceRecords.id, { onDelete: 'cascade' }),
    rightSourceRecordId: text('right_source_record_id')
      .notNull()
      .references(() => sourceRecords.id, { onDelete: 'cascade' }),
    evidenceHash: text('evidence_hash').notNull(),
    status: text('status', {
      enum: ['unresolved', 'decided'],
    })
      .notNull()
      .default('unresolved'),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    uniqueIndex('dedupe_candidates_pair_uidx').on(
      table.leftSourceRecordId,
      table.rightSourceRecordId,
    ),
    index('dedupe_candidates_status_created_idx').on(
      table.status,
      table.createdAt,
    ),
    check(
      'dedupe_candidates_pair_order_check',
      sql`${table.leftSourceRecordId} < ${table.rightSourceRecordId}`,
    ),
  ],
)

export const dedupeDecisions = sqliteTable(
  'dedupe_decisions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    candidateId: text('candidate_id')
      .notNull()
      .references(() => dedupeCandidates.id, { onDelete: 'restrict' }),
    outcome: text('outcome', {
      enum: ['merge', 'separate', 'uncertain', 'failed'],
    }).notNull(),
    model: text('model'),
    inputHash: text('input_hash').notNull(),
    schemaVersion: text('schema_version').notNull(),
    errorCode: text('error_code'),
    decidedAt: integer('decided_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    index('dedupe_decisions_candidate_decided_idx').on(
      table.candidateId,
      table.decidedAt,
    ),
    check(
      'dedupe_decisions_outcome_check',
      sql`${table.outcome} in ('merge','separate','uncertain','failed')`,
    ),
  ],
)
