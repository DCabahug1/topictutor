import type { Metadata } from "next";
import { StartSeries } from "./components/StartSeries";

export const metadata: Metadata = { title: "Start a series · TopicTutor" };

export default function StartSeriesPage() {
  return <StartSeries />;
}
