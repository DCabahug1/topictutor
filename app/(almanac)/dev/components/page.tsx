import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";

// Development only: every Almanac component in every state, light and dark side by side.
export default function DevComponentsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Gallery />;
}
