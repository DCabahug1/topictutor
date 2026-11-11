import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { cx } from "./cx";

/**
 * Colours code boxes that name their language (```python). A box without one,
 * or with "text", stays plain, so prose never gets guessed at.
 */
const HIGHLIGHT: [typeof rehypeHighlight, { plainText: string[] }] = [rehypeHighlight, { plainText: ["text", "txt", "plain"] }];

type MarkdownProps = {
  children: string;
  /**
   * block: lesson sections and tutor answers. Lists, tables, code and quotes.
   * inline: questions, options and explanations. Bold, italic, code,
   * strikethrough and code boxes, all as spans, so it is valid inside a
   * heading or a button.
   */
  mode?: "block" | "inline";
  /** Shows the writing caret after the last word. */
  streaming?: boolean;
  /** Block mode only. The first paragraph opens with a drop cap. */
  dropCap?: boolean;
  className?: string;
};

// "span" is only ever the highlighter's colour spans: raw HTML is never rendered.
const INLINE_ELEMENTS = ["p", "strong", "em", "code", "del", "pre", "span"];

/** A heading inside a lesson reads as a strong line, so the reading column stays flat. */
const Heading = ({ children }: { children?: ReactNode }) => <p className="m-0 font-medium text-(--ink)">{children}</p>;

const block: Components = {
  p: ({ children }) => <p className="m-0">{children}</p>,
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  h5: Heading,
  h6: Heading,
  strong: ({ children }) => <strong className="font-semibold text-(--ink)">{children}</strong>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-(--ink) underline decoration-1 underline-offset-[5px] hover:text-(--accent)"
    >
      {children}
    </a>
  ),
  ul: ({ children, className }) => (
    <ul className={cx("m-0 list-disc pl-6 marker:text-(--ink-muted)", className === "contains-task-list" && "list-none pl-1")}>
      {children}
    </ul>
  ),
  ol: ({ children, start }) => (
    <ol start={start} className="m-0 list-decimal pl-6 marker:font-label marker:text-[0.8em] marker:text-(--ink-muted)">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 [&+li]:mt-[0.35em]">{children}</li>,
  input: (props: ComponentProps<"input">) => (
    <input {...props} disabled className="mr-2 h-4 w-4 align-[-2px] accent-(--ink)" />
  ),
  blockquote: ({ children }) => (
    <blockquote className="m-0 border-0 border-l-2 border-solid border-(--rule) pl-4 italic">{children}</blockquote>
  ),
  hr: () => <hr className="m-0 border-0 border-t border-solid border-(--rule)" />,
  pre: ({ children }) => (
    <pre className="m-0 overflow-x-auto bg-(--paper-sunk) p-4 font-code text-[14px] leading-[1.6] text-(--ink) [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[length:inherit]">
      {children}
    </pre>
  ),
  code: ({ children }) => <code className="bg-(--paper-sunk) px-[0.3em] font-code text-[0.86em] text-(--ink)">{children}</code>,
  table: ({ children }) => (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full border-collapse text-[0.88em] leading-[1.45]">{children}</table>
    </div>
  ),
  th: ({ children, style }) => (
    <th
      style={style}
      className="min-w-[8.5rem] border-0 border-b border-solid border-(--ink) px-3 py-2 text-left align-bottom font-medium text-(--ink) first:pl-0"
    >
      {children}
    </th>
  ),
  td: ({ children, style }) => (
    <td style={style} className="min-w-[8.5rem] border-0 border-b border-solid border-(--rule) px-3 py-2 align-top first:pl-0">
      {children}
    </td>
  ),
  img: () => null,
};

const inline: Components = {
  // Spans, not blocks, so this can sit inside a heading or a button. A second
  // paragraph, or one after a code box, starts on its own line (almanac.css).
  p: ({ children }) => <span className="md-inline-p">{children}</span>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }) => <code className="bg-(--paper-sunk) px-[0.25em] font-code text-[0.86em]">{children}</code>,
  // A code box made of a span for the same reason. Fixed type, so it never
  // takes on a 48px heading or an italic line.
  pre: ({ children }) => (
    <span className="md-code mt-3 block overflow-x-auto whitespace-pre bg-(--paper-sunk) p-3 text-left font-code text-[14px] font-normal not-italic leading-[1.6] tracking-normal text-(--ink) md:p-4 md:text-[15px] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[length:inherit]">
      {children}
    </span>
  ),
};

const LANGUAGES =
  "python|py|javascript|js|typescript|ts|jsx|tsx|html|css|scss|json|sql|bash|sh|shell|java|kotlin|swift|go|rust|ruby|rb|php|c|cpp|csharp|cs|r|yaml|text";

/**
 * Some questions were written with a code fence on one line, like
 * "What does this print? ```python print(x) ```", which markdown reads as
 * text. This moves the fence onto its own lines so it shows as a code box.
 * The original line breaks are gone, so statements that plainly follow one
 * another, like "print(a) print(b)", are put back on lines of their own.
 */
function repairFences(text: string): string {
  if (!text.includes("```")) return text;
  const lang = new RegExp(`^(${LANGUAGES})\\s+`, "i");
  return text.replace(/(^|[^\n])```([^\n`][^`]*?)```/g, (_, before: string, inner: string) => {
    const match = inner.match(lang);
    let code = (match ? inner.slice(match[0].length) : inner).trim();
    if (!code.includes("\n")) code = code.replace(/\)\s+(?=[A-Za-z_][\w.]*\()/g, ")\n");
    return `${before}\n\n\`\`\`${match ? match[1].toLowerCase() : ""}\n${code}\n\`\`\`\n\n`;
  });
}

/**
 * Markdown from the writer and the tutor, in the Almanac's own type. Raw HTML
 * is never rendered and links go through react-markdown's URL check, so text
 * from the model can't inject anything.
 */
export function Markdown({ children, mode = "block", streaming = false, dropCap = false, className }: MarkdownProps) {
  if (mode === "inline") {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[HIGHLIGHT]} allowedElements={INLINE_ELEMENTS} unwrapDisallowed components={inline}>
        {repairFences(children)}
      </ReactMarkdown>
    );
  }
  return (
    <div className={cx("md-block", dropCap && "md-drop-cap", streaming && "md-streaming", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[HIGHLIGHT]} components={block}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
