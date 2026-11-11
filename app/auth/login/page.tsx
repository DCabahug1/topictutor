import { redirect } from "next/navigation";

// The old address. Log in lives at /login now.
export default function OldLoginPage() {
  redirect("/login");
}
