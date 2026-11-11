"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/almanac/Button";
import { TextField } from "@/components/almanac/TextField";
import { signUpWithEmailAndPasswordAction } from "@/lib/actions";
import { callbackPath, isSeriesPath, withNext } from "@/lib/next-path";
import { createClient } from "@/utils/supabase/client";
import { AuthFrame } from "../../login/components/AuthFrame";
import {
  FootLine,
  FormAlert,
  FormHeader,
  GoogleSignIn,
  MessageState,
  PASSWORD_MIN,
  emailProblem,
  focusField,
} from "../../login/components/AuthParts";

const NAME_MAX = 25;

type Field = "name" | "email" | "password" | "confirm";
type Errors = Partial<Record<Field, string>>;
type Resend = "idle" | "sending" | "sent" | "failed";

const ORDER: Field[] = ["name", "email", "password", "confirm"];

/** `next` is a checked same-site path to go to once the account is made: often the series a guest asked for. */
export function RegisterForm({ next = null }: { next?: string | null }) {
  const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // The address the confirmation link went to. Set once the account is created.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resend, setResend] = useState<Resend>("idle");

  const change = (field: Field) => (value: string) => {
    setValues((v) => ({ ...v, [field]: field === "name" ? value.slice(0, NAME_MAX) : value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const showProblems = (problems: Errors) => {
    setErrors(problems);
    const first = ORDER.find((field) => problems[field]);
    focusField(first && `register-${first}`);
    return Boolean(first);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    const name = values.name.trim();
    const email = values.email.trim();
    setAlert(null);
    const stopped = showProblems({
      name: name ? undefined : "Enter a name, so we know what to call you.",
      email: emailProblem(email),
      password: values.password.length >= PASSWORD_MIN ? undefined : `Use at least ${PASSWORD_MIN} characters.`,
      confirm: values.confirm === values.password ? undefined : "These two passwords don’t match.",
    });
    if (stopped) return;

    setBusy(true);
    const result = await signUpWithEmailAndPasswordAction(email, values.password, name, window.location.origin, next).catch(
      () => ({ success: false as const, error: { code: "", message: "" } })
    );

    if (result.success) {
      setSentTo(email);
      return;
    }

    const error = "error" in result ? result.error : null;
    const reason = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    if (reason.includes("already")) {
      showProblems({ email: "An account already uses this email. Log in instead." });
    } else if (reason.includes("weak") || reason.includes("password")) {
      showProblems({ password: "That password is too easy to guess. Try a longer one." });
    } else if (reason.includes("invalid") && reason.includes("email")) {
      showProblems({ email: "This email didn’t go through. Check it for typos." });
    } else if (reason.includes("rate limit") || reason.includes("seconds")) {
      setAlert("Too many tries in a row. Wait a minute, then try again.");
    } else {
      // The server doesn't always say why, so this covers the connection and everything else.
      setAlert("That didn’t go through. What you typed is still here. Check it and try again.");
    }
    setBusy(false);
  };

  const sendAgain = async () => {
    if (!sentTo || resend === "sending") return;
    setResend("sending");
    // The same return address the first email used, so the name still reaches the new profile.
    const emailRedirectTo = `${window.location.origin}${callbackPath({ name: values.name.trim(), next })}`;
    const failed = await createClient()
      .auth.resend({ type: "signup", email: sentTo, options: { emailRedirectTo } })
      .then(({ error }) => Boolean(error))
      .catch(() => true);
    setResend(failed ? "failed" : "sent");
  };

  if (sentTo) {
    return (
      <AuthFrame>
        <MessageState
          icon="mail"
          kicker="One more step"
          title="Check your email."
          body={`We sent a confirmation link to ${sentTo}. Open it on this device and you’re in. It can take a minute to arrive.`}
          primary={{ label: "Go to log in", href: withNext("/login", next) }}
          secondary={{
            lead: "Nothing yet?",
            label: resend === "sending" ? "Sending" : "Send it again",
            onClick: sendAgain,
            busy: resend === "sending",
          }}
          status={
            resend === "sent"
              ? "Sent again. It can hide in the spam folder."
              : resend === "failed" && "Couldn’t send it again. Wait a minute, then try once more."
          }
        />
      </AuthFrame>
    );
  }

  return (
    <AuthFrame>
      <form noValidate onSubmit={submit}>
        {isSeriesPath(next) ? (
          // Sent here from a series: say why, then carry on to it once the account is made.
          <FormHeader
            kicker="Series need an account"
            title="Create your account"
            lead="It’s free. Today’s lesson and your streak come with you."
          />
        ) : (
          <FormHeader
            kicker="Free · no credit card"
            title="Create your account"
            lead="If you started as a guest, your streak and lessons come with you."
          />
        )}
        {alert && <FormAlert kicker="Couldn’t create your account">{alert}</FormAlert>}
        <GoogleSignIn fallback="sign up with your email" next={next} />

        <div className="mt-7 flex flex-col gap-6">
          <TextField
            id="register-name"
            label="Name"
            name="name"
            autoComplete="name"
            placeholder="What should we call you?"
            maxLength={NAME_MAX}
            help={`Up to ${NAME_MAX} characters.`}
            value={values.name}
            error={errors.name}
            onValueChange={change("name")}
          />
          <TextField
            id="register-email"
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            error={errors.email}
            onValueChange={change("email")}
          />
          <TextField
            id="register-password"
            label="Password"
            name="password"
            autoComplete="new-password"
            revealable
            help={`At least ${PASSWORD_MIN} characters.`}
            value={values.password}
            error={errors.password}
            onValueChange={change("password")}
          />
          <TextField
            id="register-confirm"
            label="Confirm password"
            name="confirm-password"
            autoComplete="new-password"
            revealable
            value={values.confirm}
            error={errors.confirm}
            onValueChange={change("confirm")}
          />
        </div>

        <Button type="submit" icon fullWidth busy={busy} className="mt-8">
          {busy ? "Creating your account" : "Create account"}
        </Button>
        <FootLine lead="Already have one?" label="Log in" href={withNext("/login", next)} />
      </form>
    </AuthFrame>
  );
}
