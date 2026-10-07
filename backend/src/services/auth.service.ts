import bcrypt from 'bcryptjs';
import { Prisma, Role } from '@prisma/client';
import { BCRYPT_ROUNDS } from '../config/constants';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { signToken } from '../utils/jwt';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';
import { publicUserSelect, type PublicUser } from './selects';

interface AuthResponse {
  token: string;
  user: PublicUser;
}

// Compared against when the login does not exist, so response time does not reveal which logins are registered.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', BCRYPT_ROUNDS);

export const hashPassword = (password: string) => bcrypt.hash(password, BCRYPT_ROUNDS);

export const ensureClassExists = async (classId: number) => {
  const found = await prisma.class.findUnique({ where: { id: classId }, select: { id: true } });
  if (!found) throw ApiError.badRequest('Tańlanǵan klass tabılmadı');
};

/** Logins keep the case the user typed, but "Ali" and "ali" are the same account. */
export const findUserByLogin = (login: string) =>
  prisma.user.findFirst({ where: { login: { equals: login.trim(), mode: Prisma.QueryMode.insensitive } } });

export const ensureLoginIsFree = async (login: string, exceptUserId?: number) => {
  const existing = await findUserByLogin(login);
  if (existing && existing.id !== exceptUserId) {
    throw ApiError.conflict('Bul kiriw atı menen paydalanıwshı aldınnan bar');
  }
};

export const authService = {
  async login({ login, password }: LoginInput): Promise<AuthResponse> {
    const user = await findUserByLogin(login);
    const isValid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

    if (!user || !isValid) {
      throw ApiError.unauthorized('Kiriw atı yamasa parol qáte');
    }

    const publicUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: publicUserSelect,
    });

    return { token: signToken({ id: user.id, role: user.role }), user: publicUser };
  },

  async register(input: RegisterInput): Promise<AuthResponse> {
    await Promise.all([ensureLoginIsFree(input.login), ensureClassExists(input.classId)]);

    const user = await prisma.user.create({
      data: {
        fullName: input.fullName,
        login: input.login,
        password: await hashPassword(input.password),
        role: Role.STUDENT,
        classId: input.classId,
      },
      select: publicUserSelect,
    });

    return { token: signToken({ id: user.id, role: user.role }), user };
  },

  async me(userId: number): Promise<PublicUser> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: publicUserSelect });
    if (!user) throw ApiError.unauthorized();
    return user;
  },
};
