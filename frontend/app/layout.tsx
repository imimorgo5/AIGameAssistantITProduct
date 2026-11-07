import { Providers } from "_app";
import "_app/styles/global.scss";

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: { default: "AIGameAssistant", template: "AIGameAssistant - %s" },
  description:
    "ИИ-ассистент для настольных игр: каталог игр, PDF-правила и ответы на вопросы в чате.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <div className="page-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
