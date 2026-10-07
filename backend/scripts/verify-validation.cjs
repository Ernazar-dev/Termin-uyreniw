const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://fixture:fixture@127.0.0.1:1/unused';
process.env.JWT_SECRET = 'local-validation-fixture-only';
const { testSchema, fileTestSchema } = require('../dist/validators/test.validator');
const { paginationQuerySchema, optionalText } = require('../dist/validators/common.validator');
const { prisma } = require('../dist/config/prisma');
const { testService } = require('../dist/services/test.service');

(async () => {
  for (const [schema, value] of [[testSchema, {}], [fileTestSchema, { optionCount: 99 }], [paginationQuerySchema, { page: 'bad' }], [optionalText(2), 'long']]) {
    const result = schema.safeParse(value);
    assert.equal(result.success, false);
    for (const issue of result.error.issues) {
      assert(!/Required|Expected|Invalid|String must|Number must|Array must/.test(issue.message), issue.message);
    }
  }
  let writes = 0;
  prisma.test.findUnique = async () => ({ questions: [{ id: 1, options: [{ id: 2, isCorrect: true }] }] });
  prisma.testResult.create = async () => { writes++; throw new Error('Unexpected write'); };
  for (const answers of [
    [{ questionId: 1, optionId: 2 }, { questionId: 1, optionId: 2 }],
    [{ questionId: 99, optionId: null }],
    [{ questionId: 1, optionId: 99 }],
  ]) {
    await assert.rejects(() => testService.submit(1, 1, { answers }), error => error.statusCode === 400);
  }
  assert.equal(writes, 0);
  console.log('PASS: localized validation and invalid answer rejection; no database writes.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
