"use client";

import { AuthProvider } from "entities/session";
import { ThemeProvider } from "shared/lib/theme";

import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}
