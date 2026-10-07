import type { GameType } from './models';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface LoginPayload {
  login: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  fullName: string;
  classId: number;
}

export interface ClassPayload {
  name: string;
}

export interface ChapterPayload {
  classId: number;
  title: string;
  description?: string | null;
  startTopic: number;
  endTopic: number;
}

export interface OptionPayload {
  text: string;
  isCorrect: boolean;
}

export interface GamePayload {
  chapterId: number;
  termId?: number | null;
  type: GameType;
  question: string;
  options: OptionPayload[];
}

export interface TestQuestionPayload {
  question: string;
  options: OptionPayload[];
}

export interface TestPayload {
  chapterId: number;
  title: string;
  description?: string | null;
  questions: TestQuestionPayload[];
}

export interface SubmitTestPayload {
  answers: { questionId: number; optionId: number | null }[];
}

export interface StudentPayload {
  fullName: string;
  login: string;
  password?: string;
  classId: number;
}

export interface TermQuery extends PaginationParams {
  search?: string;
  classId?: number;
  chapterId?: number;
}

export interface ContentQuery {
  classId?: number;
  chapterId?: number;
}

export interface GameQuery extends ContentQuery {
  termId?: number;
  type?: GameType;
}

export interface ResultQuery extends PaginationParams, ContentQuery {
  studentId?: number;
  testId?: number;
}

export interface StudentQuery extends PaginationParams {
  classId?: number;
  search?: string;
}
