import type { Metadata } from "next";
import { StatsScreen } from "./components/StatsScreen";

export const metadata: Metadata = { title: "Stats · TopicTutor" };

export default function StatsPage() {
  return <StatsScreen />;
}
