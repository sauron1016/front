/* ============ Tunisian Basic Education Structure ============ 
   These are basic type definitions only.
   ALL curriculum data (subjects, lessons, exercises) now comes from the backend SQL database.
   Do NOT add hardcoded curriculum data here.
*/

// Basic grade levels
export interface Grade {
  n: number;
  label: string;
  short: string;
  cycle: 1 | 2;
}

export const GRADES: Grade[] = [
  { n: 1, label: "السنة الأولى أساسي", short: "الأولى", cycle: 1 },
  { n: 2, label: "السنة الثانية أساسي", short: "الثانية", cycle: 1 },
  { n: 3, label: "السنة الثالثة أساسي", short: "الثالثة", cycle: 1 },
  { n: 4, label: "السنة الرابعة أساسي", short: "الرابعة", cycle: 2 },
  { n: 5, label: "السنة الخامسة أساسي", short: "الخامسة", cycle: 2 },
  { n: 6, label: "السنة السادسة أساسي", short: "السادسة", cycle: 2 },
];

export const CYCLES = [
  { n: 1 as const, title: "المرحلة الأولى — التعليم الأساسي", sub: "سنوات 1 إلى 3 · اكتساب التعلمات الأساس" },
  { n: 2 as const, title: "المرحلة الثانية — التعليم الأساسي", sub: "سنوات 4 إلى 6 · تأصيل التعلمات والإعداد لمناظرة السادسة" },
];

// Trimester structure
export interface Trimester {
  n: 1 | 2 | 3;
  label: string;
  labelFr: string;
  period: string;
}

export const TRIMESTERS: Trimester[] = [
  { n: 1, label: "الثلاثي الأول", labelFr: "Premier trimestre", period: "سبتمبر — ديسمبر" },
  { n: 2, label: "الثلاثي الثاني", labelFr: "Deuxième trimestre", period: "جانفي — مارس" },
  { n: 3, label: "الثلاثي الثالث", labelFr: "Troisième trimestre", period: "أفريل — جوان" },
];

/* ============ Document Export Constants ============ */

// Exam kinds
export interface ExamKind {
  id: "trimester" | "devoir" | "unified";
  label: string;
  labelFr: string;
  desc: string;
}

export const EXAM_KINDS: ExamKind[] = [
  { id: "trimester", label: "امتحان ثلاثي", labelFr: "Examen trimestriel", desc: "التقييم التأليفي في نهاية الثلاثي" },
  { id: "devoir", label: "فرض مراقبة", labelFr: "Devoir de contrôle", desc: "فرض كتابي خلال الثلاثي" },
  { id: "unified", label: "امتحان موحد", labelFr: "Examen unifié", desc: "موحد على مستوى المدرسة أو المعتمدية" },
];

export const DURATIONS = [20, 30, 45, 60, 75, 90];

export const YEAR_OPTIONS = ["2024/2025", "2025/2026", "2026/2027"];

// Header layouts for official documents
export type HeaderLayoutId = "classic" | "table" | "center" | "banner";
export interface HeaderLayout {
  id: HeaderLayoutId;
  name: string;
  desc: string;
}
export const HEADER_LAYOUTS: HeaderLayout[] = [
  { id: "classic", name: "رسمي مقسوم", desc: "الجمهورية والمدرسة في جهة، والسنة والنوع في الجهة المقابلة" },
  { id: "table", name: "جدول مؤطر", desc: "خلايا رسمية على طريقة الامتحانات الوطنية والجهوية" },
  { id: "center", name: "مركزي", desc: "الأسطر في الوسط والعنوان بارز تحته" },
  { id: "banner", name: "شريط مدرسي", desc: "الشعار واسم المدرسة والسنة في سطر واحد مدمج" },
];

// Document language strings
export type DocLang = "ar" | "fr";
export interface DocStrings {
  dir: "rtl" | "ltr";
  republic: string;
  ministry: string;
  schoolYear: string;
  level: string;
  subject: string;
  duration: string;
  durationUnit: string;
  note: string;
  includes: string;
  structure: string;
  exN: string;
  exName: string;
  link: string;
  points: string;
  noLink: string;
  linkRef: (n: number) => string;
  totalRow: string;
  teacher: string;
  sign: string;
  notes: string;
  generatedBy: string;
}
export const DOC_STRINGS: Record<DocLang, DocStrings> = {
  ar: {
    dir: "rtl",
    republic: "الجمهورية التونسية",
    ministry: "وزارة التربية",
    schoolYear: "السنة الدراسية",
    level: "المستوى",
    subject: "المادة",
    duration: "المدة",
    durationUnit: "دقيقة",
    note: "العدد",
    includes: "يشمل الامتحان البرنامج الرسمي التالي:",
    structure: "هيكلة التمارين",
    exN: "م",
    exName: "التمرين",
    link: "الربط",
    points: "النقاط",
    noLink: "—",
    linkRef: (n) => `سند التمرين ${n}`,
    totalRow: "المجموع العام على سلّم العشرين",
    teacher: "الأستاذ(ة)",
    sign: "الإمضاء",
    notes: "ملاحظات",
    generatedBy: "أُنشئت بواسطة بوّمة — منشئ الامتحانات للتعليم الأساسي التونسي",
  },
  fr: {
    dir: "ltr",
    republic: "République Tunisienne",
    ministry: "Ministère de l'Éducation",
    schoolYear: "Année scolaire",
    level: "Niveau",
    subject: "Matière",
    duration: "Durée",
    durationUnit: "min",
    note: "Note",
    includes: "L'épreuve couvre le programme officiel suivant :",
    structure: "Structure des exercices",
    exN: "N°",
    exName: "Exercice",
    link: "Lien",
    points: "Points",
    noLink: "—",
    linkRef: (n) => `Support de l'ex. ${n}`,
    totalRow: "Total sur l'échelle de 20",
    teacher: "Enseignant(e)",
    sign: "Signature",
    notes: "Remarques",
    generatedBy: "Créé avec Bouma — générateur d'épreuves (primaire tunisien)",
  },
};

export const ORDINALS = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];

/** Arabic numerals (0-9) — Western digits always displayed for readability */
export function arabicDigits(n: number): string {
  return String(n);
}

/* ============ Exercise Type Placeholders ============ 
   These are now fetched from the backend database.
   The frontend should use the API to get exercise types per subject.
   Keeping minimal placeholder for type compatibility only.
*/

export interface ExType {
  id: string;
  name: string;
  desc: string;
  defPoints: number;
  icon: string;
  ltr?: boolean;
}

export interface ExDomain {
  domain: string;
  types: ExType[];
}

export const CUSTOM_TYPE = "custom";

// Empty placeholder - fetch from backend instead
export const EXERCISE_CATALOG: Record<string, ExDomain[]> = {};

/**
 * Placeholder functions for catalogFor and templatesFor.
 * These should be replaced with actual API calls to fetch exercise types from backend.
 * For now, returning empty arrays to prevent crashes during transition.
 */
export function catalogFor(family: "arabic" | "math" | "french" | "english" | "science" | "islamic" | "civic" | "hist" | "geo" | "arts" | "music" | "pe"): ExDomain[] {
  // TODO: Replace with API call to fetch exercise types for this subject family
  console.warn('catalogFor is deprecated - use fetchExerciseTypes from api/curriculum');
  return [];
}

export function templatesFor(family: "arabic" | "math" | "french" | "english" | "science" | "islamic" | "civic" | "hist" | "geo" | "arts" | "music" | "pe"): Array<{ id: string; name: string; desc?: string; items: any[] }> {
  // TODO: Replace with API call to fetch templates for this subject family
  console.warn('templatesFor is deprecated - templates should come from backend');
  return [];
}
