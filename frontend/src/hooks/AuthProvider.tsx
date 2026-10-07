import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api';
import type { LoginPayload, RegisterPayload } from '../types/api';
import type { User } from '../types/models';
import { AUTH_LOGOUT_EVENT } from '../utils/constants';
import { tokenStorage } from '../utils/storage';
import { AuthContext, type AuthContextValue } from './authContext';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(() => Boolean(tokenStorage.get()));

  useEffect(() => {
    if (!tokenStorage.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setInitializing(false));
  }, []);

  // Axios interceptor fires this event on any 401 response
  useEffect(() => {
    const handleLogout = () => setUser(null);
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    tokenStorage.set(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload);
    tokenStorage.set(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, initializing, login, register, logout }),
    [user, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
