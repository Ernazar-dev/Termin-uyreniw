import jwt, { type SignOptions } from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import type { AuthUser } from '../types';

interface TokenPayload {
  sub: string;
  role: Role;
}

export const signToken = (user: AuthUser): string =>
  jwt.sign({ role: user.role } satisfies Omit<TokenPayload, 'sub'>, env.JWT_SECRET, {
    subject: String(user.id),
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

export const verifyToken = (token: string): AuthUser => {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
  const id = Number(payload.sub);
  if (!Number.isInteger(id) || !Object.values(Role).includes(payload.role)) {
    throw new Error('Invalid token payload');
  }
  return { id, role: payload.role };
};
