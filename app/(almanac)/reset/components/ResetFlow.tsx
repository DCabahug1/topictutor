"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { Button } from "@/components/almanac/Button";
import { useSession } from "@/components/almanac/SessionProvider";
import { TextField } from "@/components/almanac/TextField";
import { createClient } from "@/utils/supabase/client";
import { AuthFrame } from "../../login/components/AuthFrame";
import {
  FootLine,
  FormAlert,
  FormHeader,
  MessageState,
  PASSWORD_MIN,
  emailProblem,
  focusField,
} from "../../login/components/AuthParts";

export function ResetFlow() {
  // useSearchParams needs a boundary so the rest of the page can prerender.
  return (
    <Suspense fallback={<AuthFrame>{null}</AuthFrame>}>
      <ResetFlowInner />
    </Suspense>
  );
}

function ResetFlowInner() {
  const user = useSession();
  const router = useRouter();
  const params = useSearchParams();
  // The link in the email comes back through /auth/callback, which signs the learner in and adds step=new.
  const settingNew = params.get("step") === "new";
  const linkFailed = params.get("state") === "link-failed";

  const [email, setEmail] = useState(user?.email ?? "");
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);

  const startOver = () => {
    setExpired(false);
    setSent(false);
    router.replace("/reset");
  };

  let content;
  if (done) {
    content = (
      <MessageState
        key="done"
        icon="check"
        tone="done"
        kicker="Password changed"
        title="You’re all set."
        body="Your new password works now. You’ve been signed out on other devices."
        primary={{ label: "Go to Today", href: "/today" }}
      />
    );
  } else if (linkFailed || expired || (settingNew && !user)) {
    // Without a session there is nobody to set a password for: the link didn't work.
    content = (
      <MessageState
        key="expired"
        icon="clock"
        tone="expired"
        kicker="Link expired"
        title="That link has stopped working."
        body="Links in our emails work for one hour and only once. This one is used up or out of date. Nothing about your account changed."
        primary={{ label: "Send a new link", onClick: startOver }}
        secondary={{ lead: "Or", label: "go to log in", href: "/login" }}
      />
    );
  } else if (settingNew && user) {
    content = <NewPassword email={user.email} onDone={() => setDone(true)} onExpired={() => setExpired(true)} />;
  } else if (sent) {
    content = (
      <MessageState
        key="sent"
        icon="mail"
        kicker="Password reset"
        title="Check your email."
        body={`If an account uses ${email.trim()}, a reset link is on its way. It works for one hour.`}
        primary={{ label: "Back to log in", href: "/login" }}
        secondary={{ lead: "Wrong address?", label: "Try another email", onClick: () => setSent(false) }}
      />
    );
  } else {
    content = <RequestLink email={email} onEmail={setEmail} onSent={() => setSent(true)} />;
  }

  return <AuthFrame>{content}</AuthFrame>;
}

function RequestLink({ email, onEmail, onSent }: { email: string; onEmail: (value: string) => void; onSent: () => void }) {
  const [error, setError] = useState<string | undefined>();
  const [alert, setAlert] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problem = emailProblem(email);
    setError(problem);
    setAlert(null);
    if (problem) {
      focusField("reset-email");
      return;
    }

    setBusy(true);
    const reason = await createClient()
      .auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset?step=new`,
      })
      .then(({ error }) => (error ? `${error.code ?? ""} ${error.message}`.toLowerCase() : null))
      .catch(() => "");

    if (reason === null) {
      onSent();
      return;
    }
    setAlert(
      reason.includes("rate limit") || reason.includes("seconds")
        ? "Too many tries in a row. Wait a minute, then try again."
        : "It’s probably the connection. Nothing about your account changed. Try again."
    );
    setBusy(false);
  };

  return (
    <>
      <form noValidate onSubmit={submit}>
        <FormHeader
          kicker="Password reset"
          title="Forgot your password?"
          lead="Enter your email and we’ll send a link to set a new one."
        />
        {alert && <FormAlert kicker="Couldn’t send the link">{alert}</FormAlert>}
        <div className="mt-7">
          <TextField
            id="reset-email"
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={error}
            onValueChange={(value) => {
              onEmail(value);
              setError(undefined);
            }}
          />
        </div>
        <Button type="submit" icon fullWidth busy={busy} className="mt-8">
          {busy ? "Sending the link" : "Send reset link"}
        </Button>
        <FootLine lead="Remembered it?" label="Log in" href="/login" />
      </form>
    </>
  );
}

type NewPasswordProps = { email: string; onDone: () => void; onExpired: () => void };

function NewPassword({ email, onDone, onExpired }: NewPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [alert, setAlert] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const problems = {
      password: password.length >= PASSWORD_MIN ? undefined : `Use at least ${PASSWORD_MIN} characters.`,
      confirm: confirm === password ? undefined : "These two passwords don’t match.",
    };
    setErrors(problems);
    setAlert(null);
    if (problems.password || problems.confirm) {
      focusField(problems.password ? "reset-password" : "reset-confirm");
      return;
    }

    setBusy(true);
    const reason = await createClient()
      .auth.updateUser({ password })
      .then(({ error }) => (error ? `${error.code ?? ""} ${error.name} ${error.message}`.toLowerCase() : null))
      .catch(() => "");

    if (reason === null) {
      onDone();
      return;
    }
    if (reason.includes("session")) {
      // The sign-in from the link has run out.
      onExpired();
      return;
    }
    if (reason.includes("same_password") || reason.includes("different from the old")) {
      setErrors({ password: "That’s your current password. Choose a new one." });
      focusField("reset-password");
    } else if (reason.includes("weak")) {
      setErrors({ password: "That password is too easy to guess. Try a longer one." });
      focusField("reset-password");
    } else {
      setAlert("It’s probably the connection. Your old password still works. Try again.");
    }
    setBusy(false);
  };

  return (
    <>
      <form noValidate onSubmit={submit}>
        <FormHeader kicker="Password reset" title="Set a new password" lead={`For ${email}.`} />
        {alert && <FormAlert kicker="Couldn’t save the password">{alert}</FormAlert>}
        <div className="mt-7 flex flex-col gap-6">
          <TextField
            id="reset-password"
            label="New password"
            name="new-password"
            autoComplete="new-password"
            revealable
            help={`At least ${PASSWORD_MIN} characters.`}
            value={password}
            error={errors.password}
            onValueChange={(value) => {
              setPassword(value);
              setErrors((e) => ({ ...e, password: undefined }));
            }}
          />
          <TextField
            id="reset-confirm"
            label="Confirm new password"
            name="confirm-password"
            autoComplete="new-password"
            revealable
            value={confirm}
            error={errors.confirm}
            onValueChange={(value) => {
              setConfirm(value);
              setErrors((e) => ({ ...e, confirm: undefined }));
            }}
          />
        </div>
        <Button type="submit" icon fullWidth busy={busy} className="mt-8">
          {busy ? "Saving" : "Save new password"}
        </Button>
        <FootLine lead="Changed your mind?" label="Log in" href="/login" />
      </form>
    </>
  );
}
