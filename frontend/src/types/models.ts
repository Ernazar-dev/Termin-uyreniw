export type Role = 'TEACHER' | 'STUDENT';
export type GameType = 'MULTIPLE_CHOICE' | 'FILL_BLANK';

export interface ClassBrief {
  id: number;
  name: string;
  order: number;
}

export interface ClassItem extends ClassBrief {
  _count: { chapters: number; students: number };
}

export interface ChapterCounts {
  terms: number;
  games: number;
  tests: number;
}

export interface ChapterBrief {
  id: number;
  title: string;
  order: number;
  classId: number;
  class: ClassBrief;
}

export interface Chapter extends ChapterBrief {
  description: string | null;
  startTopic: number;
  endTopic: number;
  _count: ChapterCounts;
}

export interface ClassDetail extends ClassItem {
  chapters: Omit<Chapter, 'class'>[];
}

export interface ChapterTestBrief {
  id: number;
  title: string;
  description: string | null;
  _count: { questions: number };
}

export interface ChapterDetail extends Chapter {
  tests: ChapterTestBrief[];
}

export interface User {
  id: number;
  fullName: string;
  login: string;
  role: Role;
  classId: number | null;
  class: ClassBrief | null;
  createdAt: string;
}

export interface Student extends User {
  testsTaken: number;
  averagePercentage: number | null;
  viewedTerms: number;
}

export interface Term {
  id: number;
  chapterId: number;
  name: string;
  definition: string;
  example: string | null;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  chapter: ChapterBrief;
}

export interface TermDetail extends Term {
  siblings: { id: number; name: string }[];
}

/** `isCorrect` is only sent to teachers. */
export interface AnswerOption {
  id: number;
  text: string;
  isCorrect?: boolean;
}

export interface Game {
  id: number;
  chapterId: number;
  termId: number | null;
  type: GameType;
  question: string;
  chapter: ChapterBrief;
  term: { id: number; name: string } | null;
  options: AnswerOption[];
}

export interface GameCheckResult {
  isCorrect: boolean;
  correctOptionId: number | null;
}

export interface ResultBrief {
  id: number;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface TestListItem {
  id: number;
  chapterId: number;
  title: string;
  description: string | null;
  /** A ready-made PDF / Word sheet belongs to this test. */
  hasFile: boolean;
  fileName: string | null;
  createdAt: string;
  chapter: ChapterBrief;
  _count: { questions: number; results: number };
  lastResult: ResultBrief | null;
}

export interface TestQuestion {
  id: number;
  question: string;
  order: number;
  options: AnswerOption[];
}

export interface TestDetail {
  id: number;
  chapterId: number;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileName: string | null;
  chapter: ChapterBrief;
  questions: TestQuestion[];
}

export interface ResultListItem extends ResultBrief {
  studentId: number;
  testId: number;
  student: { id: number; fullName: string; class: ClassBrief | null };
  test: { id: number; title: string; chapter: ChapterBrief };
}

export interface ResultQuestion {
  questionId: number;
  question: string;
  order: number;
  options: Required<AnswerOption>[];
  selectedOptionId: number | null;
  isCorrect: boolean;
}

export interface ResultDetail extends ResultListItem {
  wrongAnswers: number;
  questions: ResultQuestion[];
}

export interface RecentResult extends ResultBrief {
  student: { id: number; fullName: string };
  test: { id: number; title: string; chapter: ChapterBrief };
}

export interface TeacherStats {
  counts: {
    classes: number;
    chapters: number;
    terms: number;
    students: number;
    tests: number;
    games: number;
    submittedTests: number;
  };
  averagePercentage: number | null;
  recentResults: RecentResult[];
  classBreakdown: {
    id: number;
    name: string;
    students: number;
    chapters: number;
    terms: number;
    games: number;
    tests: number;
  }[];
  /** Tests submitted per day, oldest first. */
  activity: { date: string; count: number }[];
}

export interface ChapterProgress {
  id: number;
  title: string;
  description: string | null;
  order: number;
  totalTerms: number;
  viewedTerms: number;
  totalTests: number;
  bestTestPercentage: number | null;
}

export interface StudentStats {
  student: { id: number; fullName: string; class: { id: number; name: string } | null };
  counts: { chapters: number; terms: number; viewedTerms: number; tests: number; submittedTests: number };
  averagePercentage: number | null;
  lastResult: RecentResult | null;
  chapterProgress: ChapterProgress[];
}

export type AnswerSource = 'database' | 'ai' | 'unavailable';

export interface AssistantAnswer {
  source: AnswerSource;
  answer: string;
  term: {
    id: number;
    name: string;
    definition: string;
    example: string | null;
    image: string | null;
    chapter: { id: number; title: string; class: { id: number; name: string } };
  } | null;
}
