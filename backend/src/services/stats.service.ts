import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { chapterBriefSelect } from './selects';

const RECENT_RESULTS_LIMIT = 6;
const ACTIVITY_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

const round = (value: number | null | undefined) => (value == null ? null : Math.round(value * 10) / 10);

const recentResultSelect = {
  id: true,
  percentage: true,
  correctAnswers: true,
  totalQuestions: true,
  submittedAt: true,
  student: { select: { id: true, fullName: true } },
  test: { select: { id: true, title: true, chapter: { select: chapterBriefSelect } } },
} as const;

export const statsService = {
  async teacher() {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setTime(since.getTime() - (ACTIVITY_DAYS - 1) * DAY_MS);

    const [classes, chapters, terms, students, tests, games, submittedTests, average, recentResults, classRows, recent] =
      await prisma.$transaction([
        prisma.class.count(),
        prisma.chapter.count(),
        prisma.term.count(),
        prisma.user.count({ where: { role: Role.STUDENT } }),
        prisma.test.count(),
        prisma.game.count(),
        prisma.testResult.count(),
        prisma.testResult.aggregate({ _avg: { percentage: true } }),
        prisma.testResult.findMany({
          orderBy: { submittedAt: 'desc' },
          take: RECENT_RESULTS_LIMIT,
          select: recentResultSelect,
        }),
        prisma.class.findMany({
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            _count: { select: { students: true, chapters: true } },
            chapters: { select: { _count: { select: { terms: true, games: true, tests: true } } } },
          },
        }),
        prisma.testResult.findMany({ where: { submittedAt: { gte: since } }, select: { submittedAt: true } }),
      ]);

    // Tests submitted per day for the activity chart (days without results count as zero)
    const perDay = new Map<string, number>();
    for (const { submittedAt } of recent) perDay.set(dayKey(submittedAt), (perDay.get(dayKey(submittedAt)) ?? 0) + 1);
    const activity = Array.from({ length: ACTIVITY_DAYS }, (_, index) => {
      const date = new Date(since.getTime() + index * DAY_MS);
      return { date: dayKey(date), count: perDay.get(dayKey(date)) ?? 0 };
    });

    const classBreakdown = classRows.map((row) => ({
      id: row.id,
      name: row.name,
      students: row._count.students,
      chapters: row._count.chapters,
      terms: row.chapters.reduce((sum, chapter) => sum + chapter._count.terms, 0),
      games: row.chapters.reduce((sum, chapter) => sum + chapter._count.games, 0),
      tests: row.chapters.reduce((sum, chapter) => sum + chapter._count.tests, 0),
    }));

    return {
      counts: { classes, chapters, terms, students, tests, games, submittedTests },
      averagePercentage: round(average._avg.percentage),
      recentResults,
      classBreakdown,
      activity,
    };
  },

  async student(studentId: number) {
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: { id: true, fullName: true, classId: true, class: { select: { id: true, name: true } } },
    });
    if (!student) throw ApiError.notFound('Oqıwshı tabılmadı');

    const classFilter = student.classId ? { classId: student.classId } : { id: -1 };

    const [chapters, viewedProgress, average, resultsCount, lastResult] = await Promise.all([
      prisma.chapter.findMany({
        where: classFilter,
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          order: true,
          terms: { select: { id: true } },
          tests: {
            select: {
              id: true,
              results: {
                where: { studentId },
                orderBy: { percentage: 'desc' },
                take: 1,
                select: { percentage: true },
              },
            },
          },
        },
      }),
      prisma.studentProgress.findMany({ where: { studentId }, select: { termId: true } }),
      prisma.testResult.aggregate({ where: { studentId }, _avg: { percentage: true } }),
      prisma.testResult.count({ where: { studentId } }),
      prisma.testResult.findFirst({
        where: { studentId },
        orderBy: { submittedAt: 'desc' },
        select: recentResultSelect,
      }),
    ]);

    const viewed = new Set(viewedProgress.map((progress) => progress.termId));

    const chapterProgress = chapters.map((chapter) => {
      const bestScores = chapter.tests.flatMap((test) => test.results.map((result) => result.percentage));
      return {
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        order: chapter.order,
        totalTerms: chapter.terms.length,
        viewedTerms: chapter.terms.filter((term) => viewed.has(term.id)).length,
        totalTests: chapter.tests.length,
        bestTestPercentage: bestScores.length ? Math.max(...bestScores) : null,
      };
    });

    return {
      student: { id: student.id, fullName: student.fullName, class: student.class },
      counts: {
        chapters: chapters.length,
        terms: chapterProgress.reduce((sum, chapter) => sum + chapter.totalTerms, 0),
        viewedTerms: chapterProgress.reduce((sum, chapter) => sum + chapter.viewedTerms, 0),
        tests: chapterProgress.reduce((sum, chapter) => sum + chapter.totalTests, 0),
        submittedTests: resultsCount,
      },
      averagePercentage: round(average._avg.percentage),
      lastResult,
      chapterProgress,
    };
  },
};
