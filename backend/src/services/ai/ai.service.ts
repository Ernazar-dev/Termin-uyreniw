import { buildMessages, formatTermAnswer, UNAVAILABLE_ANSWER } from './ai.prompt';
import type { AIProvider, AssistantAnswer } from './ai.types';
import { NoopConversationStore, type ConversationStore } from './conversationStore';
import { OpenAICompatibleProvider } from './providers/openai.provider';
import { findTermInQuestion } from './termMatcher';

export class AIAssistantService {
  constructor(
    private readonly provider: AIProvider,
    private readonly store: ConversationStore,
  ) {}

  /**
   * 1. Try to recognise a platform term in the question and answer from the database.
   * 2. Otherwise ask the configured AI provider for a Karakalpak explanation.
   */
  async ask(question: string, userId: number): Promise<AssistantAnswer> {
    const term = await findTermInQuestion(question);

    let answer: AssistantAnswer;
    if (term) {
      answer = { source: 'database', answer: formatTermAnswer(term), term };
    } else if (!this.provider.isConfigured()) {
      answer = { source: 'unavailable', answer: UNAVAILABLE_ANSWER, term: null };
    } else {
      const content = await this.provider.complete(buildMessages(question));
      answer = { source: 'ai', answer: content, term: null };
    }

    await this.store.save({ userId, question, answer, createdAt: new Date() });
    return answer;
  }
}

export const aiService = new AIAssistantService(new OpenAICompatibleProvider(), new NoopConversationStore());
