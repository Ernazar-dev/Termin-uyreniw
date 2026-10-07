import type {
  ChapterPayload,
  ClassPayload,
  ContentQuery,
  GamePayload,
  GameQuery,
  LoginPayload,
  Paginated,
  RegisterPayload,
  ResultQuery,
  StudentPayload,
  StudentQuery,
  SubmitTestPayload,
  TermQuery,
  TestPayload,
} from '../types/api';
import type {
  AssistantAnswer,
  Chapter,
  ChapterDetail,
  ClassDetail,
  ClassItem,
  Game,
  GameCheckResult,
  ResultDetail,
  ResultListItem,
  Student,
  StudentStats,
  TeacherStats,
  Term,
  TermDetail,
  TestDetail,
  TestListItem,
  User,
} from '../types/models';
import { api } from './axios';

interface AuthResponse {
  token: string;
  user: User;
}

/** Standard REST resource: list / get / create / update / remove. */
const createResource = <TList, TDetail, TPayload, TQuery extends object = object>(path: string) => ({
  list: (query?: TQuery) => api.get<TList>(path, query),
  get: (id: number) => api.get<TDetail>(`${path}/${id}`),
  create: (payload: TPayload) => api.post<TDetail>(path, payload),
  update: (id: number, payload: TPayload) => api.put<TDetail>(`${path}/${id}`, payload),
  remove: (id: number) => api.delete(`${path}/${id}`),
});

export const authApi = {
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
  register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload),
  me: () => api.get<User>('/auth/me'),
};

export const classesApi = createResource<ClassItem[], ClassDetail, ClassPayload>('/classes');

export const chaptersApi = createResource<Chapter[], ChapterDetail, ChapterPayload, Pick<ContentQuery, 'classId'>>(
  '/chapters',
);

/** Terms are sent as multipart/form-data because of the optional image. */
export const termsApi = {
  ...createResource<Paginated<Term>, TermDetail, FormData, TermQuery>('/terms'),
  create: (payload: FormData) => api.post<Term>('/terms', payload),
  update: (id: number, payload: FormData) => api.put<Term>(`/terms/${id}`, payload),
};

export const gamesApi = {
  ...createResource<Game[], Game, GamePayload, GameQuery>('/games'),
  check: (id: number, optionId: number) => api.post<GameCheckResult>(`/games/${id}/check`, { optionId }),
};

export const testsApi = {
  document: (id: number) => api.get<{ text: string }>(`/tests/${id}/document`),
  ...createResource<TestListItem[], TestDetail, TestPayload, ContentQuery>('/tests'),
  /** Ready-made PDF / Word test: multipart with the sheet and the answer key. */
  createFromFile: (payload: FormData) => api.post<TestListItem>('/tests/from-file', payload),
  updateFromFile: (id: number, payload: FormData) => api.put<TestListItem>(`/tests/${id}/from-file`, payload),
  submit: (id: number, payload: SubmitTestPayload) => api.post<ResultDetail>(`/tests/${id}/submit`, payload),
};

export const resultsApi = {
  list: (query?: ResultQuery) => api.get<Paginated<ResultListItem>>('/results', query),
  listByStudent: (studentId: number, query?: ResultQuery) =>
    api.get<Paginated<ResultListItem>>(`/results/student/${studentId}`, query),
  get: (id: number) => api.get<ResultDetail>(`/results/${id}`),
  remove: (id: number) => api.delete(`/results/${id}`),
};

export const studentsApi = createResource<Paginated<Student>, Student, StudentPayload, StudentQuery>('/students');

export const statsApi = {
  teacher: () => api.get<TeacherStats>('/stats/teacher'),
  student: () => api.get<StudentStats>('/stats/student'),
};

/** The backend may retry and fall back to other models, so allow more time than the default. */
const AI_TIMEOUT_MS = 90_000;

export const aiApi = {
  ask: (question: string) => api.post<AssistantAnswer>('/ai/ask', { question }, { timeout: AI_TIMEOUT_MS }),
};
