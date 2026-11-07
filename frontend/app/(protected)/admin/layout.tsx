import { redirect } from "next/navigation";

import { getCurrentUser } from "entities/session/server";

import type { ReactNode } from "react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isAdmin) redirect("/");
  return children;
}
