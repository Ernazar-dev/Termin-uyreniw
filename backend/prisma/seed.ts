import bcrypt from 'bcryptjs';
import { GameType, PrismaClient, Role } from '@prisma/client';
import { getSeedEnv } from '../src/config/seed-env';

const prisma = new PrismaClient();

interface SeedTerm {
  name: string;
  definition: string;
  example?: string;
}

interface SeedChapter {
  title: string;
  startTopic: number;
  endTopic: number;
  terms: SeedTerm[];
}

const CLASSES: { order: number; chapters: SeedChapter[] }[] = [
  {
    order: 5,
    chapters: [
      {
        title: '1-bap. Fonetika',
        startTopic: 1,
        endTopic: 10,
        terms: [
          { name: 'Fonetika', definition: 'Til sesleriniń payda bolıwın, dúzilisin hám ózgerislerin úyrenetuǵın til biliminiń tarawı.', example: 'Fonetikada «a», «o», «b» sıyaqlı sesler úyreniledi.' },
          { name: 'Dawıslı ses', definition: 'Hawa awız boslıǵınan hesh qanday tosqınlıqqa ushıramay shıǵatuǵın, dawıstan ǵana turatuǵın ses.', example: 'a, á, e, ı, i, o, ó, u, ú — dawıslı sesler.' },
          { name: 'Dawıssız ses', definition: 'Hawa awız boslıǵında tosqınlıqqa ushırap, shawqım arqalı payda bolatuǵın ses.', example: 'b, d, k, l, m, s — dawıssız sesler.' },
          { name: 'Buwın', definition: 'Sózdiń bir dem menen aytılatuǵın bólegi. Hár bir buwında bir dawıslı ses boladı.', example: 'Kitap — ki-tap (eki buwın).' },
          { name: 'Pát', definition: 'Sózdegi bir buwınnıń basqa buwınlarǵa qaraǵanda kúshlirek aytılıwı.', example: 'Qaraqalpaq tilinde pát kóbinese sońǵı buwınǵa túsedi: balalar.' },
        ],
      },
      {
        title: '2-bap. Leksika',
        startTopic: 11,
        endTopic: 20,
        terms: [
          { name: 'Leksika', definition: 'Tildegi barlıq sózlerdiń jıyındısı hám olardı úyrenetuǵın til biliminiń tarawı.', example: 'Qaraqalpaq tiliniń leksikası júdá bay.' },
          { name: 'Sinonim', definition: 'Aytılıwı hár qıylı, biraq mánisi birdey yamasa jaqın sózler.', example: 'Batır — qaharman, ádemi — sulıw.' },
          { name: 'Antonim', definition: 'Bir-birine qarama-qarsı mánidegi sózler.', example: 'Úlken — kishi, issı — suwıq, kún — tún.' },
          { name: 'Omonim', definition: 'Aytılıwı hám jazılıwı birdey, biraq mánileri hár qıylı sózler.', example: 'Ay (aspandaǵı) — ay (jıldıń on ekiden biri).' },
        ],
      },
      {
        title: '3-bap. Morfologiya',
        startTopic: 21,
        endTopic: 30,
        terms: [
          { name: 'Morfologiya', definition: 'Sózlerdiń dúzilisin, sóz shaqapların hám olardıń ózgeriwin úyrenetuǵın grammatikanıń bólimi.' },
          { name: 'Atlıq', definition: 'Zattıń atın bildirip, kim? ne? degen sorawlarǵa juwap beretuǵın sóz shaqabı.', example: 'Mektep, oqıwshı, kitap, Ámiwdárya.' },
          { name: 'Kelbetlik', definition: 'Zattıń belgisin, sapasın bildirip, qanday? qay? degen sorawlarǵa juwap beretuǵın sóz shaqabı.', example: 'Aq qaǵaz, biyik terek, aqıllı bala.' },
          { name: 'Feyil', definition: 'Is-háreketti bildirip, ne isledi? ne qıladı? degen sorawlarǵa juwap beretuǵın sóz shaqabı.', example: 'Oqıdı, jazadı, keledi.' },
        ],
      },
    ],
  },
  {
    order: 6,
    chapters: [
      {
        title: '1-bap. Sóz quramı',
        startTopic: 1,
        endTopic: 12,
        terms: [
          { name: 'Túbir', definition: 'Sózdiń bólinbeytuǵın, tiykarǵı leksikalıq mánini bildiretuǵın bólegi.', example: 'Oqıwshılar — túbiri «oqı».' },
          { name: 'Qosımta', definition: 'Túbirge jalǵanıp, jańa sóz yamasa sózdiń jańa formasın jasaytuǵın bólek.', example: 'Bala-lar, mektep-ke.' },
        ],
      },
    ],
  },
  {
    order: 7,
    chapters: [
      {
        title: '1-bap. Sóz shaqapları',
        startTopic: 1,
        endTopic: 10,
        terms: [
          { name: 'Almasıq', definition: 'Atlıq, kelbetlik yamasa sanlıqtıń ornına qollanılatuǵın sóz shaqabı.', example: 'Men, sen, ol, bul, kim.' },
          { name: 'Ráwish', definition: 'Is-hárekettiń qalay, qashan, qayda islengenin bildiretuǵın sóz shaqabı.', example: 'Tez júgirdi, erte turdı.' },
        ],
      },
    ],
  },
  {
    order: 8,
    chapters: [
      {
        title: '1-bap. Sintaksis',
        startTopic: 1,
        endTopic: 10,
        terms: [
          { name: 'Sintaksis', definition: 'Sóz dizbekleri menen gáplerdiń dúzilisin úyrenetuǵın grammatikanıń bólimi.' },
          { name: 'Baslawısh', definition: 'Gáptiń kim? ne? degen sorawlarǵa juwap beretuǵın bas aǵzası.', example: 'Oqıwshı kitap oqıdı. (Baslawısh — oqıwshı)' },
          { name: 'Bayanlawısh', definition: 'Baslawıshtıń is-háreketin yamasa belgisin bildiretuǵın gáptiń bas aǵzası.', example: 'Oqıwshı kitap oqıdı. (Bayanlawısh — oqıdı)' },
        ],
      },
    ],
  },
  {
    order: 9,
    chapters: [
      {
        title: '1-bap. Qospa gáp',
        startTopic: 1,
        endTopic: 10,
        terms: [
          { name: 'Qospa gáp', definition: 'Eki yamasa onnan da kóp ápiwayı gáptiń mánilik hám grammatikalıq jaqtan birigiwinen dúzilgen gáp.', example: 'Kún shıqtı, hawa jıllı boldı.' },
        ],
      },
    ],
  },
];

const option = (text: string, isCorrect = false) => ({ text, isCorrect });

const clearDatabase = async () => {
  await prisma.$transaction([
    prisma.studentAnswer.deleteMany(),
    prisma.testResult.deleteMany(),
    prisma.testOption.deleteMany(),
    prisma.testQuestion.deleteMany(),
    prisma.test.deleteMany(),
    prisma.gameOption.deleteMany(),
    prisma.game.deleteMany(),
    prisma.studentProgress.deleteMany(),
    prisma.term.deleteMany(),
    prisma.chapter.deleteMany(),
    prisma.user.deleteMany(),
    prisma.class.deleteMany(),
  ]);
};

async function main() {
  const credentials = getSeedEnv();
  await clearDatabase();

  const teacher = await prisma.user.create({
    data: {
      fullName: 'Administrator',
      login: credentials.ADMIN_LOGIN,
      password: await bcrypt.hash(credentials.ADMIN_PASSWORD, 10),
      role: Role.TEACHER,
    },
  });

  const termIds = new Map<string, number>();
  const chapterIds = new Map<string, number>();

  for (const { order, chapters } of CLASSES) {
    const created = await prisma.class.create({ data: { name: `${order}-klass`, order } });

    for (const [index, chapter] of chapters.entries()) {
      const createdChapter = await prisma.chapter.create({
        data: {
          classId: created.id,
          title: chapter.title,
          description: `${chapter.startTopic}–${chapter.endTopic}-temalarda ushırasatuǵın terminler`,
          startTopic: chapter.startTopic,
          endTopic: chapter.endTopic,
          order: index + 1,
        },
      });
      chapterIds.set(`${order}:${index + 1}`, createdChapter.id);

      for (const term of chapter.terms) {
        const createdTerm = await prisma.term.create({
          data: { ...term, chapterId: createdChapter.id, createdBy: teacher.id },
        });
        termIds.set(term.name, createdTerm.id);
      }
    }
  }

  const phoneticsId = chapterIds.get('5:1')!;
  const lexicsId = chapterIds.get('5:2')!;

  const games = [
    {
      chapterId: phoneticsId,
      termId: termIds.get('Buwın'),
      type: GameType.MULTIPLE_CHOICE,
      question: 'Buwın degen ne?',
      options: [
        option('Sózdiń bir dem menen aytılatuǵın bólegi', true),
        option('Gáptiń bas aǵzası'),
        option('Zattıń atın bildiretuǵın sóz'),
        option('Hárip'),
      ],
    },
    {
      chapterId: phoneticsId,
      termId: termIds.get('Dawıslı ses'),
      type: GameType.FILL_BLANK,
      question: '___ — hawa awız boslıǵınan tosqınlıqsız shıǵatuǵın ses.',
      options: [option('Dawıslı ses', true), option('Dawıssız ses'), option('Buwın'), option('Pát')],
    },
    {
      chapterId: lexicsId,
      termId: termIds.get('Antonim'),
      type: GameType.MULTIPLE_CHOICE,
      question: 'Qaysı juplıq antonimge mısal boladı?',
      options: [option('Úlken — kishi', true), option('Batır — qaharman'), option('Ay — ay'), option('Kitap — dápter')],
    },
    {
      chapterId: lexicsId,
      termId: termIds.get('Sinonim'),
      type: GameType.FILL_BLANK,
      question: '___ — aytılıwı hár qıylı, biraq mánisi jaqın sózler.',
      options: [option('Sinonim', true), option('Antonim'), option('Omonim'), option('Leksika')],
    },
  ];

  for (const { options, ...game } of games) {
    await prisma.game.create({ data: { ...game, options: { create: options } } });
  }

  await prisma.test.create({
    data: {
      chapterId: phoneticsId,
      title: 'Fonetika boyınsha test',
      description: '1-bap terminleri boyınsha bilimińizdi tekserip kóriń',
      createdBy: teacher.id,
      questions: {
        create: [
          { question: 'Til sesleriniń payda bolıwın úyrenetuǵın taraw qalay ataladı?', options: [option('Fonetika', true), option('Leksika'), option('Morfologiya'), option('Sintaksis')] },
          { question: 'Qaysı ses dawıslı ses?', options: [option('o', true), option('b'), option('k'), option('s')] },
          { question: '«Kitap» sózinde neshe buwın bar?', options: [option('Eki', true), option('Bir'), option('Úsh'), option('Tórt')] },
          { question: 'Sózdegi bir buwınnıń kúshlirek aytılıwı ne dep ataladı?', options: [option('Pát', true), option('Buwın'), option('Ses'), option('Qosımta')] },
          { question: 'Hawa tosqınlıqqa ushırap shıǵatuǵın ses qalay ataladı?', options: [option('Dawıssız ses', true), option('Dawıslı ses'), option('Pát'), option('Buwın')] },
        ].map((question, index) => ({ question: question.question, order: index + 1, options: { create: question.options } })),
      },
    },
  });

  await prisma.test.create({
    data: {
      chapterId: lexicsId,
      title: 'Leksika boyınsha test',
      description: '2-bap terminleri boyınsha test',
      createdBy: teacher.id,
      questions: {
        create: [
          { question: 'Mánisi jaqın sózler qalay ataladı?', options: [option('Sinonim', true), option('Antonim'), option('Omonim'), option('Atlıq')] },
          { question: '«Kún — tún» qanday sózler?', options: [option('Antonim', true), option('Sinonim'), option('Omonim'), option('Feyil')] },
          { question: 'Aytılıwı birdey, mánisi hár qıylı sózler?', options: [option('Omonim', true), option('Sinonim'), option('Antonim'), option('Almasıq')] },
        ].map((question, index) => ({ question: question.question, order: index + 1, options: { create: question.options } })),
      },
    },
  });

  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error(error instanceof Error && error.message.startsWith('Invalid seed configuration:')
      ? error.message
      : 'Seed failed. Check database access and seed configuration.');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
