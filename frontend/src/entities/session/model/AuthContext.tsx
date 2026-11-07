"use client";

import { useRouter } from "next/navigation";
import { createContext, useEffect, useRef, useState } from "react";

import { requestCache } from "shared/api/cache";
import { useStableCallback } from "shared/lib/react";

import { authApi } from "../api/auth";
import { userApi } from "../api/users";

import type { Credentials, Registration } from "./types";
import type { ReactNode } from "react";

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  login: (input: Credentials) => Promise<void>;
  register: (input: Registration) => Promise<void>;
  confirmEmail: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const generation = useRef(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    // Discard credentials left by the former SPA; never reuse browser-readable tokens.
    try {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    } catch {
      // Session cookies continue to work when browser storage is unavailable.
    }
    const synchronize = () => {
      const requestId = ++generation.current;
      requestCache.clear();
      void userApi
        .getAuthenticated()
        .then(() => {
          if (active && requestId === generation.current)
            setIsAuthenticated(true);
        })
        .catch(() => {
          if (active && requestId === generation.current)
            setIsAuthenticated(false);
        })
        .finally(() => {
          if (active && requestId === generation.current) setLoading(false);
        });
    };
    synchronize();
    const changed = () => synchronize();
    window.addEventListener("focus", changed);
    return () => {
      active = false;
      window.removeEventListener("focus", changed);
    };
  }, []);
  const login = useStableCallback(async (input: Credentials) => {
    generation.current += 1;
    setLoading(true);
    try {
      await authApi.login(input);
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  });

  const register = useStableCallback(async (input: Registration) => {
    generation.current += 1;
    setLoading(true);
    try {
      await authApi.register(input);
    } finally {
      setLoading(false);
    }
  });

  const confirmEmail = useStableCallback(async (token: string) => {
    generation.current += 1;
    setLoading(true);
    try {
      await authApi.confirmUserEmail(token);
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  });

  const logout = useStableCallback(async () => {
    generation.current += 1;
    setLoading(true);
    try {
      await authApi.logout();
    } finally {
      setIsAuthenticated(false);
      setLoading(false);
      router.replace("/login");
      router.refresh();
    }
  });

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        login,
        register,
        confirmEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
