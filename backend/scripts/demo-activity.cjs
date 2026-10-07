/**
 * Creates realistic demo activity so the statistics pages are not empty:
 * test results (with per-question answers, spread over the last two weeks) and viewed terms
 * for the demo students. Only the logins listed below are touched; their earlier results and
 * progress are replaced, so the script can be re-run safely.
 *
 *   node scripts/demo-activity.cjs           dry run
 *   node scripts/demo-activity.cjs --apply   writes the data
 *
 * The target database is whatever DATABASE_URL points to.
 * Games are practice-only and store nothing, so they do not appear in statistics.
 */
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const assert = require('node:assert/strict');

const prisma = new PrismaClient();
const DAY_MS = 24 * 60 * 60 * 1000;

// accuracy: chance of a correct answer, tests: how many of the class tests are taken, termShare: share of terms viewed
const DEMO = [
  { login: 'azamat', accuracy: 0.88, tests: 6, retries: 2, termShare: 0.9 },
  { login: 'aysulu', accuracy: 0.62, tests: 4, retries: 1, termShare: 0.6 },
  { login: 'aydana', accuracy: 0.78, tests: 5, retries: 2, termShare: 0.75 },
];

/** Small deterministic generator: the same data every run, no surprises between environments. */
const seeded = seed => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

async function main() {
  const host = (process.env.DATABASE_URL || '').replace(/^.*@/, '').replace(/[/?].*$/, '');
  console.log(`Target database host: ${host}`);
  const students = await prisma.user.findMany({ where: { role: 'STUDENT', login: { in: DEMO.map(item => item.login) } } });
  const plan = [];

  for (const config of DEMO) {
    const student = students.find(item => item.login === config.login);
    if (!student || !student.classId) { console.log(`Skipped ${config.login}: account or class missing`); continue; }
    const tests = await prisma.test.findMany({
      where: { chapter: { classId: student.classId } },
      orderBy: [{ chapter: { order: 'asc' } }],
      include: { questions: { include: { options: true } } },
    });
    const terms = await prisma.term.findMany({ where: { chapter: { classId: student.classId } }, orderBy: { id: 'asc' }, select: { id: true } });
    if (!tests.length) { console.log(`Skipped ${config.login}: class has no tests`); continue; }
    plan.push({ config, student, tests, terms });
  }
  assert(plan.length > 0, 'Nothing to create');
  for (const { config, tests, terms } of plan) {
    console.log(`${config.login}: ${Math.min(config.tests, tests.length)} tests (+${config.retries} retries), ~${Math.round(terms.length * config.termShare)} terms`);
  }
  if (!process.argv.includes('--apply')) return;

  await prisma.$transaction(async db => {
    for (const { config, student, tests, terms } of plan) {
      await db.testResult.deleteMany({ where: { studentId: student.id } });
      await db.studentProgress.deleteMany({ where: { studentId: student.id } });

      const random = seeded([...config.login].reduce((sum, char) => sum * 31 + char.charCodeAt(0), 7));
      const taken = tests.slice(0, config.tests);
      // Retries are extra attempts at the first tests, done later and a bit better
      const attempts = [...taken.map(test => ({ test, boost: 0 })),
        ...taken.slice(0, config.retries).map(test => ({ test, boost: 0.1 }))];
      const total = attempts.length;

      for (const [position, { test, boost }] of attempts.entries()) {
        const answers = test.questions.map(question => {
          const correct = question.options.find(option => option.isCorrect);
          const wrong = question.options.filter(option => !option.isCorrect);
          const isRight = random() < Math.min(0.97, config.accuracy + boost);
          const selected = isRight ? correct : wrong[Math.floor(random() * wrong.length)];
          return { questionId: question.id, selectedOptionId: selected.id, isCorrect: isRight };
        });
        const correctAnswers = answers.filter(answer => answer.isCorrect).length;
        const daysAgo = Math.round(12 - (position / Math.max(1, total - 1)) * 11);
        const submittedAt = new Date(Date.now() - daysAgo * DAY_MS - Math.floor(random() * 6) * 3600 * 1000);
        await db.testResult.create({ data: {
          studentId: student.id, testId: test.id, correctAnswers, totalQuestions: answers.length,
          percentage: Math.round((correctAnswers / answers.length) * 10000) / 100,
          submittedAt, answers: { create: answers },
        } });
      }

      const viewed = terms.slice(0, Math.round(terms.length * config.termShare));
      for (const [index, term] of viewed.entries()) {
        await db.studentProgress.create({ data: {
          studentId: student.id, termId: term.id,
          viewedAt: new Date(Date.now() - Math.round(13 - (index / Math.max(1, viewed.length)) * 12) * DAY_MS),
        } });
      }
    }
  }, { timeout: 60000 });

  for (const { config, student } of plan) {
    const results = await prisma.testResult.aggregate({ where: { studentId: student.id }, _count: true, _avg: { percentage: true } });
    const progress = await prisma.studentProgress.count({ where: { studentId: student.id } });
    console.log(`${config.login}: ${results._count} results, average ${Math.round(results._avg.percentage)}%, ${progress} terms viewed`);
  }
}

main()
  .catch(error => { console.error('Demo activity failed:', error.code || error.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
