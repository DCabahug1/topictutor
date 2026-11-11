import type { Metadata } from "next";
import { PlacementResults } from "../components/PlacementResults";

export const metadata: Metadata = { title: "Placement results · TopicTutor" };

export default function PlacementResultsPage() {
  return <PlacementResults />;
}
