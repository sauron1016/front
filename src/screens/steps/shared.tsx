import { cn, Icon, DuoButton, StageFooter } from "../../ui";

export function StageTitle({ n, title, sub, icon }: { n: number; title: string; sub: string; icon: string }) {
  return (
    <div className="mb-7 flex items-start gap-4">
      <div className="relative shrink-0">
        <span className="grid h-14 w-14 place-items-center rounded-2xl border-b-4 border-pine-dark bg-pine text-ink">
          <Icon name={icon} size={26} />
        </span>
        <span className="absolute -bottom-2 -start-2 grid h-7 w-7 place-items-center rounded-full border-2 border-line bg-white font-display text-[13px] font-extrabold text-pine">
          {n}
        </span>
      </div>
      <div className="pt-1">
        <h2 className="font-display text-[22px] font-extrabold leading-tight text-ink md:text-[26px]">{title}</h2>
        <p className="mt-1 text-[13.5px] font-medium leading-relaxed text-sub md:text-sm">{sub}</p>
      </div>
    </div>
  );
}

export function SectionLabel({ icon, text }: { icon: string; text: string }) {
  return (
    <h3 className="mb-2.5 flex items-center gap-2 font-display text-[15px] font-extrabold text-ink">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-pine-soft text-pine-deep">
        <Icon name={icon} size={15} />
      </span>
      {text}
    </h3>
  );
}

export function HintLine({ ok, text, className }: { ok: boolean; text: string; className?: string }) {
  return (
    <p className={cn("flex min-w-0 items-center gap-2 text-[12.5px] font-bold md:text-[13px]", ok ? "text-pine-dark" : "text-saffron-dark", className)}>
      <Icon name={ok ? "check" : "info"} size={16} className="shrink-0" />
      <span className="truncate">{text}</span>
    </p>
  );
}

export function Chip({ color, soft, icon, text }: { color: string; soft: string; icon: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1 font-display text-[12.5px] font-extrabold" style={{ backgroundColor: soft, color, borderColor: `${color}55` }}>
      <Icon name={icon} size={14} />
      {text}
    </span>
  );
}
