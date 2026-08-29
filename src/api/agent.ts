/**
 * Phase 3 - AI Agent API (document authoring + edits)
 */

import { api, unwrap } from './client';

export interface AgentGeneratePayload {
  mode: 'full' | 'exercise';
  constitution?: string;
  lessons: Array<{ id: string; title?: string; description?: string }>;
  subjectName?: string;
  gradeLabel?: string;
  language?: 'ar' | 'fr' | 'en';
  exerciseNo?: number;
  desiredPoints?: number;
  linkingMode?: 'standalone' | 'linked';
  linkedToId?: string;
  linkedContext?: string;
  alternative?: boolean;
}

export async function agentGenerate(payload: AgentGeneratePayload): Promise<{ htmlContent: string; images: string[] }> {
  const res = await api.post('/agent/generate', payload);
  return unwrap<{ htmlContent: string; images: string[] }>(res.data);
}

export async function agentStatus(): Promise<{ configured: boolean }> {
  const res = await api.get('/agent/status');
  return unwrap<{ configured: boolean }>(res.data);
}

export async function agentEdit(payload: {
  htmlContent: string;
  instruction: string;
  attachments?: string[];
  language?: 'ar' | 'fr' | 'en';
}): Promise<{ htmlContent: string }> {
  const res = await api.post('/agent/edit', payload, { timeout: 180000 });
  return unwrap<{ htmlContent: string }>(res.data);
}

export async function uploadAgentImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post('/agent/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap<{ url: string }>(res.data).url;
}

export async function saveAiExam(payload: {
  title: string;
  htmlContent: string;
  mode?: 'full' | 'manual';
  language?: 'ar' | 'fr' | 'en';
  lessonRefs?: string[];
}): Promise<string> {
  const res = await api.post('/exams/save', payload);
  return unwrap<{ exam: { id: string } }>(res.data).exam.id;
}

export async function exportPdf(title: string, htmlContent: string): Promise<void> {
  const res = await api.post('/export/pdf', { title, htmlContent }, { responseType: 'blob', timeout: 300000 });
  const blob = new Blob([res.data as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(title || 'امتحان').replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 60)}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
