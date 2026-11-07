import { Suspense } from "react";

import { ResetPasswordPage } from "_pages/reset-password";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Загрузка страницы…</p>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
