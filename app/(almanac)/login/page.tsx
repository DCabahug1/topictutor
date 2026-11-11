import type { Metadata } from "next";
import { safeNext } from "@/lib/next-path";
import { LoginForm } from "./components/LoginForm";

export const metadata: Metadata = { title: "Log in · TopicTutor" };

/** `next` is where to go afterwards, for example the series a guest asked for. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <LoginForm next={safeNext(typeof next === "string" ? next : null)} />;
}
