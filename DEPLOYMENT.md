# Render.com va Neon PostgreSQL Deploy Qo'llanmasi

Ushbu qo'llanma orqali **Kaa-Terms** loyihasini **Render.com** (Backend va Frontend bepul varianti) hamda **Neon.tech** (PostgreSQL Serverless bepul varianti) ga to'liq va xatosiz joylashtirishingiz mumkin.

---

## 1-qadam: Neon.tech da Baza Yaratish

1. [neon.tech](https://neon.tech) saytiga kiring va ro'yxatdan o'ting (GitHub orqali kirish mumkin).
2. Yangi proyekt yarating (masalan, `kaa-terms-db`).
3. Dashboard-da **Connection Details** bo'limida bazaga ulanish havolasi (Connection String) chiqadi:
   - Format: `postgresql://neondb_owner:PASSWORD@ep-xxxx.REGION.aws.neon.tech/neondb?sslmode=require`
4. **MUHIM:** Prisma migratsiyalari uchun **Direct connection** (unpooled) havolasini nusxalang (ya'ni host nomida `-pooler` bo'lmagan havola).
5. Ushbu havolani eslab qoling, u backendning `DATABASE_URL` parametri bo'ladi.

---

## 2-qadam: Loyihani GitHub-ga Yuklash

Agar loyihangiz hali GitHub-da bo'lmasa, quyidagi buyruqlar orqali yangi repozitoriyga yuklang:

```bash
# Loyiha asosiy papkasida (Kaa-ai1):
git init
git add .
git commit -m "feat: prepare project for Render and Neon deployment"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO_NAME.git
git push -u origin main
```

---

## 3-qadam: Render.com da Joylashtirish (2 xil usul)

Sizda 2 xil variant bor:
- **Variant A (Eng osoni):** `render.yaml` orqali 1-klik Blueprint deploy.
- **Variant B:** Render Dashboard orqali qo'lda sozlash.

---

### Variant A: Blueprint (render.yaml) orqali sozlash

1. [render.com](https://render.com) ga kiring va GitHub profilingiz bilan bog'lang.
2. Dashboard-dan **New +** -> **Blueprint** tugmasini bosing.
3. O'zingizning GitHub repozitoriyangizni tanlang.
4. Render avtomatik ravishda ildizdagi `render.yaml` faylini aniqlaydi va 2 ta servisni taklif qiladi:
   - `kaa-terms-api` (Web Service)
   - `kaa-terms-web` (Static Site)
5. So'ralgan muhit o'zgaruvchilarini to'ldiring:
   - **DATABASE_URL**: Neon-dan olingan PostgreSQL URL havolasi (`?sslmode=require` bilan).
   - **ADMIN_PASSWORD**: Administrator uchun kamida 6 belgili maxfiy parol.
   - **CLIENT_URL**: Frontend tayyor bo'lgach beriladigan frontend domeni (dastlab vaqtincha `https://kaa-terms-web.onrender.com` yoki `*` yozib turish mumkin).
   - **VITE_API_URL**: Backend manzili + `/api` (masalan, `https://kaa-terms-api.onrender.com/api`).
6. **Apply** tugmasini bosing.

---

### Variant B: Render Dashboard orqali qo'lda sozlash

#### 1. Backend Web Service:
1. Render-da **New +** -> **Web Service** ni bosing.
2. GitHub repozitoriyangizni tanlang.
3. Sozlamalarni quyidagicha belgilang:
   - **Name:** `kaa-terms-api`
   - **Region:** Neon bazangiz joylashgan hududga yaqin regionni tanlang (masalan, Frankfurt).
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run render:start`
   - **Plan:** `Free`
4. **Advanced** -> **Health Check Path:** `/health`
5. **Environment Variables** bo'limiga quyidagilarni kiriting:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = `Neon dan olingan postgresql://... connection string`
   - `JWT_SECRET` = `kamida 16 belgili tasodifiy uzun kalit`
   - `JWT_EXPIRES_IN` = `7d`
   - `CLIENT_URL` = `https://kaa-terms-web.onrender.com` (Frontend domeni)
   - `ADMIN_LOGIN` = `admin`
   - `ADMIN_PASSWORD` = `admin parolingiz (kamida 6 belgi)`
   - `AI_API_KEY` = `(agar Gemini bot ishlatsangiz, Google AI Studio API kaliti)`
   - `AI_BASE_URL` = `https://generativelanguage.googleapis.com/v1beta/openai`
   - `AI_MODEL` = `gemini-1.5-flash`
6. **Create Web Service** tugmasini bosing.

#### 2. Frontend Static Site:
1. Render-da **New +** -> **Static Site** ni bosing.
2. O'sha GitHub repozitoriyangizni tanlang.
3. Sozlamalar:
   - **Name:** `kaa-terms-web`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. **Redirects / Rewrites** bo'limiga kiring va qo'shing:
   - **Type:** `Rewrite`
   - **Source:** `/*`
   - **Destination:** `/index.html`
   *(Bu React Router sahifalarini refresh qilganda 404 xatosi chiqmasligi uchun shart!)*
5. **Environment Variables** ga qo'shing:
   - `VITE_API_URL` = `https://kaa-terms-api.onrender.com/api` (Backend servisingiz manzili + /api)
6. **Create Static Site** tugmasini bosing.

---

## 4-qadam: Boshlang'ich Ma'lumotlarni (Seed) Bazaga Kiritish

Render server ishga tushganda jadvallar (`prisma migrate deploy`) avtomatik yaratiladi va Admin hisobi avtomatik ochiladi.
Ammo 5, 6, 7, 8, 9-sinflarning tayyor darslik terminlari va testlarini kiritish uchun bir marta seed ishlatishingiz mumkin:

**Eng qulay usul (O'z kompyuteringizdan):**
1. Kompyuteringizdagi `backend/.env` faylida `DATABASE_URL` o'rniga Neon PostgreSQL havolasini qo'ying.
2. Terminalda quyidagini bajaring:
   ```bash
   cd backend
   npm run db:seed
   ```
3. Barcha sinflar, terminlar, o'yinlar va namunaviy testlar Neon bazangizga kiritiladi!

---

## 5-qadam: Render Free Tier Xususiyatlari va Eslatmalar

1. **Spin Down (Uyqu rejimi):**
   Render Free backend servisiga 15 daqiqa davomida so'rov kelmasa, u resursni tejash uchun uxlaydi. Birinchi tashrifda sayt ochilishi 30–50 soniya vaqt olishi mumkin. Frontenddagi timeout bu holatga moslab 60 soniyaga uzaytirildi.
   *Maslahat:* Agar server doim uyg'oq turishini istasangiz, [cron-job.org](https://cron-job.org) yoki [uptimerobot.com](https://uptimerobot.com) orqali har 10 daqiqada `https://kaa-terms-api.onrender.com/health` manziliga bepul ping yuborib qo'yishingiz mumkin.

2. **Uploads (Fayl va Rasmlar):**
   Render Free Web Servisida doimiy disk (Persistent Disk) berilmaydi. Shuning uchun o'qituvchilar yuklagan yangi test fayllari/rasmlar server qayta yuklanganda tozalanishi mumkin. Test savollarini tizimning o'zida yaratish (Manual test mode) tavsiya etiladi, chunki ular to'g'ridan-to'g'ri Neon bazasida xavfsiz va abadiy saqlanadi.
