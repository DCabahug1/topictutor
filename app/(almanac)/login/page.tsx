import type { Metadata } from "next";
import { isKeepToday, safeNext } from "@/lib/next-path";
import { LoginForm } from "./components/LoginForm";

export const metadata: Metadata = { title: "Log in · TopicTutor" };

/**
 * `next` is where to go afterwards, for example the series a guest asked for.
 * `keep=today` brings the guest's finished lesson into the account.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; keep?: string | string[] }>;
}) {
  const { next, keep } = await searchParams;
  return <LoginForm next={safeNext(typeof next === "string" ? next : null)} keepToday={isKeepToday(keep)} />;
}
