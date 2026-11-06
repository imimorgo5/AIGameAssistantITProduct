import { createContext, useEffect, useState } from "react";
import { requestCache } from "shared/api/cache";
import { useStableCallback } from "shared/lib/react";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "shared/lib/storage";
import { getAccessToken } from "shared/lib/storage";

import { authApi } from "../api/auth";

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
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(getAccessToken()),
  );

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (
        event.key === ACCESS_TOKEN_KEY ||
        event.key === REFRESH_TOKEN_KEY ||
        event.key === null
      ) {
        requestCache.clear();
        window.location.reload();
      }
    };

    window.addEventListener("storage", changed);

    return () => window.removeEventListener("storage", changed);
  }, []);
  const login = useStableCallback(async (input: Credentials) => {
    setLoading(true);
    try {
      await authApi.login(input);
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  });

  const register = useStableCallback(async (input: Registration) => {
    setLoading(true);
    try {
      await authApi.register(input);
    } finally {
      setLoading(false);
    }
  });

  const confirmEmail = useStableCallback(async (token: string) => {
    setLoading(true);
    try {
      await authApi.confirmUserEmail(token);
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  });

  const logout = useStableCallback(async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } finally {
      setIsAuthenticated(false);
      setLoading(false);
      window.location.assign("/login");
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
