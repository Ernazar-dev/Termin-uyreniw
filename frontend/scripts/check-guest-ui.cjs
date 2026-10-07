const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Uses a separate headless browser started with --remote-debugging-port=9234.
(async () => {
  const target = await fetch('http://localhost:9234/json/new?about:blank', { method: 'PUT' }).then((r) => r.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0;
  const pending = new Map();
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      clearTimeout(timer);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`${method} timed out`)); }, 15000);
    pending.set(requestId, { resolve, reject, timer });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error('Browser evaluation failed');
    return result.result.value;
  };
  const waitFor = async (expression) => {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (await evaluate(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error(`UI condition timed out: ${expression}`);
  };
  const navigate = async (route, selector) => {
    await send('Page.navigate', { url: `http://localhost:5173${route}` });
    await waitFor(`Boolean(document.querySelector(${JSON.stringify(selector)}))`);
    await evaluate('document.fonts.ready.then(() => true)');
  };
  try {
    await send('Page.enable');
    for (const [width, height] of [[1366, 768], [390, 844], [320, 568]]) {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
      await navigate('/', 'a[href="/register"]');
      await waitFor('location.pathname === "/student/classes" && document.querySelectorAll(".ant-card").length >= 5');
      assert.equal(await evaluate('document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1'), true, `Guest page overflow ${width}`);
      assert.equal(await evaluate('Boolean(document.querySelector("header a[href=\'/login\']"))'), true);
      if (width === 1366) {
        const shot = await send('Page.captureScreenshot');
        fs.writeFileSync(path.join(os.tmpdir(), 'kaa-guest-desktop.png'), Buffer.from(shot.data, 'base64'));
      }
      await navigate('/login', 'input[name="login"], input[id="login"]');
      assert.equal(await evaluate('document.documentElement.scrollHeight <= innerHeight + 1 && document.querySelector("main").scrollHeight <= document.querySelector("main").clientHeight + 1'), true, `Login overflow ${width}`);
      assert.equal(await evaluate('document.querySelectorAll("aside").length'), 0);
      await navigate('/register', 'input[id="confirmPassword"]');
      assert.equal(await evaluate('document.documentElement.scrollHeight <= innerHeight + 1'), true, `Register document overflow ${width}`);
      await navigate('/student/tests', 'input[id="login"]');
      assert.equal(await evaluate('location.pathname'), '/login');
      assert.equal(await evaluate('history.state.usr.from'), '/student/tests');
      await evaluate('document.querySelector("a[href=\'/register\']").click()');
      await waitFor('location.pathname === "/register"');
      assert.equal(await evaluate('history.state.usr.from'), '/student/tests');
      await navigate('/student/games/1', 'input[id="login"]');
      assert.equal(await evaluate('history.state.usr.from'), '/student/games/1');
      console.log(`PASS ${width}x${height}: public entry, account buttons, compact login, protected activity redirects and return path.`);
    }
  } finally {
    await send('Page.close').catch(() => {});
    socket.close();
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
