// Run after npm run build. Uses in-memory fixtures, never connects to a database.
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/unused';
process.env.JWT_SECRET = 'local-learning-regression-fixture-only';
const { prisma } = require('../dist/config/prisma');
const { signToken } = require('../dist/utils/jwt');
const { createApp } = require('../dist/app');

const chapter = { id: 1, title: 'Leksikologiya', class: { id: 5, name: '5-klass' } };
const game = { id: 1, question: 'Sinonim', chapter, options: [{ id: 1, text: 'Gozzal', isCorrect: true }] };
let listQuery;
prisma.test.findMany = async query => {
  listQuery = query;
  return [{ id: 1, title: 'Test', chapter, _count: { questions: 2 }, ...(query.include.results ? { results: [{ id: 7, percentage: 100 }] } : {}) }];
};
prisma.chapter.findMany = async () => [{ ...chapter, _count: { games: 1 } }];
prisma.test.findUnique = async () => ({ id: 1, title: 'Test', chapter, fileUrl: null, questions: [{ id: 1, question: 'Sinonim?', options: game.options }] });
prisma.game.findMany = async () => [game];
prisma.game.findUnique = async () => game;
prisma.gameOption.findMany = async () => game.options;
const server = createApp().listen(0, '127.0.0.1', async () => {
  const origin = `http://127.0.0.1:${server.address().port}/api`;
  try {
    let response = await fetch(`${origin}/tests?classId=5`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data[0].lastResult, null);
    assert.equal(listQuery.include.results, undefined);
    assert.deepEqual(listQuery.where.chapter, { classId: 5 });
    response = await fetch(`${origin}/tests`, { headers: { Authorization: `Bearer ${signToken({ id: 42, role: 'STUDENT' })}` } });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data[0].lastResult.percentage, 100);
    assert.equal(listQuery.include.results.where.studentId, 42);
    for (const path of ['/chapters', '/games', '/games/1']) {
      response = await fetch(origin + path);
      assert.equal(response.status, 200, path);
      const payload = (await response.json()).data;
      const options = Array.isArray(payload) ? payload[0]?.options : payload.options;
      if (options) assert(!('isCorrect' in options[0]), 'Practice choices keep the existing student format');
    }
    response = await fetch(`${origin}/games/1/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ optionId: 1 }) });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.isCorrect, true);
    response = await fetch(`${origin}/tests/1`);
    assert.equal(response.status, 200);
    assert(!('isCorrect' in (await response.json()).data.questions[0].options[0]));
    // Verify the legacy Word route reaches the real controller and document service.
    response = await fetch(`${origin}/tests/1/document`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).message, 'Test faylı tabılmadı');
    const WordExtractor = require('word-extractor');
    WordExtractor.prototype.extract = async () => ({ getBody: () => 'Qaraqalpaqsha test sorawları' });
    prisma.test.findUnique = async () => ({ fileUrl: '/uploads/fixture.doc' });
    response = await fetch(`${origin}/tests/1/document`);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).data.text, 'Qaraqalpaqsha test sorawları');
    for (const [method, path] of [['POST', '/tests/1/submit'], ['POST', '/ai/ask'], ['POST', '/games'], ['PUT', '/games/1'], ['DELETE', '/games/1'], ['POST', '/tests'], ['GET', '/results'], ['GET', '/students']]) {
      response = await fetch(origin + path, { method });
      assert.equal(response.status, 401, `${method} ${path} must still require an account`);
    }
    console.log('PASS: public test summaries and practice games; guest answer checks; signed-in result scoping; test submissions and teacher writes retain authentication. No database used.');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { server.close(); await prisma.$disconnect(); }
});
