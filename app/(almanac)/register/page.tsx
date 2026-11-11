import type { Metadata } from "next";
import { RegisterForm } from "./components/RegisterForm";

export const metadata: Metadata = { title: "Create your account · TopicTutor" };

export default function RegisterPage() {
  return <RegisterForm />;
}
