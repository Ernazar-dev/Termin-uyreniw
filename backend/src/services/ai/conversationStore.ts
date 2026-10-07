import type { AssistantAnswer } from './ai.types';

export interface ConversationEntry {
  userId: number;
  question: string;
  answer: AssistantAnswer;
  createdAt: Date;
}

/**
 * Chat history persistence is optional for now. To start saving history,
 * add a Prisma model (e.g. AIMessage) and implement this interface with it.
 */
export interface ConversationStore {
  save(entry: ConversationEntry): Promise<void>;
}

export class NoopConversationStore implements ConversationStore {
  async save() {
    // History is intentionally not persisted yet.
  }
}
