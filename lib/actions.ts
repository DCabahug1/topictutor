"use server";

import { authService } from "./auth";

export async function signUpWithEmailAndPasswordAction(
  email: string,
  password: string,
  name?: string | null,
  origin?: string
) {
  return await authService.signUpWithEmailAndPasswordServer(email, password, name || undefined, origin || undefined);
}
