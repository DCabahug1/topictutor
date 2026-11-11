import type { Metadata } from "next";
import { safeNext } from "@/lib/next-path";
import { RegisterForm } from "./components/RegisterForm";

export const metadata: Metadata = { title: "Create your account · TopicTutor" };

/** `next` is where to go afterwards, for example the series a guest asked for. */
export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await searchParams;
  return <RegisterForm next={safeNext(typeof next === "string" ? next : null)} />;
}
