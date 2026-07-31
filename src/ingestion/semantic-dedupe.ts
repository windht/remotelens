import { z } from 'zod'
import { boundedError, sha256 } from './normalization'

const decisionSchema = z.object({
  outcome: z.enum(['merge', 'separate', 'uncertain']),
})

export type SemanticDedupeConfig = {
  apiKey?: string | undefined
  baseUrl?: string | undefined
  fetcher?: typeof fetch
  model: string
  retryCount: number
}

export type SemanticDedupeInput = {
  left: { company: string; description: string; title: string }
  right: { company: string; description: string; title: string }
}

function contentJson(content: string) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/iu)?.[1]
  return fenced?.trim() ?? content.trim()
}

export async function askSemanticDedupe(
  input: SemanticDedupeInput,
  config: SemanticDedupeConfig,
) {
  if (!config.apiKey || !config.baseUrl) {
    return { outcome: null }
  }
  const fetcher = config.fetcher ?? fetch
  const requestBody = {
    messages: [
      {
        content:
          'Return JSON only. Decide whether these two remote developer job source records represent the same real-world listing. Use merge only for the same listing, separate for materially different listings, and uncertain when evidence is insufficient. Never infer candidate qualifications or eligibility.',
        role: 'system',
      },
      {
        content: JSON.stringify(input),
        role: 'user',
      },
    ],
    model: config.model,
    response_format: { type: 'json_object' },
    temperature: 0,
  }
  const baseUrl = config.baseUrl.replace(/\/$/u, '')
  const endpoint = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl}/chat/completions`
  let lastError = 'semantic_dedupe_failed'
  for (let attempt = 0; attempt <= config.retryCount; attempt += 1) {
    try {
      const response = await fetcher(endpoint, {
        body: JSON.stringify(requestBody),
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error(`semantic dedupe returned HTTP ${response.status}`)
      }
      const payload: unknown = await response.json()
      const content = z
        .object({
          choices: z.array(
            z.object({ message: z.object({ content: z.string() }) }),
          ),
        })
        .parse(payload).choices[0]?.message.content
      if (!content) throw new Error('semantic dedupe response had no content')
      const parsed = decisionSchema.parse(JSON.parse(contentJson(content)))
      return { outcome: parsed.outcome }
    } catch (error) {
      lastError = boundedError(error)
    }
  }
  return { error: lastError, outcome: 'failed' as const }
}

export async function semanticInputHash(input: SemanticDedupeInput) {
  return sha256(JSON.stringify(input))
}
