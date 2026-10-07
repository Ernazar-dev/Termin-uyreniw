# Qaraqalpaq tili terminlerin úyretiw platforması

5–9-klass oqıwshıları ushın terminler, shınıǵıwlar, testler hám aqıllı járdemshi.

Bas bette tanıstırıw bólimi hám klasslar kórsetiledi. Miymanlar klasslardı, baplardı,
terminlerdi hám test sorawların kóre aladı, shınıǵıwlardı orınlay aladı.
Test nátiyjesin saqlaw hám aqıllı járdemshige soraw beriw ushın akkauntqa kiriw kerek.
Kirgennen keyin paydalanıwshı tańlaǵan shınıǵıwına qaytadı.

Interfeys telefon hám kompyuter ekranlarına beyimlesedi. Termin betinde baptaǵı
terminlerge, test betinde sorawlarǵa tikkeley ótiw múmkin.
Tekseriw esabatı: [REVIEW.md](REVIEW.md).

## Dúzilisi

- `frontend/`: React, Vite, TypeScript, Ant Design, SCSS.
- `backend/`: Node.js, Express, TypeScript, Prisma, PostgreSQL.

Backendte sorawlar `routes → controllers → services → Prisma` arqalı isleydi.
`validators/` maǵlıwmatlardı tekseredi; `middlewares/` akkauntqa kiriwdi, ruqsatlardı,
fayl júklewdi hám sorawlar sanın basqaradı. `services/ai/` aqıllı járdemshi menen isleydi.

Frontendte `api/` server menen baylanısadı, `routes/` betlerge ótiwdi basqaradı,
`components/` ulıwma komponentlerdi saqlaydı. Betler kerek bolǵanda júklenedi.
`src/locales/kaa.ts` tayın komponentlerdiń qaraqalpaqsha mátinlerin saqlaydı.
Backendtegi ulıwma tekseriw xabarları `src/config/validation-locale.ts` faylında.

## Iske túsiriw

Jergilikli tekseriw Node.js 24 penen orınlandı. PostgreSQL hám `.env` sazlamaları kerek.

### Backend

```powershell
cd backend
npm install
Copy-Item .env.example .env
# .env ishindegi baza hám akkaunt sazlamaların toltırıń.
npm run prisma:migrate
npm run prisma:generate
npm run dev
```

API ádette `http://localhost:5000/api` mánzilinde isleydi.

### Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Frontend ádette `http://localhost:5173` mánzilinde isleydi.
`VITE_API_URL` API mánzilin belgileydi: `http://localhost:5000/api` yamasa `/api`.

### Akkauntlar hám jasırın sazlamalar

- `ADMIN_LOGIN`, `ADMIN_PASSWORD`: oqıtıwshı (`TEACHER`) akkauntı.
- `DATABASE_URL`: PostgreSQL bazasına jalǵanıw mánzili.
- `JWT_SECRET`: kiriw belgisin tastıyıqlaw ushın jasırın gilt.
- `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`, `AI_FALLBACK_MODELS`: aqıllı járdemshi sazlamaları.

Server iske túsirilgende basqarıwshı akkauntın `.env` penen sáykeslestiredi:
akkaunt joq bolsa jaratadı, parol ózgerse jańalaydı. Parol bcrypt penen saqlanadı.
Oqıwshılar `/register` betinen dizimnen ótedi yamasa oqıtıwshı olardı qosadı.

Jasırın mánislerdi `frontend/.env` yamasa `VITE_*` ózgeriwshilerine jazbań:
bul ózgeriwshiler brauzerge jiberiledi. `.env` faylları Gitke qosılmaydı;
`.env.example` tek úlgi ushın berilgen.

Kiriw atı (`login`) 3–32 belgiden ibarat: latın háripleri, sanlar, noqta,
sızıqsha yamasa astınǵı sızıq. Birinshi belgi hárip yamasa san bolıwı kerek.
Kiriwde úlken hám kishi háripler ajıratılmaydı: `Ali` hám `ali` bir at dep esaplanadı.

### Bar bazanı jańalaw

```powershell
cd backend
npm run prisma:deploy
npm run prisma:generate
```

`use_login` migraciyası akkaunt belgilerin, parollardı hám nátiyjelerdi saqlaydı.
Aldınǵı elektron mánzildiń `@` belgisine shekemgi bólegi kiriw atına aylanadı.
At qaytalansa oǵan akkaunt belgisi qosıladı; jaramsız at ornına `user_<id>` qollanıladı.
Jańa kiriw atı menen aldınǵı paroldı qollanıw múmkin. Bazanı qayta toltırıw kerek emes.

### Úlgi maǵlıwmatlar

`backend` papkasında `npm run db:demo` bar jazıwlardı óshirmesten úlgi maǵlıwmatlar qosadı:
50 oqıwshı, 20 bap, 120 termin, 120 shınıǵıw, 40 test, 145 nátiyje hám 650 úyreniw jazıwı.
Qayta isletilgende bar úlgiler qaytalanbaydı. Bular interfeysi tekseriwge arnalǵan,
oqıw baǵdarlamasın tastıyıqlaytuǵın material emes.
Úlgiler `[Demo]` belgisi menen ajıratılǵan. Kiriw maǵlıwmatları Gitke qosılmaytuǵın
`backend/demo-access.local.json` faylına jazıladı.

**`npm run db:seed` bar bazanı tazalap, baslanǵısh maǵlıwmatlardı qayta jaratadı.**
Bul buyrıqtı tek usı nátiyje kerek bolǵanda isletiń.

## API

Juwap túri: `{ "success": true, "data": ... }` yamasa `{ "success": false, "message": "..." }`.

| Ámel | Mánzil | Ruqsat |
|---|---|---|
| POST | `/api/auth/login`, `/api/auth/register` | Miyman |
| GET | `/api/auth/me` | Akkauntqa kirgenler |
| GET/POST/PUT/DELETE | `/api/classes[/:id]`, `/api/chapters[/:id]`, `/api/terms[/:id]`, `/api/games[/:id]`, `/api/tests[/:id]` | Oqıw: barlıǵına; ózgertiw: oqıtıwshıǵa |
| POST | `/api/games/:id/check` | Barlıǵına |
| POST / PUT | `/api/tests/from-file`, `/api/tests/:id/from-file` | Oqıtıwshıǵa; `file`, `optionCount`, `answerKey` maydanları |
| GET | `/api/tests/:id/document` | Barlıǵına |
| POST | `/api/tests/:id/submit` | Oqıwshıǵa |
| GET | `/api/results`, `/api/results/:id` | Oqıtıwshıǵa barlıǵı, oqıwshıǵa óz nátiyjeleri |
| GET | `/api/results/student/:id` | Oqıtıwshıǵa |
| GET/POST/PUT/DELETE | `/api/students[/:id]` | Oqıtıwshıǵa |
| GET | `/api/stats/teacher`, `/api/stats/student` | Tiyisli rolge |
| POST | `/api/ai/ask` | Akkauntqa kirgenler |

Dizimler tiyisli `classId`, `chapterId`, `studentId`, `termId`, `type` súzgilerinen
paydalanadı. Terminler hám oqıwshılardı izlew ushın `search`, betlew ushın `page` hám
`pageSize` qollanıladı.

## Jumıs tártibi

- Terminniń klassı `chapter.classId` arqalı anıqlanadı. Durıs juwap `GameOption.isCorrect` maydanında saqlanadı.
- Shınıǵıwda hár sorawǵa bir ret juwap beriledi. Durıs yamasa qáte ekeni 2,2 sekund kórsetilip, keyingi soraw ashıladı. `Keyingi` túymesi menen erterek ótiw múmkin. Sońında juwaplar talqılanadı. `Qayta oynaw` juwaplardı tazalaydı. Bul nátiyje test nátiyjeleri kestesine jazılmaydı.
- Oqıwshıǵa soraw júklengende `isCorrect` maydanı jiberilmeydi. Juwaplar serverde tekseriledi.
- Tapsırılǵan testtiń sorawların, faylın hám babın almastırıw sheklengen. Atın hám túsindirmesin ózgertiw múmkin.
- Test juwapları usı brauzer betiniń saqlaw ornında 30 minutqa shekem saqlanadı. Test hám akkauntlar ushın bólek giltler qollanıladı. Miymannıń juwapları akkauntqa kirgennen keyin tiklenedi.
- Tayın PDF/Word testinde oqıtıwshı fayl júkleydi hám durıs juwaplardı belgileydi. Server A, B, C… variantların jaratadı. Bul variantlardıń tártibi aralastırılmaydı. Sorawlar menen hújjetti miymanlar da kóre aladı; nátiyjeni tapsırıw ushın oqıwshı akkauntı kerek.
- Súwretler ushın 2 MB, test hújjetleri ushın 15 MB shek qoyılǵan.
- Klass hám bap tártibi avtomat túrde belgilenedi. Termin hám shınıǵıw qosıwda «Saqlaw hám keyingisin qosıw» túymesi bar.
- Aqıllı járdemshi dáslep termindi bazadan izleydi. Tabılmasa sazlanǵan jasalma intellekt xızmetine soraw jiberedi. Gilt joq bolsa túsinikli xabar qaytaradı. Juwaplar ushın qaraqalpaq tilinde, latın jazıwında jazıw talabı berilgen.

## Tekseriw

```powershell
cd backend
npm run build
node scripts/verify-public-learning.cjs
node scripts/verify-test-history.cjs
node scripts/verify-validation.cjs
cd ../frontend
npm run build
node scripts/verify-test-draft.mjs
node scripts/verify-design.mjs
```

Brauzer tekseriwi Windows sisteması hám standart orında ornatılǵan Chrome brauzerinen
paydalanadı. Súwretler `frontend/artifacts/` papkasına saqlanadı. Ádettegi tekseriwler
jasalma juwaplardan paydalanadı, haqıyqıy bazanı ózgertpeydi.

Úlgi maǵlıwmatlar menen islewshi backend iske túsirilgen bolsa,
`node scripts/verify-design.mjs --live` arqalı qosımsha tekseriw múmkin.
