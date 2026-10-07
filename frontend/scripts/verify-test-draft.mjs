import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';

const source = await readFile(new URL('../src/utils/testDraft.ts', import.meta.url), 'utf8');
const storage = new Map();
const context = { exports: {}, sessionStorage: { getItem: key => storage.get(key) ?? null } };
vm.runInNewContext(stripTypeScriptTypes(source).replace(/export const /g, 'const ') + '\nexports.readTestDraft = readTestDraft; exports.testDraftKey = testDraftKey;', context);
const { readTestDraft, testDraftKey } = context.exports;
const key = testDraftKey(1, 5);
assert.notEqual(key, testDraftKey(1, 6));
assert.notEqual(key, testDraftKey(2, 5));
assert.notEqual(key, testDraftKey(1));
const read = () => JSON.parse(JSON.stringify(readTestDraft(key)));
assert.deepEqual(read(), {});
storage.set(key, '{');
assert.deepEqual(read(), {});
storage.set(key, JSON.stringify({ at: Date.now(), answers: { 1: 2, 2: '3', '-1': 4, 3: 0, 4: 1.5 } }));
assert.deepEqual(read(), { 1: 2 });
for (const at of [Date.now() - 31 * 60 * 1000, Date.now() + 60 * 1000, null]) {
  storage.set(key, JSON.stringify({ at, answers: { 1: 2 } }));
  assert.deepEqual(read(), {});
}
context.sessionStorage.getItem = () => { throw new Error('Blocked storage'); };
assert.deepEqual(read(), {});
console.log('PASS: draft validation, expiry, account/test separation and unavailable storage.');
