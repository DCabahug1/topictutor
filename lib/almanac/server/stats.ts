import "server-only";
import type { GuestState, Stats, Subject } from "../types";
import { check, db, type Learner } from "./context";
import { finishesOf, streakFrom, subjectsOf } from "./daily";
import { guestDailyLimitReached, guestSeriesUsed } from "./placement";

export async function getStats(learner: Learner): Promise<Stats> {
  const userId = learner.userId;
  const finishes = await finishesOf(userId);
  const streak = streakFrom(finishes, learner.today);

  const [recallRows, seriesRows] = userId
    ? await Promise.all([
        db().from("daily_progress").select("recall_correct").eq("user_id", userId).not("recall_correct", "is", null),
        db().from("series").select("id, title, mastery_passed, mastery_best").eq("user_id", userId).eq("is_sample", false),
      ]).then(([recall, series]) => [
        check(recall) as Array<{ recall_correct: boolean }>,
        check(series) as Array<{ id: string; title: string; mastery_passed: boolean; mastery_best: number | null }>,
      ] as const)
    : ([[], []] as const);

  const counts = new Map<Subject, number>();
  for (const f of finishes) counts.set(f.subject, (counts.get(f.subject) ?? 0) + 1);

  return {
    streak,
    totalLessons: finishes.length,
    lastSevenDays: streak.week.map((day) => ({ ...day, count: finishes.filter((f) => f.local_date === day.date).length })),
    recall: { correct: recallRows.filter((r) => r.recall_correct).length, total: recallRows.length },
    seriesCompleted: seriesRows.filter((s) => s.mastery_passed).length,
    masteryScores: seriesRows
      .filter((s) => s.mastery_best !== null)
      .map((s) => ({ seriesId: s.id, title: s.title, best: s.mastery_best! })),
    bySubject: [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([subject, lessons]) => ({ subject, lessons })),
  };
}

export async function getGuestState(learner: Learner): Promise<GuestState> {
  const userId = learner.userId;
  const [finishes, settings, used, limit] = await Promise.all([
    finishesOf(userId),
    subjectsOf(userId),
    userId && learner.isGuest ? guestSeriesUsed(userId) : Promise.resolve(false),
    guestDailyLimitReached(),
  ]);
  return {
    hasProgress: finishes.length > 0,
    streak: streakFrom(finishes, learner.today).count,
    seriesUsed: used,
    dailyLimitReached: limit,
    subjectsPrompted: settings.prompted,
  };
}
