import { Suspense } from "react";

import { AuthPage } from "_pages/auth";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Вход",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Загрузка страницы…</p>}>
      <AuthPage />
    </Suspense>
  );
}
