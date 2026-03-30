import OpenAI from 'openai';

let cached: OpenAI | null | undefined;

/**
 * Lazy OpenAI client for enrichment only — does not throw when the API key is missing
 * (search and other features may use `lib/openai.ts`, which requires a key at import time).
 */
export function getEnrichmentOpenAI(): OpenAI | null {
  if (cached === undefined) {
    const key = process.env.OPENAI_API_KEY?.trim();
    cached = key ? new OpenAI({ apiKey: key }) : null;
  }
  return cached;
}

export function getEnrichmentModel(): string {
  return process.env.OPENAI_ENRICHMENT_MODEL?.trim() || 'gpt-4o-mini';
}

export type JsonCompletionResult =
  | { ok: true; raw: string }
  | { ok: false; error: string };

/**
 * Single-turn JSON object completion for enrichment pipelines.
 */
export async function runJsonCompletion(params: {
  system: string;
  user: string;
  model?: string;
  temperature?: number;
}): Promise<JsonCompletionResult> {
  const client = getEnrichmentOpenAI();
  if (!client) {
    return { ok: false, error: 'OPENAI_API_KEY is not configured' };
  }
  const model = params.model ?? getEnrichmentModel();
  try {
    const res = await client.chat.completions.create({
      model,
      temperature: params.temperature ?? 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: params.system },
        { role: 'user', content: params.user },
      ],
    });
    const content = res.choices[0]?.message?.content;
    if (!content?.trim()) {
      return { ok: false, error: 'Empty completion from OpenAI' };
    }
    return { ok: true, raw: content };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
