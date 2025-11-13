"use server";

import { authService } from "./auth";

export async function signUpWithEmailAndPasswordAction(
  email: string,
  password: string
) {
  return await authService.signUpWithEmailAndPasswordServer(email, password);
}
