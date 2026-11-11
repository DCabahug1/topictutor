import type { Metadata } from "next";
import { PlacementTest } from "../components/PlacementTest";

export const metadata: Metadata = { title: "Placement test · TopicTutor" };

export default function PlacementTestPage() {
  return <PlacementTest />;
}
