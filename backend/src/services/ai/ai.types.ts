export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

/** Any LLM backend (OpenAI, OpenRouter, a local model, ...) implements this contract. */
export interface AIProvider {
  readonly name: string;
  isConfigured(): boolean;
  complete(messages: ChatMessage[], options?: CompletionOptions): Promise<string>;
}

export type AnswerSource = 'database' | 'ai' | 'unavailable';

export interface MatchedTerm {
  id: number;
  name: string;
  definition: string;
  example: string | null;
  image: string | null;
  chapter: { id: number; title: string; class: { id: number; name: string } };
}

export interface AssistantAnswer {
  source: AnswerSource;
  answer: string;
  term: MatchedTerm | null;
}
