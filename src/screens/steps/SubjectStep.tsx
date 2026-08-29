import { useMemo } from "react";
import type { BackendSubject } from "../../api/curriculum";
import { arabicDigits, GRADES } from "../../data";
import { ExamPlan, stepValid } from "../../blueprint";
import { Reveal, DuoButton, Icon, StageFooter, HintLine, cn } from "../../ui";
import { StageTitle } from "./shared";

/* ═══════════════════ المحطة 2 · المادة ═══════════════════ */

// The DB slugs have the form "{subjectId}_y{grade}" (e.g. arabic_y3). Resolve a
// per-subject icon from the subjectId portion so every official subject gets a
// meaningful glyph (icons exist in ../ui PATHS).
function subjectIcon(slug: string): string {
  const base = slug.replace(/_y\d+$/i, "");
  const map: Record<string, string> = {
    mathematics: "sigma",
    scientific_awakening: "flask",
    science: "flask",
    islamic_education: "minaret",
    arabic: "book",
    french: "pen",
    english: "chat",
    history: "tunmap",
    geography: "tunmap",
    civic_education: "ballot",
    art_education: "palette",
    music_education: "music",
    physical_education: "dumbbell",
    technology_education: "layers",
  };
  return map[base] || "book";
}

function subjectName(s: BackendSubject, _grade: number | null): string {
  // The subject is always shown by its official Arabic name.
  return s.nameAr;
}

function subjectSubtitle(_s: BackendSubject): string {
  return "";
}

export function SubjectStep({ 
  plan, 
  subjects, 
  loading,
  onSubject, 
  onBack, 
  onNext 
}: { 
  plan: ExamPlan; 
  subjects: BackendSubject[]; 
  loading: boolean;
  onSubject: (id: string) => void; 
  onBack: () => void; 
  onNext: () => void; 
}) {
  const valid = stepValid(1, plan);
  
  // Filter subjects to those belonging to the selected grade (all 6 years exist)
  const availableSubjects = useMemo(() => {
    if (!plan.grade) return subjects;
    const yearKey = `YEAR_${plan.grade}` as const;
    return subjects.filter((s) => s.schoolYear === yearKey);
  }, [subjects, plan.grade]);
  
  if (loading) {
    return (
      <div className="pb-28">
        <StageTitle n={2} icon="book" title="مادة الامتحان" sub="جاري تحميل المواد الدراسية..." />
        <div className="grid place-items-center py-20">
          <Icon name="clock" size={40} className="anim-pulse text-pine" />
          <p className="mt-4 font-display text-sm font-bold text-sub">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  // Show message if no subjects available for this grade
  if (availableSubjects.length === 0) {
    return (
      <div className="pb-28">
        <StageTitle n={2} icon="book" title="مادة الامتحان" sub={`لا توجد مواد متاحة في ${plan.grade ? GRADES[plan.grade - 1].label : "هذا المستوى"} حالياً.`} />
        <Reveal dir="up" className="grid place-items-center py-16">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-paper">
              <Icon name="clock" size={32} className="text-sub" />
            </div>
            <h3 className="font-display text-lg font-extrabold text-ink">لا توجد مواد</h3>
            <p className="mt-2 max-w-md text-[13px] font-medium leading-relaxed text-sub">
              لم يتم العثور على مواد قابلة للتقييم في هذا المستوى حاليًا.
            </p>
            <button
              type="button"
              onClick={() => onBack()}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-pine-dark bg-pine px-5 py-2.5 font-display text-[13px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_0_#0f9c84]"
            >
              <Icon name="arrow-left" size={16} />
              تغيير السنة
            </button>
          </div>
        </Reveal>
      </div>
    );
  }
  
  return (
    <div className="pb-28">
      <StageTitle n={2} icon="book" title="مادة الامتحان" sub={`المواد المتاحة في ${plan.grade ? GRADES[plan.grade - 1].label : "هذا المستوى"} وفق البرامج الرسمية. بعض المواد تُدرَّس انطلاقًا من سنوات محددة.`} />
      <Reveal dir="up" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {availableSubjects.map((s) => {
          const locked = plan.grade != null && plan.grade < 1; // Never lock for Year 1+
          const sel = plan.subjectId === s.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={locked}
              onClick={() => onSubject(s.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl border-2 bg-white p-3.5 text-start transition-all duration-150",
                locked ? "cursor-not-allowed border-line opacity-50" : sel ? "border-pine-dark bg-pine-soft/40 shadow-[0_4px_0_#0f9c84]" : "border-line shadow-[0_4px_0_#dfe6ea] hover:-translate-y-0.5 hover:border-pine/60"
              )}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border-b-[3px]" style={{ backgroundColor: "#e0f2f1", color: "#00796b", borderColor: "#004d40" }}>
                <Icon name={subjectIcon(s.slug)} size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[14.5px] font-extrabold text-ink">{subjectName(s, plan.grade)}</span>
                <span className="block truncate text-[11.5px] font-medium text-faint" dir="ltr" style={{ textAlign: "end" }}>
                  {subjectSubtitle(s)}
                </span>
              </span>
              {locked ? (
                <span className="flex shrink-0 items-center gap-1 rounded-md bg-paper px-1.5 py-1 text-[10.5px] font-bold text-faint">
                  <Icon name="lock" size={11} /> من س{arabicDigits(1)}
                </span>
              ) : sel ? (
                <span className="anim-pop grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-pine-dark bg-pine text-ink">
                  <Icon name="check" size={12} strokeWidth={3.4} />
                </span>
              ) : null}
            </button>
          );
        })}
      </Reveal>
      <FooterNav back={onBack} ok={valid} hint="المادة محددة — تابع إلى الإطار" next={onNext} />
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
