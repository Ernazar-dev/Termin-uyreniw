/**
 * Rebuilds the learning content from scratch from the verified textbook data (scripts/textbook-content.cjs).
 *
 * Keeps: classes, users (admin and students), everything outside chapters.
 * Replaces: every chapter with its terms, games and tests (test results and term progress go with them).
 * Creates per class (5 and 6): 6 chapters, each with 4 terms, 4 games and one 4-question test.
 *
 *   node scripts/rebuild-content.cjs           dry run, prints the plan
 *   node scripts/rebuild-content.cjs --apply   backs up the database to backups/, then rebuilds
 *
 * The target database is whatever DATABASE_URL points to.
 */
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const books = require('./textbook-content.cjs');

const prisma = new PrismaClient();
const TABLES = ['class', 'user', 'chapter', 'term', 'game', 'gameOption', 'test', 'testQuestion', 'testOption', 'testResult', 'studentAnswer', 'studentProgress'];
const BLANK = '___';

// Wording taken directly from the textbook page for terms whose earlier explanation was only a paraphrase.
const DEFINITION_FIXES = {
  'Jıynaqlaw san': 'Zatlardı jıynaqlap, sanamalap kórsetetuǵın sanlıq. Neshew? sorawına juwap beredi. 1 menen 7 niń arasındaǵı sanaq sanlarǵa -aw/-ew qosımtaları jalǵanıp jasaladı.',
  'Shamalıq san': 'Zattıń sanın, muǵdarın shamalap kórsetetuǵın sanlıq. Qansha? nesheden? qanshadan? sorawlarına juwap beredi.',
  'Toplaw san': 'Zatlardı san jaǵınan toplap kórsetetuǵın sanlıq. Nesheden? qanshadan? neshewlep? qanshalap? sorawlarına juwap beredi hám dara yamasa jup sóz túrinde qollanıladı.',
};
const EXAMPLE_FIXES = {
  'Jıynaqlaw san': 'birew, ekew, úshew, tórtew, altaw, jetew. «Onıń balaları besew, úshewi mektepte oqıydı.»',
  'Shamalıq san': 'onlaǵan oqıwshı, jigirmalaǵan qız, saat beslerde, jasi otızlarda.',
  'Toplaw san': '«Hárqaysımızdıń eki-ekiden etigimiz bar.» «Ekewimiz bes tonnadan dán aldıq.»',
};

const termsOf = chapter => chapter.terms.map(([name, definition, example, page]) => ({
  name,
  definition: DEFINITION_FIXES[name] || definition,
  example: EXAMPLE_FIXES[name] || example,
  page,
}));

/** Correct answer moves between positions so it is not always "A". */
const withCorrect = (items, correctIndex, offset) =>
  items.map((_, k) => items[(k + offset) % items.length]).map(item => ({ item, isCorrect: item === items[correctIndex] }));

function validate() {
  for (const book of books) {
    assert.equal(book.chapters.length, 6);
    const seen = new Set();
    for (const chapter of book.chapters) {
      assert.equal(chapter.terms.length, 4);
      for (const term of termsOf(chapter)) {
        assert(!seen.has(term.name), `Duplicate term ${term.name}`);
        seen.add(term.name);
        assert(term.definition.length >= 5 && term.definition.length <= 500, term.name);
        assert(Number.isInteger(term.page) && term.page > 0);
      }
    }
  }
}

async function main() {
  validate();
  const host = (process.env.DATABASE_URL || '').replace(/^.*@/, '').replace(/[/?].*$/, '');
  console.log(`Target database host: ${host}`);
  console.log('Plan: classes 5 and 6 → 6 chapters, 24 terms, 24 games, 6 tests (24 questions) each.');
  if (!process.argv.includes('--apply')) return;

  const teacher = await prisma.user.findFirst({ where: { role: 'TEACHER' }, orderBy: { id: 'asc' } });
  assert(teacher, 'Teacher account missing');
  const classes = await prisma.class.findMany();

  const snapshot = {};
  for (const table of TABLES) snapshot[table] = await prisma[table].findMany({ orderBy: { id: 'asc' } });
  const dir = path.join(__dirname, '../backups');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `before-rebuild-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  await writeFile(file, JSON.stringify(snapshot, null, 2), { flag: 'wx', mode: 0o600 });
  console.log(`Backup written: ${path.relative(path.join(__dirname, '..'), file)}`);

  await prisma.$transaction(async db => {
    await db.chapter.deleteMany();
    for (const book of books) {
      const klass = classes.find(item => item.order === book.grade);
      assert(klass, `Missing class ${book.grade}`);
      for (const [index, source] of book.chapters.entries()) {
        const terms = termsOf(source);
        const chapter = await db.chapter.create({ data: {
          classId: klass.id,
          title: `${index + 1}-bap. ${source.title}`,
          order: index + 1,
          startTopic: source.startTopic,
          endTopic: source.endTopic,
          description: `${book.grade}-klass sabaqlıǵınıń §${source.startTopic}–${source.endTopic} temaları boyınsha tiykarǵı terminler.`,
        } });

        const created = [];
        for (const term of terms) {
          created.push(await db.term.create({ data: {
            chapterId: chapter.id,
            name: term.name,
            definition: term.definition,
            example: `${term.example}\nDerek: ${book.grade}-klass sabaqlıǵı, ${term.page}-bet.`,
            createdBy: teacher.id,
          } }));
        }

        // Games: two "term → explanation" multiple-choice and two "explanation → term" fill-in-the-blank
        for (const [i, term] of terms.entries()) {
          const offset = (i + index + book.grade) % 4;
          if (i % 2 === 0) {
            await db.game.create({ data: {
              chapterId: chapter.id, termId: created[i].id, type: 'MULTIPLE_CHOICE',
              question: `«${term.name}» termini qaysı túsindirmege sáykes keledi?`,
              options: { create: withCorrect(terms, i, offset).map(({ item, isCorrect }) => ({ text: item.definition, isCorrect })) },
            } });
          } else {
            await db.game.create({ data: {
              chapterId: chapter.id, termId: created[i].id, type: 'FILL_BLANK',
              question: `${term.definition}\nBul túsindirme ${BLANK} terminine tiyisli.`,
              options: { create: withCorrect(terms, i, offset).map(({ item, isCorrect }) => ({ text: item.name, isCorrect })) },
            } });
          }
        }

        await db.test.create({ data: {
          chapterId: chapter.id,
          title: `${source.title} boyınsha test`,
          description: 'Baptaǵı 4 terminniń mánisin ajıratıwǵa arnalǵan 4 soraw. Hár sorawda bir durıs juwap bar.',
          createdBy: teacher.id,
          questions: { create: terms.map((term, q) => ({
            order: q + 1,
            question: `${term.definition}\nBul qaysı termin?`,
            options: { create: withCorrect(terms, q, (q + index + book.grade + 1) % 4).map(({ item, isCorrect }) => ({ text: item.name, isCorrect })) },
          })) },
        } });
      }
    }

    // Verification inside the transaction: any failed assertion rolls everything back
    assert.equal(await db.chapter.count(), 12);
    assert.equal(await db.term.count(), 48);
    assert.equal(await db.game.count(), 48);
    assert.equal(await db.test.count(), 12);
    assert.deepEqual(await db.user.findMany({ orderBy: { id: 'asc' } }), snapshot.user);
    assert.deepEqual(await db.class.findMany({ orderBy: { id: 'asc' } }), snapshot.class);
    for (const game of await db.game.findMany({ include: { options: true } })) {
      assert.equal(game.options.length, 4);
      assert.equal(game.options.filter(option => option.isCorrect).length, 1);
      assert.equal(new Set(game.options.map(option => option.text)).size, 4);
      if (game.type === 'FILL_BLANK') assert(game.question.includes(BLANK));
    }
    for (const question of await db.testQuestion.findMany({ include: { options: true } })) {
      assert.equal(question.options.length, 4);
      assert.equal(question.options.filter(option => option.isCorrect).length, 1);
    }
  }, { timeout: 120000 });

  console.log('Done: 12 chapters, 48 terms, 48 games, 12 tests (48 questions). Users and classes unchanged.');
}

main()
  .catch(error => { console.error('Rebuild failed:', error.code || error.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
