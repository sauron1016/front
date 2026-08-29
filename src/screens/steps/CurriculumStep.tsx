import { useEffect, useMemo, useState } from "react";
import { arabicDigits, GRADES, TRIMESTERS } from "../../data";
import { ExamPlan, stepValid } from "../../blueprint";
import { Reveal, DuoButton, Icon, StageFooter, HintLine, cn, DuoCheckbox } from "../../ui";
import { StageTitle, SectionLabel, Chip } from "./shared";

/* ═══════════════════ المحطة 4 · الدروس ═══════════════════ */

export function CurriculumStep({
  plan,
  onToggleLesson,
  onToggleUnit,
  onSelectMany,
  onClear,
  onBack,
  onNext,
}: {
  plan: ExamPlan;
  onToggleLesson: (id: string, title?: string) => void;
  onToggleUnit: (ids: string[], on: boolean) => void;
  onSelectMany: (ids: string[], on: boolean) => void;
  onClear: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<number | "all">(plan.trimester ?? "all");
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectName, setSubjectName] = useState<string>("");
  
  useEffect(() => {
    const loadLessons = async () => {
      setLoading(true);
      try {
        const { fetchCurriculumSubjects } = await import('../../api/curriculum');
        // Fetch full curriculum with nested structure for the specific grade
        const subjects = await fetchCurriculumSubjects(plan.grade!.toString(), 'system');
        console.log('Fetched subjects count:', subjects.length);
        console.log('Looking for subjectId:', plan.subjectId);
        const subject = subjects.find((s: any) => {
          const match = s.id === plan.subjectId;
          console.log('Checking subject:', s.nameAr || s.id, 'matches:', match);
          return match;
        });
        
        console.log('Found subject:', subject?.nameAr || subject?.id, subject ? 'YES' : 'NO');
        
        if (subject && subject.terms && subject.terms.length > 0) {
          setSubjectName(subject.nameAr);
          // Flatten lessons from all terms/units
          const allLessons: any[] = [];
          subject.terms.forEach((term: any) => {
            term.units.forEach((unit: any) => {
              unit.lessons.forEach((lesson: any) => {
                console.log('Lesson:', lesson.titleAr, lesson.id);
                allLessons.push({
                  lesson,
                  unit,
                  term
                });
              });
            });
          });
          setLessons(allLessons);
        } else if (subject) {
          console.warn('Subject has no terms or lessons:', subject.nameAr);
          setSubjectName(subject.nameAr);
          setLessons([]);
        }
      } catch (err) {
        console.error('Failed to load lessons:', err);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };
    if (plan.subjectId && plan.grade && plan.trimester) {
      loadLessons();
    }
  }, [plan.subjectId, plan.grade, plan.trimester]);
  
  const valid = stepValid(3, plan);

  /* اسم الكتاب الرسمي للمادة (إن وُجد) لعرض مصدر الدروس */
  // TODO: Fetch book metadata from backend API in Phase 1
  const bookHint = null;

  const lessonTitles = useMemo(() => {
    const map = new Map<string, string>();
    lessons.forEach(({ lesson }: any) => {
      console.log('Building lessonTitles map:', lesson.id, '->', lesson.titleAr);
      map.set(lesson.id, lesson.titleAr);
    });
    console.log('lessonTitles map size:', map.size);
    return map;
  }, [lessons]);

  const filtered = useMemo(() => {
    const q = query.trim();
    // Group lessons by unit properly
    const unitMap = new Map<string, any>();
    
    lessons
      .filter(({ term }: any) => filter === "all" || term.termNumber === filter)
      .forEach(({ lesson, unit, term }: any) => {
        if (!unitMap.has(unit.id)) {
          unitMap.set(unit.id, {
            id: unit.id,
            t: unit.unitNameAr,
            unitId: unit.id,
            unitName: unit.unitNameAr,
            tri: term.termNumber as 1 | 2 | 3,
            ls: []
          });
        }
        const u = unitMap.get(unit.id);
        u.ls.push({ id: lesson.id, t: lesson.titleAr, content: lesson.descriptionAr || undefined });
      });
    
    return Array.from(unitMap.values())
      .filter((item: any) => !q || item.t.includes(q) || item.ls.some((l: any) => l.t.includes(q)));
  }, [lessons, filter, query]);

  const visibleIds = filtered.flatMap((f: any) => f.ls.map((l: any) => l.id));

  if (loading) {
    return (
      <div className="pb-28">
        <StageTitle n={4} icon="layers" title="البرنامج والدروس" sub="جاري تحميل الدروس..." />
        <div className="grid place-items-center py-20">
          <Icon name="clock" size={40} className="anim-pulse text-pine" />
          <p className="mt-4 font-display text-sm font-bold text-sub">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <StageTitle
        n={4}
        icon="layers"
        title="البرنامج والدروس"
        sub={`دروس مكيّفة من الكتب المدرسية الرسمية — ${GRADES[plan.grade! - 1].label}. اختر الدروس والكفايات التي سيغطيها الامتحان.`}
      />

      <Reveal dir="start" className="mb-5 flex flex-wrap items-center gap-2">
        <Chip color="#00796b" soft="#e0f2f1" icon="book" text={subjectName || "الرياضيات"} />
        <Chip color="#2f8fe0" soft="#e3f1ff" icon="school" text={GRADES[plan.grade! - 1].label} />
        <Chip color="#d96f32" soft="#ffe8d6" icon="clock" text={TRIMESTERS[(plan.trimester ?? 1) - 1].label} />
      </Reveal>

      <Reveal dir="end" className="mb-5">
        <div className="relative overflow-hidden rounded-xl border-2 border-blue/40 bg-blue-soft/60 shadow-[0_4px_0_#cfe6fb]">
          <div className="absolute inset-y-0 start-0 w-1.5 bg-blue" />
          <div className="flex items-center gap-3 px-4 py-3.5 ps-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-b-[3px] border-blue-dark bg-blue text-ink">
              <Icon name="book" size={21} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-[14.5px] font-extrabold leading-snug text-blue-dark">
                دروس مكيّفة من الكتب المدرسية الرسمية لوزارة التربية
              </p>
              <p className="mt-0.5 text-[12px] font-medium leading-relaxed text-ink/70">
                {bookHint
                  ? `من كتاب «${bookHint}» — المركز الوطني البيداغوجي (CNP)، وفق البرامج الرسمية المعتمدة.`
                  : "وفق البرامج الرسمية المعتمدة — المركز الوطني البيداغوجي (CNP) ووزارة التربية."}
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal dir="end" className="card mb-4 flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Icon name="search" size={17} className="absolute start-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث في دروس البرنامج…"
            className="w-full rounded-xl border-2 border-line bg-white py-2 pe-3 ps-9 text-[14px] outline-none transition-all placeholder:text-faint focus:border-pine focus:ring-4 focus:ring-pine/15"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {([1, 2, 3, "all"] as const).map((t) => (
            <button
              key={String(t)}
              type="button"
              onClick={() => setFilter(t)}
              className={cn(
                "rounded-lg border-2 px-2.5 py-1.5 font-display text-[12px] font-bold transition-all",
                filter === t ? "border-pine-dark bg-pine text-ink" : "border-line bg-white text-sub hover:border-pine/50 hover:text-pine-deep"
              )}
            >
              {t === "all" ? "كل البرنامج" : `ث${arabicDigits(t)}`}
            </button>
          ))}
          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
          <DuoButton size="xs" color="white" icon="check" onClick={() => onSelectMany(visibleIds, true)}>
            تحديد المعروض
          </DuoButton>
          <DuoButton size="xs" color="ghost" icon="x" onClick={onClear} disabled={plan.lessons.length === 0}>
            مسح
          </DuoButton>
        </div>
      </Reveal>

      {plan.lessons.length > 0 && (
        <div className="anim-fade-up mb-5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-lg border-2 border-pine-dark/30 bg-pine-soft px-2.5 py-1 font-display text-[12.5px] font-extrabold text-pine-dark">
            <Icon name="check" size={13} strokeWidth={3} />
            {arabicDigits(plan.lessons.length)} درسًا
          </span>
          {plan.lessons.slice(0, 4).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onToggleLesson(id)}
              className="group inline-flex items-center gap-1 rounded-lg border-2 border-line bg-white px-2 py-1 text-[11.5px] font-bold text-sub transition-colors hover:border-tun/40 hover:text-tun"
            >
              {lessonTitles.get(id) ?? id}
              <Icon name="x" size={11} className="opacity-40 group-hover:opacity-100" />
            </button>
          ))}
          {plan.lessons.length > 4 && <span className="text-[11.5px] font-bold text-faint">+{arabicDigits(plan.lessons.length - 4)} أخرى</span>}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card anim-fade-up p-10 text-center">
          <Icon name="search" size={36} className="mx-auto text-line-dark" />
          <p className="mt-3 font-display text-base font-extrabold text-ink">لا نتائج مطابقة</p>
          <p className="mt-1 text-[13px] font-medium text-sub">جرّب كلمة أخرى أو غيّر مرشّح الثلاثي.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((u, idx) => {
            const ids = u.ls.map((l: any) => l.id);
            const selIn = u.ls.filter((l: any) => plan.lessons.includes(l.id)).length;
            const all = selIn === u.ls.length;
            return (
              <Reveal key={u.id} dir={idx % 2 ? "end" : "start"}>
                <div className={cn("card overflow-hidden transition-colors", all && "border-pine")}>
                  <button
                    type="button"
                    onClick={() => onToggleUnit(ids, !all)}
                    className={cn("flex w-full items-center gap-3 border-b-2 border-line px-4 py-3 text-start transition-colors", all ? "bg-pine-soft/50" : "bg-paper/60 hover:bg-pine-soft/30")}
                  >
                    <DuoCheckbox checked={all} onChange={() => onToggleUnit(ids, !all)} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[14.5px] font-extrabold leading-snug text-ink">{u.t}</span>
                      {(!!u.letters?.length || !!u.duration) && (
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          {!!u.letters?.length && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-jasmine-soft/80 px-1.5 py-0.5 text-[10.5px] font-bold text-saffron-dark">
                              <Icon name="qalam" size={11} />
                              <span dir="rtl">{u.letters.join(" ")}</span>
                            </span>
                          )}
                          {!!u.duration && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-line/50 px-1.5 py-0.5 text-[10.5px] font-bold text-faint">
                              <Icon name="clock" size={11} />
                              {u.duration}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10.5px] font-bold text-faint">ث{arabicDigits(u.tri)}</span>
                    <span className={cn("rounded-lg px-2 py-0.5 font-display text-[12px] font-extrabold", selIn ? "bg-pine-soft text-pine-dark" : "bg-line/60 text-faint")}>
                      {arabicDigits(selIn)}/{arabicDigits(u.ls.length)}
                    </span>
                  </button>
                  <ul className="divide-y divide-line/60">
                    {u.ls.map((l: any) => {
                      const checked = plan.lessons.includes(l.id);
                      return (
                        <li key={l.id}>
                          <button
                            type="button"
                              onClick={() => onToggleLesson(l.id, l.t)}
                            className={cn("flex w-full items-start gap-3 px-4 py-2.5 text-start transition-colors hover:bg-paper", checked && "bg-pine-soft/25")}
                          >
                            {l.letter ? (
                              <span
                                className={cn(
                                  "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-b-2 font-display text-[15px] font-extrabold transition-colors",
                                  checked ? "border-pine-dark bg-pine text-ink" : "border-line bg-paper text-sub"
                                )}
                              >
                                {l.letter.replace("ـ", "")}
                              </span>
                            ) : (
                              <span className={cn("mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full transition-colors", checked ? "bg-pine" : "bg-line-dark")} />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className={cn("block text-[13.5px] font-medium leading-relaxed", checked ? "text-ink" : "text-ink/75")}>{l.t}</span>
                              {l.content && <span className="mt-1 block text-[11.5px] leading-relaxed text-faint">{l.content}</span>}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[11.5px] font-medium text-faint">
          <Icon name="seal" size={13} className="shrink-0 text-blue" />
          جميع الدروس المعروضة مكيّفة من الكتب المدرسية الرسمية لوزارة التربية — الجمهورية التونسية
        </p>
      )}

      <FooterNav back={onBack} ok={valid} hint={`تم اختيار ${arabicDigits(plan.lessons.length)} درسًا — تابع إلى التمارين`} next={onNext} />
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
