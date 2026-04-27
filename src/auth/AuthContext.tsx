import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { login as loginRequest, register as registerRequest } from '../api/auth.api';
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from './storage';
import type { StoredUser } from '../types/api';

type AuthContextValue = {
  user: StoredUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type Props = {
  children: ReactNode;
};

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredUser());
    setToken(getStoredToken());
    setIsLoading(false);
  }, []);

  const applyAuth = useCallback((nextUser: StoredUser, nextToken: string) => {
    setStoredUser(nextUser);
    setStoredToken(nextToken);
    setUser(nextUser);
    setToken(nextToken);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password);
    applyAuth(result.user, result.accessToken);
  }, [applyAuth]);

  const register = useCallback(async (email: string, password: string) => {
    const result = await registerRequest(email, password);
    applyAuth(result.user, result.accessToken);
  }, [applyAuth]);

  const logout = useCallback(() => {
    clearAuthStorage();
    setUser(null);
    setToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
  }), [user, token, isLoading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}