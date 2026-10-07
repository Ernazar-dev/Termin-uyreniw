import { createContext } from 'react';
import type { LoginPayload, RegisterPayload } from '../types/api';
import type { User } from '../types/models';

export interface AuthContextValue {
  user: User | null;
  /** True while the stored token is being validated on app start. */
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
