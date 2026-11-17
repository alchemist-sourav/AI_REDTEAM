"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createApiClient, ApiClient } from "@/lib/api/client";

interface User {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  tokenRef: React.MutableRefObject<string | null>;
}

const DEFAULT_CONTEXT: AuthContextType = {
  user: null,
  token: null,
  loading: false,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  tokenRef: { current: null },
};

const AuthContext = createContext<AuthContextType>(DEFAULT_CONTEXT);

const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
} as const;

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem(STORAGE_KEYS.USER);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  } else {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }
}

function setStoredUser(user: User | null): void {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.USER);
  }
}

function getInitialToken(): string | null {
  return getStoredToken();
}

function getInitialUser(): User | null {
  return getStoredUser();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getInitialUser());
  const [token, setToken] = useState<string | null>(() => getInitialToken());
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const mountedRef = useRef(true);
  const validatingRef = useRef(false);
  const tokenRef = useRef<string | null>(getInitialToken());
  const apiRef = useRef<ApiClient | null>(null);

  // Initialize API client in effect to avoid react-hooks/refs error
  useEffect(() => {
    apiRef.current = createApiClient(() => tokenRef.current);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    setStoredToken(null);
    setStoredUser(null);
    tokenRef.current = null;
  }, []);

  const setTokenAndRef = useCallback((newToken: string | null) => {
    setToken(newToken);
    tokenRef.current = newToken;
    if (newToken) {
      setStoredToken(newToken);
    } else {
      setStoredToken(null);
    }
  }, []);

  const validateToken = useCallback(async (): Promise<User | null> => {
    if (validatingRef.current) return null;
    validatingRef.current = true;

    try {
      const api = apiRef.current;
      if (!api) return null;
      
      const userData = await api.get<User>("/auth/me");
      
      if (mountedRef.current) {
        setUser(userData);
        setStoredUser(userData);
      }
      return userData;
    } catch (err) {
      if (mountedRef.current) {
        const apiError = err as Error & { status?: number; detail?: string };
        if (apiError.status === 401 || apiError.status === 403) {
          clearAuth();
        } else if (apiError.status && apiError.status >= 500) {
          console.warn("Token validation server error, preserving session:", apiError.message);
        } else {
          clearAuth();
        }
      }
      return null;
    } finally {
      validatingRef.current = false;
    }
  }, [clearAuth]);

  useEffect(() => {
    let cancelled = false;

    async function initializeAuth() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) setTokenAndRef(storedToken);
      await validateToken();
      if (!cancelled) setLoading(false);
    }

    initializeAuth();

    return () => { cancelled = true; };
  }, [validateToken, setTokenAndRef]);

  const refreshUser = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      clearAuth();
      setLoading(false);
      return;
    }

    setTokenAndRef(storedToken);
    await validateToken();
  }, [clearAuth, validateToken, setTokenAndRef]);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const api = apiRef.current;
      if (!api) throw new Error("API client not initialized");

      const tokenData = await api.post<{ access_token: string; token_type: string; expires_in: number }>("/auth/login", {
        email,
        password,
      });

      const accessToken: string = tokenData.access_token;
      if (!accessToken) {
        throw new Error("Server did not return an access token");
      }

      setTokenAndRef(accessToken);

      const userData = await api.get<User>("/auth/me");

      setUser(userData);
      setStoredUser(userData);

      router.push("/dashboard");
    } catch (err) {
      clearAuth();
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearAuth, router, setTokenAndRef]);

  const logout = useCallback(() => {
    clearAuth();
    router.replace("/login");
  }, [clearAuth, router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser, tokenRef }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === DEFAULT_CONTEXT) {
    return DEFAULT_CONTEXT;
  }
  return context;
}