import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = (p: IconProps): IconProps => ({
  viewBox: "0 0 24 24",
  width: "1em",
  height: "1em",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": p["aria-label"] ? undefined : true,
  focusable: "false",
  ...p,
});

export const ShieldIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.9 7.5-9.5V6L12 3Z" />
  </svg>
);

export const StarIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
  </svg>
);

export const MedalIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 3h3l1 4m4-4h-3l-1 4" />
    <circle cx="12" cy="15" r="5.5" />
    <path d="m12 12.5.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2.8-1.6Z" />
  </svg>
);

export const TrophyIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 6H4.5v1.5A3.5 3.5 0 0 0 8 11m8-5h3.5v1.5A3.5 3.5 0 0 1 16 11" />
    <path d="M12 13v4m-3.5 3h7M10 17h4v3h-4z" />
  </svg>
);

export const GemIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 4h11l3.5 5-9 11L3 9l3.5-5Z" />
    <path d="M3 9h18M9.5 4 8 9l4 11 4-11-1.5-5" />
  </svg>
);

export const CrownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m3 7 4.5 4L12 5l4.5 6L21 7l-2 11H5L3 7Z" />
    <path d="M5 21h14" />
  </svg>
);

export const LockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const VolumeOnIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);

export const VolumeOffIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
    <path d="m16 9.5 5 5m0-5-5 5" />
  </svg>
);

export const GlobeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
  </svg>
);

export const UsersIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <path d="M15.5 5.3a3.5 3.5 0 0 1 0 6.4M17.5 14.3c2.3.7 4 2.6 4 5.7" />
  </svg>
);

export const UserIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
  </svg>
);

export const MailIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 7 8.5 6.5L20.5 7" />
  </svg>
);

export const SpinnerIcon = (p: IconProps) => (
  <svg {...base({ className: "animate-spin", ...p })}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);

/** Xiangqi-style brand mark: a round piece with an inner ring. */
export const BrandIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5.5" />
    <path d="M12 9v6M9 12h6" />
  </svg>
);

/** Filled side marker; pass `side` to pick the colour. */
export function SideDot({
  side,
  ...p
}: IconProps & { side: "r" | "b" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      aria-hidden="true"
      focusable="false"
      {...p}
    >
      <circle
        cx="12"
        cy="12"
        r="8"
        fill={side === "r" ? "#dc2626" : "#1c1917"}
        stroke={side === "r" ? "#fca5a5" : "#a8a29e"}
        strokeWidth="2"
      />
    </svg>
  );
}

const TIER_ICONS = {
  shield: ShieldIcon,
  star: StarIcon,
  medal: MedalIcon,
  trophy: TrophyIcon,
  gem: GemIcon,
  crown: CrownIcon,
} as const;

export type TierIconName = keyof typeof TIER_ICONS;

export function TierIcon({
  name,
  ...p
}: IconProps & { name: TierIconName }) {
  const Icon = TIER_ICONS[name];
  return <Icon {...p} />;
}
