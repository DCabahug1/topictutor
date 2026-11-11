import type { Metadata } from "next";
import { MasteryCheck } from "../components/MasteryCheck";

export const metadata: Metadata = { title: "Mastery Check · TopicTutor" };

export default function MasteryPage() {
  return <MasteryCheck />;
}
