require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const { mkdir, writeFile, access } = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const books = require('./textbook-content.cjs');
const prisma = new PrismaClient();
const models = ['class', 'user', 'chapter', 'term', 'game', 'gameOption', 'test', 'testQuestion', 'testOption', 'testResult', 'studentAnswer', 'studentProgress'];

async function main() {
  for (const book of books) {
    await access(path.join(__dirname, '../../kitap', book.file));
    assert.equal(book.chapters.length, 6);
    const names = new Set();
    for (const chapter of book.chapters) {
      assert(chapter.startTopic <= chapter.endTopic);
      assert(chapter.title.length < 130);
      assert.equal(chapter.terms.length, 4);
      for (const [name, definition, example, page] of chapter.terms) {
        assert(!names.has(name), `Duplicate term: ${name}`);
        names.add(name);
        assert(name && definition && example && Number.isInteger(page) && page > 0);
        assert(name.length >= 2 && name.length <= 150);
        assert(definition.length >= 5 && definition.length < 900);
        assert(example.length < 1900);
        assert(!/[\u0400-\u04ff\u00ad\u200b]/.test(name + definition + example));
      }
    }
  }
  console.log('Plan: 5-klass and 6-klass, 6 chapters each, 4 terms and 1 four-question test per chapter.');
  if (!process.argv.includes('--apply')) return;
  const backupDirectory = path.join(__dirname, '../backups');
  await mkdir(backupDirectory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summary = [];
  await prisma.$transaction(async db => {
    const teacher = await db.user.findFirst({ where: { role: 'TEACHER' }, orderBy: { id: 'asc' } });
    assert(teacher, 'Teacher account missing.');
    const snapshot = {};
    for (const model of models) snapshot[model] = await db[model].findMany({ orderBy: { id: 'asc' } });
    const classIds = [];
    for (const book of books) {
      const klass = snapshot.class.find(item => item.order === book.grade);
      assert(klass, `Missing class: ${book.grade}`);
      classIds.push(klass.id);
      assert(!snapshot.chapter.some(chapter => chapter.classId === klass.id), `Class ${book.grade} already has chapters; import stopped to avoid duplicates or overwriting.`);
    }
    await writeFile(path.join(backupDirectory, `before-textbooks-${stamp}.json`), JSON.stringify(snapshot, null, 2), { flag: 'wx', mode: 0o600 });
    for (const book of books) {
      const klass = snapshot.class.find(item => item.order === book.grade);
      for (const [index, item] of book.chapters.entries()) {
        const chapter = await db.chapter.create({ data: {
          classId: klass.id, title: `${index + 1}-bap. ${item.title}`, order: index + 1,
          startTopic: item.startTopic, endTopic: item.endTopic,
          description: `${book.source}\n§${item.startTopic}–${item.endTopic} materialları tiykarında temalıq topar. Túsiniw qıyınıraq 4 termin, ápiwayı túsindirme hám mısallar.`,
        } });
        for (const [name, definition, example, page] of item.terms) {
          await db.term.create({ data: { chapterId: chapter.id, name, definition, example: `${example}\nDerek: ${book.grade}-klass sabaqlıǵı, ${page}-bet.`, createdBy: teacher.id } });
        }
        await db.test.create({ data: {
          chapterId: chapter.id, title: `${item.title} boyınsha test`, createdBy: teacher.id,
          description: 'Baptaǵı 4 terminniń mánisin ajıratıwǵa arnalǵan 4 soraw. Hár sorawda bir durıs juwap bar.',
          questions: { create: item.terms.map((term, questionIndex) => ({
            order: questionIndex + 1, question: `${term[1]}\nBul qaysı termin?`,
            options: { create: item.terms.map((_, optionIndex) => {
              const selected = (optionIndex + index + book.grade) % item.terms.length;
              return { text: item.terms[selected][0], isCorrect: selected === questionIndex };
            }) },
          })) },
        } });
      }
      const inserted = await db.chapter.findMany({ where: { classId: klass.id }, orderBy: { order: 'asc' }, include: { terms: true, tests: { include: { questions: { include: { options: true } } } } } });
      assert.equal(inserted.length, 6);
      for (const chapter of inserted) {
        assert.equal(chapter.terms.length, 4);
        assert.equal(chapter.tests.length, 1);
        assert.equal(chapter.tests[0].questions.length, 4);
        for (const question of chapter.tests[0].questions) {
          assert.equal(question.options.length, 4);
          assert.equal(question.options.filter(option => option.isCorrect).length, 1);
          assert.equal(new Set(question.options.map(option => option.text)).size, 4);
        }
      }
      summary.push({ class: klass.name, chapters: inserted.length, terms: inserted.flatMap(chapter => chapter.terms).length, tests: inserted.flatMap(chapter => chapter.tests).length });
    }
    assert.deepEqual(await db.user.findMany({ orderBy: { id: 'asc' } }), snapshot.user);
    assert.deepEqual(await db.class.findMany({ orderBy: { id: 'asc' } }), snapshot.class);
    assert.deepEqual(await db.chapter.findMany({ where: { classId: { notIn: classIds } }, orderBy: { id: 'asc' } }), snapshot.chapter.filter(chapter => !classIds.includes(chapter.classId)));
    for (const model of ['game', 'gameOption', 'testResult', 'studentAnswer', 'studentProgress']) {
      assert.deepEqual(await db[model].findMany({ orderBy: { id: 'asc' } }), snapshot[model]);
    }
    assert.equal(await db.term.count(), snapshot.term.length + 48);
    assert.equal(await db.test.count(), snapshot.test.length + 12);
  }, { timeout: 120000, isolationLevel: 'Serializable' });
  const report = ['# Kitoblardan tanlangan terminlar', '', 'Har klass uchun 6 tematik bo‘lim; har bo‘limda 4 termin va 4 savolli 1 test. Bo‘limlar kitobdagi paragraflardan guruhlangan. Sahifalar kitobda bosilgan raqamlardir.', ''];
  for (const book of books) {
    report.push(`## ${book.grade}-klass`, '', book.source, '', '| Bo‘lim | Paragraflar | Termin | Sahifa |', '| --- | --- | --- | --- |');
    for (const chapter of book.chapters) for (const [name, , , page] of chapter.terms) report.push(`| ${chapter.title} | ${chapter.startTopic}–${chapter.endTopic} | ${name} | ${page} |`);
    report.push('');
  }
  await writeFile(path.join(__dirname, '../../kitap/tanlangan-terminler.md'), report.join('\n'));
  console.log(JSON.stringify(summary, null, 2));
  console.log('Verified: 48 terms, 12 tests, 48 questions. Accounts and other classes unchanged.');
}
main().catch(error => { console.error('Textbook import failed:', error.code || error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
