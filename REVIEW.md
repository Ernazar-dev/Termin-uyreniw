# Joybardı tekseriw — 2026-10-07

## Dúzetilgenler

- Ant Design komponentleri ushın qaraqalpaqsha til sazlaması qosıldı: betlew, kesteler, tańlaw, tastıyıqlaw, fayl júklew, bos dizimler hám forma xabarları.
- Zod tekseriwiniń ádette inglisshe shıǵatuǵın xabarları qaraqalpaqshalastırıldı.
- «AI Kómekshi», «Login», «Ixtiyariy» sıyaqlı interfeys mátinleri sáykes túrde «Aqıllı járdemshi», «Kiriw atı», «Májbúriy emes» dep ózgertildi. Parolǵa baylanıslı imla qáteleri dúzetildi.
- README hám usı esabat qaraqalpaq tilinde jazıldı. Fayl testlerin miymanlar kóre alıwı haqqında eskirgen túsindirme dúzetildi.
- Test, oyın yamasa bap almastırılǵanda aldınǵı bettiń juwapları hám bet nomeri jańasına ótip ketpeytuǵın etildi.
- Test juwapları bet jańalanǵanda tiklenedi. Saqlaw giltleri test hám akkaunt boyınsha ajıratıldı; eskirgen, jaramsız hám keleshektegi waqıt belgisi bar jazıwlar qabıllanbaydı.
- Testtegi házirgi sorawlarǵa sáykes kelmeytuǵın saqlanǵan juwaplar orınlanıw kórsetkishine qosılmaydı hám serverge jiberilmeydi.
- Server qaytalanǵan soraw juwapların hám testke tiyisli emes sorawlardı qabıllamaydı.
- `/api` sıyaqlı salıstırmalı API mánzili berilgende frontendtiń ashılmay qalıw qátesi dúzetildi.
- Bet belgisi bar `favicon.svg` faylına baylanıstırıldı.
- Eski Word `.doc` hújjetlerin oqıw ushın jetispegen `/api/tests/:id/document` jolı qosıldı. Jol, basqarıwshı funkciya hám hújjet oqıw xızmeti birgelikte tekserildi; sınawda fayl oqıw úlgi juwap penen almastırıldı.

## Tekseriw qamtıwı

Frontend hám backendtiń TypeScript tekseriwleri, tarqatıw ushın jıynawları;
miymanǵa ashıq bólimler hám akkaunt talap etiletuǵın ámeller;
tapsırılǵan test tariyxınıń saqlanıwı; qáte juwaplardı qabıllamaw;
saqlanǵan juwaplardıń múddeti, túri hám akkaunt boyınsha ajıratılıwı tekserildi.

Brauzer tekseriwi 320, 390, 768, 1024, 1440 hám 1920 piksel ekranlardı,
mobil menyudi, kataloglardı, kiriwden keyin qaytıwdı, oyın juwapların,
test sorawları arasında ótiwdi, terminler dizimin hám bettiń joqarıǵa qaytıwın qamtıydı.
Qosımsha tekseriwler test juwabınıń bet jańalanǵanda tikleniwin, testler arasında
aralaspawın hám betlew túymesiniń qaraqalpaqsha atın tekseredi.

Qayta isletiw buyrıqları [README.md](README.md#tekseriw) faylında.
Brauzer súwretleri `frontend/artifacts/` papkasında.

## Tekseriw shegaraları

Avtomat tekseriwler haqıyqıy PostgreSQL bazasına jazbaydı. Bul jumısta haqıyqıy bazada
maǵlıwmat jaratıw, ózgertiw, óshiriw hám migraciyalardı orınlaw sınalmadı.
Sırtqı jasalma intellekt xızmetine soraw jiberilmedi. Onıń hár juwabınıń til sapasına
avtomat túrde kepillik berilmeydi. Bazadaǵı oqıw materialları hám paydalanıwshılar
júklegen PDF/Word hújjetleriniń ishindegi mátinler ózgertilmedi.
