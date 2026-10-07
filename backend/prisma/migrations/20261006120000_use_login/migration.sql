BEGIN;

LOCK TABLE "User" IN ACCESS EXCLUSIVE MODE;

-- Preserve account IDs, password hashes and all related records.
CREATE TEMP TABLE account_login_map (
  id INTEGER PRIMARY KEY,
  login TEXT NOT NULL UNIQUE
) ON COMMIT DROP;

DO $$
DECLARE
  account RECORD;
  base_login TEXT;
  next_login TEXT;
  suffix TEXT;
  attempt INTEGER;
BEGIN
  FOR account IN SELECT "id", "email" FROM "User" ORDER BY "id" LOOP
    base_login := left(regexp_replace(lower(split_part(trim(account."email"), '@', 1)), '[^a-z0-9._-]', '', 'g'), 32);
    IF length(base_login) < 3 OR base_login !~ '^[a-z0-9]' THEN
      base_login := 'user_' || account."id";
    END IF;
    next_login := base_login;
    attempt := 0;
    WHILE EXISTS (SELECT 1 FROM account_login_map WHERE login = next_login) LOOP
      attempt := attempt + 1;
      suffix := '_' || account."id" || CASE WHEN attempt > 1 THEN '_' || attempt ELSE '' END;
      next_login := left(base_login, 32 - length(suffix)) || suffix;
    END LOOP;
    INSERT INTO account_login_map (id, login) VALUES (account."id", next_login);
  END LOOP;
END $$;

DROP INDEX "User_email_key";
ALTER TABLE "User" RENAME COLUMN "email" TO "login";
UPDATE "User" AS account SET "login" = mapping.login
FROM account_login_map AS mapping WHERE account."id" = mapping.id;
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

COMMIT;
