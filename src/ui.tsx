import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const BOUMA_URL =
  "https://image.qwenlm.ai/generated-images/a0346b5f-84ff-4000-bd3f-605d0ae1094f/_result.png";

/* ================= أيقونات مرسومة خصيصًا ================= */

const PATHS: Record<string, ReactNode> = {
  /* مواد */
  qalam: (
    <>
      <path d="M20.5 3.5c-1.9-.3-3.7.4-5 1.7L4.6 16.1 3 21l4.9-1.6L18.8 8.5c1.3-1.3 2-3.1 1.7-5Z" />
      <path d="m14.5 6.5 3 3M6.5 14.5l3 3" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="4" r="1.7" />
      <path d="M11.2 5.5 6.8 19.5M12.8 5.5l4.4 14M8.6 13.8a8.5 8.5 0 0 0 6.8 0" />
      <path d="M7.8 18.6a10 10 0 0 0 8.4 0" />
    </>
  ),
  livre: (
    <>
      <path d="M12 6.6 9.7 5.4C7.7 4.4 5 4.4 3 5.4v13c2-1 4.7-1 6.7 0l2.3 1.2 2.3-1.2c2-1 4.7-1 6.7 0v-13c-2-1-4.7-1-6.7 1L12 6.6Z" />
      <path d="M12 6.6v13M16 9.5h3" />
    </>
  ),
  chat: (
    <>
      <path d="M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6.5L6 19.5V16a3 3 0 0 1-2-2.8V7Z" />
      <path d="M8 8.5h8M8 11.5h5" />
    </>
  ),
  flask: (
    <>
      <path d="M10 3v5.5L4.8 18a2.4 2.4 0 0 0 2.1 3.5h10.2A2.4 2.4 0 0 0 19.2 18L14 8.5V3" />
      <path d="M8.5 3h7M7.5 14.5h9" />
      <circle cx="10" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="18.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  minaret: (
    <>
      <path d="M12 2.5c.4 1.6 2 2.4 2 4.2a2 2 0 0 1-4 0c0-1.8 1.6-2.6 2-4.2Z" />
      <path d="M9 12.5h6l.8 8H8.2l.8-8ZM10.5 12.5V9.8a1.5 1.5 0 0 1 3 0v2.7M6 21h12" />
    </>
  ),
  ballot: (
    <>
      <path d="M5 12h14v8.5H5z" />
      <path d="M3 12l2.2-3.5h13.6L21 12M9.5 8.5v-5h5v5" />
      <path d="M9.5 15.5h5" />
    </>
  ),
  arch: (
    <>
      <path d="M4.5 20.5V11a7.5 7.5 0 0 1 15 0v9.5" />
      <path d="M9 20.5v-6.5a3 3 0 0 1 6 0v6.5M2.5 20.5h19M6.5 11h11" />
    </>
  ),
  tunmap: (
    <>
      <path d="M9.5 2.5 12 2l2.6 1 2.7.7 1.2 1.7-1.6 1.3-1.6-.4-1.3 1.2.6 2.3 1.4 1.6-.4 2.5-1.5 2.4-.9 2.8-1.8 2.5-2.2 1.4-1.9-.7.3-2.7-.7-2.6-1.5-2.7.2-2.8L6.6 8l.8-2.8 2.1-2.7Z" />
      <circle cx="12.6" cy="5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2.2-.8 2.2-1.9 0-1-.7-1.5-.7-2.3 0-1.1.9-1.8 2-1.8h1.6A3.9 3.9 0 0 0 21 11c0-4.4-4-8-9-8Z" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="7" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  music: (
    <>
      <path d="M9 18.5V6l10-2v12.5" />
      <circle cx="6.5" cy="18.5" r="2.5" />
      <circle cx="16.5" cy="16.5" r="2.5" />
    </>
  ),
  dumbbell: <path d="M6.5 7.5v9M3.5 9.5v5M17.5 7.5v9M20.5 9.5v5M6.5 12h11" />,
  /* تقييم */
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-4.5M9 7.5h6" />
    </>
  ),
  pen: (
    <>
      <path d="m14.5 5 4.5 4.5L8 20.5l-5 1 1-5L14.5 5Z" />
      <path d="m12.5 7 4.5 4.5M20.5 3.5 18 6" />
    </>
  ),
  hand: (
    <>
      <path d="M5 13.5V6.8a1.4 1.4 0 0 1 2.8 0v5.4M7.8 11.5V4.9a1.4 1.4 0 0 1 2.8 0v6.3M10.6 11.2V6a1.4 1.4 0 0 1 2.8 0v6.8" />
      <path d="M13.4 12.8V8.6a1.4 1.4 0 0 1 2.8 0v6.2c0 3.8-2.4 6.7-6 6.7-3 0-4.4-1.6-5.8-4.4L3 14.4a1.4 1.4 0 0 1 2.4-1.4l1.2 1.8" />
    </>
  ),
  sigma: <path d="M18 6.5V4.5H6l7 7.5-7 7.5h12v-2" />,
  hash: <path d="M5 9h14M5 15h14M9.5 4 7.5 20M16.5 4l-2 16" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  ruler: (
    <>
      <path d="m3 17 14-14 4 4L7 21l-4-4Z" />
      <path d="m7.5 12.5 1.5 1.5M10.5 9.5 12 11M13.5 6.5 15 8" />
    </>
  ),
  chart: (
    <>
      <path d="M4 4v16h16" />
      <path d="M8 16v-5M12 16V8M16 16v-3" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3l1.9 4.6 4.6 1.4-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4L12 3Z" />
      <path d="m18.5 15 .8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9Z" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13.5 9 5 9-5M3 18l9 5 9-5" strokeOpacity="0.55" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8 2.5V7M16 2.5V7" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4.5 18 4.5-4.5 3 3 3.5-3.5 4 4" />
    </>
  ),
  heart: <path d="M12 20.5s-8-4.6-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 6.4-8 11-8 11Z" />,
  /* واجهة */
  check: <path d="m4.5 12.5 5 5 10-11" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  link: (
    <>
      <path d="m9.5 14.5 5-5" />
      <path d="M11 8l2.5-2.5a3.54 3.54 0 0 1 5 5L16 13M8 11l-2.5 2.5a3.54 3.54 0 0 0 5 5L13 16" />
    </>
  ),
  grip: (
    <>
      <circle cx="9" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="6" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="9" cy="18" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  template: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
      <path d="M3.5 9.5h17M10 9.5V20.5" />
    </>
  ),
  seal: (
    <>
      <circle cx="12" cy="12" r="8" strokeDasharray="3 2.6" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="m12 6.2.9 1.9 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3.9-1.9Z" fill="currentColor" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4-4" />
    </>
  ),
  chevUp: <path d="m6 14.5 6-5.5 6 5.5" />,
  chevDown: <path d="m6 9.5 6 5.5 6-5.5" />,
  arrowBack: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  arrowNext: (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  school: (
    <>
      <path d="m3 10.5 9-5.5 9 5.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20M12 4.5V7" />
    </>
  ),
  file: (
    <>
      <path d="M6 2.5h8L19 7.5v14H6v-19Z" />
      <path d="M14 2.5v5h5M9 12.5h6M9 16h4.5" />
    </>
  ),
  printer: (
    <>
      <path d="M7 8V3h10v5" />
      <rect x="3" y="8" width="18" height="9" rx="2" />
      <path d="M7 14h10v7H7z" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 6.3" />
      <path d="M20 5v6h-6" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
  user: (
    <>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 19v3" />
    </>
  ),
  fileDown: (
    <>
      <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v5h5" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11M7.5 10 12 14.5 16.5 10" />
      <path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
    </>
  ),
  wand: (
    <>
      <path d="m5 19 9.5-9.5M13 4.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
      <path d="m19 10 .6 1.5 1.4.5-1.4.5-.6 1.5-.6-1.5-1.4-.5 1.4-.5.6-1.5Z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5v.2" />
    </>
  ),
  edit: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
    </>
  ),
  star: <path d="m12 2.5 2.9 5.9 6.6 1-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-1L12 2.5Z" />,
  alert: (
    <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 10v4.5M12 17.5v.2" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.9,
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {PATHS[name] ?? PATHS.star}
    </svg>
  );
}

/* ================= الزر الأساسي ================= */

type BtnColor = "pine" | "red" | "blue" | "saffron" | "white" | "ghost";

const BTN: Record<BtnColor, string> = {
  pine: "bg-pine text-ink border-pine-dark hover:brightness-95 focus-visible:ring-pine/40",
  red: "bg-tun text-ink border-tun-dark hover:brightness-95 focus-visible:ring-tun/40",
  blue: "bg-blue text-ink border-blue-dark hover:brightness-95 focus-visible:ring-blue/40",
  saffron: "bg-saffron text-ink border-saffron-dark hover:brightness-95 focus-visible:ring-saffron/40",
  white: "bg-white text-blue-dark border-line hover:bg-paper focus-visible:ring-blue/20",
  ghost: "bg-transparent text-sub border-transparent hover:bg-line/40",
};

export function DuoButton({
  children,
  color = "pine",
  size = "md",
  className,
  disabled,
  onClick,
  icon,
  type = "button",
}: {
  children?: ReactNode;
  color?: BtnColor;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  icon?: string;
  type?: "button" | "submit";
}) {
  const sizes = {
    xs: "h-8 px-3 text-xs rounded-lg border-b-[3px] gap-1.5",
    sm: "h-10 px-4 text-sm rounded-xl border-b-4 gap-1.5",
    md: "h-11 px-5 text-[15px] rounded-xl border-b-4 gap-2",
    lg: "h-13 px-7 text-base rounded-xl border-b-4 gap-2",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex select-none items-center justify-center font-display font-bold tracking-tight transition-all duration-100 focus:outline-none focus-visible:ring-4",
        sizes[size],
        disabled ? "cursor-not-allowed border-line-dark bg-line text-faint" : BTN[color],
        !disabled && "active:translate-y-[3px] active:border-b-[1px]",
        className
      )}
    >
      {icon && <Icon name={icon} size={size === "xs" ? 14 : size === "lg" ? 20 : 17} />}
      {children}
    </button>
  );
}

/* ================= مربع اختيار ================= */
export function DuoCheckbox({
  checked,
  onChange,
  size = "md",
  color = "pine",
}: {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
  color?: "pine" | "blue";
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border-2 transition-all duration-100",
        size === "sm" ? "h-5 w-5" : "h-6 w-6",
        checked
          ? color === "pine"
            ? "border-pine-dark bg-pine text-ink"
            : "border-blue-dark bg-blue text-ink"
          : "border-line-dark bg-white text-transparent hover:border-pine"
      )}
    >
      {checked && <Icon name="check" size={size === "sm" ? 12 : 14} strokeWidth={3.4} className="anim-pop" />}
    </button>
  );
}

/* ================= مقاييس ================= */
export function ProgressBar({
  value,
  color = "pine",
  className,
  height = "h-3.5",
  shimmer = false,
}: {
  value: number;
  color?: "pine" | "saffron" | "red" | "blue";
  className?: string;
  height?: string;
  shimmer?: boolean;
}) {
  const fills = { pine: "bg-pine", saffron: "bg-saffron", red: "bg-tun", blue: "bg-blue" };
  return (
    <div className={cn("w-full overflow-hidden rounded-full bg-line", height, className)}>
      <div
        className={cn("relative h-full rounded-full transition-all duration-700 ease-out", fills[color])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      >
        <div className="absolute inset-x-2 top-[3px] h-[25%] rounded-full bg-white/25" />
        {shimmer && <div className="shimmer absolute inset-0 rounded-full" />}
      </div>
    </div>
  );
}

export function SegmentedBar({
  total,
  done,
  className,
  height = "h-2",
}: {
  total: number;
  done: number;
  className?: string;
  height?: string;
}) {
  return (
    <div className={cn("flex w-full gap-1.5", className)}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn("flex-1 overflow-hidden rounded-full transition-all duration-500", height, i < done ? "bg-pine" : "bg-line")}>
          {i < done && <div className="mx-1 mt-[2px] h-[28%] rounded-full bg-white/25" />}
        </div>
      ))}
    </div>
  );
}

export function CountUp({ value, className }: { value: number; className?: string }) {
  const [disp, setDisp] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 320);
      const e = 1 - Math.pow(1 - p, 3);
      setDisp(from + (to - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={className}>{Number.isInteger(disp) ? disp : disp.toFixed(1)}</span>;
}

/* ================= عناصر تحكم ================= */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: string; sub?: string }[];
  value: T | null;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full gap-1.5 rounded-2xl border-2 border-line bg-paper p-1.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "flex-1 rounded-xl px-2 py-2 text-center font-display font-bold transition-all duration-150",
              active ? "border-b-4 border-blue-dark bg-white text-blue-dark shadow-sm" : "text-sub hover:bg-white/70 hover:text-ink"
            )}
          >
            <span className="block text-[13px] md:text-sm">{o.label}</span>
            {o.sub && <span className={cn("mt-0.5 block text-[10.5px] font-body font-medium", active ? "text-blue/70" : "text-faint")}>{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  step = 1,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, Math.round((value - step) * 2) / 2))}
        className="grid h-8 w-8 place-items-center rounded-lg border-b-[3px] border-line bg-paper text-sub transition-all hover:bg-line/50 active:translate-y-[2px] active:border-b-[1px]"
        aria-label="إنقاص"
      >
        <Icon name="minus" size={14} />
      </button>
      <span className="w-11 text-center font-display text-base font-bold text-ink tabular-nums">{fmt(value)}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, Math.round((value + step) * 2) / 2))}
        className="grid h-8 w-8 place-items-center rounded-lg border-b-[3px] border-pine-dark bg-pine text-ink transition-all hover:brightness-95 active:translate-y-[2px] active:border-b-[1px]"
        aria-label="زيادة"
      >
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}

export function DuoInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  icon,
  dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  icon?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 font-display text-[13px] font-bold text-ink">
        {icon && <Icon name={icon} size={15} className="text-sub" />}
        {label}
        {required && <span className="text-tun">*</span>}
      </span>
      <input
        value={value}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border-2 border-line bg-white px-3.5 py-2.5 font-body text-[14.5px] text-ink outline-none transition-all placeholder:text-faint focus:border-pine focus:ring-4 focus:ring-pine/15"
      />
    </label>
  );
}

export function DuoSelect({
  label,
  value,
  onChange,
  options,
  icon,
  dir,
  noneLabel,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: string;
  dir?: "ltr" | "rtl";
  noneLabel?: string;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 flex items-center gap-1.5 font-display text-[13px] font-bold text-ink">
          {icon && <Icon name={icon} size={15} className="text-sub" />}
          {label}
        </span>
      )}
      <select
        value={value}
        dir={dir}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer rounded-xl border-2 border-line bg-white px-3.5 py-2.5 font-body text-[14.5px] text-ink outline-none transition-all focus:border-pine focus:ring-4 focus:ring-pine/15"
      >
        {noneLabel && <option value="">{noneLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label?: string }) {
  return (
    <button type="button" onClick={onChange} className="flex cursor-pointer items-center gap-2.5 text-start" role="switch" aria-checked={checked}>
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full border-2 transition-colors", checked ? "border-pine-dark bg-pine" : "border-line-dark bg-line")}>
        <span className={cn("absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all", checked ? "start-[22px]" : "start-[2px]")} />
      </span>
      {label && <span className="text-[13px] font-medium text-ink">{label}</span>}
    </button>
  );
}

/* ================= كشف عند التمرير ================= */
export function Reveal({
  children,
  dir = "up",
  delay = 0,
  className,
}: {
  children: ReactNode;
  dir?: "up" | "start" | "end";
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn("rv", dir === "up" ? "rv-up" : dir === "start" ? "rv-start" : "rv-end", inView && "rv-in", className)}
    >
      {children}
    </div>
  );
}

/* ================= درج (كتالوج) ================= */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) setMounted(true);
    else {
      const t = setTimeout(() => setMounted(false), 240);
      return () => clearTimeout(t);
    }
  }, [open]);
  if (!mounted) return null;
  // نركّبه في body كي لا يحبسَه تحويل (transform) خاص بانتقال المحطات
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className={cn("absolute inset-0 bg-ink/45", open ? "anim-fade-in" : "opacity-0 transition-opacity duration-200")} onClick={onClose} />
      <div
        className={cn(
          "absolute bottom-0 start-0 end-0 max-h-[82vh] overflow-y-auto rounded-t-2xl border-t-2 border-line bg-white shadow-2xl lg:bottom-4 lg:top-16 lg:end-6 lg:start-auto lg:w-[430px] lg:rounded-2xl lg:border-2",
          open ? "anim-sheet lg:anim-side-in" : "translate-y-full transition-transform duration-200"
        )}
      >
        <div className="sticky top-0 z-10 border-b-2 border-line bg-white px-5 py-4">
          <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-line lg:hidden" />
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-extrabold text-ink">{title}</h3>
              {subtitle && <p className="mt-0.5 text-[12.5px] font-medium text-sub">{subtitle}</p>}
            </div>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-sub transition-colors hover:bg-paper hover:text-ink" aria-label="إغلاق">
              <Icon name="x" size={18} />
            </button>
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

/* ================= تذييل المحطة ================= */
export function StageFooter({ children }: { children: ReactNode }) {
  // نركّبه في body مباشرة كي لا يحبسَه تحويل (transform) خاص بانتقال المحطات
  return createPortal(
    <div className="no-print fixed bottom-0 start-0 end-0 z-30 border-t-2 border-line bg-white/95 backdrop-blur lg:start-72">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 md:px-8">{children}</div>
    </div>,
    document.body
  );
}

/* ================= سطر التلميح ================= */
export function HintLine({ ok, text, className }: { ok: boolean; text: string; className?: string }) {
  return (
    <p className={cn("flex min-w-0 items-center gap-2 text-[12.5px] font-bold md:text-[13px]", ok ? "text-pine-dark" : "text-saffron-dark", className)}>
      <Icon name={ok ? "check" : "info"} size={16} className="shrink-0" />
      <span className="truncate">{text}</span>
    </p>
  );
}
