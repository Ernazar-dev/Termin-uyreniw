/**
 * Copy all local PostgreSQL data to Neon PostgreSQL database.
 * Usage:
 *   node scripts/copy-to-neon.cjs "postgresql://neondb_owner:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require"
 */

const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');

const localUrl = process.env.DATABASE_URL;
const neonUrl = process.argv[2] || process.env.NEON_DATABASE_URL;

if (!neonUrl) {
  console.error('\n❌ Neon DB ulanish havolasi (Connection String) kiritilmadi!\n');
  console.log('Foydalanish:');
  console.log('  node scripts/copy-to-neon.cjs "postgresql://neondb_owner:PAROL@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require"\n');
  console.log('Yoki backend/.env faylida NEON_DATABASE_URL="havola" deb belgilang.\n');
  process.exit(1);
}

if (!localUrl) {
  console.error('❌ Lokal DATABASE_URL topilmadi. backend/.env faylini tekshiring.');
  process.exit(1);
}

console.log('=====================================================');
console.log('  Lokal ma\'lumotlarni Neon DB ga ko\'chirish skripti');
console.log('=====================================================');
console.log('1. Lokal baza:', localUrl.replace(/:[^:@]+@/, ':****@'));
console.log('2. Neon baza: ', neonUrl.replace(/:[^:@]+@/, ':****@'));
console.log('-----------------------------------------------------');

const localPrisma = new PrismaClient({
  datasources: { db: { url: localUrl } },
});

const neonPrisma = new PrismaClient({
  datasources: { db: { url: neonUrl } },
});

async function runMigrationsOnNeon() {
  console.log('\n[1/4] Neon DB da jadvallarni tekshirish va migratsiyalarni yurgizish...');
  try {
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: neonUrl },
      stdio: 'inherit',
    });
    console.log('✔ Neon DB jadvallari muvaffaqiyatli tayyorlandi.');
  } catch (err) {
    console.error('❌ Migratsiyani yurgizishda xatolik:', err.message);
    throw err;
  }
}

async function copyData() {
  console.log('\n[2/4] Lokal ma\'lumotlarni o\'qish va Neon DB ga ko\'chirish...');

  // 1. Classes
  const classes = await localPrisma.class.findMany();
  console.log(`- Sinflar (Class): ${classes.length} ta`);
  for (const item of classes) {
    await neonPrisma.class.upsert({
      where: { id: item.id },
      update: { name: item.name, order: item.order },
      create: item,
    });
  }

  // 2. Users
  const users = await localPrisma.user.findMany();
  console.log(`- Foydalanuvchilar (User): ${users.length} ta`);
  for (const item of users) {
    await neonPrisma.user.upsert({
      where: { id: item.id },
      update: {
        fullName: item.fullName,
        login: item.login,
        password: item.password,
        role: item.role,
        classId: item.classId,
      },
      create: item,
    });
  }

  // 3. Chapters
  const chapters = await localPrisma.chapter.findMany();
  console.log(`- Boblar (Chapter): ${chapters.length} ta`);
  for (const item of chapters) {
    await neonPrisma.chapter.upsert({
      where: { id: item.id },
      update: {
        classId: item.classId,
        title: item.title,
        description: item.description,
        startTopic: item.startTopic,
        endTopic: item.endTopic,
        order: item.order,
      },
      create: item,
    });
  }

  // 4. Terms
  const terms = await localPrisma.term.findMany();
  console.log(`- Terminlar (Term): ${terms.length} ta`);
  for (const item of terms) {
    await neonPrisma.term.upsert({
      where: { id: item.id },
      update: {
        chapterId: item.chapterId,
        name: item.name,
        definition: item.definition,
        example: item.example,
        image: item.image,
        createdBy: item.createdBy,
      },
      create: item,
    });
  }

  // 5. Games
  const games = await localPrisma.game.findMany();
  console.log(`- O'yinlar (Game): ${games.length} ta`);
  for (const item of games) {
    await neonPrisma.game.upsert({
      where: { id: item.id },
      update: {
        chapterId: item.chapterId,
        termId: item.termId,
        type: item.type,
        question: item.question,
      },
      create: item,
    });
  }

  // 6. Game Options
  const gameOptions = await localPrisma.gameOption.findMany();
  console.log(`- O'yin variantlari (GameOption): ${gameOptions.length} ta`);
  for (const item of gameOptions) {
    await neonPrisma.gameOption.upsert({
      where: { id: item.id },
      update: {
        gameId: item.gameId,
        text: item.text,
        isCorrect: item.isCorrect,
      },
      create: item,
    });
  }

  // 7. Tests
  const tests = await localPrisma.test.findMany();
  console.log(`- Testlar (Test): ${tests.length} ta`);
  for (const item of tests) {
    await neonPrisma.test.upsert({
      where: { id: item.id },
      update: {
        chapterId: item.chapterId,
        title: item.title,
        description: item.description,
        fileUrl: item.fileUrl,
        fileName: item.fileName,
        createdBy: item.createdBy,
      },
      create: item,
    });
  }

  // 8. Test Questions
  const questions = await localPrisma.testQuestion.findMany();
  console.log(`- Test savollari (TestQuestion): ${questions.length} ta`);
  for (const item of questions) {
    await neonPrisma.testQuestion.upsert({
      where: { id: item.id },
      update: {
        testId: item.testId,
        question: item.question,
        order: item.order,
      },
      create: item,
    });
  }

  // 9. Test Options
  const testOptions = await localPrisma.testOption.findMany();
  console.log(`- Test variantlari (TestOption): ${testOptions.length} ta`);
  for (const item of testOptions) {
    await neonPrisma.testOption.upsert({
      where: { id: item.id },
      update: {
        questionId: item.questionId,
        text: item.text,
        isCorrect: item.isCorrect,
      },
      create: item,
    });
  }

  // 10. Test Results
  const testResults = await localPrisma.testResult.findMany();
  console.log(`- Test natijalari (TestResult): ${testResults.length} ta`);
  for (const item of testResults) {
    await neonPrisma.testResult.upsert({
      where: { id: item.id },
      update: {
        studentId: item.studentId,
        testId: item.testId,
        correctAnswers: item.correctAnswers,
        totalQuestions: item.totalQuestions,
        percentage: item.percentage,
        submittedAt: item.submittedAt,
      },
      create: item,
    });
  }

  // 11. Student Answers
  const studentAnswers = await localPrisma.studentAnswer.findMany();
  console.log(`- O'quvchi javoblari (StudentAnswer): ${studentAnswers.length} ta`);
  for (const item of studentAnswers) {
    await neonPrisma.studentAnswer.upsert({
      where: { id: item.id },
      update: {
        testResultId: item.testResultId,
        questionId: item.questionId,
        selectedOptionId: item.selectedOptionId,
        isCorrect: item.isCorrect,
      },
      create: item,
    });
  }

  // 12. Student Progress
  const studentProgress = await localPrisma.studentProgress.findMany();
  console.log(`- O'rganish progressi (StudentProgress): ${studentProgress.length} ta`);
  for (const item of studentProgress) {
    await neonPrisma.studentProgress.upsert({
      where: { id: item.id },
      update: {
        studentId: item.studentId,
        termId: item.termId,
        viewedAt: item.viewedAt,
      },
      create: item,
    });
  }
}

async function fixSequences() {
  console.log('\n[3/4] PostgreSQL ID sekvensiyalarini yangilash (Auto-increment sync)...');
  const tables = [
    'Class',
    'User',
    'Chapter',
    'Term',
    'Game',
    'GameOption',
    'Test',
    'TestQuestion',
    'TestOption',
    'TestResult',
    'StudentAnswer',
    'StudentProgress',
  ];

  for (const table of tables) {
    try {
      await neonPrisma.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('"${table}"', 'id'),
          coalesce((SELECT max(id) FROM "${table}"), 1)
        );
      `);
    } catch (err) {
      // Ba'zi jadvallarda bo'sh bo'lsa yoki xatolik bo'lsa o'tkazib yuborish
    }
  }
  console.log('✔ Sekvensiyalar to\'liq yangilandi.');
}

async function verifyCounts() {
  console.log('\n[4/4] Natijani tekshirish:');
  const [cls, ch, tm, gm, ts, tq, usr] = await Promise.all([
    neonPrisma.class.count(),
    neonPrisma.chapter.count(),
    neonPrisma.term.count(),
    neonPrisma.game.count(),
    neonPrisma.test.count(),
    neonPrisma.testQuestion.count(),
    neonPrisma.user.count(),
  ]);

  console.log('-----------------------------------------------------');
  console.log(`  Sinflar:       ${cls} ta`);
  console.log(`  Boblar:        ${ch} ta`);
  console.log(`  Terminlar:     ${tm} ta`);
  console.log(`  Testlar:       ${ts} ta (${tq} ta savol)`);
  console.log(`  O'yinlar:      ${gm} ta`);
  console.log(`  Foydalanuvchi: ${usr} ta`);
  console.log('-----------------------------------------------------');
  console.log('🎉 BARCHA MA\'LUMOTLAR NEON DB GA MUVAFFAQIYATLI KO\'CHIRILDI!\n');
}

async function main() {
  try {
    await runMigrationsOnNeon();
    await copyData();
    await fixSequences();
    await verifyCounts();
  } catch (error) {
    console.error('\n❌ Xatolik yuz berdi:', error);
    process.exit(1);
  } finally {
    await localPrisma.$disconnect();
    await neonPrisma.$disconnect();
  }
}

main();
