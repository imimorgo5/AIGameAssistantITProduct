import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ResetPasswordPage } from "_pages/reset-password";
import { getCurrentUser } from "entities/session/server";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  robots: { index: false, follow: false },
};

export default async function Page() {
  if (await getCurrentUser()) redirect("/");

  return (
    <Suspense fallback={<p role="status">Загрузка страницы…</p>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
