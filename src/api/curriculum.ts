/**
 * Curriculum API Service
 * Fetches curriculum data from the secure Node.js backend.
 * All curriculum data resides in the SQL database - no hardcoded data in frontend.
 */

import { api, unwrap } from './client';

export interface BackendSubject {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string | null;
  nameFr: string | null;
  code: string | null; // cnpGuideCode
  weeklyHours: number | null;
  isAssessable: boolean; // renamed from isExamAssessable
  descriptionAr: string | null;
  schoolYear: 'YEAR_1' | 'YEAR_2' | 'YEAR_3' | 'YEAR_4' | 'YEAR_5' | 'YEAR_6';
  source: 'SYSTEM' | 'CUSTOM';
  userId: string | null;
  family?: string | null; // optional subject-family metadata (used for exercise catalog hints)
  terms?: BackendTermWithUnits[]; // Nested structure for full curriculum
}

export interface BackendTermWithUnits {
  id: string;
  subjectId: string;
  termNumber: number;
  termNameAr: string;
  weeksRange: string;
  units: BackendUnitWithLessons[];
}

export interface BackendUnitWithLessons {
  id: string;
  termId: string;
  unitNameAr: string;
  weeks: string;
  descriptionAr: string | null;
  lessons: BackendLessonSimple[];
}

export interface BackendLessonSimple {
  id: string;
  unitId: string | null;
  subjectId: string;
  lessonId: number;
  titleAr: string;
  titleEn: string | null;
  descriptionAr: string;
  difficultyRange: 'easy' | 'medium' | 'hard';
}

export interface BackendTerm {
  id: string;
  subjectId: string;
  termNumber: number;
  termNameAr: string;
  weeksRange: string;
}

export interface BackendUnit {
  id: string;
  termId: string;
  unitNameAr: string;
  weeks: string;
  descriptionAr: string | null;
}

export interface BackendLesson {
  id: string;
  unitId: string;
  subjectId: string;
  lessonId: number;
  titleAr: string;
  titleOriginalAr: string | null;
  descriptionAr: string;
  difficultyRange: 'easy' | 'medium' | 'hard';
  bloomLevels: string[];
  prerequisites: number[];
  readmePath: string | null;
}

export interface BackendExerciseType {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  bloomDefault: string | null;
  difficultyDefault: 'easy' | 'medium' | 'hard' | null;
  exampleAr: string | null;
  appliesToSubjects: string[];
}

export interface LessonWithUnit {
  lesson: BackendLesson;
  unit: BackendUnit;
  term: BackendTerm;
}

/**
 * Fetch complete curriculum structure for a school year and source.
 * When no specific year is given, the backend groups by school year.
 */
export async function fetchCurriculumSubjects(
  year?: string,
  source: 'system' | 'custom' = 'system'
): Promise<any[]> {
  const response = await api.get('/curriculum/subjects', {
    params: { ...(year ? { year } : {}), source },
  });
  const data = unwrap<any>(response.data);
  // With a year filter the payload is a flat array; without one it is grouped by year
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') return Object.values(data).flat();
  return [];
}

/**
 * Fetch all available subjects from the backend (legacy - use fetchCurriculumSubjects instead)
 */
export async function fetchSubjects(): Promise<BackendSubject[]> {
  return fetchCurriculumSubjects('1', 'system');
}

/**
 * Fetch terms (trimesters) for a specific subject
 */
export async function fetchSubjectTerms(subjectId: string): Promise<BackendTerm[]> {
  const response = await api.get(`/curriculum/subjects/${subjectId}/terms`);
  return unwrap<BackendTerm[]>(response.data);
}

/**
 * Fetch lessons for a specific subject, optionally filtered by term
 */
export async function fetchSubjectLessons(
  subjectId: string,
  _termNumber?: number
): Promise<LessonWithUnit[]> {
  const response = await api.get(`/curriculum/subjects/${subjectId}/lessons`);
  return unwrap<LessonWithUnit[]>(response.data);
}

/**
 * Fetch detailed information for a specific lesson
 */
export async function fetchLessonDetails(lessonId: string): Promise<BackendLesson> {
  const response = await api.get(`/curriculum/lessons/${lessonId}`);
  return unwrap<BackendLesson>(response.data);
}

/**
 * Fetch all exercise types from the backend
 */
export async function fetchExerciseTypes(): Promise<BackendExerciseType[]> {
  const response = await api.get('/curriculum/exercise-types');
  return unwrap<BackendExerciseType[]>(response.data);
}

/**
 * Fetch complete curriculum structure for a subject
 */
export async function fetchFullCurriculum(subjectId: string): Promise<{
  subject: BackendSubject | undefined;
  terms: BackendTerm[];
  lessons: LessonWithUnit[];
}> {
  const [allSubjects, terms, lessons] = await Promise.all([
    fetchCurriculumSubjects('1', 'system'),
    fetchSubjectTerms(subjectId),
    fetchSubjectLessons(subjectId),
  ]);

  const subject = (allSubjects as BackendSubject[]).find((s) => s.id === subjectId);

  return { subject, terms, lessons };
}
