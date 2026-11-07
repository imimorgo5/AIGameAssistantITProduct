import { redirect } from "next/navigation";

import { getCurrentUser } from "entities/session/server";

import type { ReactNode } from "react";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return children;
}
