const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

// Run the actual migration against a temporary table, never real accounts.
const migration = fs.readFileSync(path.join(__dirname, 'migrations/20261006120000_use_login/migration.sql'), 'utf8')
  .replaceAll('"User"', '"login_migration_check"')
  .replaceAll('"User_email_key"', '"login_check_email_key"')
  .replaceAll('"User_login_key"', '"login_check_login_key"');
const sql = `
CREATE TEMP TABLE "login_migration_check" (id INTEGER PRIMARY KEY, email TEXT, password TEXT);
CREATE UNIQUE INDEX "login_check_email_key" ON "login_migration_check"(email);
INSERT INTO "login_migration_check" VALUES
  (1, ' Alice@example.test ', 'unchanged'),
  (2, 'alice@second.test', 'unchanged'),
  (3, 'alice_2@third.test', 'unchanged'),
  (4, '!@fourth.test', 'unchanged'),
  (5, 'a@fifth.test', 'unchanged'),
  (6, repeat('b', 50) || '@sixth.test', 'unchanged');
${migration}
DO $$ BEGIN
  IF (SELECT count(*) FROM "login_migration_check") <> 6 THEN RAISE EXCEPTION 'Account count changed'; END IF;
  IF EXISTS (SELECT 1 FROM "login_migration_check" WHERE password <> 'unchanged') THEN RAISE EXCEPTION 'Password changed'; END IF;
  IF EXISTS (SELECT 1 FROM "login_migration_check" WHERE login !~ '^[a-z0-9][a-z0-9._-]{2,31}$') THEN RAISE EXCEPTION 'Invalid login'; END IF;
  IF (SELECT login FROM "login_migration_check" WHERE id = 1) <> 'alice' THEN RAISE EXCEPTION 'Normalization failed'; END IF;
  IF (SELECT login FROM "login_migration_check" WHERE id = 2) <> 'alice_2' THEN RAISE EXCEPTION 'Collision failed'; END IF;
  IF (SELECT login FROM "login_migration_check" WHERE id = 3) <> 'alice_2_3' THEN RAISE EXCEPTION 'Nested collision failed'; END IF;
  IF (SELECT login FROM "login_migration_check" WHERE id = 4) <> 'user_4' THEN RAISE EXCEPTION 'Fallback failed'; END IF;
END $$;
`;
const prismaCli = path.join(path.dirname(require.resolve('prisma/package.json')), 'build/index.js');
const result = spawnSync(process.execPath, [prismaCli, 'db', 'execute', '--stdin', '--schema', 'prisma/schema.prisma'], {
  cwd: path.join(__dirname, '..'), input: sql, encoding: 'utf8', windowsHide: true,
});
if (result.error) throw result.error;
if (result.status !== 0) {
  console.error('Migration check failed:', result.stderr);
  process.exit(1);
}
console.log('PASS: migration preserves accounts and hashes; normalization, collisions, and fallback logins verified.');
