import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { DATE_HEADER } from "../protocol";
import { shiftDate } from "../rules";
import { AlmanacError } from "../types";

/** Who is asking, and what day it is for them. Built once per request from verified claims. */
export type Learner = {
  /** Null for a visitor with no session at all: reads only. */
  userId: string | null;
  /** An anonymous session: a guest. */
  isGuest: boolean;
  /** The learner's own calendar date, YYYY-MM-DD. */
  today: string;
  /** Keeps work going after the response: writing ahead, finishing a lesson the reader left. */
  defer: (task: Promise<unknown>) => void;
};

/**
 * Work started during a request that must finish even if the reader leaves.
 * The route hands `drain` to next/server's after(), which runs once the
 * response is done, by which time every task has been registered.
 */
export function backgroundTasks() {
  const tasks: Promise<unknown>[] = [];
  return {
    defer: (task: Promise<unknown>) => {
      tasks.push(task.catch((cause) => console.error("[almanac] background:", cause)));
    },
    drain: async () => {
      for (let i = 0; i < tasks.length; i += 1) await tasks[i];
    },
  };
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The learner's date from the header, if it is within a day of UTC (every
 * timezone is), otherwise UTC. Nobody can claim a lesson for next week.
 */
function learnerDate(header: string | null): string {
  const utc = utcDate();
  if (header && DATE.test(header) && (header === utc || header === shiftDate(utc, -1) || header === shiftDate(utc, 1))) {
    return header;
  }
  return utc;
}

export async function getLearner(request: Request, defer: Learner["defer"]): Promise<Learner> {
  const store = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Refreshed cookies are written by the middleware.
        }
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  return {
    userId: typeof claims?.sub === "string" ? claims.sub : null,
    isGuest: Boolean(claims?.is_anonymous),
    today: learnerDate(request.headers.get(DATE_HEADER)),
    defer,
  };
}

/** For writes: a learner with a session, or the call is refused. */
export function requireUser(learner: Learner): string {
  if (!learner.userId) throw new AlmanacError("loadFailed", "No session");
  return learner.userId;
}

export const db = () => createAdminClient();

/** Throws loadFailed for any database error, so screens show "didn't load", never a code. */
export function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) {
    console.error("[almanac] database:", result.error.message);
    throw new AlmanacError("loadFailed");
  }
  return result.data;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids from the address bar that aren't ours read as not found, not as a database error. */
export function isUuid(id: string): boolean {
  return UUID.test(id);
}
