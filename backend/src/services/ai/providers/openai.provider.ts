import { env } from '../../../config/env';
import { ApiError } from '../../../utils/ApiError';
import type { AIProvider, ChatMessage, CompletionOptions } from '../ai.types';

const REQUEST_TIMEOUT_MS = 25_000;
/** Total budget for all retries and fallbacks; must stay below the frontend AI timeout (90s). */
const TOTAL_DEADLINE_MS = 70_000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1_500;
const RETRYABLE_STATUSES = [429, 500, 503];

const AI_BUSY_ERROR = new ApiError(503, 'Jasalma intellekt xızmeti házir bánt. Birazdan qaytalap kóriń');

class TransientProviderError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ChatCompletionResponse {
  choices?: { message?: { content?: string | null } }[];
}

/**
 * Works with any OpenAI-compatible Chat Completions API
 * (OpenAI, OpenRouter, Groq, Together, LM Studio, Ollama's /v1 ...).
 */
export class OpenAICompatibleProvider implements AIProvider {
  readonly name = 'openai-compatible';

  /** Primary model first, then fallbacks used only when the previous one is busy. */
  private readonly models: string[];

  constructor(
    private readonly apiKey = env.AI_API_KEY,
    private readonly baseUrl = env.AI_BASE_URL,
    model = env.AI_MODEL,
    fallbackModels = env.AI_FALLBACK_MODELS,
  ) {
    this.models = [model, ...fallbackModels].filter(Boolean);
  }

  isConfigured() {
    return Boolean(this.apiKey && this.baseUrl && this.models.length);
  }

  /** Overloaded / rate-limited models usually recover within seconds; otherwise try the next model. */
  async complete(messages: ChatMessage[], options: CompletionOptions = {}) {
    const deadline = Date.now() + TOTAL_DEADLINE_MS;

    for (const model of this.models) {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw AI_BUSY_ERROR;
        try {
          return await this.request(model, messages, options, Math.min(REQUEST_TIMEOUT_MS, remaining));
        } catch (error) {
          if (!(error instanceof TransientProviderError)) throw error;
          if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }
    throw AI_BUSY_ERROR;
  }

  private async request(model: string, messages: ChatMessage[], options: CompletionOptions, timeoutMs: number) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.3,
          // Reasoning models (e.g. Gemini) spend part of this budget on thinking
          max_tokens: options.maxTokens ?? 2048,
        }),
        signal: controller.signal,
      });

      if (RETRYABLE_STATUSES.includes(response.status)) {
        console.warn(`[ai] ${model} busy (${response.status})`);
        throw new TransientProviderError();
      }

      if (!response.ok) {
        console.error(`[ai] provider responded ${response.status}`);
        throw new ApiError(502, 'Jasalma intellekt xızmeti juwap bermedi. Birazdan qaytalań');
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new ApiError(502, 'Járdemshi bos juwap qaytardı');
      return content;
    } catch (error) {
      if (error instanceof ApiError || error instanceof TransientProviderError) throw error;
      // A slow or unreachable model is treated like a busy one: try the next model
      console.warn(`[ai] ${model} request failed:`, error instanceof Error ? error.message : error);
      throw new TransientProviderError();
    } finally {
      clearTimeout(timer);
    }
  }
}
