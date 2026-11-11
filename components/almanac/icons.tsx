import type { SVGProps } from "react";

// Inline icons on a 24px grid: 1.6px stroke, round caps, no fills.
// Every icon is decorative. The control that holds it carries the label.

type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & { size?: number };

function Icon({
  size = 18,
  strokeWidth = 1.6,
  children,
  ...rest
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ArrowIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const BackIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon strokeWidth={2.4} {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const CrossIcon = (p: IconProps) => (
  <Icon strokeWidth={2.4} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Icon>
);

export const SendIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </Icon>
);

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Icon>
);

export const MoreIcon = (p: IconProps) => (
  <Icon strokeWidth={2.4} {...p}>
    <path d="M5 12h.01M12 12h.01M19 12h.01" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Icon>
);

export const RetryIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon strokeWidth={2} {...p}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

/** The Google mark, drawn in the same single stroke as the other icons. */
export const GoogleIcon = (p: IconProps) => (
  <Icon strokeWidth={1.8} {...p}>
    <path d="M20 12.2c0-.6 0-1.2-.2-1.7H12v3.3h4.5a3.9 3.9 0 0 1-1.7 2.5v2.1h2.7c1.6-1.5 2.5-3.7 2.5-6.2zM12 20.5c2.3 0 4.2-.8 5.5-2.1l-2.7-2.1c-.7.5-1.7.8-2.8.8a4.9 4.9 0 0 1-4.6-3.4H4.6v2.2A8.5 8.5 0 0 0 12 20.5zM7.4 13.7a5 5 0 0 1 0-3.4V8.1H4.6a8.5 8.5 0 0 0 0 7.8zM12 6.9c1.2 0 2.3.4 3.2 1.2l2.4-2.4A8.5 8.5 0 0 0 4.6 8.1l2.8 2.2A4.9 4.9 0 0 1 12 6.9z" />
  </Icon>
);
