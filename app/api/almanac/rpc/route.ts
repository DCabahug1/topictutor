import { after } from "next/server";
import { backgroundTasks, getLearner } from "@/lib/almanac/server/context";
import { rpc } from "@/lib/almanac/server/dispatch";
import type { RpcReply } from "@/lib/almanac/protocol";
import { AlmanacError } from "@/lib/almanac/types";

// Generating a placement test or a Mastery Check can take most of a minute.
export const maxDuration = 120;

const reply = (body: RpcReply, status = 200) => Response.json(body, { status });

/** One AlmanacSource call: { method, args } in, { ok, data } or { ok: false, kind } out. */
export async function POST(request: Request) {
  let body: { method?: unknown; args?: unknown };
  try {
    body = await request.json();
  } catch {
    return reply({ ok: false, kind: "loadFailed" }, 400);
  }
  const call = typeof body.method === "string" ? rpc(body.method, body.args ?? []) : null;
  if (!call) return reply({ ok: false, kind: "loadFailed" }, 400);

  const background = backgroundTasks();
  after(background.drain);
  try {
    const learner = await getLearner(request, background.defer);
    const data = await call(learner);
    return reply({ ok: true, data: data ?? null });
  } catch (cause) {
    if (cause instanceof AlmanacError) return reply({ ok: false, kind: cause.kind });
    console.error(`[almanac] ${body.method}:`, cause);
    return reply({ ok: false, kind: "loadFailed" }, 500);
  }
}
