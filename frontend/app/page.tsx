import { MainPage } from "_pages/main";
import { getInitialCatalog } from "entities/game/server";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "AIGameAssistant - Каталог игр" },
};

export default async function Page() {
  const initialCatalog = await getInitialCatalog();
  return <MainPage initialCatalog={initialCatalog} />;
}
