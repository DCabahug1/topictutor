import type { Metadata } from "next";
import { SeriesOverview } from "./components/SeriesOverview";

export const metadata: Metadata = { title: "Series · TopicTutor" };

// The public sample series is this same route, with the id "sample".
export default function SeriesPage() {
  return <SeriesOverview />;
}
