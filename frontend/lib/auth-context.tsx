"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getApiErrorMessage, setAccessToken } from "@/lib/api";
import type { AuthResponse } from "@/types/auth";
import type { User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, confirmPassword: string) => Promise<string>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const response = await api.get("/users/me");
    setUser(response.data.data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const response = await api.post("/auth/refresh");
        const data = response.data.data as AuthResponse;
        setAccessToken(data.accessToken);
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        setAccessToken(null);
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data.data as AuthResponse;
      setAccessToken(data.accessToken);
      setUser(data.user);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Invalid email or password"));
    }
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string, confirmPassword: string) => {
      try {
        const response = await api.post("/auth/signup", {
          name,
          email,
          password,
          confirmPassword,
        });
        return response.data.message as string;
      } catch (error) {
        throw new Error(getApiErrorMessage(error, "Registration failed"));
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser }),
    [user, loading, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
