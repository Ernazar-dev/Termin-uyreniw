import type { GameType, Role } from '../types/models';

export const ROLES = {
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const satisfies Record<Role, Role>;

export const AUTH_LOGOUT_EVENT = 'auth:logout';

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  teacher: {
    root: '/teacher',
    dashboard: '/teacher/dashboard',
    classes: '/teacher/classes',
    chapters: '/teacher/chapters',
    terms: '/teacher/terms',
    games: '/teacher/games',
    tests: '/teacher/tests',
    students: '/teacher/students',
    results: '/teacher/results',
  },
  student: {
    root: '/student',
    dashboard: '/student/dashboard',
    classes: '/student/classes',
    classDetail: (classId: number | string) => `/student/classes/${classId}`,
    chapter: (chapterId: number | string) => `/student/chapters/${chapterId}`,
    terms: '/student/terms',
    term: (termId: number | string) => `/student/terms/${termId}`,
    games: '/student/games',
    gamePlay: (chapterId: number | string) => `/student/games/${chapterId}`,
    tests: '/student/tests',
    test: (testId: number | string) => `/student/tests/${testId}`,
    results: '/student/results',
    result: (resultId: number | string) => `/student/results/${resultId}`,
    ai: '/student/ai',
  },
} as const;

export const ROLE_HOME: Record<Role, string> = {
  TEACHER: ROUTES.teacher.dashboard,
  STUDENT: ROUTES.student.dashboard,
};

export const ROLE_LABELS: Record<Role, string> = {
  TEACHER: 'Oqıtıwshı',
  STUDENT: 'Oqıwshı',
};

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  MULTIPLE_CHOICE: 'Variant tańlaw',
  FILL_BLANK: 'Bos orındı toltırıw',
};

/** Fill-in-the-blank questions mark the gap with this token. */
export const BLANK_MARKER = '___';

export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
export const OPTIONS_MIN = 2;
export const OPTIONS_MAX = 6;
export const DEFAULT_OPTIONS_COUNT = 4;

export const DEFAULT_PAGE_SIZE = 12;
export const TABLE_PAGE_SIZE = 10;

export const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.webp';
export const IMAGE_MAX_SIZE_MB = 2;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Percentage thresholds used to colour scores consistently everywhere. */
export const SCORE_THRESHOLDS = { good: 80, medium: 50 } as const;

export const TEXT = {
  save: 'Saqlaw',
  cancel: 'Biykarlaw',
  add: 'Qosıw',
  edit: 'Ózgertiw',
  delete: 'Óshiriw',
  search: 'Izlew',
  back: 'Artqa',
  all: 'Barlıǵı',
  saved: 'Saqlandı',
  deleted: 'Óshirildi',
  required: 'Bul maydan toltırılıwı shárt',
  confirmDelete: 'Haqıyqattan da óshiresiz be?',
  confirmDeleteHint: 'Bul ámeldi qaytarıp bolmaydı.',
  aiLoginHint: 'Aqıllı járdemshi menen sóylesiw ushın akkauntıńızǵa kiriń. Kirgennen keyin sorawıńızdı beriwińiz múmkin.',
} as const;
