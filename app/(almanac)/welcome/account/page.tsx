"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackLink } from "@/components/almanac/BackLink";
import { Button } from "@/components/almanac/Button";
import { CheckIcon } from "@/components/almanac/icons";
import { LeadBlock } from "@/components/almanac/LeadBlock";
import { PaperPage } from "@/components/almanac/Page";
import { useSession } from "@/components/almanac/SessionProvider";
import { almanac, joinList, subjectNames, useAlmanac } from "@/lib/almanac";
import { authService } from "@/lib/auth";

// A label column sized to the longest label, so labels stay on one line and values line up.
const ROWS = "m-0 grid list-none grid-cols-[auto_minmax(0,1fr)] gap-x-6 p-0";
const ROW =
  "col-span-2 grid grid-cols-subgrid items-baseline border-0 border-b border-solid border-(--rule) py-[14px] text-[17px]";
const LABEL = "whitespace-nowrap text-(--ink-muted)";
const VALUE = "text-right";

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
      <BackLink href="/welcome/subjects">Your subjects</BackLink>
      <div className="mt-10 flex md:mt-16 flex-wrap items-end justify-between gap-x-20 gap-y-14">
        <LeadBlock
          eyebrow="Free · no credit card"
          title="Keep your streak."
          line="Right now it lives in this browser. With an account it follows you to any device."
          className="max-w-[780px] flex-[1_1_560px]"
          primary={
            <Button icon busy={starting} onClick={withGoogle}>
              Continue with Google
            </Button>
          }
          quiet={
            <Button variant="quiet" href="/register">
              or sign up with email
            </Button>
          }
        >
          {failed && (
            <p role="alert" className="m-0 text-[17px] text-(--incorrect)">
              Google sign-in didn’t start. Try again, or sign up with email.
            </p>
          )}
        </LeadBlock>

        {/* Beside the lead it is 340px wide. The lead (560px) + gap (80px) + list (340px) fit from
            980px; below that the list wraps under the lead and fills the row. */}
        <aside
          aria-labelledby="comes-with-you"
          className="min-w-0 flex-[1_1_340px] max-w-[max(340px,calc((980px_-_100%)_*_999))]"
        >
          <h2
            id="comes-with-you"
            className="m-0 border-0 border-b border-solid border-(--ink) pb-3 font-label text-[12px] uppercase tracking-[0.1em] text-(--ink-muted)"
          >
            What comes with you
          </h2>
          <ul className={ROWS}>
            {session?.finishedAt && (
              <li className={ROW}>
                <span className={LABEL}>Today’s lesson</span>
                <span className={VALUE}>
                  {/* Inline, so the mark stays with the title's first line when it wraps. */}
                  <CheckIcon size={14} className="mr-[6px] inline-block align-[-1px]" />
                  {session.lesson.title}
                </span>
              </li>
            )}
            <li className={ROW}>
              <span className={LABEL}>Your streak</span>
              <span className={VALUE}>{streak === 1 ? "1 day" : `${streak} days`}</span>
            </li>
            <li className={ROW}>
              <span className={LABEL}>Your subjects</span>
              <span className={VALUE}>
                {subjects && subjectNames(subjects).length ? joinList(subjectNames(subjects)) : "None yet"}
              </span>
            </li>
          </ul>
        </aside>
      </div>

      <p className="m-0 mt-(--section-gap) text-[17px] text-(--ink-muted)">
        Already have an account?{" "}
        <Link href="/login" className="text-(--ink) underline-offset-4">
          Log in
        </Link>{" "}
        and today is added to it. ·{" "}
        <Link href="/today/lesson" className="text-(--ink) underline-offset-4">
          Not now
        </Link>
      </p>
    </PaperPage>
  );
}
