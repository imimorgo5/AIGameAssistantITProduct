import { notFound, redirect } from "next/navigation";

import { ChatPage } from "_pages/chat";
import { getCurrentUser } from "entities/session/server";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Чат с ассистентом",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments = [] } = await params;
  if (!segments.length) redirect("/");
  if (segments.length > 2 || segments.some((id) => !/^[1-9]\d*$/.test(id)))
    notFound();
  const user = await getCurrentUser();
  if (!user && segments.length > 1) redirect("/login");
  if (user && !user.isEnabled) redirect("/");
  return <ChatPage guest={!user} />;
}
