// Regression for preserving the meaning of existing results. No database writes.
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/unused';
process.env.JWT_SECRET = 'local-test-history-fixture-only';
const { prisma } = require('../dist/config/prisma');
const { testService } = require('../dist/services/test.service');

const questions = [{ question: 'Sinonim?', options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }] }];
const input = { title: 'Updated title', description: 'Updated description', chapterId: 1, questions };
let writes = 0;
prisma.test.findUnique = async () => ({ id: 1, chapterId: 1, questions, _count: { results: 1 }, fileUrl: '/uploads/original.pdf' });
prisma.test.update = async ({ data }) => { writes++; return data; };

(async () => {
  for (const [payload, file] of [
    [input, { filename: 'replacement.pdf', originalname: 'replacement.pdf' }],
    [{ ...input, chapterId: 2 }, undefined],
    [{ ...input, questions: [{ ...questions[0], question: 'Different question' }] }, undefined],
  ]) {
    await assert.rejects(() => testService.update(1, payload, file), error => error.statusCode === 409);
  }
  assert.equal(writes, 0);
  const updated = await testService.update(1, input);
  assert.equal(updated.title, input.title);
  assert.equal(updated.questions, undefined);
  assert.equal(writes, 1);
  console.log('PASS: taken tests preserve sheet, chapter and questions; title/description remain editable. No database used.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
