// Product rules from docs/design/spec.md, as pure functions.

import type { Answer, ChoiceQuestion, SeriesStatus, StreakDay } from "./types";

export const LESSONS_PER_SERIES = 5;

/**
 * Lesson text is markdown in sections. Sections are separated by a line holding
 * only `---`, since a section can have blank lines of its own (a list, a table).
 */
export const SECTION_BREAK = "\n\n---\n\n";

const BREAK_LINE = /^[ \t]*-{3,}[ \t]*$/m;

/**
 * Splits lesson text into its sections. While it is still being written, a
 * half-typed break at the very end is held back so it never shows as text.
 * Finished text with no breaks at all (older lessons, or a writer that forgot)
 * falls back to splitting on blank lines.
 */
export function splitSections(text: string, { streaming = false }: { streaming?: boolean } = {}): string[] {
  let body = text.replace(/\r\n/g, "\n");
  if (streaming) body = body.replace(/\n[ \t]*-{1,3}[ \t]*$/, "");
  const parts = BREAK_LINE.test(body) || streaming ? body.split(new RegExp(BREAK_LINE.source, "gm")) : body.split(/\n\s*\n/);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/**
 * How many sections a lesson body draws. While the text is being written (or
 * hasn't arrived) it holds `reserve` places so the page doesn't jump; once it is
 * written, only the sections it has. A lesson can have fewer than `reserve`
 * sections, and a reserved place left over would sit under the text as a blank.
 */
export function sectionSlots(written: number, reserve: number, writing: boolean): number {
  return writing || written === 0 ? Math.max(reserve, written) : written;
}

// ---- Maths ----
//
// Maths is LaTeX between double dollars: `$$x$$` inside a sentence, or `$$` on
// lines of their own around an equation. Single dollars are never maths, so
// "$5 and $10" stays money.

const CODE = /(`{3,})[^\n]*\n[\s\S]*?\n[ \t]*\1|`[^`\n]+`/g;
const HELD = "\u0000";

/** Swaps code for markers while `edit` runs on the rest, so maths rules never touch code. */
function outsideCode(text: string, edit: (prose: string) => string): string {
  const held: string[] = [];
  const masked = text.replace(CODE, (code) => `${HELD}${held.push(code) - 1}${HELD}`);
  return edit(masked).replace(new RegExp(`${HELD}(\\d+)${HELD}`, "g"), (_, i: string) => held[Number(i)]);
}

// Rough widths, in em, of what KaTeX draws. Only good enough to tell a formula
// that fits on a phone line from one that can't.
const RELATION = new Set(["le", "leq", "ge", "geq", "ne", "neq", "approx", "equiv", "cdot", "times", "div", "pm", "mp", "to", "rightarrow", "leftarrow", "Rightarrow", "Leftarrow", "implies", "iff", "mapsto", "in", "notin", "subset", "subseteq", "supset", "cup", "cap", "sim", "propto", "lt", "gt"]);
const BIG = new Set(["sum", "prod", "int", "iint", "iiint", "oint", "lim", "max", "min", "log", "ln", "sin", "cos", "tan", "exp"]);
const NO_WIDTH = new Set(["left", "right", "big", "Big", "bigg", "Bigg", "displaystyle", "textstyle", "limits", "nolimits"]);
const SCRIPT = 0.7;

/** Where the `{...}` group starting at `open` ends. */
function groupEnd(latex: string, open: number): number {
  let depth = 0;
  for (let i = open; i < latex.length; i += 1) {
    if (latex[i] === "{") depth += 1;
    else if (latex[i] === "}" && (depth -= 1) === 0) return i;
  }
  return latex.length - 1;
}

/** The width of the next argument (a group, a command or one character) and where it ends. */
function argument(latex: string, at: number): [number, number] {
  let i = at;
  while (latex[i] === " ") i += 1;
  if (latex[i] === "{") {
    const end = groupEnd(latex, i);
    return [drawnWidth(latex.slice(i + 1, end)), end + 1];
  }
  if (latex[i] === "\\") {
    const name = latex.slice(i).match(/^\\([a-zA-Z]+|.)/)?.[0] ?? "\\";
    return [drawnWidth(name), i + name.length];
  }
  return [drawnWidth(latex[i] ?? ""), i + 1];
}

/** About how wide a piece of LaTeX draws inline, in em. */
export function drawnWidth(latex: string): number {
  let width = 0;
  let lastScript = -1; // where the last ^ or _ ended, so x_1^2 counts the wider script, not both
  let lastScriptWidth = 0;
  let i = 0;
  while (i < latex.length) {
    const c = latex[i];
    if (c === "^" || c === "_") {
      const [w, end] = argument(latex, i + 1);
      const scaled = w * SCRIPT;
      if (lastScript === i) width += Math.max(0, scaled - lastScriptWidth);
      else width += scaled;
      lastScriptWidth = lastScript === i ? Math.max(scaled, lastScriptWidth) : scaled;
      lastScript = end;
      i = end;
      continue;
    }
    if (c === "\\") {
      const name = latex.slice(i + 1).match(/^[a-zA-Z]+/)?.[0];
      if (!name) {
        width += /[,;:]/.test(latex[i + 1] ?? "") ? 0.2 : latex[i + 1] === "!" ? 0 : 0.5; // spacing, or an escaped character
        i += 2;
        continue;
      }
      i += name.length + 1;
      if (/^[dt]?frac$|^binom$/.test(name)) {
        const [top, afterTop] = argument(latex, i);
        const [bottom, end] = argument(latex, afterTop);
        width += Math.max(top, bottom) * (name === "dfrac" ? 1 : SCRIPT) + 0.3;
        i = end;
      } else if (name === "sqrt") {
        if (latex[i] === "[") i = latex.indexOf("]", i) + 1 || latex.length;
        const [inside, end] = argument(latex, i);
        width += inside + 0.9;
        i = end;
      } else if (/^(text|textbf|textit|mathrm|mathbf|mathit|mathbb|mathcal|operatorname|boldsymbol)$/.test(name)) {
        const [inside, end] = argument(latex, i);
        width += inside;
        i = end;
      } else if (name === "quad") width += 1;
      else if (name === "qquad") width += 2;
      else if (RELATION.has(name)) width += 1.25;
      else if (BIG.has(name)) width += name.length > 3 ? 1.6 : 1.1;
      else if (!NO_WIDTH.has(name)) width += 0.6;
      continue;
    }
    if (c === "{") {
      const end = groupEnd(latex, i);
      width += drawnWidth(latex.slice(i + 1, end));
      i = end + 1;
      continue;
    }
    if (/[+=<>]/.test(c) || (c === "-" && width > 0)) width += 1.25;
    else if (/[,;]/.test(c)) width += 0.45;
    else if (!/[\s}&]/.test(c)) width += 0.55;
    i += 1;
  }
  return width;
}

/**
 * The widest formula that sits in a sentence, in em: about one line of the
 * lesson column on a phone. Anything wider goes on its own line instead.
 */
const MAX_INLINE_WIDTH = 15.5;

/**
 * Tidies maths before it is drawn, leaving it where the writer put it: inline
 * maths stays in its sentence, and an equation the writer set on lines of its
 * own stays there.
 *
 * - `\(x\)` becomes inline `$$x$$`.
 * - `\[x\]` becomes an equation on its own lines, kept inside the list item or
 *   quote it was written in, with punctuation right after it taken inside. So
 *   does inline maths too wide to fit on one line of a phone, since it would
 *   otherwise run off the side.
 * - In inline mode (questions, options, explanations) nothing gets a line of
 *   its own: an equation set apart is folded back into the sentence.
 */
export function normalizeMath(text: string, { inline = false }: { inline?: boolean } = {}): string {
  if (!text.includes("$$") && !text.includes("\\(") && !text.includes("\\[")) return text;
  return outsideCode(text, (prose) => {
    const marked = prose
      .replace(/\\\[([\s\S]+?)\\\]/g, (_, latex: string) => `$$\u0001${latex}$$`)
      .replace(/\\\(([\s\S]+?)\\\)/g, (_, latex: string) => `$$${latex}$$`);

    let out = "";
    let last = 0;
    for (const match of marked.matchAll(/\$\$([^$]+?)\$\$/g)) {
      const whole = match[0];
      const start = match.index;
      const end = start + whole.length;
      const latex = match[1].replace(/^\u0001/, "").trim();
      const isBlock = /^\$\$[ \t]*\n/.test(whole) && /\n[ \t]*\$\$$/.test(whole);
      const display = match[1].startsWith("\u0001") || (!inline && !isBlock && drawnWidth(latex) > MAX_INLINE_WIDTH);

      out += marked.slice(last, start);
      last = end;

      if (inline) {
        // Fold a set-apart equation back into its sentence: one space before
        // it, and none before punctuation after it.
        if (isBlock || display) {
          out = out.replace(/\s+$/, "");
          if (out) out += " ";
          while (last < marked.length && /\s/.test(marked[last])) last += 1;
          if (last < marked.length && !/[.,;:?!)]/.test(marked[last])) {
            out += `$$${latex.replace(/\s*\n\s*/g, " ")}$$ `;
            continue;
          }
        }
        out += `$$${latex.replace(/\s*\n\s*/g, " ")}$$`;
        continue;
      }

      if (!display) {
        out += whole;
        continue;
      }

      // `\[ \]`: an equation on its own lines, inside the list item or quote it was written in.
      const lineStart = marked.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = marked.indexOf("\n", end) === -1 ? marked.length : marked.indexOf("\n", end);
      const line = marked.slice(lineStart, lineEnd);
      if (/^[ \t>]*\|/.test(line)) {
        out += `$$${latex.replace(/\s*\n\s*/g, " ")}$$`; // a table row can't hold a block
        continue;
      }
      const quote = line.match(/^(?:[ \t]*>[ \t]?)*/)?.[0] ?? "";
      const marker = line.slice(quote.length).match(/^[ \t]*(?:[-*+]|\d+[.)])[ \t]+/)?.[0];
      const lead = marker ?? line.slice(quote.length).match(/^[ \t]*/)?.[0] ?? "";
      const indent = quote + " ".repeat(lead.length);
      const textBefore = marked.slice(lineStart + quote.length + lead.length, start).trim() !== "";
      const stop = marked.slice(end, lineEnd).match(/^[ \t]*([.,;:?!]+)/);
      if (stop) last = end + stop[0].length;

      const blank = quote ? `\n${quote.trimEnd()}\n` : "\n\n";
      const body = `${latex}${stop ? stop[1] : ""}`.split("\n").map((l) => indent + l.trim()).join("\n");
      if (textBefore) out = out.replace(/[ \t]+$/, "") + blank + indent;
      out += `$$\n${body}\n${indent}$$`;
      if (marked.slice(last, lineEnd).trim()) {
        out += blank + indent;
        while (last < lineEnd && /[ \t]/.test(marked[last])) last += 1;
      }
    }
    return out + marked.slice(last);
  });
}

/**
 * While text is still being written, maths that has been opened but not closed
 * would show as raw LaTeX for a moment. This holds it back until it is closed.
 */
export function holdBackOpenMath(text: string): string {
  return outsideCode(text, (prose) => {
    let cut = prose.length;
    const dollars = [...prose.matchAll(/\$\$/g)];
    if (dollars.length % 2 === 1) cut = Math.min(cut, dollars[dollars.length - 1].index);
    for (const [open, close] of [["\\[", "\\]"], ["\\(", "\\)"]]) {
      const last = prose.lastIndexOf(open);
      if (last !== -1 && prose.indexOf(close, last) === -1) cut = Math.min(cut, last);
    }
    return prose.slice(0, cut).replace(/[ \t]+$/, "");
  });
}

const LATEX_SYMBOLS: Record<string, string> = {
  int: "∫", iint: "∬", iiint: "∭", oint: "∮", sum: "Σ", prod: "Π", infty: "∞", partial: "∂", nabla: "∇",
  cdot: "·", times: "×", div: "÷", pm: "±", mp: "∓", le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠",
  approx: "≈", equiv: "≡", sim: "∼", propto: "∝", to: "→", rightarrow: "→", leftarrow: "←", Rightarrow: "⇒",
  Leftarrow: "⇐", iff: "⇔", implies: "⇒", mapsto: "↦", in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆",
  supset: "⊃", cup: "∪", cap: "∩", emptyset: "∅", forall: "∀", exists: "∃", neg: "¬", land: "∧", lor: "∨",
  circ: "∘", degree: "°", angle: "∠", perp: "⊥", parallel: "∥", ldots: "…", cdots: "⋯", dots: "…",
  alpha: "α", beta: "β", gamma: "γ", Gamma: "Γ", delta: "δ", Delta: "Δ", epsilon: "ε", varepsilon: "ε",
  zeta: "ζ", eta: "η", theta: "θ", Theta: "Θ", iota: "ι", kappa: "κ", lambda: "λ", Lambda: "Λ", mu: "μ",
  nu: "ν", xi: "ξ", Xi: "Ξ", pi: "π", Pi: "Π", rho: "ρ", sigma: "σ", Sigma: "Σ", tau: "τ", upsilon: "υ",
  phi: "φ", varphi: "φ", Phi: "Φ", chi: "χ", psi: "ψ", Psi: "Ψ", omega: "ω", Omega: "Ω",
};
const LATEX_SPACES = new Set(["left", "right", "big", "Big", "bigg", "Bigg", "displaystyle", "limits", "quad", "qquad"]);

const SUPERSCRIPT: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", n: "ⁿ", i: "ⁱ",
};
const SUBSCRIPT: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉", "+": "₊", "-": "₋",
};

/** `^2` as ², `^{n+1}` as ^(n+1). */
function script(body: string, table: Record<string, string>, mark: string): string {
  const chars = [...body];
  if (chars.every((c) => table[c])) return chars.map((c) => table[c]).join("");
  return chars.length === 1 ? `${mark}${body}` : `${mark}(${body})`;
}

/** LaTeX as something a screen reader can say: `\frac{1}{2^n}` as 1/(2ⁿ). Readable, not exact. */
export function readLatex(latex: string): string {
  let text = latex;
  const group = "\\{([^{}]*)\\}";
  for (let i = 0; i < 6; i += 1) {
    const before = text;
    text = text
      .replace(/\\(?:text|textbf|textit|mathrm|mathbf|mathit|mathbb|mathcal|operatorname|boldsymbol)\s*\{([^{}]*)\}/g, "$1")
      .replace(new RegExp(`\\\\[dt]?frac\\s*${group}\\s*${group}`, "g"), (_, a: string, b: string) => {
        const wrap = (s: string) => (/^[\w.ⁿ⁰¹²³⁴⁵⁶⁷⁸⁹]+$/.test(s.trim()) ? s.trim() : `(${s.trim()})`);
        return `${wrap(a)}/${wrap(b)}`;
      })
      .replace(new RegExp(`\\\\sqrt\\s*\\[([^\\]]*)\\]\\s*${group}`, "g"), (_, n: string, x: string) => `${script(n, SUPERSCRIPT, "^")}√(${x})`)
      .replace(new RegExp(`\\\\sqrt\\s*${group}`, "g"), "√($1)")
      .replace(new RegExp(`\\^\\s*${group}`, "g"), (_, b: string) => script(b.trim(), SUPERSCRIPT, "^"))
      .replace(new RegExp(`_\\s*${group}`, "g"), (_, b: string) => script(b.trim(), SUBSCRIPT, "_"));
    if (text === before) break;
  }
  return text
    .replace(/\\[dt]?frac\s*(\w)\s*(\w)/g, "$1/$2")
    .replace(/\^\s*\\circ/g, "°")
    .replace(/\^([0-9a-zA-Z+-])/g, (_, c: string) => script(c, SUPERSCRIPT, "^"))
    .replace(/_([0-9a-zA-Z+-])/g, (_, c: string) => script(c, SUBSCRIPT, "_"))
    .replace(/\\([a-zA-Z]+)/g, (_, name: string) => (LATEX_SYMBOLS[name] ?? (LATEX_SPACES.has(name) ? " " : name)))
    .replace(/\\[,;:! ]/g, " ")
    .replace(/\\\\/g, " ")
    .replace(/\\([{}|])/g, "$1")
    .replace(/[{}&]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Markdown with its marks taken out, for screen-reader announcements and plain previews. */
export function plainText(markdown: string): string {
  // Maths first, set aside so the markdown rules below don't eat its ^, _ and *.
  const maths: string[] = [];
  const held = markdown
    .replace(/\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\\\(([\s\S]+?)\\\)/g, (_, a?: string, b?: string, c?: string) => {
      return `${HELD}${maths.push(readLatex(a ?? b ?? c ?? "")) - 1}${HELD}`;
    });
  return held
    .replace(/```[\s\S]*?```/g, (block) => block.replace(/```\w*/g, ""))
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]*(#{1,6}|>|[-*+]|\d+[.)])[ \t]+/gm, "")
    .replace(/^[ \t]*\|?[ \t]*:?-{3,}:?[ \t]*(\|[ \t]*:?-{3,}:?[ \t]*)*\|?[ \t]*$/gm, "")
    .replace(/\|/g, " ")
    .replace(/(\*\*|__|~~|\*|_|`)/g, "")
    .replace(/^[ \t]*-{3,}[ \t]*$/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .replace(new RegExp(`${HELD}(\\d+)${HELD}`, "g"), (_, i: string) => maths[Number(i)])
    .trim();
}
export const MASTERY_PASS = 4;

/** Local calendar date as YYYY-MM-DD. Streaks follow the learner's own timezone. */
export function localDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** The date `days` before (negative) or after (positive) a YYYY-MM-DD date. */
export function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return localDate(new Date(y, m - 1, d + days));
}

export function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** (lessons with their check answered, plus 1 if the Mastery Check is passed) / 6. */
export function percentComplete(lessonsDone: number, masteryPassed: boolean): number {
  return Math.round(((lessonsDone + (masteryPassed ? 1 : 0)) / (LESSONS_PER_SERIES + 1)) * 100);
}

export function seriesStatus(lessonsDone: number, masteryPassed: boolean): SeriesStatus {
  if (masteryPassed) return "completed";
  return lessonsDone > 0 ? "inProgress" : "notStarted";
}

/** The Mastery Check opens when all five lesson checks are answered. */
export function masteryOpen(lessonsDone: number): boolean {
  return lessonsDone >= LESSONS_PER_SERIES;
}

export function masteryPassed(score: number): boolean {
  return score >= MASTERY_PASS;
}

/** Not sure and no answer both score as wrong. */
export function scoreAnswers(questions: ChoiceQuestion[], answers: Array<Answer | null>): number {
  return questions.filter((q, i) => answers[i] === q.correctIndex).length;
}

/**
 * Consecutive days with any lesson finished, counted back from today.
 * Not having finished one yet today never breaks the streak.
 */
export function streakCount(finishedDates: Iterable<string>, today: string = localDate()): number {
  const done = new Set(finishedDates);
  let day = done.has(today) ? today : shiftDate(today, -1);
  let count = 0;
  while (done.has(day)) {
    count += 1;
    day = shiftDate(day, -1);
  }
  return count;
}

export function longestStreak(finishedDates: Iterable<string>): number {
  const sorted = [...new Set(finishedDates)].sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const day of sorted) {
    run = previous && shiftDate(previous, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  return best;
}

/** The last seven days, oldest first, ending today. */
export function lastSevenDays(finishedDates: Iterable<string>, today: string = localDate()): StreakDay[] {
  return recentDays(finishedDates, 7, today);
}

/** The last `length` days, oldest first, ending today. */
export function recentDays(finishedDates: Iterable<string>, length: number, today: string = localDate()): StreakDay[] {
  const done = new Set(finishedDates);
  return Array.from({ length }, (_, i) => {
    const date = shiftDate(today, i - (length - 1));
    const name = parseLocalDate(date).toLocaleDateString("en-US", { weekday: "long" });
    return {
      letter: name[0],
      short: name.slice(0, 3),
      name,
      date,
      done: done.has(date),
      isToday: date === today,
    };
  });
}

/** "1", "1 and 2", "1, 2 and 3". */
export function joinList(items: Array<string | number>): string {
  if (items.length <= 1) return String(items[0] ?? "");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** The sentence under a placement score, built from the missed questions. */
export function focusLine(questions: ChoiceQuestion[], answers: Array<Answer | null>): string {
  const missed = questions.map((q, i) => (answers[i] === q.correctIndex ? -1 : i)).filter((i) => i >= 0);
  if (missed.length === 0) {
    return "You got all five. Your series skips the basics and goes further on each topic.";
  }
  if (missed.length === questions.length) {
    return "A fresh start. Your series begins from the ground up and takes each topic slowly.";
  }
  const numbers = joinList(missed.map((i) => i + 1));
  const topics = joinList(missed.map((i) => questions[i].topic ?? `question ${i + 1}`));
  return `You missed ${missed.length === 1 ? "question" : "questions"} ${numbers}, so your series spends the most time on ${topics}.`;
}

/** The "why this is in your series" line for lesson `index` (0-based). */
export function whyLine(questions: ChoiceQuestion[], answers: Array<Answer | null>, index: number): string {
  const question = questions[index];
  if (!question) return "";
  return answers[index] === question.correctIndex
    ? `A quick refresher. You got question ${index + 1} right.`
    : `Here because you missed question ${index + 1}, on ${question.topic ?? "this topic"}.`;
}

/** Options that point at each other or at a lettered list only make sense in the order they were written. */
export function keepsOrder(options: string[]): boolean {
  return options.some(
    (o) =>
      /^\s*\(?[A-D][.,:)\s]/.test(o) ||
      /^\s*(version|option|snippet|example|line)\s+\d/i.test(o) ||
      /\b(all|none|both) of (the )?(above|these)\b/i.test(o)
  );
}

/** The same question with its options in a new random order. */
export function shuffleChoice<T extends { options: string[]; correctIndex: number }>(question: T): T {
  const order = question.options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...question, options: order.map((i) => question.options[i]), correctIndex: order.indexOf(question.correctIndex) };
}
