require('dotenv').config({ quiet: true });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomBytes } = require('node:crypto');
const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const prisma = new PrismaClient();
const students = [
  ['Azamat Allambergenov', 'azamat', 5],
  ['Aydana Jumabaeva', 'aydana', 6],
  ['Nurlan Ernazarov', 'nurlan', 7],
  ['Gúlnara Turemuratova', 'gulnara', 8],
  ['Dáwlet Bekmuratov', 'dawlet', 9],
  ['Aysulu Saparova', 'aysulu', 5],
];

async function main() {
  const classes = await prisma.class.findMany();
  const accounts = await Promise.all(students.map(async ([fullName, login, grade]) => {
    const klass = classes.find(item => item.order === grade);
    assert(klass, `Missing class ${grade}`);
    const password = randomBytes(9).toString('base64url');
    return { fullName, login, password, className: klass.name, classId: klass.id, hash: await bcrypt.hash(password, 10) };
  }));
  const collision = await prisma.user.findFirst({ where: { OR: accounts.map(account => ({ login: { equals: account.login, mode: 'insensitive' } })) }, select: { id: true } });
  assert(!collision, 'A requested login already exists; no accounts added.');
  const directory = path.resolve(__dirname, '../backups');
  await mkdir(directory, { recursive: true });
  const accessFile = path.join(directory, `student-access-${new Date().toISOString().replace(/[:.]/g, '-')}.local.json`);
  await writeFile(accessFile, JSON.stringify(accounts.map(({ hash, classId, ...account }) => account), null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  await prisma.$transaction(async db => {
    const before = await db.user.count({ where: { role: 'STUDENT' } });
    for (const account of accounts) {
      const created = await db.user.create({ data: { fullName: account.fullName, login: account.login, password: account.hash, role: 'STUDENT', classId: account.classId } });
      assert(await bcrypt.compare(account.password, created.password));
      assert.equal(created.classId, account.classId);
    }
    assert.equal(await db.user.count({ where: { role: 'STUDENT' } }), before + 6);
  }, { isolationLevel: 'Serializable', timeout: 30000 });
  console.log(JSON.stringify(accounts.map(({ fullName, login, className }) => ({ fullName, login, className })), null, 2));
  console.log(`Credentials: ${accessFile}`);
  console.log(`Total students: ${await prisma.user.count({ where: { role: 'STUDENT' } })}`);
}
main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
