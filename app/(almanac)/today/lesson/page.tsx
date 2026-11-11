import type { Metadata } from "next";
import { DailySession } from "./components/DailySession";

export const metadata: Metadata = { title: "Today’s lesson · TopicTutor" };

export default function TodayLessonPage() {
  return <DailySession />;
}
