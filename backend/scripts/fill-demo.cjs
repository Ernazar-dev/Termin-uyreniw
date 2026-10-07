// Additive, repeatable UI demonstration data. Never runs the destructive seed.
require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('node:crypto');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');
const prisma = new PrismaClient();
const accessFile = path.join(__dirname, '../demo-access.local.json');
const groups = [
  ['Fonetika', [
    ['Fonetika', 'Til seslerin úyrenetuǵın til biliminiń tarawı.', 'Dawıslı hám dawıssız sesler úyreniledi.'],
    ['Dawıslı ses', 'Hawa awız boslıǵınan tosqınlıqsız shıǵatuǵın ses.', 'a, o, e — dawıslı sesler.'],
    ['Dawıssız ses', 'Hawa tosqınlıqqa ushırap payda bolatuǵın ses.', 'b, k, s — dawıssız sesler.'],
    ['Buwın', 'Sózdiń bir dem menen aytılatuǵın bólegi.', 'Ki-tap: eki buwın.'],
    ['Pát', 'Sózdegi bir buwınnıń kúshlirek aytılıwı.', 'Sózdi aytqanda pátke itibar beriń.'],
    ['Hárip', 'Jazıwda sesti bildiretuǵın belgi.', 'A, B, D — háripler.'],
  ]],
  ['Leksika', [
    ['Leksika', 'Tildegi barlıq sózlerdiń jıyındısı.', 'Tilimizdiń sózlik baylıǵı.'],
    ['Sinonim', 'Aytılıwı hár qıylı, mánisi jaqın sózler.', 'Sulıw — gózzal.'],
    ['Antonim', 'Qarama-qarsı mánili sózler.', 'Úlken — kishi.'],
    ['Omonim', 'Jazılıwı birdey, mánisi hár qıylı sózler.', 'Ay: aspan denesi; ay: waqıt birligi.'],
    ['Termin', 'Belgili bir tarawǵa tiyisli túsinikti bildiretuǵın sóz.', 'Fonetika — til bilimi termini.'],
    ['Frazeologizm', 'Bir pútin máni bildiretuǵın turaqlı sóz dizbegi.', 'Turaqlı dizbektiń mánisi bir pútin boladı.'],
  ]],
  ['Morfologiya', [
    ['Atlıq', 'Zattıń atın bildiretuǵın sóz shaqabı.', 'Kitap, mektep, oqıwshı.'],
    ['Kelbetlik', 'Zattıń belgisin bildiretuǵın sóz shaqabı.', 'Aq qaǵaz, biyik terek.'],
    ['Sanlıq', 'Zattıń sanın yamasa tártip sanın bildiretuǵın sóz shaqabı.', 'Bes kitap, birinshi sabaq.'],
    ['Almasıq', 'Basqa sóz shaqaplarınıń ornına qollanılatuǵın sóz.', 'Men, sen, ol.'],
    ['Feyil', 'Is-háreketti bildiretuǵın sóz shaqabı.', 'Oqıdı, jazadı.'],
    ['Ráwish', 'Is-hárekettiń belgisin bildiretuǵın sóz shaqabı.', 'Tez júgirdi, erte turdı.'],
  ]],
  ['Sintaksis', [
    ['Sintaksis', 'Sóz dizbekleri hám gáplerdiń dúzilisin úyrenetuǵın bólim.', 'Gáptiń aǵzaların anıqlaw.'],
    ['Baslawısh', 'Gáptiń kim? ne? sorawlarına juwap beretuǵın bas aǵzası.', 'Oqıwshı kitap oqıdı: oqıwshı.'],
    ['Bayanlawısh', 'Baslawıshtıń is-háreketin yamasa belgisin bildiretuǵın bas aǵza.', 'Oqıwshı kitap oqıdı: oqıdı.'],
    ['Sóz dizbegi', 'Mánilik hám grammatikalıq jaqtan baylanısqan sózler.', 'Qızıqlı kitap.'],
    ['Ápiwayı gáp', 'Bir grammatikalıq tiykarǵa iye gáp.', 'Bala kitap oqıdı.'],
    ['Qospa gáp', 'Eki yamasa birneshe ápiwayı gápten dúzilgen gáp.', 'Kún shıqtı, hawa jıllı boldı.'],
  ]],
];
const firstNames = ['Azamat', 'Aydana', 'Nurlan', 'Gúlnara', 'Dáwlet', 'Aysulu', 'Jasur', 'Malika', 'Timur', 'Zarina'];
const lastNames = ['Allambergenov', 'Jumabaeva', 'Ernazarov', 'Turemuratova', 'Bekmuratov', 'Saparova', 'Nazarov', 'Qurbanova', 'Ótemuratov', 'Seytova'];
async function counts(db) {
  const names = ['class', 'chapter', 'term', 'game', 'test', 'user', 'testResult', 'studentProgress'];
  return Object.fromEntries(await Promise.all(names.map(async name => [name, await db[name].count()])));
}
async function main() {
  console.log('Before:', JSON.stringify(await counts(prisma)));
  if (!process.argv.includes('--apply')) return;
  const credentials = [];
  let previous = [];
  try { previous = JSON.parse(await readFile(accessFile, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const hashByLogin = new Map();
  for (let grade = 5; grade <= 9; grade++) for (let i = 0; i < 10; i++) {
    const login = `demo_${grade}_${String(i + 1).padStart(2, '0')}`;
    if (!(await prisma.user.findFirst({ where: { login: { equals: login, mode: 'insensitive' } }, select: { id: true } }))) {
      const password = randomBytes(12).toString('base64url');
      credentials.push({ login, password, grade });
      hashByLogin.set(login, await bcrypt.hash(password, 10));
    }
  }
  // Save generated access information before inserting accounts so it survives interruption.
  await writeFile(accessFile, JSON.stringify([...previous.filter(row => !hashByLogin.has(row.login)), ...credentials], null, 2) + '\n', { mode: 0o600 });
  await prisma.$transaction(async db => {
    for (let grade = 5; grade <= 9; grade++) {
      let klass = await db.class.findFirst({ where: { name: `${grade}-klass` } });
      if (!klass) {
        const last = await db.class.aggregate({ _max: { order: true } });
        const occupied = await db.class.findUnique({ where: { order: grade } });
        klass = await db.class.create({ data: { name: `${grade}-klass`, order: occupied ? (last._max.order || 0) + 1 : grade } });
      }
      const terms = [], tests = [];
      for (const [groupIndex, [topic, entries]] of groups.entries()) {
        const title = `[Demo] ${topic}`;
        let chapter = await db.chapter.findFirst({ where: { classId: klass.id, title } });
        if (!chapter) {
          const last = await db.chapter.aggregate({ where: { classId: klass.id }, _max: { order: true } });
          chapter = await db.chapter.create({ data: { classId: klass.id, title, description: 'Interfeysti sınaw ushın úlgi materiallar.', startTopic: groupIndex * 6 + 1, endTopic: groupIndex * 6 + 6, order: (last._max.order || 0) + 1 } });
        }
        for (const [i, [name, definition, example]] of entries.entries()) {
          let term = await db.term.findFirst({ where: { chapterId: chapter.id, name } });
          if (!term) term = await db.term.create({ data: { chapterId: chapter.id, name, definition, example } });
          terms.push(term);
          const question = i % 2 ? `___ — ${definition[0].toLowerCase()}${definition.slice(1)}` : `«${name}» termininiń mánisin tabıń.`;
          if (!(await db.game.findFirst({ where: { chapterId: chapter.id, question } }))) {
            const choices = Array.from({ length: 4 }, (_, offset) => entries[(i + offset) % entries.length]);
            await db.game.create({ data: { chapterId: chapter.id, termId: term.id, type: i % 2 ? 'FILL_BLANK' : 'MULTIPLE_CHOICE', question, options: { create: choices.map((entry, j) => ({ text: entry[i % 2 ? 0 : 1], isCorrect: j === 0 })) } } });
          }
        }
        for (let variant = 1; variant <= 2; variant++) {
          const title = `[Demo] ${topic} — ${variant}-variant`;
          let test = await db.test.findFirst({ where: { chapterId: chapter.id, title }, include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } } });
          if (!test) test = await db.test.create({ data: { chapterId: chapter.id, title, description: '6 soraw. Terminler boyınsha bilimińizdi tekseriń.', questions: { create: entries.map((entry, i) => ({ order: i + 1, question: variant === 1 ? `«${entry[0]}» degen ne?` : `${entry[1]} Bul qaysı termin?`, options: { create: Array.from({ length: 4 }, (_, j) => ({ text: entries[(i + j) % entries.length][variant === 1 ? 1 : 0], isCorrect: j === 0 })) } })) } }, include: { questions: { include: { options: true }, orderBy: { order: 'asc' } } } });
          tests.push(test);
        }
      }
      for (let i = 0; i < 10; i++) {
        const login = `demo_${grade}_${String(i + 1).padStart(2, '0')}`;
        let student = await db.user.findFirst({ where: { login: { equals: login, mode: 'insensitive' } } });
        if (!student) student = await db.user.create({ data: { login, fullName: `[Demo] ${firstNames[i]} ${lastNames[i]}`, password: hashByLogin.get(login), classId: klass.id, role: 'STUDENT' } });
        // Never attach generated results to an unrelated account that happens to share a login.
        if (student.role !== 'STUDENT' || student.classId !== klass.id || !student.fullName.startsWith('[Demo] ')) continue;
        for (const term of terms.slice(0, 4 + i * 2)) await db.studentProgress.upsert({ where: { studentId_termId: { studentId: student.id, termId: term.id } }, create: { studentId: student.id, termId: term.id }, update: {} });
        for (const [testIndex, test] of tests.slice(0, 2 + i % 3).entries()) {
          if (await db.testResult.findFirst({ where: { studentId: student.id, testId: test.id } })) continue;
          const answers = test.questions.map((question, n) => {
            const selected = question.options.find(option => option.isCorrect === ((n + i) % 4 !== 0)) || question.options[0];
            return { questionId: question.id, selectedOptionId: selected.id, isCorrect: selected.isCorrect };
          });
          const correctAnswers = answers.filter(answer => answer.isCorrect).length;
          await db.testResult.create({ data: { studentId: student.id, testId: test.id, totalQuestions: answers.length, correctAnswers, percentage: Math.round(correctAnswers / answers.length * 10000) / 100, submittedAt: new Date(Date.now() - ((i + testIndex) % 14) * 86400000), answers: { create: answers } } });
        }
      }
    }
  }, { timeout: 120000 });
  console.log('After:', JSON.stringify(await counts(prisma)));
  console.log('Demo access saved to backend/demo-access.local.json. Existing records preserved.');
}
main().catch(error => { console.error('Demo fill failed:', error.code || error.name); process.exitCode = 1; }).finally(() => prisma.$disconnect());
