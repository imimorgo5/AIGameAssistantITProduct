import { Suspense } from "react";

import { AdminPage } from "_pages/admin";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Админ-панель",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Загрузка страницы…</p>}>
      <AdminPage />
    </Suspense>
  );
}
