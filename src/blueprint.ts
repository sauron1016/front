import type { BackendSubject } from "./api/curriculum";
import {
  CUSTOM_TYPE,
  DOC_STRINGS,
  EXAM_KINDS,
  GRADES,
  ORDINALS,
  TRIMESTERS,
  arabicDigits,
  catalogFor,
  templatesFor,
  type DocLang,
  type ExamKind,
  type HeaderLayoutId,
} from "./data";
import { fetchSubjectLessons } from "./api/curriculum";
import type { BackendLesson, LessonWithUnit } from "./api/curriculum";

/* ---------------- البرنامج الرسمي ---------------- */

/**
 * Legacy compatibility layer for curriculum data.
 * In production, this should be replaced with direct API calls to the backend.
 * For now, we keep the existing frontend structure but note that curriculum data
 * should come from the backend API.
 */

// Legacy types for backward compatibility during transition
export interface Lesson {
  id: string;
  t: string;
  content?: string;
  activities?: string[];
  letter?: string;
  letterName?: string;
}

export interface Unit {
  id: string;
  t: string;
  tri: 1 | 2 | 3;
  ls: Lesson[];
  duration?: string;
  letters?: string[];
  content?: string;
}

/**
 * Convert backend lesson format to frontend Lesson format
 */
function backendLessonToFrontend(lesson: BackendLesson, unitName: string, termNumber: number): Lesson {
  return {
    id: lesson.id,
    t: lesson.titleAr,
    content: lesson.descriptionAr || undefined,
    letter: lesson.readmePath ? lesson.readmePath.split('/').pop() : undefined,
  };
}

/**
 * Convert backend lesson structure to frontend Unit format
 */
function backendLessonsToUnit(lessons: LessonWithUnit[]): Unit[] {
  const unitMap = new Map<string, {
    id: string;
    t: string;
    tri: 1 | 2 | 3;
    ls: Lesson[];
    duration?: string;
  }>();

  lessons.forEach(({ lesson, unit, term }) => {
    if (!unitMap.has(unit.id)) {
      unitMap.set(unit.id, {
        id: unit.id,
        t: unit.unitNameAr,
        tri: term.termNumber as 1 | 2 | 3,
        ls: [],
        duration: unit.weeks || undefined,
      });
    }
    const u = unitMap.get(unit.id)!;
    u.ls.push(backendLessonToFrontend(lesson, unit.unitNameAr, term.termNumber));
  });

  return Array.from(unitMap.values());
}

/**
 * Get curriculum program for a subject and grade.
 * In Phase 1, this is a stub that returns empty array.
 * Frontend components should migrate to using fetchSubjectLessons directly.
 */
export function getProgram(subjectId: string, grade: number): Unit[] {
  // This function is deprecated - use fetchSubjectLessons from api/curriculum instead
  console.warn('getProgram is deprecated - use fetchSubjectLessons from api/curriculum');
  return [];
}

export function resolveLesson(subjectId: string, grade: number, lessonId: string): { unit: Unit; lesson: Lesson } | null {
  // This function is deprecated - use fetchLessonDetails from api/curriculum instead
  console.warn('resolveLesson is deprecated - use fetchLessonDetails from api/curriculum');
  return null;
}

export function lessonsByUnit(p: ExamPlan): { unit: Unit; lessons: Lesson[] }[] {
  // This function is deprecated - lessons should be fetched from backend
  return [];
}

/* ---------------- الخطة ---------------- */

export interface SubQuestion {
  id: string;
  text: string;
  points: number;
  recommendedPoints?: number;
}

export interface ExerciseSlot {
  id: string;
  typeId: string;
  label: string;
  points: number;
  linkedTo: string | null;
  /* Phase 3 - AI wizard fields */
  htmlContent?: string;
  subQuestions?: SubQuestion[];
  images?: { url: string }[];
  sourceLessonIds?: string[];
}

export interface ExamMeta {
  kind: ExamKind["id"];
  year: string;
  title: string;
  titleAuto: boolean;
  duration: number;
  showScale: boolean;
  /* الترويسة — تُحرَّر في محطة المعاينة */
  school: string;
  region: string;
  teacher: string;
  notes: string;
  closing: string;
  gradeLabel: string;
  subjectLabel: string;
  trimesterLabel: string;
  /* اللغة وتخطيط الترويسة والشعار */
  lang: DocLang;
  headerLayout: HeaderLayoutId;
  logo: string | null; // dataURL
}

export interface AiDocument {
  mode: 'full' | 'manual';
  htmlContent: string;
  images?: string[];
  savedId?: string;
}

export interface ExamPlan {
  grade: number | null;
  subjectId: string | null;
  trimester: number | null;
  lessons: string[];
  lessonTitles: Map<string, string>; // Store lesson titles to avoid showing IDs
  exercises: ExerciseSlot[];
  meta: ExamMeta;
  /* Phase 3 - AI-generated exam document (full or assembled manual) */
  aiDocument?: AiDocument;
}

export const emptyPlan = (): ExamPlan => ({
  grade: null,
  subjectId: null,
  trimester: null,
  lessons: [],
  lessonTitles: new Map<string, string>(),
  exercises: [],
  meta: {
    kind: "trimester",
    year: "2025/2026",
    title: "",
    titleAuto: true,
    duration: 60,
    showScale: true,
    school: "",
    region: "",
    teacher: "",
    notes: "",
    closing: "بالتوفيق",
    gradeLabel: "",
    subjectLabel: "",
    trimesterLabel: "",
    lang: "ar",
    headerLayout: "classic",
    logo: null,
  },
});

export const uid = () => Math.random().toString(36).slice(2, 9);

export const totalPoints = (exercises: ExerciseSlot[]) => exercises.reduce((s, e) => s + e.points, 0);

export function fmtPoints(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function slotName(slot: ExerciseSlot, family?: string | null): string {
  if (slot.typeId === CUSTOM_TYPE) return slot.label.trim() || "تمرين مخصص";
  const fams = family ? [family] : ["arabic", "math", "french", "english", "science", "islamic", "civic", "hist", "geo", "arts", "music", "pe"];
  for (const f of fams) {
    const t = catalogFor(f as never)
      .flatMap((d) => d.types)
      .find((x) => x.id === slot.typeId);
    if (t) return slot.label.trim() || t.name;
  }
  return slot.label.trim() || "تمرين";
}

export function kindLabel(kind: ExamKind["id"], lang: DocLang = "ar"): string {
  const k = EXAM_KINDS.find((x) => x.id === kind)!;
  return lang === "fr" ? k.labelFr : k.label;
}

export function resolveLabels(p: ExamPlan, subjects?: BackendSubject[]): { grade: string; subject: string; trimester: string } {
  const sub = p.subjectId && subjects ? subjects.find(s => s.id === p.subjectId) || null : null;
  return {
    grade: p.meta.gradeLabel.trim() || (p.grade ? GRADES[p.grade - 1].label : ""),
    subject: p.meta.subjectLabel.trim() || (sub && p.grade ? (sub.nameFr && p.grade >= 4 ? sub.nameFr! : sub.nameAr) : ""),
    trimester: p.meta.trimesterLabel.trim() || (p.trimester ? TRIMESTERS[p.trimester - 1].label : ""),
  };
}

/* ---------------- المحطات الست ---------------- */

export function stepValid(i: number, p: ExamPlan): boolean {
  switch (i) {
    case 0:
      return p.grade != null;
    case 1:
      return !!p.subjectId;
    case 2:
      return !!p.trimester;
    case 3:
      return p.lessons.length > 0;
    case 4:
      // AI document present OR legacy manual slots summing to 20
      return !!p.aiDocument?.htmlContent || (p.exercises.length > 0 && Math.abs(totalPoints(p.exercises) - 20) < 0.01);
    default:
      return true;
  }
}

export const STEP_HINTS = [
  "اختر المستوى الدراسي",
  "اختر مادة الامتحان",
  "حدّد الثلاثي المعني بالامتحان",
  "اختر درسًا واحدًا على الأقل من البرنامج الرسمي",
  "ولّد كل تمرين بالذكاء الاصطناعي ووزّع نقاطه يدويًا",
];

export function suggestTitle(p: ExamPlan, subjects?: BackendSubject[]): string {
  if (!p.subjectId || !p.grade || !p.trimester) return "";
  // Use the real backend subject name when available
  const sub = p.subjectId && subjects ? subjects.find((s) => s.id === p.subjectId) : undefined;
  const subjectName = sub ? (sub.nameFr && p.grade >= 4 ? sub.nameFr! : sub.nameAr) : "المادة";
  const gradeLabel = GRADES[p.grade - 1].label;
  if (p.meta.kind === "devoir") return `فرض المراقبة في ${subjectName} — ${gradeLabel}`;
  if (p.meta.kind === "unified") return `الامتحان الموحد في ${subjectName} — ${gradeLabel}`;
  const tri = TRIMESTERS[p.trimester - 1].label.replace("الثلاثي ", "");
  return `الامتحان الثلاثي ${tri} في ${subjectName} — ${gradeLabel}`;
}

/* ---------------- توزيع آلي /20 بنصف نقطة ---------------- */

export function autoBalance(exercises: ExerciseSlot[]): ExerciseSlot[] {
  if (exercises.length === 0) return exercises;
  const weights = exercises.map((e) => (e.typeId === CUSTOM_TYPE ? 4 : Math.max(1, e.points)));
  const W = weights.reduce((a, b) => a + b, 0) || 1;
  let pts = exercises.map((_, i) => Math.max(0.5, Math.round((20 * weights[i]) / W / 0.5) * 0.5));
  let total = pts.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (Math.abs(total - 20) > 0.001 && guard++ < 200) {
    if (total < 20) {
      const i = pts.indexOf(Math.min(...pts));
      pts[i] += 0.5;
    } else {
      let worst = -1;
      let worstGap = Infinity;
      pts.forEach((p, i) => {
        const gap = weights[i] / 2 - p;
        if (p > 0.5 && gap < worstGap) {
          worstGap = gap;
          worst = i;
        }
      });
      if (worst < 0) break;
      pts[worst] -= 0.5;
    }
    total = pts.reduce((a, b) => a + b, 0);
  }
  return exercises.map((e, i) => ({ ...e, points: pts[i] }));
}

/* ---------------- تطبيق قالب ---------------- */

export function applyTemplate(items: { type: string; points: number; linkTo?: number }[]): ExerciseSlot[] {
  const slots: ExerciseSlot[] = items.map((it) => ({ id: uid(), typeId: it.type, label: "", points: it.points, linkedTo: null }));
  items.forEach((it, i) => {
    if (it.linkTo && it.linkTo - 1 < i) slots[i].linkedTo = slots[it.linkTo - 1].id;
  });
  return slots;
}

/* ---------------- نصوص الوثيقة حسب اللغة ---------------- */

export function docStrings(p: ExamPlan) {
  const s = DOC_STRINGS[p.meta.lang] ?? DOC_STRINGS.ar;
  const closing = p.meta.closing.trim() || (p.meta.lang === "fr" ? "Bonne chance" : "بالتوفيق");
  return { ...s, closing };
}

/* ---------------- حمولة الوكيل ---------------- */

export function buildPayload(p: ExamPlan, subjects: BackendSubject[] = []) {
  const sub = p.subjectId ? subjects.find((s) => s.id === p.subjectId) ?? null : null;
  const tri = TRIMESTERS[(p.trimester ?? 1) - 1];
  return {
    version: "2.0",
    task: "tunisia-primary-exam-generation",
    context: {
      country: "Tunisia",
      cycle: p.grade! <= 3 ? "Premier cycle (enseignement de base)" : "Second cycle (approfondissement)",
      grade: p.grade!,
      subject: sub ? { id: sub.id, nameAr: sub.nameAr, nameFr: sub.nameFr } : null,
      trimester: { n: tri.n, label: tri.label, labelFr: tri.labelFr, period: tri.period },
      examKind: kindLabel(p.meta.kind, p.meta.lang),
    },
    curriculum: p.lessons.map((id) => {
      const r = resolveLesson(p.subjectId!, p.grade!, id);
      return {
        unit: r?.unit.t ?? "",
        trimester: r?.unit.tri ?? 0,
        lesson: r?.lesson.t ?? id,
        /* محتوى رسمي — يساعد الوكيل على توليد تمارين مطابقة */
        ...(r?.lesson.content ? { content: r.lesson.content } : {}),
        ...(r?.lesson.activities?.length ? { activities: r.lesson.activities } : {}),
        ...(r?.unit.letters?.length ? { targetedLetters: r.unit.letters } : {}),
      };
    }),
    exercises: p.exercises.map((e, i) => {
      const linkedIdx = e.linkedTo ? p.exercises.findIndex((x) => x.id === e.linkedTo) : -1;
      return {
        index: i + 1,
        type: e.typeId,
        label: slotName(e, sub?.family ?? undefined),
        points: e.points,
        linkedTo: linkedIdx >= 0 ? linkedIdx + 1 : null,
        linkNote: linkedIdx >= 0 ? `يستعمل نفس سند التمرين ${linkedIdx + 1}` : null,
      };
    }),
    document: {
      title: p.meta.titleAuto ? suggestTitle(p) : p.meta.title,
      language: p.meta.lang,
      headerLayout: p.meta.headerLayout,
      school: p.meta.school,
      region: p.meta.region,
      teacher: p.meta.teacher,
      year: p.meta.year,
      durationMinutes: p.meta.duration,
      gradingScale: 20,
      showPointsOnSheet: p.meta.showScale,
      labels: resolveLabels(p),
      notes: p.meta.notes,
      closing: p.meta.closing,
      hasLogo: !!p.meta.logo,
    },
    instructions:
      "ولّد تمارين كاملة باللغة المناسبة للمادة، مستوحاة من أنماط الامتحانات الثلاثية التونسية السابقة (الوطنية والجهوية) الخاصة بهذه الدروس، مع احترام النقاط المحددة والربط بين التمارين والمدة الزمنية.",
  };
}

export { ORDINALS, arabicDigits };
