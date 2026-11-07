import { Suspense } from "react";

import { VerifyEmailPage } from "_pages/verify-email";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Подтверждение почты",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Загрузка страницы…</p>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
