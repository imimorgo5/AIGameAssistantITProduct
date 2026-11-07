import { Suspense } from "react";

import { ProfilePage } from "_pages/profile";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Профиль",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<p role="status">Загрузка страницы…</p>}>
      <ProfilePage />
    </Suspense>
  );
}
