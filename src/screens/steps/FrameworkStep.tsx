import { ExamPlan, ExamMeta, stepValid, suggestTitle } from "../../blueprint";
import { EXAM_KINDS, TRIMESTERS, YEAR_OPTIONS } from "../../data";
import { Reveal, DuoButton, Icon, StageFooter, HintLine, Segmented, DuoSelect } from "../../ui";
import { StageTitle, SectionLabel } from "./shared";

/* ═══════════════════ المحطة 3 · إطار الامتحان ═══════════════════ */

export function FrameworkStep({
  plan,
  onMeta,
  onTrimester,
  onBack,
  onNext,
}: {
  plan: ExamPlan;
  onMeta: (patch: Partial<ExamMeta>) => void;
  onTrimester: (t: number) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const valid = stepValid(2, plan);
  return (
    <div className="pb-28">
      <StageTitle n={3} icon="clock" title="إطار الامتحان" sub="نوع التقييم الرسمي، الثلاثي المعني، والسنة الدراسية. منها يُقترح عنوان الامتحان تلقائيًا." />

      <Reveal dir="start" className="mb-6">
        <SectionLabel icon="template" text="نوع الامتحان" />
        <Segmented
          options={EXAM_KINDS.map((k) => ({ value: k.id, label: k.label, sub: k.desc }))}
          value={plan.meta.kind}
          onChange={(v) => onMeta({ kind: v })}
        />
      </Reveal>

      <Reveal dir="end" className="mb-6">
        <SectionLabel icon="clock" text="الثلاثي" />
        <Segmented options={TRIMESTERS.map((t) => ({ value: t.n, label: t.label, sub: t.period }))} value={plan.trimester} onChange={onTrimester} />
      </Reveal>

      <Reveal dir="start" className="mb-6 max-w-xs">
        <DuoSelect label="السنة الدراسية" icon="calendar" value={plan.meta.year} onChange={(v) => onMeta({ year: v })} options={YEAR_OPTIONS.map((y) => ({ value: y, label: y }))} />
      </Reveal>

      <Reveal dir="end">
        <div className="rounded-xl border-2 border-dashed border-pine/40 bg-pine-soft/40 px-4 py-3.5">
          <p className="text-[11.5px] font-bold text-pine-dark">العنوان المقترح تلقائيًا</p>
          <p className="mt-1 font-display text-[15px] font-extrabold leading-relaxed text-ink">{suggestTitle(plan) || "—"}</p>
          <p className="mt-1 text-[11.5px] font-medium text-sub">يمكن تعديله لاحقًا في محطة المعاينة مع باقي الترويسة.</p>
        </div>
      </Reveal>

      <FooterNav back={onBack} ok={valid} hint="الإطار مكتمل — تابع إلى الدروس" next={onNext} />
    </div>
  );
}

function FooterNav({ back, next, nextLabel = "متابعة", nextIcon = "arrowNext", ok, hint }: { back: () => void; next: () => void; nextLabel?: string; nextIcon?: string; ok: boolean; hint: string }) {
  return (
    <StageFooter>
      <DuoButton color="white" icon="arrowBack" onClick={back} className="order-1">
        رجوع
      </DuoButton>
      <DuoButton color="pine" size="lg" icon={nextIcon} disabled={!ok} onClick={next} className="order-2 shrink-0">
        {nextLabel}
      </DuoButton>
      <HintLine ok={ok} text={hint} className="order-3 w-full justify-center text-center sm:order-none sm:w-auto sm:flex-1 sm:justify-start sm:text-start" />
    </StageFooter>
  );
}
