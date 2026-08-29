import React, { useEffect, useRef, useState } from "react";
import { GRADES, TRIMESTERS } from "../data";
import type { BackendSubject } from "../api/curriculum";
import {
  emptyPlan,
  fmtPoints,
  stepValid,
  suggestTitle,
  totalPoints,
  type ExamMeta,
  type ExamPlan,
  type ExerciseSlot,
} from "../blueprint";
import { LevelStep, SubjectStep, FrameworkStep, CurriculumStep, ExerciseWizardStep } from "../screens/steps";
import { ReviewStep } from "../screens/Review";
import { DuoButton, Icon, cn, BOUMA_URL } from "../ui";
import { useAuth } from "../contexts/AuthContext";

const STEPS = [
  { icon: "school", title: "المستوى" },
  { icon: "book", title: "المادة" },
  { icon: "clock", title: "الإطار" },
  { icon: "layers", title: "الدروس" },
  { icon: "template", title: "التمارين" },
  { icon: "seal", title: "المعاينة" },
];

const LS_KEY = "bouma.exam.v4";

// Maps don't survive JSON round-trips: normalize whatever localStorage had
function asLessonTitles(v: unknown): Map<string, string> {
  if (v instanceof Map) return v as Map<string, string>;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return new Map(Object.entries(v as Record<string, string>));
  }
  return new Map();
}

function load(): { plan: ExamPlan; step: number } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.plan) {
        const plan: ExamPlan = {
          ...emptyPlan(),
          ...parsed.plan,
          meta: { ...emptyPlan().meta, ...parsed.plan.meta },
        };
        plan.lessonTitles = asLessonTitles(parsed.plan.lessonTitles);
        return { plan, step: Math.min(5, Math.max(0, parsed.step ?? 0)) };
      }
    }
  } catch {
    /* تجاهل */
  }
  return { plan: emptyPlan(), step: 0 };
}

export default function Wizard() {
  const { isAuthenticated, user, logout } = useAuth();

  const initial = useRef(load());
  const [plan, setPlan] = useState<ExamPlan>(initial.current.plan);
  const [step, setStep] = useState(initial.current.step);
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);
  const [showReset, setShowReset] = useState(false);

  const [subjects, setSubjects] = useState<BackendSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [lessons, setLessons] = useState<any[]>([]);

  const showToast = (msg: string) => setToast({ id: Date.now(), msg });

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          plan: { ...plan, lessonTitles: Object.fromEntries(plan.lessonTitles ?? []) },
          step,
        })
      );
    } catch {
      /* تجاهل */
    }
  }, [plan, step]);

  useEffect(() => {
    if (!isAuthenticated) return;
    // Fetch subjects from backend - supports grade filtering
    const loadSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const { fetchCurriculumSubjects } = await import('../api/curriculum');
        // Fetch ALL school years' subjects (no year filter → grouped, flattened in API)
        const allSubjects = await fetchCurriculumSubjects(undefined, 'system');
        // Filter only exam-assessable subjects (those that can be tested)
        const assessableSubjects = allSubjects.filter((s: BackendSubject) => s.isAssessable === true);
        setSubjects(assessableSubjects);

        // Flatten lessons from all subjects for use in setMany
        const allLessons: any[] = [];
        allSubjects.forEach((subject: any) => {
          if (subject.terms) {
            subject.terms.forEach((term: any) => {
              term.units.forEach((unit: any) => {
                unit.lessons.forEach((lesson: any) => {
                  allLessons.push({ lesson, unit, term });
                });
              });
            });
          }
        });
        setLessons(allLessons);
      } catch (err) {
        console.error('Failed to load subjects:', err);
        showToast('فشل تحميل المواد الدراسية');
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2700);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- التنقل ---------- */
  const canAccess = (i: number): boolean => {
    for (let k = 0; k < i; k++) if (!stepValid(k, plan)) return false;
    return true;
  };
  const complete = (i: number): boolean => {
    for (let k = 0; k <= Math.min(i, 4); k++) if (!stepValid(k, plan)) return false;
    return true;
  };

  const goTo = (i: number) => {
    if (i === step || i < 0 || i > 5) return;
    if (!canAccess(i)) {
      showToast("أكمل المحطات السابقة أولًا");
      return;
    }
    setDir(i > step ? "fwd" : "back");
    setStep(i);
    window.scrollTo({ top: 0 });
  };

  /* ---------- تحديثات الخطة ---------- */
  const patchMeta = (m: Partial<ExamMeta>) =>
    setPlan((old) => {
      const meta = { ...old.meta, ...m };
      const next = { ...old, meta };
      if (meta.titleAuto) meta.title = suggestTitle(next);
      return next;
    });

  const pickGrade = (g: number) =>
    setPlan((old) => {
      const sub = old.subjectId ? subjects.find((s) => s.id === old.subjectId) : null;
      const keep = !!sub && g >= 1 && g <= 6 && sub.schoolYear === (`YEAR_${g}`); // Only keep a subject that belongs to the newly selected grade
      const meta = { ...old.meta };
      const next: ExamPlan = {
        ...old,
        grade: g,
        subjectId: keep ? old.subjectId : null,
        lessons: keep ? old.lessons : [],
        exercises: keep ? old.exercises : [],
        meta,
      };
      if (meta.titleAuto) meta.title = suggestTitle(next);
      return next;
    });

  const pickSubject = (id: string) =>
    setPlan((old) => {
      const meta = { ...old.meta };
      const next: ExamPlan = { ...old, subjectId: id, lessons: [], exercises: [], meta };
      if (meta.titleAuto) meta.title = suggestTitle(next);
      return next;
    });

  const pickTrimester = (t: number) =>
    setPlan((old) => {
      const meta = { ...old.meta };
      const next: ExamPlan = { ...old, trimester: t, meta };
      if (meta.titleAuto) meta.title = suggestTitle(next);
      return next;
    });

  const toggleLesson = (id: string, title?: string) =>
    setPlan((old) => {
      const exists = old.lessons.includes(id);
      const newLessons = exists ? old.lessons.filter((l) => l !== id) : [...old.lessons, id];
      const newLessonTitles = asLessonTitles(old.lessonTitles);
      if (!exists && title) {
        newLessonTitles.set(id, title);
      } else if (exists) {
        newLessonTitles.delete(id);
      }
      return { ...old, lessons: newLessons, lessonTitles: newLessonTitles };
    });

  const setMany = (ids: string[], on: boolean) => {
    // Get lesson titles for the IDs being added
    const titlesToAdd = lessons.filter(l => ids.includes(l.lesson.id)).map(l => ({ id: l.lesson.id, title: l.lesson.titleAr }));
    
    setPlan((old) => {
      const newLessons = on ? Array.from(new Set([...old.lessons, ...ids])) : old.lessons.filter((l) => !ids.includes(l));
      const newLessonTitles = asLessonTitles(old.lessonTitles);
      
      if (on) {
        titlesToAdd.forEach(({ id, title }) => {
          if (!newLessonTitles.has(id)) {
            newLessonTitles.set(id, title);
          }
        });
      } else {
        ids.forEach(id => newLessonTitles.delete(id));
      }
      
      return { ...old, lessons: newLessons, lessonTitles: newLessonTitles };
    });
  };

  const addSlot = (slot: ExerciseSlot) => {
    setPlan((old) => ({ ...old, exercises: [...old.exercises, slot] }));
    showToast("أُضيف التمرين إلى الهيكل");
  };
  const removeSlot = (id: string) =>
    setPlan((old) => ({
      ...old,
      exercises: old.exercises.filter((s) => s.id !== id).map((s) => (s.linkedTo === id ? { ...s, linkedTo: null } : s)),
    }));
  const changeSlots = (exercises: ExerciseSlot[]) => setPlan((old) => ({ ...old, exercises }));
  const setDuration = (d: number) => setPlan((old) => ({ ...old, meta: { ...old.meta, duration: d } }));

  const resetAll = () => {
    setPlan(emptyPlan());
    setStep(0);
    setDir("back");
    setShowReset(false);
    showToast("بدأنا صفحة جديدة");
    window.scrollTo({ top: 0 });
  };

  const signOut = () => {
    logout();
    showToast("تم تسجيل الخروج بنجاح");
  };

  /* ---------- ملخص للسكة ---------- */
  const sub = plan.subjectId ? subjects.find((s) => s.id === plan.subjectId) || null : null;
  const subjectDisplay = sub?.nameAr ?? null;
  const total = totalPoints(plan.exercises);
  const summary = [
    { icon: "school", label: "المستوى", value: plan.grade ? GRADES[plan.grade - 1].short : null },
    { icon: "book", label: "المادة", value: subjectDisplay },
    { icon: "clock", label: "الثلاثي", value: plan.trimester ? TRIMESTERS[plan.trimester - 1].label.replace("الثلاثي ", "ث") : null },
    { icon: "layers", label: "الدروس", value: plan.lessons.length ? `${plan.lessons.length} دروس` : null },
    { icon: "template", label: "التمارين", value: plan.exercises.length ? `${plan.exercises.length} · ${fmtPoints(total)} ن` : null },
  ];

  return (
    <div className="min-h-screen">
      {/* ═══════ السكة الجانبية (حاسوب) ═══════ */}
      <aside className="no-print fixed inset-y-0 start-0 z-40 hidden w-72 flex-col overflow-y-auto border-e-2 border-line bg-white lg:flex">
        <div className="border-b-2 border-line px-5 pb-4 pt-5">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <span className="absolute -inset-1 rounded-full border-2 border-dashed border-pine/40" />
              <img src={BOUMA_URL} alt="بوّمة" className="rounded-full border-2 border-line object-cover" style={{ width: 52, height: 52 }} />
            </div>
            <div>
              <h1 className="font-display text-[22px] font-extrabold leading-none text-ink">بوّمة</h1>
              <p className="mt-1 text-[10.5px] font-bold tracking-wide text-sub">منشئ الامتحانات · التعليم الأساسي</p>
            </div>
          </div>
          <div className="mt-4 flex h-2 overflow-hidden rounded-full border border-tun-dark/30">
            <span className="flex-1 bg-tun" />
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-tun" />
          </div>
        </div>

        <nav className="px-3 py-3">
          <p className="mb-2 px-2 font-display text-[11px] font-extrabold tracking-wide text-faint">محطات الإنشاء</p>
          <ol className="relative space-y-1">
            <span className="absolute inset-y-3 start-[21px] w-0.5 bg-line" />
            {STEPS.map((s, i) => {
              const done = complete(i) && i < step;
              const active = i === step;
              const accessible = canAccess(i);
              return (
                <li key={s.title} className="relative">
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 px-2.5 py-2 text-start transition-all duration-150",
                      active ? "border-pine-dark/40 bg-pine-soft/70 shadow-[0_3px_0_#bdeee2]" : accessible ? "border-transparent hover:bg-paper" : "cursor-not-allowed border-transparent opacity-60"
                    )}
                  >
                    <span
                      className={cn(
                        "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 font-display text-[13px] font-extrabold transition-colors",
                        done ? "border-jasmine-dark bg-jasmine text-ink" : active ? "anim-pulse-soft border-pine-dark bg-white text-pine-deep" : "border-line-dark bg-white text-faint"
                      )}
                    >
                      {done ? <Icon name="check" size={14} strokeWidth={3.2} /> : accessible ? `${i + 1}` : <Icon name="lock" size={13} />}
                    </span>
                    <span className={cn("font-display text-[13.5px] font-extrabold", active ? "text-pine-deep" : accessible ? "text-ink" : "text-faint")}>{s.title}</span>
                    <Icon name={s.icon} size={16} className={cn("ms-auto", active ? "text-pine-deep" : "text-line-dark")} />
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="mx-4 rounded-xl border-2 border-line bg-paper/70 p-3">
          <p className="mb-2 font-display text-[11px] font-extrabold tracking-wide text-faint">ملخص الامتحان</p>
          <ul className="space-y-1.5">
            {summary.map((r) => (
              <li key={r.label} className="flex items-center gap-2 text-[12px]">
                <Icon name={r.icon} size={14} className={r.value ? "text-pine-deep" : "text-line-dark"} />
                <span className="w-12 shrink-0 font-display font-bold text-sub">{r.label}</span>
                <span className={cn("truncate font-semibold", r.value ? "text-ink" : "text-faint")}>{r.value ?? "—"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto px-5 py-4">
          <div className="mb-3 flex items-center gap-2.5 rounded-xl border-2 border-line bg-paper/70 p-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-pine-dark bg-pine font-display text-[15px] font-extrabold text-ink">
              {(user?.name?.trim()?.[0] ?? "؟").toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[13px] font-extrabold text-ink">{user?.name || "مستخدم"}</span>
              <span className="block truncate text-[11px] font-medium text-sub" dir="ltr">{user?.phone}</span>
            </span>
            <button
              type="button"
              onClick={signOut}
              title="تسجيل الخروج"
              aria-label="تسجيل الخروج"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border-2 border-line text-sub transition-colors hover:border-tun hover:bg-tun/10 hover:text-tun-dark"
            >
              <Icon name="logout" size={15} />
            </button>
          </div>
          <DuoButton color="white" size="sm" icon="refresh" className="w-full" onClick={() => setShowReset(true)}>
            امتحان جديد
          </DuoButton>
          <p className="mt-3 text-center text-[10px] font-medium leading-relaxed text-faint">وفق البرامج الرسمية لوزارة التربية — الجمهورية التونسية</p>
        </div>
      </aside>

      {/* ═══════ شريط الجوال ═══════ */}
      <header className="no-print sticky top-0 z-30 border-b-2 border-line bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <img src={BOUMA_URL} alt="بوّمة" className="h-8 w-8 rounded-full border-2 border-line object-cover" />
            <span className="font-display text-lg font-extrabold text-ink">بوّمة</span>
            <span className="rounded-md bg-paper px-1.5 py-0.5 text-[10px] font-bold text-sub">التعليم الأساسي</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={signOut} className="grid h-9 w-9 place-items-center rounded-xl text-sub hover:bg-paper" aria-label="تسجيل الخروج">
              <Icon name="logout" size={17} />
            </button>
            <button type="button" onClick={() => setShowReset(true)} className="grid h-9 w-9 place-items-center rounded-xl text-sub hover:bg-paper" aria-label="امتحان جديد">
              <Icon name="refresh" size={17} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1.5 px-3 py-2.5">
          {STEPS.map((s, i) => {
            const active = i === step;
            const done = complete(i) && i < step;
            const accessible = canAccess(i);
            const fill = done ? 100 : active ? 50 : 0;
            return (
              <div key={s.title} className="flex min-w-0 flex-col items-stretch gap-1.5">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  disabled={!accessible && !active}
                  aria-label={s.title}
                  className={cn(
                    "flex w-full flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border-2 py-1.5 font-display text-[9.5px] font-extrabold leading-tight transition-all",
                    active
                      ? "border-pine-dark bg-pine text-ink"
                      : done
                        ? "border-jasmine-dark/50 bg-jasmine-soft/70 text-ink"
                        : accessible
                          ? "border-line bg-white text-sub active:bg-paper"
                          : "border-line bg-white text-faint"
                  )}
                >
                  {done ? <Icon name="check" size={14} strokeWidth={3.2} /> : <Icon name={s.icon} size={14} />}
                  <span className="truncate px-0.5">{s.title}</span>
                </button>
                {/* شريط المؤشر — بنفس عرض الزر الذي فوقه تمامًا */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", done ? "bg-jasmine-dark" : "bg-pine")}
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {/* ═══════ المحتوى ═══════ */}
      <main className="min-w-0 lg:ms-72">
        <div key={`${step}-${dir}`} className={cn("mx-auto w-full max-w-5xl px-4 pt-6 md:px-8", dir === "fwd" ? "anim-step-fwd" : "anim-step-back")}>
          {step === 0 && <LevelStep plan={plan} onGrade={pickGrade} onNext={() => goTo(1)} />}
          {step === 1 && plan.grade && <SubjectStep plan={plan} subjects={subjects} loading={loadingSubjects} onSubject={pickSubject} onBack={() => goTo(0)} onNext={() => goTo(2)} />}
          {step === 2 && plan.subjectId && <FrameworkStep plan={plan} onMeta={patchMeta} onTrimester={pickTrimester} onBack={() => goTo(1)} onNext={() => goTo(3)} />}
          {step === 3 && plan.subjectId && plan.grade && plan.trimester && (
            <CurriculumStep
              plan={plan}
              onToggleLesson={toggleLesson}
              onToggleUnit={setMany}
              onSelectMany={setMany}
              onClear={() => setPlan((old) => ({ ...old, lessons: [] }))}
              onBack={() => goTo(2)}
              onNext={() => goTo(4)}
            />
          )}
          {step === 4 && plan.subjectId && plan.grade && (
            <ExerciseWizardStep
              plan={plan}
              subjects={subjects}
              onChangeExercises={(ex) => setPlan((old) => ({ ...old, exercises: ex }))}
              onChangeAiDocument={(doc) => setPlan((old) => ({ ...old, aiDocument: doc }))}
              onBack={() => goTo(3)}
              onNext={() => goTo(5)}
              onToast={showToast}
            />
          )}
          {step === 5 && plan.subjectId && (
            <ReviewStep
              plan={plan}
              subjects={subjects}
              onChangeAiDocument={(doc) => setPlan((old) => ({ ...old, aiDocument: doc }))}
              onGoStep={goTo}
              onToast={showToast}
            />
          )}
        </div>
      </main>

      {/* ═══════ إشعار ═══════ */}
      {toast && (
        <div key={toast.id} className="no-print anim-toast fixed bottom-44 left-1/2 z-[95] w-max max-w-[92vw] -translate-x-1/2 sm:bottom-8 lg:bottom-8">
          <div className="flex items-center gap-2.5 rounded-xl border-2 border-pine-dark bg-ink px-4 py-2.5 shadow-xl">
            <Icon name="check" size={16} className="shrink-0 text-pine" strokeWidth={3} />
            <span className="whitespace-normal text-center font-display text-[13px] font-bold text-white">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* ═══════ نافذة إعادة التعيين ═══════ */}
      {showReset && (
        <div className="no-print fixed inset-0 z-[70] grid place-items-center p-4">
          <div className="anim-fade-in absolute inset-0 bg-ink/50" onClick={() => setShowReset(false)} />
          <div className="anim-pop relative w-full max-w-sm rounded-2xl border-2 border-line bg-white p-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border-b-4 border-tun-dark bg-tun text-ink">
              <Icon name="alert" size={26} />
            </span>
            <h3 className="mt-3 font-display text-xl font-extrabold text-ink">بدء امتحان جديد؟</h3>
            <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-sub">ستُمحى كل الاختيارات الحالية (المستوى، الدروس، التمارين والترويسة) نهائيًا.</p>
            <div className="mt-5 flex flex-col gap-2.5">
              <DuoButton color="red" className="w-full" icon="refresh" onClick={resetAll}>
                نعم، ابدأ من جديد
              </DuoButton>
              <DuoButton color="white" className="w-full" onClick={() => setShowReset(false)}>
                متابعة العمل الحالي
              </DuoButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
