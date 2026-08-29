import { useEffect, useState } from "react";
import type { BackendSubject } from "../../api/curriculum";
import { agentGenerate, agentEdit, agentStatus } from "../../api/agent";
import { stepValid, totalPoints, uid, fmtPoints, type ExerciseSlot, type ExamPlan } from "../../blueprint";
import { CountUp, DuoButton, Icon, ProgressBar, Reveal, StageFooter, cn } from "../../ui";
import { SectionLabel, StageTitle } from "./shared";

type Phase = "idle" | "working" | "review";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-2 font-display text-[15px] font-extrabold tracking-wide text-pine-deep">{children}</h3>;
}

interface Draft {
  title: string;
  instructions: string;
  answerKey: string[];
  rubric: string;
  htmlContent: string;
  images: { url: string }[];
  sourceIds: string[];
  linkingMode: "standalone" | "linked";
  linkedToId: string | null;
}

export function ExerciseWizardStep({
  plan,
  subjects,
  onChangeExercises,
  onChangeAiDocument,
  onBack,
  onNext,
  onToast,
}: {
  plan: ExamPlan;
  subjects: BackendSubject[];
  onChangeExercises: (exercises: ExerciseSlot[]) => void;
  onChangeAiDocument: (doc?: { mode: "full" | "manual"; htmlContent: string; images?: string[]; savedId?: string }) => void;
  onBack: () => void;
  onNext: () => void;
  onToast: (msg: string) => void;
}) {
  // Always start at the chooser - a previous document is offered as a banner instead
  const [mode, setMode] = useState<"auto" | "manual" | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [workLabel, setWorkLabel] = useState("");
  const [error, setError] = useState("");
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [mockConfirm, setMockConfirm] = useState<(() => void) | null>(null);

  // Check AI connectivity as soon as the step opens
  useEffect(() => {
    let alive = true;
    agentStatus()
      .then((s) => alive && setAiConfigured(s.configured))
      .catch(() => alive && setAiConfigured(false));
    return () => {
      alive = false;
    };
  }, []);

  // manual flow
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [linkingMode, setLinkingMode] = useState<"standalone" | "linked">("standalone");
  const [linkedToId, setLinkedToId] = useState<string>("");
  const [desired, setDesired] = useState(4);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editText, setEditText] = useState("");

  const accepted = plan.exercises;
  const acceptedTotal = totalPoints(accepted);
  const remaining = Math.max(0, Math.round((20 - acceptedTotal) * 4) / 4);

  const wholeLessons = Array.from(plan.lessonTitles.entries())
    .filter(([id]) => plan.lessons.includes(id))
    .map(([id, title]) => ({ id, title }));

  const subjectName = subjects.find((s) => s.id === plan.subjectId)?.nameAr || "";
    function guardLessons(): boolean {
    if (selectedLessonIds.length === 0 && wholeLessons.length > 0) {
      setSelectedLessonIds(wholeLessons.map((l) => l.id));
      return true;
    }
    return selectedLessonIds.length > 0;
  }

  async function runFullExam() {
    setError("");
    if (!guardLessons()) {
      onToast("لا توجد دروس مختارة — عُد إلى المحطة السابقة");
      return;
    }
    setWorkLabel("الوكيل يكتب الامتحان كاملاً… قد يستغرق لحظات");
    setPhase("working");
    try {
      const result = await agentGenerate({
        mode: "full",
        language: "ar",
        subjectName,
        gradeLabel: plan.grade ? `السنة ${plan.grade} أساسي` : undefined,
        lessons: wholeLessons.map((l) => ({ id: l.id, title: l.title })),
      });
      onChangeAiDocument({ mode: "full", htmlContent: result.htmlContent, images: result.images });
      onToast("تم توليد الامتحان كاملاً — انتقلت إلى المراجعة");
      onNext();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التوليد");
      setPhase("idle");
    }
  }

  async function runGenerateExercise(isAlternative: boolean) {
    setError("");
    if (!guardLessons()) return;
    const budget = remaining;
    if (desired > budget) {
      onToast(`المتبقّي من النقاط ${fmtPoints(budget)} فقط`);
      return;
    }
    setWorkLabel(isAlternative ? "جاري توليد نسخة بديلة…" : "الوكيل يكتب التمرين…");
    setPhase("working");
    try {
      const lessons = (selectedLessonIds.length ? selectedLessonIds : wholeLessons.map((l) => l.id)).map((id) => ({
        id,
        title: plan.lessonTitles.get(id),
      }));
      const linkedEx = accepted.find((a) => a.id === linkedToId);
      const ex = await agentGenerate({
        mode: "exercise",
        exerciseNo: accepted.length + 1,
        desiredPoints: desired,
        language: "ar",
        subjectName,
        gradeLabel: plan.grade ? `السنة ${plan.grade} أساسي` : undefined,
        lessons,
        linkingMode,
        linkedToId: linkingMode === "linked" ? linkedToId || accepted[accepted.length - 1]?.id : undefined,
        linkedContext:
          linkingMode === "linked"
            ? linkedEx?.htmlContent
              ? linkedEx.htmlContent.replace(/<[^>]*>/g, " ").slice(0, 600)
              : linkedEx?.label
            : undefined,
        alternative: isAlternative,
      });
      setDraft({
        title: "",
        instructions: "",
        answerKey: [],
        rubric: "",
        htmlContent: ex.htmlContent,
        images: ex.images.map((url) => ({ url })),
        sourceIds: lessons.map((l) => l.id),
        linkingMode,
        linkedToId: linkingMode === "linked" ? linkedToId || accepted[accepted.length - 1]?.id || null : null,
      });
      setPhase("review");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التوليد");
      setPhase("idle");
    }
  }

  async function applyEdit() {
    if (!draft || !editText.trim()) return;
    setWorkLabel("الوكيل يعدّل التمرين…");
    setPhase("working");
    try {
      const ex = await agentEdit({ htmlContent: draft.htmlContent, instruction: editText.trim(), language: "ar" });
      setDraft((d) => (d ? { ...d, htmlContent: ex.htmlContent } : d));
      setEditText("");
      setPhase("review");
      onToast("طُبِّق التعديل");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل التعديل");
      setPhase("review");
    }
  }

  function removeImage(idx: number) {
    setDraft((d) => (d ? { ...d, images: d.images.filter((_, i) => i !== idx) } : d));
  }

  function acceptExercise() {
    if (!draft) return;
    const slot: ExerciseSlot = {
      id: uid(),
      typeId: "ai",
      label: `التمرين ${accepted.length + 1}`,
      points: desired,
      linkedTo: draft.linkedToId,
      htmlContent: draft.htmlContent,
      images: draft.images,
      sourceLessonIds: draft.sourceIds,
    };
    onChangeExercises([...accepted, slot]);
    setDraft(null);
    setSelectedLessonIds([]);
    setLinkingMode("standalone");
    setLinkedToId("");
    setDesired(Math.max(1, Math.min(4, remaining)));
    setPhase("idle");
    onToast("قُبل التمرين — أضف التالي أو أنهِ للمراجعة");
    window.scrollTo({ top: 0 });
  }

  function finishManual() {
    if (accepted.length === 0) {
      onToast("أنجز تمرينًا واحدًا على الأقل");
      return;
    }
    const header = `<h1>${subjectName || "امتحان"}${plan.grade ? ` — السنة ${plan.grade} أساسي` : ""}</h1><p>المدة: ${plan.meta.duration} دقيقة</p>`;
    const body = accepted.map((a) => a.htmlContent || "").join("\n<hr />\n");
    onChangeAiDocument({ mode: "manual", htmlContent: header + body, images: [] });
    onToast("انتقلت إلى مراجعة الامتحان الكامل");
    onNext();
  }

  const busy = phase === "working";
  const canFinishManual = accepted.length > 0;
  const overBudget = acceptedTotal > 20;

  function requestGenerate(action: () => void) {
    if (aiConfigured === false) {
      setMockConfirm(() => action);
      return;
    }
    action();
  }

  return (
    <div className="pb-44 sm:pb-28">
      <StageTitle n={5} icon="wand" title="مولّد الامتحان الذكي" sub="اختر التوليد التلقائي للامتحان كاملاً، أو ابنِه تمرينًا بعد تمرين بإشراف الوكيل." />

      {/* حالة الاتصال بواجهة الذكاء الاصطناعي */}
      {aiConfigured === false && (
        <div className="anim-fade-up mb-4 flex items-start gap-2.5 rounded-xl border-2 border-saffron/60 bg-saffron-soft px-4 py-3">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0 text-saffron-dark" />
          <p className="text-[13px] font-bold leading-relaxed text-saffron-dark">
            لم يتم ضبط مفتاح الذكاء الاصطناعي على الخادم — سيعمل التوليد حاليًا بوضع المحاكاة بمحتوى تجريبي.
            <span className="block text-[11.5px] font-medium">يمكن للمشرف لصق مفتاح مزوّد الذكاء في إعدادات الخادم (/api/settings) لتفعيل التوليد الحقيقي.</span>
          </p>
        </div>
      )}

      {/* شريط تقدّم العلامة /20 */}
      {(mode !== null || accepted.length > 0) && (
        <Reveal dir="end" className="mb-4">
          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-display text-[13px] font-extrabold text-ink">علامة الامتحان</span>
              <span className={cn("font-display text-[15px] font-extrabold tabular-nums", overBudget ? "text-tun-dark" : acceptedTotal === 20 ? "text-pine-dark" : "text-sub")}>
                <CountUp value={acceptedTotal} /> / 20
              </span>
            </div>
            <ProgressBar value={(Math.min(acceptedTotal, 20) / 20) * 100} color={overBudget ? "red" : acceptedTotal === 20 ? "pine" : "saffron"} height="h-3" shimmer={acceptedTotal === 20} />
            {overBudget && <p className="mt-1.5 text-[11.5px] font-bold text-tun-dark">تجاوزت العلامة المطلوبة — احذف تمرينًا أو عدّل النقاط</p>}
          </div>
        </Reveal>
      )}

      {/* مستند سابق من جلسة سابقة */}
      {mode === null && plan.aiDocument?.htmlContent && (
        <div className="card anim-fade-up mb-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-b-4 border-jasmine-dark bg-jasmine text-ink"><Icon name="file" size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[13.5px] font-extrabold text-ink">لديك مستند جاهز من قبل</p>
            <p className="truncate text-[12px] font-medium text-sub">يمكنك متابعة مراجعته وتصديره، أو بدء مستند جديد.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <DuoButton size="sm" color="white" icon="eye" onClick={onNext}>معاينة</DuoButton>
            <DuoButton size="sm" color="red" icon="refresh" onClick={() => { onChangeAiDocument(undefined); onToast("بدأت مستندًا جديدًا"); }}>جديد</DuoButton>
          </div>
        </div>
      )}

      {error && <div className="anim-fade-up mb-4 rounded-xl border-2 border-tun bg-tun/10 p-3 font-display text-[13px] font-bold text-tun-dark">{error}</div>}

      {/* تأكيد وضع المحاكاة عند غياب المفتاح */}
      {mockConfirm && (
        <div className="no-print fixed inset-0 z-[90] grid place-items-center p-4">
          <div className="anim-fade-in absolute inset-0 bg-ink/50" onClick={() => setMockConfirm(null)} />
          <div className="anim-pop relative w-full max-w-sm rounded-2xl border-2 border-saffron bg-white p-6 text-center shadow-xl">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-b-4 border-saffron-dark bg-saffron text-ink">
              <Icon name="alert" size={26} />
            </span>
            <h4 className="mt-3 font-display text-lg font-extrabold text-ink">الذكاء الاصطناعي غير مُفعَّل</h4>
            <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-sub">سيتم التوليد بوضع المحاكاة بمحتوى تجريبي. هل تريد المتابعة؟</p>
            <div className="mt-5 flex flex-col gap-2.5">
              <DuoButton color="white" className="w-full" onClick={() => setMockConfirm(null)}>إلغاء</DuoButton>
              <DuoButton icon="wand" className="w-full" onClick={() => { const a = mockConfirm; setMockConfirm(null); a(); }}>متابعة بالمحاكاة</DuoButton>
            </div>
          </div>
        </div>
      )}

      {busy && (
        <div className="card grid place-items-center py-16">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-line border-t-pine" />
          <p className="font-display text-[15px] font-extrabold text-ink">{workLabel}</p>
        </div>
      )}

      {!busy && mode === null && (
        <div className="grid gap-4 md:grid-cols-2">
          {([
            { key: "auto", icon: "spark", title: "توليد تلقائي كامل", desc: "يكتب الوكيل الامتحان بأكمله دفعة واحدة انطلاقًا من الدروس المختارة، ثم تراجعه وتطلب أي تعديل.", cta: "ابدأ التوليد الكامل", color: "pine" },
            { key: "manual", icon: "layers", title: "تمرينًا بتمرين", desc: "ولّد كل تمرين على حدة، عدّله، اقبله، ثم انتقل للتالي حتى اكتمال العلامة.", cta: "ابدأ بالتمرين الأول", color: "white" },
          ] as const).map((opt) => (
            <Reveal key={opt.key} dir="end">
              <div className="card flex h-full flex-col gap-3 p-5">
                <span className={cn("grid h-12 w-12 place-items-center rounded-2xl border-b-4 font-display", opt.key === "auto" ? "border-pine-dark bg-pine text-ink" : "border-line-dark bg-paper text-sub")}>
                  <Icon name={opt.icon} size={24} />
                </span>
                <h3 className="font-display text-lg font-extrabold text-ink">{opt.title}</h3>
                <p className="min-h-16 flex-1 text-[13.5px] font-medium leading-relaxed text-sub">{opt.desc}</p>
                <DuoButton color={opt.color} icon="arrowNext" onClick={() => setMode(opt.key)}>{opt.cta}</DuoButton>
              </div>
            </Reveal>
          ))}
          {wholeLessons.length > 0 && (
            <p className="md:col-span-2 text-center text-[12px] font-medium text-faint">الدروس المختارة للامتحان: {wholeLessons.map((l) => l.title).join(" · ")}</p>
          )}
        </div>
      )}

      {!busy && mode === "auto" && phase === "idle" && (
        <>
          <SectionHeading>ملخص التوليد</SectionHeading>
          <div className="card anim-fade-up mb-5 space-y-2 p-5">
            <p className="text-[14px] font-semibold text-ink">سيكتب الوكيل امتحانًا كاملاً (20 نقطة) يغطي:</p>
            <ul className="list-disc pe-6 text-[13px] font-medium leading-relaxed text-sub">
              {wholeLessons.map((l) => (<li key={l.id}>{l.title}</li>))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <DuoButton size="sm" color="white" icon="arrowBack" onClick={() => setMode(null)}>تغيير النمط</DuoButton>
              <DuoButton icon="wand" onClick={() => requestGenerate(runFullExam)}>توليد الامتحان الآن</DuoButton>
            </div>
          </div>
        </>
      )}

      {!busy && mode === "manual" && phase === "idle" && !draft && (
        <>
          <SectionHeading>{`التمرين القادم رقم ${accepted.length + 1}`}</SectionHeading>
          <SectionLabel icon="layers" text="دروس هذا التمرين" />
          <div className="card anim-fade-up mb-4 p-4">
            <div className="mb-3 flex gap-2">
              <DuoButton size="xs" color="white" icon="check" onClick={() => setSelectedLessonIds(wholeLessons.map((l) => l.id))}>كل الدروس</DuoButton>
              <DuoButton size="xs" color="white" icon="refresh" onClick={() => setSelectedLessonIds([])}>مسح</DuoButton>
              <span className="ms-auto self-center text-[11.5px] font-bold text-faint">{fmtPoints(remaining)} نقطة متبقّية</span>
            </div>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {wholeLessons.map((l) => {
                const checked = selectedLessonIds.includes(l.id);
                return (
                  <li key={l.id}>
                    <button type="button" onClick={() => setSelectedLessonIds((o) => o.includes(l.id) ? o.filter((x) => x !== l.id) : [...o, l.id])} className={cn("flex w-full items-center gap-2 rounded-xl border-2 px-3 py-2 text-start transition-all", checked ? "border-pine-dark bg-pine-soft/60" : "border-line bg-white hover:border-pine/50")}>
                      <span className={cn("grid h-5 w-5 shrink-0 place-items-center rounded-md border-2", checked ? "border-pine-dark bg-pine text-ink" : "border-line-dark bg-white text-transparent")}>
                        <Icon name="check" size={12} strokeWidth={3.4} />
                      </span>
                      <span className={cn("truncate text-[13px] font-semibold", checked ? "text-ink" : "text-sub")}>{l.title}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <SectionLabel icon="link" text="صلة التمرين والنقاط" />
          <div className="card anim-fade-up mb-4 space-y-3 p-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setLinkingMode("standalone")} className={cn("rounded-xl border-2 px-3 py-2.5 text-start", linkingMode === "standalone" ? "border-pine-dark bg-pine-soft/60" : "border-line bg-white")}>
                <span className="block font-display text-[13.5px] font-extrabold text-ink">مستقل</span>
                <span className="block text-[11.5px] text-sub">سند خاص به</span>
              </button>
              <button type="button" disabled={accepted.length === 0} onClick={() => setLinkingMode("linked")} className={cn("rounded-xl border-2 px-3 py-2.5 text-start disabled:opacity-50", linkingMode === "linked" ? "border-saffron-dark bg-saffron-soft" : "border-line bg-white")}>
                <span className="block font-display text-[13.5px] font-extrabold text-ink">مرتبط بسند سابق</span>
                <span className="block text-[11.5px] text-sub">أسئلة جديدة على نفس السند</span>
              </button>
            </div>
            {linkingMode === "linked" && accepted.length > 0 && (
              <select value={linkedToId || accepted[accepted.length - 1].id} onChange={(e) => setLinkedToId(e.target.value)} className="w-full cursor-pointer rounded-xl border-2 border-line bg-white px-3 py-2.5 text-[13.5px] font-semibold outline-none focus:border-pine">
                {accepted.map((a, i) => (<option key={a.id} value={a.id}>التمرين {i + 1}</option>))}
              </select>
            )}
            <label className="flex items-center gap-3">
              <span className="font-display text-[13px] font-extrabold text-sub">علامة هذا التمرين:</span>
              <input type="number" min={0.5} max={remaining} step={0.5} value={desired} onChange={(e) => setDesired(Math.max(0.5, Math.min(remaining || 0.5, Number(e.target.value))))} className="w-24 rounded-lg border-2 border-line px-2 py-1.5 text-center font-display font-bold tabular-nums outline-none focus:border-pine" />
              <span className="text-[11.5px] font-medium text-faint">يقرّر الوكيل توزيعها على الأسئلة</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <DuoButton color="white" size="sm" icon="arrowBack" onClick={() => setMode(null)}>تغيير النمط</DuoButton>
            <div className="flex flex-wrap gap-2">
              {canFinishManual && (
                <DuoButton color="blue" icon="eye" onClick={finishManual}>إنهاء ومراجعة الامتحان</DuoButton>
              )}
              <DuoButton icon="wand" disabled={remaining <= 0} onClick={() => requestGenerate(() => runGenerateExercise(false))}>ولّد التمرين</DuoButton>
            </div>
          </div>

          {accepted.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {accepted.map((a, i) => (
                <li key={a.id} className={cn("inline-flex items-center gap-1.5 rounded-lg border-2 px-2 py-1 font-display text-[11.5px] font-bold", a.linkedTo ? "border-saffron/60 bg-saffron-soft text-saffron-dark" : "border-line bg-paper text-sub")}>
                  {i + 1}. {a.label} · {fmtPoints(a.points)}ن
                  <button type="button" aria-label="إزالة" onClick={() => onChangeExercises(accepted.filter((x) => x.id !== a.id))} className="opacity-50 hover:opacity-100"><Icon name="x" size={11} /></button>
                </li>
              ))}
              <li className="inline-flex items-center rounded-lg bg-pine-soft px-2 py-1 font-display text-[11.5px] font-extrabold text-pine-dark">المجموع {fmtPoints(acceptedTotal)}/20</li>
            </ul>
          )}
        </>
      )}

      {!busy && mode === "manual" && draft && phase === "review" && (
        <>
          <SectionLabel icon="eye" text={`مراجعة التمرين ${accepted.length + 1}`} />
          <div className="card anim-fade-up mb-4 overflow-hidden">
            <div dir="rtl" className="exam-preview px-6 py-5 [&_.answer-key]:mt-4 [&_.answer-key]:rounded-lg [&_.answer-key]:border-2 [&_.answer-key]:border-dashed [&_.answer-key]:border-jasmine-dark [&_.answer-key]:bg-jasmine-soft/40 [&_figure]:my-3 [&_figure]:text-center [&_h3]:font-display [&_img]:mx-auto [&_img]:max-h-48 [&_img]:rounded-lg [&_ol]:list-decimal [&_ol]:pe-6 [&_table]:w-full [&_ul]:list-disc [&_ul]:pe-6" dangerouslySetInnerHTML={{ __html: draft.htmlContent }} />
            {draft.images.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t-2 border-line bg-paper/60 px-5 py-3">
                {draft.images.map((im, i) => (
                  <span key={i} className="relative">
                    <img src={im.url} alt={`صورة ${i + 1}`} className="h-16 w-16 rounded-lg border-2 border-line object-cover" />
                    <button type="button" onClick={() => removeImage(i)} aria-label="حذف الصورة" className="absolute -top-1.5 -start-1.5 grid h-5 w-5 place-items-center rounded-full bg-tun text-white shadow"><Icon name="x" size={10} strokeWidth={3} /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-2.5 border-t-2 border-line bg-paper/40 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <DuoButton size="sm" color="white" icon="refresh" onClick={() => runGenerateExercise(true)}>نسخة بديلة</DuoButton>
              </div>
              <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} placeholder="اطلب من الوكيل تعديل هذا التمرين: «اجعل السؤال الثاني اختيارًا من متعدد وأضف صورة»…" className="w-full rounded-xl border-2 border-line bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-pine" />
              <div className="flex flex-wrap justify-between gap-2">
                <DuoButton size="sm" color="ghost" icon="x" onClick={() => { setDraft(null); setPhase("idle"); }}>إلغاء المسودة</DuoButton>
                <div className="flex flex-wrap gap-2">
                  <DuoButton size="sm" color="white" icon="wand" disabled={!editText.trim()} onClick={applyEdit}>طبّق التعديل</DuoButton>
                  <DuoButton size="sm" color="pine" icon="check" onClick={acceptExercise}>قبول وإضافة ({fmtPoints(desired)}ن)</DuoButton>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <StageFooter>
        <DuoButton color="white" icon="arrowBack" onClick={onBack} className="order-1 w-auto">رجوع</DuoButton>
        <div className="hidden sm:order-none sm:mt-0 sm:flex-1 sm:text-center sm:block">
          {mode === null
            ? "اختر نمط التوليد للبدء"
            : stepValid(4, plan)
              ? "جاهز للمعاينة والتصدير"
              : mode === "manual"
                ? `المجموع الحالي ${fmtPoints(acceptedTotal)}/20 — أنجز تمرينًا على الأقل`
                : "أكمل التوليد للانتقال إلى المراجعة"}
        </div>
        {mode === "manual" && (
          <DuoButton color="pine" size="lg" icon="arrowNext" disabled={!stepValid(4, plan)} onClick={finishManual} className="order-2 ms-auto w-full shrink-0 sm:w-auto">
            مراجعة الامتحان
          </DuoButton>
        )}
      </StageFooter>
    </div>
  );
}
