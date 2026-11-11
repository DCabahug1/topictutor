"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/almanac/Button";
import { GoogleIcon } from "@/components/almanac/icons";
import { PaperPage, PinnedActions } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { almanac, joinList, useAlmanac } from "@/lib/almanac";
import { authService } from "@/lib/auth";

const ROW_LABEL = "t-label font-normal! text-(--ink-muted)";

// Offered to a guest after the finish. Signed-in learners never see it.
export default function WelcomeAccountPage() {
  const user = useSession();
  const router = useRouter();
  const { data: session } = useAlmanac(() => almanac.getDailySession(), []);
  const { data: subjects } = useAlmanac(() => almanac.getSubjects(), []);
  const [failed, setFailed] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (user) router.replace("/today");
  }, [user, router]);

  const streak = session?.streak.count ?? 0;
  const days = streak === 1 ? "1 day" : `${streak} days`;

  const withGoogle = async () => {
    setFailed(false);
    setStarting(true);
    const result = await authService.signInWithGoogle();
    if (!result.success) {
      setFailed(true);
      setStarting(false);
    }
  };

  return (
    <PaperPage tabs={false}>
      <div className="flex flex-wrap items-start gap-x-24 gap-y-7 pb-32 pt-8 md:gap-y-12 md:pb-0 md:pt-16">
        <div className="min-w-0 max-w-[680px] flex-[999_1_520px]">
          <p className="t-label m-0 font-normal! text-(--accent)">Free · no credit card</p>
          <h1 className="m-0 mt-3 text-[40px] font-medium leading-[1.02] tracking-[-0.02em] md:mt-[14px] md:text-[clamp(44px,5vw,72px)] md:leading-[0.98] md:tracking-[-0.025em]">
            Keep your streak.
          </h1>
          <p className="m-0 mt-3 text-[18px] leading-normal text-(--ink-soft) md:mt-4 md:text-[20px]">
            Right now your progress lives in this browser. With an account, it comes with you to any device, and
            tomorrow’s lesson picks up where today left off.
          </p>

          <h2 className="t-label m-0 mt-7 md:mt-9">What comes with you</h2>
          <ul className="m-0 mt-2 list-none border-0 border-b border-solid border-(--rule) p-0">
            {session?.finishedAt && (
              <li className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-0 border-t border-solid border-(--rule) py-[14px] md:grid-cols-[160px_minmax(0,1fr)]">
                <span className={ROW_LABEL}>Today’s lesson</span>
                <span className="text-[18px]">{session.lesson.title} · done</span>
              </li>
            )}
            <li className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-0 border-t border-solid border-(--rule) py-[14px] md:grid-cols-[160px_minmax(0,1fr)]">
              <span className={ROW_LABEL}>Your streak</span>
              <span className="text-[18px]">{streak ? `${days}, and counting` : "Starts with your first lesson"}</span>
            </li>
            <li className="grid grid-cols-[120px_minmax(0,1fr)] gap-4 border-0 border-t border-solid border-(--rule) py-[14px] md:grid-cols-[160px_minmax(0,1fr)]">
              <span className={ROW_LABEL}>Your subjects</span>
              <span className="text-[18px]">{subjects?.length ? joinList(subjects) : "None picked yet"}</span>
            </li>
          </ul>
        </div>

        <div className="box-border min-w-0 max-w-[440px] flex-[1_1_360px] border border-solid border-(--ink) bg-(--paper-raised) p-5 md:p-7">
          <Button size="large" fullWidth busy={starting} onClick={withGoogle}>
            {!starting && <GoogleIcon />}
            Continue with Google
          </Button>
          <Button size="large" variant="secondary" fullWidth href="/register" className="mt-[10px]">
            Sign up with email
          </Button>
          {failed && (
            <p role="alert" className="m-0 mt-3 text-[15px] text-(--incorrect)">
              Google sign-in didn’t start. Try again, or sign up with email.
            </p>
          )}
          <p className="m-0 mt-[18px] text-[16px] text-(--ink-muted)">
            Already have an account?{" "}
            <Link href="/login" className="font-mono text-[14px] text-(--ink)">
              Log in
            </Link>{" "}
            and today is added to it.
          </p>
          <div className="mt-5 hidden border-0 border-t border-solid border-(--rule) pt-4 md:block">
            <Link href="/today/lesson" className="inline-flex min-h-11 items-center font-mono text-[14px] text-(--ink)">
              Not now, stop for today
            </Link>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <PinnedActions>
          <Button size="large" variant="secondary" href="/today/lesson">
            Not now
          </Button>
        </PinnedActions>
      </div>
    </PaperPage>
  );
}
