import {
  askSemanticDedupe,
  semanticInputHash,
  type SemanticDedupeConfig,
} from './semantic-dedupe'
import { normalizeCompany, normalizeTitle, sha256 } from './normalization'

type CandidateRow = {
  evidence_hash: string
  id: string
  left_company: string
  left_description: string
  left_listing_url: string
  left_title: string
  left_source_record_id: string
  right_company: string
  right_description: string
  right_listing_url: string
  right_title: string
  right_source_record_id: string
}

function normalized(value: string) {
  return value.normalize('NFKC').trim().toLocaleLowerCase()
}

function deterministicOutcome(candidate: CandidateRow) {
  const sameTitle =
    normalized(normalizeTitle(candidate.left_title)) ===
    normalized(normalizeTitle(candidate.right_title))
  const sameCompany =
    normalized(normalizeCompany(candidate.left_company)) ===
    normalized(normalizeCompany(candidate.right_company))
  if (sameTitle && sameCompany) return 'merge' as const
  if (
    normalized(candidate.left_listing_url) ===
    normalized(candidate.right_listing_url)
  ) {
    return 'merge' as const
  }
  return null
}

export async function resolveDedupeCandidates(
  db: D1Database,
  input: {
    now: number
    maxPerRun: number
    semantic?: SemanticDedupeConfig
  },
) {
  const candidates = await db
    .prepare(
      `SELECT candidate.id, candidate.evidence_hash,
              left_record.id AS left_source_record_id,
              left_record.company AS left_company,
              left_record.title AS left_title,
              left_record.description_text AS left_description,
              left_record.listing_url AS left_listing_url,
              right_record.id AS right_source_record_id,
              right_record.company AS right_company,
              right_record.title AS right_title,
              right_record.description_text AS right_description,
              right_record.listing_url AS right_listing_url
       FROM dedupe_candidates AS candidate
       JOIN source_records AS left_record
         ON left_record.id = candidate.left_source_record_id
       JOIN source_records AS right_record
         ON right_record.id = candidate.right_source_record_id
       WHERE candidate.status = 'unresolved'
       ORDER BY candidate.created_at, candidate.id
       LIMIT ?`,
    )
    .bind(Math.min(50, Math.max(0, input.maxPerRun)))
    .all<CandidateRow>()
  const statements: D1PreparedStatement[] = []
  let merged = 0
  let separate = 0
  let uncertain = 0
  let failed = 0
  for (const candidate of candidates.results) {
    const deterministic = deterministicOutcome(candidate)
    const semanticInput = {
      left: {
        company: candidate.left_company,
        description: candidate.left_description,
        title: candidate.left_title,
      },
      right: {
        company: candidate.right_company,
        description: candidate.right_description,
        title: candidate.right_title,
      },
    }
    const inputHash = await semanticInputHash(semanticInput)
    const decision = deterministic
      ? { outcome: deterministic as 'merge' | 'separate' | 'uncertain' }
      : input.semantic
        ? await askSemanticDedupe(semanticInput, input.semantic)
        : { outcome: null }
    if (decision.outcome === null) continue
    const outcome = decision.outcome
    if (outcome === 'merge') merged += 1
    else if (outcome === 'separate') separate += 1
    else if (outcome === 'uncertain') uncertain += 1
    else failed += 1
    statements.push(
      db
        .prepare(
          `INSERT INTO dedupe_decisions (
             candidate_id, outcome, model, input_hash, schema_version,
             error_code, decided_at
           ) VALUES (?, ?, ?, ?, 'dedupe-v1', ?, ?)
           ON CONFLICT DO NOTHING`,
        )
        .bind(
          candidate.id,
          outcome,
          deterministic ? 'deterministic-v1' : (input.semantic?.model ?? null),
          inputHash,
          'error' in decision ? decision.error : null,
          input.now,
        ),
    )
    statements.push(
      db
        .prepare(
          `UPDATE dedupe_candidates
           SET status = 'decided', updated_at = ?
           WHERE id = ? AND status = 'unresolved'`,
        )
        .bind(input.now, candidate.id),
    )
  }
  for (let index = 0; index < statements.length; index += 450) {
    await db.batch(statements.slice(index, index + 450))
  }
  return {
    considered: candidates.results.length,
    failed,
    merged,
    separate,
    uncertain,
  }
}

export async function candidateEvidenceHash(candidate: {
  leftSourceRecordId: string
  rightSourceRecordId: string
  title: string
  company: string
}) {
  return sha256(JSON.stringify(candidate))
}
