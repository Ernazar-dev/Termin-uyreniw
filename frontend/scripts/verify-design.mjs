// Isolated browser smoke check: fixture responses never touch either project's database.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, extname, resolve, dirname, basename } from 'node:path';
import assert from 'node:assert/strict';
import JSZip from 'jszip';

const zip = new JSZip();
zip.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
zip.file('word/document.xml', '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Fonetika test hujjeti</w:t></w:r></w:p><w:p><w:r><w:t>1. Til seslerin uyrenetugin taraw?</w:t></w:r></w:p><w:p><w:r><w:t>A. Fonetika   B. Sintaksis</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>2. Sinonim misali</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>');
const docxFixture = await zip.generateAsync({ type: 'nodebuffer' });
const stream = 'BT /F1 20 Tf 40 760 Td (Fonetika PDF test) Tj 0 -40 Td /F1 12 Tf (1. A. Fonetika   B. Sintaksis) Tj ET';
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
];
let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((object, i) => { offsets.push(Buffer.byteLength(pdf)); pdf += `${i + 1} 0 obj\n${object}\nendobj\n`; });
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

const root = resolve(import.meta.dirname, '..');
const output = join(root, 'artifacts');
const live = process.argv.includes('--live');
let liveToken;
if (live) {
  const accounts = JSON.parse(await readFile(join(root, '../backend/demo-access.local.json'), 'utf8'));
  const { login, password } = accounts[0];
  const response = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login, password }) });
  assert.equal(response.status, 200, 'Demo student login');
  liveToken = (await response.json()).data.token;
}
await mkdir(output, { recursive: true });
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/fixtures/test.docx') { res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); res.end(docxFixture); return; }
  if (path === '/fixtures/test.pdf') { res.setHeader('Content-Type', 'application/pdf'); res.end(pdf); return; }
  const file = path.startsWith('/assets/') ? join(root, 'dist', path) : join(root, 'dist/index.html');
  try {
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html' })[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
const profile = await mkdtemp(join(tmpdir(), 'kaa-design-'));
const browser = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' });
let ws;
const pause = ms => new Promise(done => setTimeout(done, ms));
try {
  let port;
  for (let i = 0; i < 100; i++) {
    try { port = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; } catch { await pause(100); }
  }
  assert(port, 'Chrome did not start');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise(done => ws.addEventListener('open', done, { once: true }));
  let id = 0;
  const pending = new Map();
  const errors = [];
  const send = (method, params = {}) => new Promise((done, reject) => {
    const key = ++id;
    pending.set(key, { done, reject });
    ws.send(JSON.stringify({ id: key, method, params }));
  });
  ws.addEventListener('message', async event => {
    const msg = JSON.parse(event.data);
    if (msg.id) {
      const task = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) task?.reject(new Error(msg.error.message)); else task?.done(msg.result);
    }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text);
    if (msg.method === 'Fetch.requestPaused') {
      const { requestId, request } = msg.params;
      const url = new URL(request.url);
      if (url.origin === origin) return void send('Fetch.continueRequest', { requestId });
      if (live) {
        if (request.method === 'OPTIONS') {
          await send('Fetch.fulfillRequest', { requestId, responseCode: 204, responseHeaders: [{ name: 'Access-Control-Allow-Origin', value: '*' }, { name: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' }] });
          return;
        }
        const response = await fetch(`http://localhost:5000${url.pathname}${url.search}`, { method: request.method, headers: { Authorization: `Bearer ${liveToken}`, 'Content-Type': 'application/json' }, ...(request.postData ? { body: request.postData } : {}) });
        await send('Fetch.fulfillRequest', { requestId, responseCode: response.status, responseHeaders: [{ name: 'Content-Type', value: response.headers.get('content-type') || 'application/octet-stream' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(await response.arrayBuffer()).toString('base64') });
        return;
      }
      let data = [];
      const chapter = { id: 1, title: 'Leksikologiya', class: { id: 5, name: '5-klass' } };
      if (url.pathname.endsWith('/auth/me')) data = { id: 42, fullName: 'Test Oqıwshı', login: 'fixture', role: Object.values(request.headers).includes('Bearer fixture-teacher') ? 'TEACHER' : 'STUDENT', classId: 5 };
      if (/\/tests\/1$/.test(url.pathname)) data = { id: 1, title: 'Sinonimler testi', chapter, fileUrl: null, questions: [1, 2, 3].map(id => ({ id, question: `${id}. Sinonimdi tabıń`, options: [{ id: id * 10, text: 'Sulıw' }, { id: id * 10 + 1, text: 'Úlken' }] })) };
      if (/\/tests\/(20|21|22)$/.test(url.pathname)) {
        const id = Number(url.pathname.split('/').pop());
        const extension = id === 20 ? 'docx' : id === 21 ? 'pdf' : 'doc';
        data = { id, title: 'Faylli test', chapter, fileUrl: `${origin}/fixtures/test.${extension}`, fileName: `test.${extension}`, questions: [1, 2].map(id => ({ id, question: `${id}-soraw`, options: [{ id: id * 10, text: 'A' }, { id: id * 10 + 1, text: 'B' }] })) };
      }
      if (url.pathname.endsWith('/tests/22/document')) data = { text: 'Eski Word test hujjeti\n1. A. Fonetika B. Sintaksis' };
      if (/\/terms\/[12]$/.test(url.pathname)) data = { id: Number(url.pathname.split('/').pop()), name: 'Sinonim', definition: 'Mánisi jaqın sózler.', example: 'Sulıw — gózzal', image: null, chapterId: 1, chapter, siblings: [{ id: 1, name: 'Sinonim' }, { id: 2, name: 'Antonim' }] };
      if (url.pathname.endsWith('/classes')) data = [5, 6, 7, 8, 9].map(n => ({ id: n, name: `${n}-klass`, _count: { chapters: n - 1 } }));
      if (url.pathname.endsWith('/terms')) data = { items: [], total: 0, page: 1, pageSize: 12 };
      if (url.pathname.endsWith('/terms') && url.searchParams.get('chapterId') === '1') {
        const page = Number(url.searchParams.get('page') || 1);
        const pageSize = Number(url.searchParams.get('pageSize') || 24);
        data = { page, pageSize, total: 101, items: Array.from({ length: Math.min(pageSize, 101 - (page - 1) * pageSize) }, (_, index) => ({ id: (page - 1) * pageSize + index + 1, name: `Termin ${(page - 1) * pageSize + index + 1}`, definition: 'Mánisi jaqın sózler.', chapter, image: null })) };
      }
      if (url.pathname.endsWith('/chapters/1')) data = { ...chapter, classId: 5, startTopic: 1, endTopic: 5, _count: { terms: 101, games: 0, tests: 0 }, tests: [] };
      if (url.pathname.endsWith('/chapters')) data = [{ id: 1, title: 'Leksikologiya', class: { id: 5, name: '5-klass' }, _count: { games: 2, terms: 3, tests: 1 } }];
      if (url.pathname.endsWith('/tests')) data = [{ id: 1, title: 'Sinonimler testi', chapter: { title: 'Leksikologiya', class: { name: '5-klass' } }, _count: { questions: 2 }, lastResult: null }];
      if (url.pathname.endsWith('/games')) data = [
        { id: 1, type: 'MULTIPLE_CHOICE', question: 'Sulıw sóziniń sinonimin tabıń', chapter: { title: 'Leksikologiya', class: { name: '5-klass' } }, options: [{ id: 1, text: 'Gózzal' }, { id: 2, text: 'Úlken' }] },
        { id: 2, type: 'FILL_BLANK', question: '___ — qarama-qarsı mánili sózler.', chapter: { title: 'Leksikologiya', class: { name: '5-klass' } }, options: [{ id: 3, text: 'Antonim' }, { id: 4, text: 'Sinonim' }] },
      ];
      if (url.pathname.endsWith('/check') && request.method === 'POST') {
        const correctOptionId = url.pathname.includes('/games/1/') ? 1 : 3;
        data = { isCorrect: JSON.parse(request.postData).optionId === correctOptionId, correctOptionId };
      }
      await send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [
        { name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Headers', value: 'Authorization, Content-Type' },
      ], body: Buffer.from(JSON.stringify({ success: true, data })).toString('base64') });
    }
  });
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Fetch.enable', { patterns: [{ urlPattern: '*' }] });
  const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;
  const until = async expression => {
    for (let i = 0; i < 80; i++) { if (await evaluate(expression)) return; await pause(100); }
    throw new Error(`Timed out: ${expression}`);
  };
  const screenshot = async name => {
    await pause(400);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await writeFile(join(output, name), Buffer.from(shot.data, 'base64'));
  };
  if (live) {
    await send('Page.navigate', { url: origin });
    await until("!!document.getElementById('learning-title')");
    await evaluate("localStorage.setItem('kaa_terms_token', 'live-demo')");
    for (const width of [1920, 1200, 390, 320]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height: width < 500 ? 844 : 1000, deviceScaleFactor: 1, mobile: false });
      for (const [route, ready] of [
        ['classes', "document.body.innerText.includes('5-klass')"],
        ['terms', "document.querySelectorAll('.ant-card').length >= 12"],
        ['games', "document.querySelectorAll('main .ant-card').length >= 4"],
        ['tests', "document.querySelectorAll('main .ant-card').length >= 8"],
        ['ai', "!!document.querySelector('textarea')"],
        ['dashboard', "!!document.getElementById('learning-title')"],
      ]) {
        await send('Page.navigate', { url: `${origin}/student/${route}` });
        await until(ready);
        const fits = await evaluate("document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth");
        if (!fits) {
          await screenshot(`overflow-${route}-${width}.png`);
          console.log(await evaluate("[...document.querySelectorAll('main *')].filter(el => el.getBoundingClientRect().right > innerWidth).map(el => ({tag: el.tagName, cls: el.className})).slice(0, 12)"));
        }
        assert(fits, `${route} overflow ${width}`);
        if (['games', 'tests'].includes(route) && width >= 1200) assert(await evaluate("document.querySelector('main .ant-select').getBoundingClientRect().width <= 280"), 'Compact class filter');
        if (route === 'ai' && width >= 1200) assert(await evaluate("document.querySelector('main .ant-card').getBoundingClientRect().width <= 960"), 'Compact AI panel');
        if (width >= 1200) assert(await evaluate("(() => { const nav = document.querySelector('header nav').getBoundingClientRect(); const brand = document.querySelector('header a[href=\"/\"]').getBoundingClientRect(); return brand.right <= nav.left && Math.abs((nav.left + nav.right) / 2 - innerWidth / 2) < 3; })()"), 'Centered navigation without overlap');
        await screenshot(`filled-${route}-${width}.png`);
      }
    }
    console.log('PASS: populated database, demo login, classes / terms / games / tests / AI / dashboard at 1920, 1200, 390, 320px.');
  } else {
  for (const width of [1920, 1440, 1024, 768, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: origin });
    await until("document.body.innerText.includes('5-klass')");
    assert.equal(await evaluate('location.pathname'), '/');
    assert(await evaluate("!!document.getElementById('learning-title')"), 'Guests see the landing hero');
    assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), `Page overflow at ${width}`);
    if (width >= 1440) assert(await evaluate("document.querySelector('main > div').getBoundingClientRect().width > innerWidth - 40"), 'Desktop content should use available width');
    if (width >= 1440) assert(await evaluate("document.querySelector('header a[href=\"/login\"]').getBoundingClientRect().left > innerWidth * 2 / 3 && document.querySelector('header a[href=\"/\"]').getBoundingClientRect().left < innerWidth / 3"), 'Brand left, account right');
    await screenshot(`landing-${width}.png`);
    if (width === 390) {
      await evaluate("document.querySelector('button[aria-label=\"Menyunı ashıw\"]').click()");
      await until("!!document.querySelector('.ant-drawer-open')");
      await screenshot('mobile-menu.png');
    }
  }
  await send('Page.navigate', { url: `${origin}/student/tests` });
  await until("document.body.innerText.includes('Sinonimler testi')");
  assert.equal(await evaluate('location.pathname'), '/student/tests');
  const startTest = "[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Baslaw').click()";
  await evaluate(startTest);
  await until("location.pathname === '/student/tests/1' && !!document.querySelector('button[role=radio]')");
  await evaluate("document.querySelector('button[role=radio]').click()");
  const submitTest = "[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Testti tapsırıw').click()";
  await evaluate(submitTest);
  await until("!!document.querySelector('.ant-modal-confirm')");
  assert.equal(await evaluate('location.pathname'), '/student/tests/1');
  await screenshot('test-signin-prompt.png');
  await evaluate("[...document.querySelectorAll('.ant-modal button')].find(b => b.textContent.trim() === 'Házir emes').click()");
  await until("!document.querySelector('.ant-modal-confirm')");
  assert.equal(await evaluate('location.pathname'), '/student/tests/1');
  await evaluate(submitTest);
  await until("!!document.querySelector('.ant-modal-confirm')");
  await evaluate("document.querySelector('.ant-modal .ant-btn-primary').click()");
  await until("location.pathname === '/login'");
  assert.equal(await evaluate('history.state.usr.from'), '/student/tests/1');
  await until("!!document.querySelector('input[type=password]')");
  assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Login overflow');
  await screenshot('login-mobile.png');
  await send('Page.navigate', { url: `${origin}/student/tests/1` });
  await until("!!document.querySelector('button[role=radio][aria-checked=true]')");
  assert.equal(await evaluate('location.pathname'), '/student/tests/1');
  await send('Page.navigate', { url: `${origin}/student/ai` });
  await until("!!document.querySelector('textarea')");
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Sinonim degen ne?')).click()");
  await until("!!document.querySelector('.ant-modal-confirm')");
  await send('Page.navigate', { url: `${origin}/student/classes` });
  await until("document.body.innerText.includes('5-klass')");
  assert(await evaluate("!document.getElementById('learning-title')"), 'Classes remain separate from landing');
  await send('Page.navigate', { url: `${origin}/student/games` });
  await until("document.body.innerText.includes('Leksikologiya')");
  assert.equal(await evaluate('location.pathname'), '/student/games');
  await evaluate(startTest);
  await until("document.body.innerText.includes('Sulıw sóziniń sinonimin tabıń')");
  assert.equal(await evaluate('location.pathname'), '/student/games/1');
  await screenshot('guest-game.png');
  const nextPractice = "[...document.querySelectorAll('main button')].find(b => b.textContent.includes('Keyingi') || b.textContent.includes('Nátiyjeni kóriw'))";
  assert(await evaluate(`${nextPractice}.disabled`), 'Cannot skip an unanswered game');
  await evaluate("document.querySelectorAll('button[role=radio]')[1].click()");
  await until("!!document.querySelector('.ant-alert-error')");
  assert(await evaluate("[...document.querySelectorAll('button[role=radio]')].every(b => b.disabled)"), 'Wrong answer locks all options');
  assert(await evaluate("![...document.querySelectorAll('button')].some(b => b.textContent === 'Qaytadan')"), 'No retry on the same question');
  await until("document.body.innerText.includes('Shınıǵıw 2 / 2')");
  await evaluate("document.querySelector('button[role=radio]').click()");
  await until("document.body.innerText.includes('2 sorawdan 1 durıs, 1 qáte.')");
  await screenshot('practice-result-mobile.png');
  await evaluate("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Qayta oynaw')).click()");
  await until("document.body.innerText.includes('Shınıǵıw 1 / 2')");
  assert(await evaluate(`${nextPractice}.disabled`), 'Replay clears previous answers');
  await evaluate("document.querySelector('button[role=radio]').click()");
  await until("!!document.querySelector('.ant-alert-success')");
  await evaluate(`${nextPractice}.click()`);
  await until("document.body.innerText.includes('Shınıǵıw 2 / 2')");
  assert(await evaluate(`${nextPractice}.disabled`), 'Manual Next does not carry over an answer');
  await evaluate("document.querySelector('button[role=radio]').click()");
  await until("document.body.innerText.includes('2 sorawdan 2 durıs, 0 qáte.')");
  await send('Page.navigate', { url: `${origin}/student/chapters/1` });
  await until("!!document.querySelector('.ant-pagination-item-5')");
  await evaluate("document.querySelector('.ant-pagination-item-5').click()");
  await until("document.body.innerText.includes('Termin 101')");

  for (const width of [1920, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const id of [20, 21, 22]) {
      await send('Page.navigate', { url: `${origin}/student/tests/${id}` });
      if (id === 20) await until("document.querySelector('iframe')?.srcdoc.includes('Fonetika test hujjeti')");
      if (id === 21) await until("!!document.querySelector('canvas') && getComputedStyle(document.querySelector('canvas')).display !== 'none'");
      if (id === 22) await until("document.body.innerText.includes('Eski Word test hujjeti')");
      assert(await evaluate("![...document.querySelectorAll('a,button')].some(el => /Júklep alıw|Fayldı ashıw|Jańa betde/.test(el.textContent))"), 'No open/download buttons');
      assert(await evaluate("document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth"), 'Document layout fits');
      await screenshot(`document-${id}-${width}.png`);
    }
  }

  await evaluate("localStorage.setItem('kaa_terms_token', 'fixture-student')");
  for (const width of [1920, 1200, 390, 320]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${origin}/student/tests/1` });
    await until("!!document.querySelector('nav[aria-label=\"Test sorawları\"]')");
    assert(await evaluate("document.querySelector('header').scrollWidth <= innerWidth"), `Student header overflow ${width}`);
    await evaluate("document.querySelector('nav[aria-label=\"Test sorawları\"] button:nth-child(2)').click()");
    await until("document.body.innerText.includes('Soraw 2 / 3')");
    assert(await evaluate("document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth"), `Test content overflow ${width}`);
    await screenshot(`test-workspace-${width}.png`);
    await send('Page.navigate', { url: `${origin}/student/terms/1` });
    await until("!!document.querySelector('nav[aria-label=\"Baptaǵı terminler\"]')");
    assert(await evaluate("document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth"), `Term content overflow ${width}`);
    await screenshot(`term-workspace-${width}.png`);
    await evaluate("document.querySelector('main').scrollTop = 300; document.querySelector('nav[aria-label=\"Baptaǵı terminler\"] a:last-child').click()");
    await until("location.pathname === '/student/terms/2'");
    await until("document.querySelector('main').scrollTop === 0");
  }
  await evaluate("sessionStorage.clear()");
  await send('Page.navigate', { url: `${origin}/student/tests/1` });
  await until("!!document.querySelector('button[role=radio]')");
  await evaluate("document.querySelector('button[role=radio]').click()");
  await until("JSON.parse(sessionStorage.getItem('test-draft:1:42') || '{}').answers?.[1] === 10");
  await send('Page.reload');
  await until("!!document.querySelector('button[role=radio][aria-checked=true]')");
  await evaluate("history.pushState({}, '', '/student/tests/20'); dispatchEvent(new PopStateEvent('popstate'))");
  await until("document.body.innerText.includes('Faylli test')");
  assert.equal(await evaluate("document.querySelectorAll('input[type=radio]:checked').length"), 0, 'Switching tests clears answers even when question IDs overlap');
  await evaluate("history.pushState({}, '', '/student/tests/1'); dispatchEvent(new PopStateEvent('popstate'))");
  await until("!!document.querySelector('button[role=radio][aria-checked=true]')");
  await send('Page.navigate', { url: `${origin}/student/chapters/1` });
  await until("!!document.querySelector('.ant-pagination-next')");
  assert.equal(await evaluate("document.querySelector('.ant-pagination-next').title"), 'Keyingi bet');
  console.log('PASS: answer restoration, test switching and Karakalpak pagination.');
  await evaluate("localStorage.setItem('kaa_terms_token', 'fixture-teacher')");
  for (const width of [1920, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${origin}/teacher/terms` });
    await until("!!document.querySelector('.ant-table')");
    assert(await evaluate("document.querySelector('main').scrollWidth <= document.querySelector('main').clientWidth"), `Teacher content overflow ${width}`);
    await screenshot(`teacher-terms-${width}.png`);
  }
  }
  assert.deepEqual(errors, [], 'Browser runtime errors');
  if (!live) console.log('PASS: 1920 / 1440 / 1024 / 768 / 390 / 320px layouts; mobile menu; public catalogs; sign-in return path; guest game; authenticated test navigation; term sidebar; route scroll reset; no runtime errors.');
  console.log(`Screenshots: ${output}`);
  await send('Browser.close');
} finally {
  ws?.close();
  browser.kill();
  server.close();
  await pause(500);
  assert.equal(dirname(resolve(profile)), resolve(tmpdir()));
  assert(basename(profile).startsWith('kaa-design-'));
  await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
