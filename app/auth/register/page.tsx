import { redirect } from "next/navigation";

// The old address. Register lives at /register now.
export default function OldRegisterPage() {
  redirect("/register");
}
