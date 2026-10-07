require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('node:crypto');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const groups = require('./curated-demo.cjs');
const prisma = new PrismaClient();
const tables = ['class', 'user', 'chapter', 'term', 'game', 'gameOption', 'test', 'testQuestion', 'testOption', 'testResult', 'studentAnswer', 'studentProgress'];
const seedTitles = ['1-bap. Fonetika', '2-bap. Leksika', '3-bap. Morfologiya', '1-bap. Sóz quramı', '1-bap. Sóz shaqapları', '1-bap. Sintaksis', '1-bap. Qospa gáp'];
const names = ['Azamat Allambergenov', 'Aydana Jumabaeva', 'Nurlan Ernazarov', 'Gúlnara Turemuratova', 'Dáwlet Bekmuratov'];
const isDemo = user => user.role === 'STUDENT' && /^demo_\d+_\d+$/.test(user.login) && user.fullName.startsWith('[Demo] ');
async function main() {
  assert.equal(groups.length, 5);
  groups.forEach(([, terms]) => assert.equal(new Set(terms.map(term => term[0])).size, 4));
  const classes = await prisma.class.findMany({ orderBy: { order: 'asc' } });
  assert.deepEqual(classes.map(klass => klass.order), [5, 6, 7, 8, 9]);
  const users = await prisma.user.findMany();
  const teacher = users.find(user => user.role === 'TEACHER');
  assert(teacher);
  const chapters = await prisma.chapter.findMany();
  assert(chapters.every(chapter => chapter.title.startsWith('[Demo]') || seedTitles.includes(chapter.title)), 'Unrecognized chapter; review before reset.');
  const custom = (await prisma.test.findMany()).filter(test => !test.title.startsWith('[Demo]') && !['Fonetika boyınsha test', 'Leksika boyınsha test'].includes(test.title));
  console.log(JSON.stringify({ chapters: 25, terms: 100, tests: 25, demoStudents: 5, preservedStudents: users.filter(user => user.role === 'STUDENT' && !isDemo(user)).length, customTests: custom.map(test => ({ id: test.id, title: test.title })) }));
  if (!process.argv.includes('--apply')) return;
  assert(!custom.length || process.argv.includes('--replace-custom-tests') || process.argv.includes('--preserve-custom-tests'), 'Choose how to handle custom tests.');
  const preservedTests = new Map();
  if (process.argv.includes('--preserve-custom-tests')) for (const test of custom) {
    const classId = chapters.find(chapter => chapter.id === test.chapterId).classId;
    assert(!preservedTests.has(classId), 'Multiple custom tests need manual placement.');
    preservedTests.set(classId, test);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  await mkdir(backupDir, { recursive: true });
  const accounts = await Promise.all(classes.map(async (klass, i) => {
    const password = randomBytes(12).toString('base64url');
    return { login: `demo_${klass.order}_01`, password, grade: klass.order, fullName: `[Demo] ${names[i]}`, hash: await bcrypt.hash(password, 10) };
  }));
  const credentials = JSON.stringify(accounts.map(({ hash, ...account }) => account), null, 2);
  await writeFile(path.join(backupDir, `demo-access-${stamp}.local.json`), credentials, { mode: 0o600, flag: 'wx' });
  await prisma.$transaction(async db => {
    const snapshot = {};
    for (const table of tables) snapshot[table] = await db[table].findMany();
    await writeFile(path.join(backupDir, `before-demo-reset-${stamp}.json`), JSON.stringify(snapshot, null, 2), { mode: 0o600, flag: 'wx' });
    await db.user.deleteMany({ where: { id: { in: users.filter(isDemo).map(user => user.id) } } });
    const staging = [];
    for (const [classId, test] of preservedTests) {
      const chapter = await db.chapter.create({ data: { classId, title: 'Temporary preservation', order: 100000, startTopic: 1, endTopic: 1 } });
      staging.push(chapter.id);
      await db.test.update({ where: { id: test.id }, data: { chapterId: chapter.id } });
    }
    await db.chapter.deleteMany({ where: { id: { in: chapters.map(chapter => chapter.id) } } });
    for (const [classIndex, klass] of classes.entries()) {
      for (const [groupIndex, [topic, terms]] of groups.entries()) {
        const chapter = await db.chapter.create({ data: { classId: klass.id, title: `[Demo] ${groupIndex + 1}-bap. ${topic}`, description: 'Til bilimi terminleri boyınsha úlgi materiallar.', order: groupIndex + 1, startTopic: groupIndex * 4 + 1, endTopic: groupIndex * 4 + 4 } });
        const choices = i => terms.map((_, j) => {
          const position = (j + classIndex + groupIndex) % terms.length;
          return { text: terms[position][0], isCorrect: position === i };
        });
        for (const [i, [name, definition, example]] of terms.entries()) {
          const term = await db.term.create({ data: { chapterId: chapter.id, name, definition, example, createdBy: teacher.id } });
          await db.game.create({ data: { chapterId: chapter.id, termId: term.id, type: 'MULTIPLE_CHOICE', question: `${definition} Bul qaysı termin?`, options: { create: choices(i) } } });
        }
        const existing = groupIndex === 0 ? preservedTests.get(klass.id) : undefined;
        if (existing) await db.test.update({ where: { id: existing.id }, data: { chapterId: chapter.id } });
        else await db.test.create({ data: { chapterId: chapter.id, title: `[Demo] ${topic} boyınsha test`, description: 'Baptaǵı 4 termin boyınsha 4 soraw.', createdBy: teacher.id, questions: { create: terms.map((term, i) => ({ order: i + 1, question: `${term[1]} Bul qaysı termin?`, options: { create: choices(i) } })) } } });
      }
      const account = accounts[classIndex];
      await db.user.create({ data: { login: account.login, password: account.hash, fullName: account.fullName, role: 'STUDENT', classId: klass.id } });
    }
    await db.chapter.deleteMany({ where: { id: { in: staging } } });
    const result = await db.class.findMany({ include: { chapters: { include: { _count: { select: { terms: true, tests: true, games: true } } } } } });
    for (const klass of result) {
      assert.equal(klass.chapters.length, 5);
      for (const chapter of klass.chapters) assert.deepEqual(chapter._count, { terms: 4, tests: 1, games: 4 });
    }
    for (const question of await db.testQuestion.findMany({ where: { test: { title: { startsWith: '[Demo]' } } }, include: { options: true } })) {
      assert.equal(question.options.length, 4);
      assert.equal(question.options.filter(option => option.isCorrect).length, 1);
    }
    for (const user of users.filter(user => !isDemo(user))) {
      const preserved = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      assert.equal(preserved.password, user.password);
      assert.equal(preserved.login, user.login);
    }
  }, { timeout: 120000, isolationLevel: 'Serializable' });
  await writeFile(path.join(__dirname, '../demo-access.local.json'), credentials + '\n', { mode: 0o600 });
  console.log('Verified: 25 chapters, 100 terms, 25 tests, 100 exercises, 5 demo students. Non-demo accounts preserved.');
  console.log(`Backup: backend/backups/before-demo-reset-${stamp}.json`);
}
main().catch(error => { console.error('Demo reset failed:', error.code || error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
