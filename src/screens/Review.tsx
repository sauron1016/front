import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { BackendSubject } from "../api/curriculum";
import { agentEdit, saveAiExam, exportPdf, uploadAgentImage } from "../api/agent";
import { fmtPoints } from "../blueprint";
import type { ExamPlan } from "../blueprint";
import { DuoButton, Icon, cn } from "../ui";
import { SectionLabel, StageTitle } from "./steps/shared";
import { useSpeech } from "../hooks/useSpeech";
import { api } from "../api/client";

/**
 * Phase 3 - Step 6: whole-exam review
 * The user sees the SERVER-RENDERED PDF (what will actually be printed), with
 * an inline agent edit panel (text + speech-to-text + image attachments) and
 * PDF / Word / print exports. The raw HTML is kept off-screen purely as the
 * print source.
 */

export function ReviewStep({
  plan,
  subjects,
  onChangeAiDocument,
  onGoStep,
  onToast,
}: {
  plan: ExamPlan;
  subjects: BackendSubject[];
  onChangeAiDocument: (doc?: { mode: "full" | "manual"; htmlContent: string; images?: string[]; savedId?: string }) => void;
  onGoStep: (i: number) => void;
  onToast: (msg: string) => void;
}) {
  const doc = plan.aiDocument;
  const [instruction, setInstruction] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [busy, setBusy] = useState<"" | "edit" | "pdf" | "word" | "save" | "upload" | "preview">("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfFailed, setPdfFailed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const speech = useSpeech("ar-TN");

  const subjectName = subjects.find((s) => s.id === plan.subjectId)?.nameAr || "امتحان";
  const title = plan.meta.title || subjectName;

  // Render the server PDF preview whenever the document changes
  useEffect(() => {
    if (!doc?.htmlContent) return;
    let alive = true;
    let objectUrl = "";
    setPdfFailed(false);
    setBusy((b) => b || "preview");
    (async () => {
      try {
        const res = await api.post("/export/pdf", { title, htmlContent: doc.htmlContent }, { responseType: "blob", timeout: 300000 });
        if (!alive) return;
        objectUrl = URL.createObjectURL(new Blob([res.data as BlobPart], { type: "application/pdf" }));
        setPdfUrl(objectUrl);
      } catch {
        if (alive) setPdfFailed(true);
      } finally {
        if (alive) setBusy((b) => (b === "preview" ? "" : b));
      }
    })();
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc?.htmlContent]);

  async function applyEdit() {
    if (!doc || !instruction.trim()) return;
    setBusy("edit");
    try {
      const result = await agentEdit({
        htmlContent: doc.htmlContent,
        instruction: instruction.trim(),
        attachments,
        language: "ar",
      });
      onChangeAiDocument({ ...doc, htmlContent: result.htmlContent });
      setInstruction("");
      setAttachments([]);
      onToast("طُبِّق تعديل الوكيل على المستند");
    } catch {
      onToast("تعذّر تطبيق التعديل — حاول مجددًا");
    } finally {
      setBusy("");
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy("upload");
    try {
      for (const f of Array.from(files).slice(0, 6 - attachments.length)) {
        const url = await uploadAgentImage(f);
        setAttachments((old) => [...old, url]);
      }
      onToast("أُرفقت الصور");
    } catch {
      onToast("فشل رفع صورة");
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function downloadWord() {
    if (!doc) return;
    setBusy("word");
    const wordHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${title}</title></head><body dir="rtl" style="font-family:'Segoe UI',Tahoma,'Traditional Arabic',serif;font-size:13pt;line-height:1.9;">${doc.htmlContent}</body></html>`;
    const blob = new Blob(["\ufeff", wordHtml], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60)}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    setBusy("");
    onToast("نُزِّل ملف Word");
  }

  async function downloadPdf() {
    if (!doc) return;
    setBusy("pdf");
    try {
      await exportPdf(title, doc.htmlContent);
      onToast("نُزِّل ملف PDF");
    } catch {
      onToast("تعذّر إنشاء PDF على الخادم");
    } finally {
      setBusy("");
    }
  }

  async function persist() {
    if (!doc) return;
    setBusy("save");
    try {
      const id = await saveAiExam({ title, htmlContent: doc.htmlContent, mode: doc.mode, lessonRefs: plan.lessons });
      onChangeAiDocument({ ...doc, savedId: id });
      onToast("حُفظ الامتحان في حسابك");
    } catch {
      onToast("تعذّر الحفظ على الخادم");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="pb-28">
      <StageTitle n={6} icon="seal" title="مراجعة وطباعة الامتحان" sub="راجع المستند كاملًا، اطلب من الوكيل أي تعديل بالكتابة أو بالصوت، ثم صدّره PDF أو Word." />

      {!doc ? (
        <div className="card grid place-items-center gap-4 py-16 text-center">
          <Icon name="file" size={40} className="text-line-dark" />
          <p className="font-display text-[15px] font-extrabold text-ink">لا يوجد مستند بعد</p>
          <DuoButton icon="wand" onClick={() => onGoStep(4)}>انتقل إلى المولّد الذكي</DuoButton>
        </div>
      ) : (
        <>
          {/* لوحة التعديل بالوكيل */}
          <div className={cn("no-print card anim-fade-up mb-5 overflow-hidden", busy && "opacity-70 pointer-events-none")}>
            <button type="button" onClick={() => setPanelOpen((v) => !v)} className="flex w-full items-center gap-2 px-5 py-3 text-start">
              <Icon name="wand" size={17} className="text-pine-deep" />
              <span className="flex-1 font-display text-[13.5px] font-extrabold text-ink">اطلب تعديلًا من الوكيل</span>
              <span className="rounded-md bg-pine-soft px-1.5 py-0.5 text-[10.5px] font-extrabold text-pine-dark">{busy === "edit" ? "جاري التعديل…" : busy ? "لحظة…" : doc.mode === "full" ? "توليد كامل" : "تمرينًا بتمرين"}</span>
              <Icon name={panelOpen ? "chevUp" : "chevDown"} size={15} />
            </button>

            {panelOpen && (
              <div className="space-y-3 border-t-2 border-line bg-paper/40 px-5 py-4">
                <textarea
                  value={speech.listening ? `${instruction} ${speech.transcript}`.trim() : instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={3}
                  placeholder='مثال: «اجعل التمرين الثاني من ثلاثة أسئلة وأضف صورة سند لفصل الحيوانات»'
                  className="w-full rounded-xl border-2 border-line bg-white px-3.5 py-2.5 text-[14px] leading-relaxed outline-none focus:border-pine"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!speech.supported}
                    onClick={() => (speech.listening ? speech.stop() : speech.start((t) => setInstruction((p) => `${p} ${t}`.trim())))}
                    title={speech.supported ? "إدخال صوتي" : "الإدخال الصوتي مدعوم في Chrome/Edge"}
                    className={cn("inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-[12.5px] font-bold transition-all", speech.listening ? "animate-pulse border-tun-dark bg-tun text-white" : speech.supported ? "border-line bg-white text-sub hover:border-pine/50 hover:text-pine" : "cursor-not-allowed border-line bg-paper text-faint")}
                  >
                    <Icon name="mic" size={14} />
                    {speech.listening ? "أستمع… اضغط للإيقاف" : "إدخال صوتي"}
                  </button>

                  <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
                  <DuoButton size="sm" color="white" icon="image" onClick={() => fileRef.current?.click()}>إرفاق صور ({attachments.length})</DuoButton>

                  <span className="ms-auto" />
                  <DuoButton size="sm" icon="wand" disabled={!instruction.trim() || busy !== ""} onClick={applyEdit}>
                    {busy === "edit" ? "جاري التعديل…" : "طبّق التعديل"}
                  </DuoButton>
                </div>

                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((url, i) => (
                      <span key={i} className="relative">
                        <img src={url} alt={`مرفق ${i + 1}`} className="h-14 w-14 rounded-lg border-2 border-line object-cover" />
                        <button type="button" aria-label="إزالة" onClick={() => setAttachments((o) => o.filter((_, j) => j !== i))} className="absolute -top-1.5 -start-1.5 grid h-5 w-5 place-items-center rounded-full bg-tun text-white shadow"><Icon name="x" size={10} strokeWidth={3} /></button>
                      </span>
                    ))}
                    <span className="self-center text-[11px] font-medium text-faint">ستستعملها الوكيل كمرجع وعند الطلب تُدرَج داخل المستند</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* شريط التصدير */}
          <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-2">
            <SectionLabel icon="printer" text="المستند الجاهز للطباعة" />
            <div className="flex flex-wrap gap-2">
              <DuoButton size="xs" color="white" icon="fileDown" disabled={busy !== ""} onClick={downloadPdf}>{busy === "pdf" ? "جاري الإنشاء…" : "PDF"}</DuoButton>
              <DuoButton size="xs" color="white" icon="fileDown" disabled={busy !== ""} onClick={downloadWord}>{busy === "word" ? "جاري التنزيل…" : "Word"}</DuoButton>
              <DuoButton size="xs" color="white" icon="printer" onClick={() => window.print()}>طباعة</DuoButton>
              <DuoButton size="xs" color="blue" icon="check" disabled={busy !== ""} onClick={persist}>{busy === "save" ? "جاري الحفظ…" : doc.savedId ? "حُفِظ — حفظ نسخة جديدة" : "حفظ في حسابي"}</DuoButton>
            </div>
          </div>

          {/* المستند — معاينة PDF من الخادم (نفس ما سيُطبع) */}
          <div className="relative">
            {busy === "preview" && (
              <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-white/80 backdrop-blur-sm">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-line border-t-pine" />
                  <p className="font-display text-[13px] font-extrabold text-ink">جاري تجهيز معاينة PDF…</p>
                </div>
              </div>
            )}

            {pdfUrl ? (
              <iframe
                title="معاينة الامتحان"
                src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
                className={cn("h-[75vh] w-full rounded-xl border-2 border-line bg-white shadow-sm sm:h-[85vh]", busy === "preview" && "opacity-60")}
              />
            ) : (
              <div id="exam-print-area" dir="rtl" className="card exam-preview anim-fade-up min-h-[50vh] overflow-auto bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-7 [&_.answer-key]:mt-6 [&_.answer-key]:rounded-xl [&_.answer-key]:border-2 [&_.answer-key]:border-dashed [&_.answer-key]:border-jasmine-dark [&_.answer-key]:bg-jasmine-soft/40 [&_.exercise-image]:my-4 [&_.exercise-image]:text-center [&_.rubric]:mt-4 [&_.rubric]:rounded-xl [&_.rubric]:bg-paper [&_h1]:mb-4 [&_h1]:text-center [&_h1]:font-display [&_h2]:mt-7 [&_h2]:border-b-2 [&_h2]:border-ink/60 [&_h2]:pb-1 [&_h2]:font-display [&_h3]:mt-5 [&_h3]:font-display [&_img]:mx-auto [&_img]:max-h-56 [&_img]:rounded-lg [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pe-7 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-ink/50 [&_td]:px-2 [&_th]:border [&_th]:border-ink/50 [&_th]:px-2 [&_ul]:list-disc [&_ul]:pe-7">
                <div dangerouslySetInnerHTML={{ __html: doc.htmlContent }} />
              </div>
            )}

            {pdfFailed && !pdfUrl && (
              <p className="no-print mt-2 flex items-center gap-1.5 text-[11.5px] font-bold text-saffron-dark">
                <Icon name="alert" size={13} />
                تعذّر توليد معاينة PDF — هذه معاينة HTML تقريبية، والتصدير الفعلي يظل متاحًا.
              </p>
            )}
          </div>

          {/* نسخة الطباعة - تُرسَل إلى نهاية body عبر Portal حتى لا تُحدث أي تمرير أفقي */}
          {pdfUrl &&
            createPortal(
              <div className="print-portal">
                <div id="exam-print-area" aria-hidden className="print-offscreen exam-preview bg-white px-10 py-8 [&_.answer-key]:mt-6 [&_.answer-key]:rounded-lg [&_.answer-key]:border [&_.answer-key]:border-dashed [&_.answer-key]:border-neutral-400 [&_.rubric]:mt-4 [&_.rubric]:bg-neutral-100 [&_figure]:text-center [&_h1]:text-center [&_h1]:text-2xl [&_h1]:font-bold [&_img]:mx-auto [&_img]:max-w-full [&_li]:mb-2 [&_ol]:list-decimal [&_ol]:ps-8 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-neutral-500 [&_td]:px-2 [&_th]:border [&_th]:border-neutral-500 [&_th]:px-2 [&_ul]:list-disc [&_ul]:ps-8">
                  <div dangerouslySetInnerHTML={{ __html: doc.htmlContent }} />
                </div>
              </div>,
              document.body
            )}

          <div className="no-print mt-4 flex justify-between">
            <DuoButton color="white" size="sm" icon="arrowBack" onClick={() => onGoStep(4)}>عودة للمولّد</DuoButton>
          </div>
        </>
      )}
    </div>
  );
}
