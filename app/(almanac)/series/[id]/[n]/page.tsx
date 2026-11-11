import type { Metadata } from "next";
import { SeriesLessonView } from "../components/SeriesLessonView";

export const metadata: Metadata = { title: "Series lesson · TopicTutor" };

export default function SeriesLessonPage() {
  return <SeriesLessonView />;
}
