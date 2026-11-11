import { notFound } from "next/navigation";
import { SignedInPreview } from "./SignedInPreview";

// Development only: the signed-in pages rendered for a sample learner, so they can be checked without an account.
export default function DevSignedInPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SignedInPreview />;
}
