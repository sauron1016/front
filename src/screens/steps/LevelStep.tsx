import { arabicDigits, CYCLES, GRADES } from "../../data";
import { ExamPlan, stepValid } from "../../blueprint";
import { Reveal, DuoButton, Icon, StageFooter, HintLine, cn } from "../../ui";
import { StageTitle } from "./shared";

/* ═══════════════════ المحطة 1 · المستوى ═══════════════════ */

export function LevelStep({ plan, onGrade, onNext }: { plan: ExamPlan; onGrade: (g: number) => void; onNext: () => void }) {
  const valid = stepValid(0, plan);
  return (
    <div className="pb-28">
      <StageTitle n={1} icon="school" title="المستوى الدراسي" sub="حدّد السنة وفق هيكل التعليم الأساسي التونسي: المرحلة الأولى (أساسي) ثم المرحلة الثانية (تأصيل) المؤدية إلى مناظرة السادسة." />
      <div className="space-y-7">
        {CYCLES.map((c, ci) => (
          <Reveal key={c.n} dir={ci % 2 ? "end" : "start"}>
            <div className="mb-3 flex items-center gap-2.5">
              <span className={cn("h-3.5 w-3.5 rounded-full border-b-2", c.n === 1 ? "border-pine-dark bg-pine" : "border-blue-dark bg-blue")} />
              <h3 className="font-display text-base font-extrabold text-ink">{c.title}</h3>
              <span className="text-xs font-medium text-sub">({c.sub})</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              {GRADES.filter((g) => g.cycle === c.n).map((g) => {
                const sel = plan.grade === g.n;
                return (
                  <button
                    key={g.n}
                    type="button"
                    onClick={() => onGrade(g.n)}
                    className={cn(
                      "group relative flex flex-col items-center gap-1.5 rounded-xl border-2 bg-white px-2 py-3.5 transition-all duration-150 hover:-translate-y-0.5 sm:py-4",
                      sel ? "border-pine-dark bg-pine-soft/40 shadow-[0_4px_0_#0f9c84]" : "border-line shadow-[0_4px_0_#dfe6ea] hover:border-pine/60"
                    )}
                  >
                    {sel && (
                      <span className="anim-pop absolute -top-2 -start-2 grid h-6 w-6 place-items-center rounded-full border-2 border-pine-dark bg-pine text-ink">
                        <Icon name="check" size={12} strokeWidth={3.4} />
                      </span>
                    )}
                    <span
                      className={cn(
                        "grid h-10 w-10 place-items-center rounded-lg border-b-[3px] font-display text-lg font-extrabold transition-colors sm:h-11 sm:w-11",
                        sel ? "border-pine-dark bg-pine text-ink" : "border-line bg-paper text-sub group-hover:bg-pine-soft group-hover:text-pine-deep"
                      )}
                    >
                      {arabicDigits(g.n)}
                    </span>
                    <span className={cn("font-display text-[12px] font-bold sm:text-[12.5px]", sel ? "text-pine-dark" : "text-ink")}>{g.short}</span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        ))}
      </div>

      <FooterNav ok={valid} hint="المستوى محدد — تابع إلى المادة" next={onNext} />
    </div>
  );
}

function FooterNav({ back, next, nextLabel = "متابعة", nextIcon = "arrowNext", ok, hint, nextDisabled }: { back?: () => void; next: () => void; nextLabel?: string; nextIcon?: string; ok: boolean; hint: string; nextDisabled?: boolean }) {
  return (
    <StageFooter>
      {back && (
        <DuoButton color="white" icon="arrowBack" onClick={back} className="order-1">
          رجوع
        </DuoButton>
      )}
      <DuoButton color="pine" size="lg" icon={nextIcon} disabled={nextDisabled || !ok} onClick={next} className={cn("order-2 shrink-0", !back && "ms-auto")}>
        {nextLabel}
      </DuoButton>
      <HintLine ok={ok} text={ok ? hint : hint} className="order-3 w-full justify-center text-center sm:order-none sm:w-auto sm:flex-1 sm:justify-start sm:text-start" />
    </StageFooter>
  );
}
