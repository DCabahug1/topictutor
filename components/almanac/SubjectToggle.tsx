import { cx } from "./cx";
import { CheckIcon } from "./icons";

type SubjectToggleProps = {
  name: string;
  on: boolean;
  onToggle: () => void;
};

/** One subject in the picker. A toggle button: check when picked, plus when not. */
export function SubjectToggle({ name, on, onToggle }: SubjectToggleProps) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cx(
        "flex min-h-[52px] cursor-pointer items-center justify-between gap-2 border-[1.5px] border-solid border-(--ink) px-[14px] text-left font-serif text-[17px] leading-[1.2] md:min-h-[60px] md:px-[18px] md:text-[20px] transition-colors duration-(--duration-instant) ease-out",
        on ? "bg-(--ink) text-(--on-ink)" : "bg-transparent text-(--ink) hover:bg-(--paper-sunk)"
      )}
    >
      <span>{name}</span>
      {on ? (
        <CheckIcon size={16} className="flex-none" />
      ) : (
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="flex-none"
        >
          <path d="M12 6v12M6 12h12" />
        </svg>
      )}
    </button>
  );
}
