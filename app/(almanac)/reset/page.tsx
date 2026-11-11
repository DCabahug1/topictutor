import type { Metadata } from "next";
import { ResetFlow } from "./components/ResetFlow";

export const metadata: Metadata = { title: "Reset your password · TopicTutor" };

export default function ResetPage() {
  return <ResetFlow />;
}
