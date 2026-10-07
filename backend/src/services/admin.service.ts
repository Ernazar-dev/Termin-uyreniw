import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { seedEnvSchema } from '../config/seed-env';
import { findUserByLogin, hashPassword } from './auth.service';

/**
 * Keeps the administrator account in line with ADMIN_LOGIN / ADMIN_PASSWORD from .env:
 * creates it when missing and updates its password when the .env value changes.
 * Content and results are never touched.
 */
export const syncAdminAccount = async () => {
  const parsed = seedEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Only field names are reported; never print credentials.
    const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join('.')))];
    console.warn(`Admin account not synced: check ${fields.join(', ')} in backend/.env`);
    return;
  }

  const { ADMIN_LOGIN: login, ADMIN_PASSWORD: password } = parsed.data;
  const existing = await findUserByLogin(login);

  if (!existing) {
    await prisma.user.create({
      data: { fullName: 'Administrator', login, password: await hashPassword(password), role: Role.TEACHER },
    });
    console.log(`Admin account created: ${login}`);
    return;
  }

  const passwordMatches = await bcrypt.compare(password, existing.password);
  if (!passwordMatches || existing.role !== Role.TEACHER) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: await hashPassword(password), role: Role.TEACHER, classId: null },
    });
    console.log(`Admin account updated from .env: ${existing.login}`);
  }
};
