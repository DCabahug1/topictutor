"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Caret } from "@/components/almanac/Button";
import { Notice } from "@/components/almanac/Notice";
import { SessionPage } from "@/components/almanac/Page";
import { StepMeter } from "@/components/almanac/StepMeter";
import { changeStep } from "@/components/almanac/stepTransition";
import { almanac, useAlmanac, type Mastery } from "@/lib/almanac";
import { QUESTION_HEADING } from "../../new/components/parts";
import { MasteryLocked } from "./MasteryLocked";
import { MasteryResult } from "./MasteryResult";
import { MasteryTaking } from "./MasteryTaking";
import { SeriesLoading, SeriesProblem } from "./SeriesStates";

export function MasteryCheck() {
  const { id } = useParams<{ id: string }>();
  return <MasteryForSeries key={id} id={id} />;
}

function MasteryForSeries({ id }: { id: string }) {
  const mastery = useAlmanac(() => almanac.getMastery(id), [id]);
  // For the lesson titles, the progress and to know the sample series.
  const series = useAlmanac(() => almanac.getSeries(id), [id]);
  const [writeFailed, setWriteFailed] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [retakeFailed, setRetakeFailed] = useState(false);
  // True once the check has moved on during this visit: the next screen then takes focus at its heading.
  const [moved, setMoved] = useState(false);

  // Once the check is open, its questions are written straight away.
  const status = mastery.data?.status;
  const { setData } = mastery;
  useEffect(() => {
    if (status !== "ready" || writeFailed) return;
    let current = true;
    almanac
      .writeMastery(id)
      .then((written) => {
        if (!current) return;
        changeStep(() => {
          setMoved(true);
          setData(written);
        });
      })
      .catch(() => {
        if (current) setWriteFailed(true);
      });
    return () => {
      current = false;
    };
  }, [status, writeFailed, id, setData]);

  const error = mastery.error ?? series.error;
  if (error) {
    return (
      <SeriesProblem
        notFound={error.kind === "notFound"}
        what="check"
        onRetry={() => {
          mastery.reload();
          series.reload();
        }}
      />
    );
  }
  if (!mastery.data || !series.data) return <SeriesLoading label="Loading the Mastery Check" />;

  const seriesHref = `/series/${id}`;

  // Clears the answers. The status goes back to ready, so new questions are written.
  const retake = async () => {
    setRetaking(true);
    setRetakeFailed(false);
    try {
      const fresh = await almanac.retakeMastery(id);
      changeStep(() => {
        setWriteFailed(false);
        window.scrollTo({ top: 0 });
        setMoved(true);
        setData(fresh);
      });
    } catch {
      setRetakeFailed(true);
    } finally {
      setRetaking(false);
    }
  };

  switch (mastery.data.status) {
    case "locked":
      return <MasteryLocked mastery={mastery.data} series={series.data} />;

    case "ready":
      if (writeFailed) {
        return (
          <SessionPage leaveHref={seriesHref} leaveLabel="Leave check">
            <Notice
              tone="error"
              headingLevel={1}
              kicker="Couldn’t write questions"
              title="Your Mastery Check didn’t come through."
              body="Your lessons, checks and progress are untouched. Try again whenever you’re ready."
              primary={{ label: "Try again", onClick: () => setWriteFailed(false) }}
              secondary={{ label: "or back to the series", href: seriesHref }}
            />
          </SessionPage>
        );
      }
      return <MasteryWriting seriesHref={seriesHref} focusHeading={moved} />;

    case "taking":
      return (
        <MasteryTaking
          mastery={mastery.data}
          focusHeading={moved}
          onUpdate={(next: Mastery) => {
            if (next.status !== "taking") setMoved(true);
            setData(next);
          }}
        />
      );

    default:
      return (
        <MasteryResult
          mastery={mastery.data}
          focusHeading={moved}
          onRetake={retake}
          retaking={retaking}
          retakeFailed={retakeFailed}
        />
      );
  }
}

/** Shown for the two seconds or so it takes to write the five questions. */
function MasteryWriting({ seriesHref, focusHeading }: { seriesHref: string; focusHeading: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusHeading) heading.current?.focus();
  }, [focusHeading]);

  return (
    <SessionPage
      leaveHref={seriesHref}
      leaveLabel="Leave check"
      rail={<StepMeter steps={5} current={-1} label="Mastery Check · writing the questions" />}
      footer={
        <Button disabled busy>
          Writing questions
        </Button>
      }
    >
      <section aria-busy="true">
        <p className="t-eyebrow m-0 flex items-center gap-2">
          <Caret className="h-[14px]" />
          Mastery Check
        </p>
        <h1 ref={heading} tabIndex={-1} className={QUESTION_HEADING}>
          Writing five questions from your five lessons.
        </h1>
        <p className="m-0 mt-5 text-[17px] italic text-(--ink-muted)">
          Usually a few seconds. You can leave and come back. Nothing is lost.
        </p>
        <div aria-hidden="true" className="mt-10 flex flex-col gap-[10px]">
          <span className="h-[58px] bg-(--paper-sunk)" />
          <span className="h-[58px] bg-(--paper-sunk)" />
          <span className="h-[58px] bg-(--paper-sunk)" />
          <span className="h-[58px] bg-(--paper-sunk)" />
        </div>
      </section>
    </SessionPage>
  );
}
