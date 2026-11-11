import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cx } from "./cx";

type MarkdownProps = {
  children: string;
  /**
   * block: lesson sections and tutor answers. Lists, tables, code and quotes.
   * inline: questions, options and explanations. Bold, italic, code and
   * strikethrough only, rendered inline, so nothing nests inside a button.
   */
  mode?: "block" | "inline";
  /** Shows the writing caret after the last word. */
  streaming?: boolean;
  /** Block mode only. The first paragraph opens with a drop cap. */
  dropCap?: boolean;
  className?: string;
};

const INLINE_ELEMENTS = ["p", "strong", "em", "code", "del"];

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
    <ol start={start} className="m-0 list-decimal pl-6 marker:font-mono marker:text-[0.8em] marker:text-(--ink-muted)">
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
    <pre className="m-0 overflow-x-auto bg-(--paper-sunk) p-4 font-mono text-[14px] leading-[1.6] text-(--ink) [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[length:inherit]">
      {children}
    </pre>
  ),
  code: ({ children }) => <code className="bg-(--paper-sunk) px-[0.3em] font-mono text-[0.86em] text-(--ink)">{children}</code>,
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
  p: ({ children }) => <>{children}</>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  code: ({ children }) => <code className="bg-(--paper-sunk) px-[0.25em] font-mono text-[0.86em]">{children}</code>,
};

/**
 * Markdown from the writer and the tutor, in the Almanac's own type. Raw HTML
 * is never rendered and links go through react-markdown's URL check, so text
 * from the model can't inject anything.
 */
export function Markdown({ children, mode = "block", streaming = false, dropCap = false, className }: MarkdownProps) {
  if (mode === "inline") {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} allowedElements={INLINE_ELEMENTS} unwrapDisallowed components={inline}>
        {children}
      </ReactMarkdown>
    );
  }
  return (
    <div className={cx("md-block", dropCap && "md-drop-cap", streaming && "md-streaming", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={block}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
