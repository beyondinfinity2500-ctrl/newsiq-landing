/**
 * OpenAI-compatible provider (Phase 7).
 *
 * Uses the raw `fetch` API so the bundle stays small and the adapter works
 * against any OpenAI-compatible endpoint (OpenAI, OpenRouter, Together,
 * vLLM, LM Studio, etc.). Provider-specific behaviour is configuration
 * driven via env vars — no code changes required to swap providers.
 *
 * Configuration (all server-side, never exposed to the browser):
 *   AI_PROVIDER_BASE_URL   e.g. "https://api.openai.com/v1" or "https://openrouter.ai/api/v1"
 *   AI_PROVIDER_API_KEY    bearer token
 *   AI_PROVIDER_MODEL      e.g. "gpt-4o-mini", "anthropic/claude-3.5-sonnet"
 *
 * If any of these are missing, the provider fails closed and returns
 * "provider unavailable" so the rest of the pipeline can mark the analysis
 * as `failed` instead of crashing.
 *
 * Retry behaviour: bounded exponential backoff (1s, 2s, 4s) for retryable
 * HTTP statuses (429, 5xx, network errors). The model is invoked at most
 * MAX_ATTEMPTS times; further failures bubble up.
 */

import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { ExternalServiceError, RateLimitError } from "@/lib/errors";
import type { AiAnalysis } from "@/lib/validation";

const MAX_ATTEMPTS = 3;
const BACKOFF_BASE_MS = 1000;
const REQUEST_TIMEOUT_MS = 30_000;

export interface AnalysisRequest {
  system: string;
  user: string;
  version: string;
}

export interface AnalysisProvider {
  readonly name: string;
  readonly version: string;
  /** Returns parsed + (light) sanity-checked analysis. Throws on failure. */
  complete(request: AnalysisRequest): Promise<AiAnalysis>;
  /** Cheap reachability check. */
  isConfigured(): boolean;
}

class OpenAiCompatibleProvider implements AnalysisProvider {
  readonly name = "openai-compatible";
  readonly version = "1.0.0";

  isConfigured(): boolean {
    return Boolean(env.ai.openaiApiKey) || Boolean(env.ai.anthropicApiKey);
  }

  async complete(request: AnalysisRequest): Promise<AiAnalysis> {
    const baseUrl = process.env.AI_PROVIDER_BASE_URL ?? defaultBaseUrl();
    const apiKey = process.env.AI_PROVIDER_API_KEY ?? env.ai.openaiApiKey ?? env.ai.anthropicApiKey;
    const model = process.env.AI_PROVIDER_MODEL ?? defaultModel();

    if (!apiKey) {
      throw new ExternalServiceError("ai-provider", "AI provider is not configured (missing API key).");
    }

    const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
    const body = {
      model,
      messages: [
        { role: "system", content: request.system },
        { role: "user", content: request.user },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 2500,
    };

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (res.status === 429) {
          lastError = new RateLimitError("AI provider rate-limited the request.");
        } else if (res.status >= 500) {
          lastError = new ExternalServiceError("ai-provider", `HTTP ${res.status} ${res.statusText}`);
        } else if (!res.ok) {
          // 4xx other than 429 are not retryable.
          const text = await res.text().catch(() => "");
          throw new ExternalServiceError(
            "ai-provider",
            `HTTP ${res.status}: ${text.slice(0, 500)}`,
          );
        } else {
          const json = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
          };
          const content = json.choices?.[0]?.message?.content;
          if (!content) {
            throw new ExternalServiceError("ai-provider", "AI provider returned an empty completion.");
          }
          return parseModelJson(content);
        }
      } catch (err) {
        if (err instanceof ExternalServiceError) throw err;
        if (err instanceof RateLimitError) {
          lastError = err;
        } else if (err instanceof Error && err.name === "AbortError") {
          lastError = new ExternalServiceError("ai-provider", "AI provider request timed out.");
        } else {
          lastError = new ExternalServiceError(
            "ai-provider",
            err instanceof Error ? err.message : "Unknown AI provider error",
          );
        }
      } finally {
        clearTimeout(timeout);
      }

      if (attempt < MAX_ATTEMPTS) {
        const backoff = BACKOFF_BASE_MS * 2 ** (attempt - 1);
        logger.warn("ai.provider.retry", { attempt, backoffMs: backoff, error: lastError?.message });
        await new Promise((r) => setTimeout(r, backoff));
      }
    }

    logger.error("ai.provider.failed", { error: lastError?.message });
    throw lastError ?? new ExternalServiceError("ai-provider", "AI provider failed without a recorded error.");
  }
}

function defaultBaseUrl(): string {
  return env.ai.openaiApiKey ? "https://api.openai.com/v1" : "https://api.anthropic.com/v1";
}

function defaultModel(): string {
  return env.ai.openaiApiKey ? "gpt-4o-mini" : "claude-3-5-sonnet-latest";
}

/**
 * Parse the model JSON output. Tolerant of accidental markdown fences
 * (some providers ignore response_format). Throws if no valid JSON object
 * is found.
 */
function parseModelJson(content: string): AiAnalysis {
  const trimmed = content.trim();
  const candidates: string[] = [trimmed];
  // Strip ```json ... ``` if present.
  const fence = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence?.[1]) candidates.push(fence[1].trim());
  // First { ... last } substring.
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    candidates.push(trimmed.slice(first, last + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;
      // Defer strict Zod validation to the service layer so this helper
      // stays provider-agnostic and testable.
      if (parsed && typeof parsed === "object") {
        return parsed as AiAnalysis;
      }
    } catch {
      // try next candidate
    }
  }
  throw new ExternalServiceError("ai-provider", "AI provider returned invalid JSON.");
}

let activeProvider: AnalysisProvider = new OpenAiCompatibleProvider();

export function getAnalysisProvider(): AnalysisProvider {
  return activeProvider;
}

/** Test seam — swap the active provider from a single call site. */
export function setAnalysisProvider(provider: AnalysisProvider): void {
  activeProvider = provider;
}
