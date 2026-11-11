"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/almanac/Button";
import { TextField } from "@/components/almanac/TextField";
import { authService } from "@/lib/auth";
import { AuthFrame } from "./AuthFrame";
import { FootLine, FormAlert, FormHeader, GoogleSignIn, emailProblem, focusField } from "./AuthParts";

type Errors = { email?: string; password?: string };

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const problems: Errors = {
      email: emailProblem(email),
      password: password ? undefined : "Enter your password.",
    };
    setErrors(problems);
    setAlert(null);
    if (problems.email || problems.password) {
      focusField(problems.email ? "login-email" : "login-password");
      return;
    }

    setBusy(true);
    const result = await authService
      .signInWithEmailAndPassword(email.trim(), password)
      .catch(() => ({ success: false as const, error: null }));

    if (result.success) {
      // A full page load, so the server picks up the new session.
      window.location.assign("/today");
      return;
    }

    const error = "error" in result ? result.error : null;
    const reason = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    if (reason.includes("invalid_credentials") || reason.includes("invalid login")) {
      setAlert("The email and password don’t match. Your progress is safe.");
      setErrors({ password: "That password doesn’t match this email. Check it, or reset it." });
      focusField("login-password");
    } else if (reason.includes("not_confirmed") || reason.includes("not confirmed")) {
      setAlert("This email isn’t confirmed yet. Open the link we sent you, then log in. Your progress is safe.");
    } else {
      setAlert("It’s probably the connection. Try again in a moment. Your progress is safe.");
    }
    setBusy(false);
  };

  return (
    <AuthFrame>
      {alert && <FormAlert kicker="Couldn’t log in">{alert}</FormAlert>}
      <form noValidate onSubmit={submit}>
        <FormHeader kicker="Welcome back" title="Log in" />
        <GoogleSignIn fallback="log in with your email" />

        <div className="mt-5 flex flex-col gap-[18px]">
          <TextField
            id="login-email"
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={errors.email}
            onValueChange={(value) => {
              setEmail(value);
              setErrors((e) => ({ ...e, email: undefined }));
            }}
          />
          <div className="relative">
            <TextField
              id="login-password"
              label="Password"
              name="password"
              autoComplete="current-password"
              revealable
              value={password}
              error={errors.password}
              onValueChange={(value) => {
                setPassword(value);
                setErrors((e) => ({ ...e, password: undefined }));
              }}
            />
            {/* Sits on the label's line. TextField has no slot there, so it is placed over it. */}
            <Link
              href="/reset"
              className="absolute -top-[14px] right-0 inline-flex min-h-11 items-center font-mono text-[12px] text-(--ink) underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="large" fullWidth busy={busy} className="mt-6">
          {busy ? "Logging in" : "Log in"}
        </Button>
        <FootLine lead="New here?" label="Create an account" href="/register" />
      </form>
    </AuthFrame>
  );
}
