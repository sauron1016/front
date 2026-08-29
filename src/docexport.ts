import { TRIMESTERS } from "./data";
import { buildPayload, docStrings, fmtPoints, kindLabel, lessonsByUnit, resolveLabels, slotName, suggestTitle, totalPoints, type ExamPlan } from "./blueprint";
import type { BackendSubject } from "./api/curriculum";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const fname = (p: ExamPlan) => `${(p.meta.title || "امتحان").replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 60)}.doc`;

function sheetHtml(p: ExamPlan, subjects: BackendSubject[] = []): string {
  const S = docStrings(p);
  const m = p.meta;
  const sub = subjects.find(s => s.id === p.subjectId) ?? null;
  const L = resolveLabels(p, subjects);
  const total = totalPoints(p.exercises);
  const units = lessonsByUnit(p);
  const tri = TRIMESTERS[(p.trimester ?? 1) - 1];
  const kindText = kindLabel(m.kind, m.lang);
  const triText = m.trimesterLabel.trim() ? m.trimesterLabel : m.lang === "fr" ? tri.labelFr : tri.label;
  const title = (m.titleAuto ? suggestTitle(p, subjects) : m.title) || `${kindText} — ${L.subject}`;

  const INK = "#1b2b32";
  const border = `border:1pt solid #555;`;
  const headBg = `background:${INK};color:#fff;`;
  const logo = m.logo ? `<img src="${m.logo}" width="64" height="64" alt="logo" />` : "";

  const rows = p.exercises
    .map((s, i) => {
      const li = s.linkedTo ? p.exercises.findIndex((x) => x.id === s.linkedTo) : -1;
      return `<tr>
        <td style="${border}padding:4pt;text-align:center;font-weight:bold;">${i + 1}</td>
        <td style="${border}padding:4pt;">${esc(slotName(s, sub?.family))}</td>
        <td style="${border}padding:4pt;text-align:center;">${li >= 0 ? esc(S.linkRef(li + 1)) : "—"}</td>
        ${m.showScale ? `<td style="${border}padding:4pt;text-align:center;font-weight:bold;">${fmtPoints(s.points)}</td>` : ""}
      </tr>`;
    })
    .join("");

  const leftBlock = `
      ${logo}
      <p style="margin:2pt 0;font-size:15pt;font-weight:bold;">${esc(S.republic)}</p>
      <p style="margin:2pt 0;">${esc(S.ministry)}</p>
      ${m.region ? `<p style="margin:2pt 0;">${esc(m.region)}</p>` : ""}
      <p style="margin:2pt 0;">${esc(m.school || "……………………")}</p>`;
  const rightBlock = `
      <p style="margin:2pt 0;font-weight:bold;">${esc(kindText)}</p>
      <p style="margin:2pt 0;">${esc(S.schoolYear)}: ${esc(m.year)}</p>
      <p style="margin:2pt 0;">${esc(triText)}</p>`;

  let headerHtml = "";
  if (m.headerLayout === "table") {
    headerHtml = `<table width="100%" style="border-collapse:collapse;margin-bottom:10pt;">
      <tr>
        <td style="${border}padding:6pt;">${esc(S.republic)}<br/>${esc(S.ministry)}${m.region ? `<br/>${esc(m.region)}` : ""}</td>
        <td style="${border}padding:6pt;text-align:center;font-weight:bold;">${esc(m.school || "……………………")}${logo ? `<br/>${logo}` : ""}</td>
        <td style="${border}padding:6pt;text-align:${S.dir === "rtl" ? "left" : "right"};">${esc(S.schoolYear)}: ${esc(m.year)}</td>
      </tr>
      <tr>
        <td style="${border}padding:6pt;font-weight:bold;">${esc(kindText)}</td>
        <td style="${border}padding:6pt;text-align:center;">${esc(triText)}</td>
        <td style="${border}padding:6pt;text-align:${S.dir === "rtl" ? "left" : "right"};">${esc(S.level)}: ${esc(L.grade)}</td>
      </tr>
    </table>`;
  } else if (m.headerLayout === "center") {
    headerHtml = `<div style="text-align:center;margin-bottom:10pt;">
      ${logo}
      <p style="margin:2pt 0;font-size:15pt;font-weight:bold;">${esc(S.republic)}</p>
      <p style="margin:2pt 0;">${esc(S.ministry)}</p>
      ${m.region ? `<p style="margin:2pt 0;">${esc(m.region)}</p>` : ""}
      <p style="margin:2pt 0;">${esc(m.school || "……………………")}</p>
      <p style="margin:6pt 0;font-weight:bold;">${esc(kindText)} — ${esc(m.year)} — ${esc(triText)}</p>
    </div>`;
  } else if (m.headerLayout === "banner") {
    headerHtml = `<table width="100%" style="border-collapse:collapse;border:1.5pt solid ${INK};margin-bottom:10pt;"><tr>
      <td style="padding:6pt;width:70pt;text-align:center;">${logo}</td>
      <td style="padding:6pt;vertical-align:middle;text-align:center;"><p style="margin:2pt 0;font-weight:bold;font-size:13pt;">${esc(m.school || "……………………")}</p>${m.region ? `<p style="margin:2pt 0;font-size:10pt;">${esc(m.region)}</p>` : ""}<p style="margin:2pt 0;font-size:10pt;">${esc(S.republic)} — ${esc(S.ministry)}</p></td>
      <td style="padding:6pt;width:120pt;vertical-align:middle;text-align:center;"><p style="margin:2pt 0;font-weight:bold;">${esc(kindText)}</p><p style="margin:2pt 0;font-size:10pt;">${esc(S.schoolYear)}: ${esc(m.year)}</p><p style="margin:2pt 0;font-size:10pt;">${esc(triText)}</p></td>
    </tr></table>`;
  } else {
    headerHtml = `<table width="100%" style="margin-bottom:10pt;"><tr>
      <td style="vertical-align:top;">${leftBlock}</td>
      <td style="vertical-align:top;text-align:${S.dir === "rtl" ? "left" : "right"};">${rightBlock}</td>
    </tr></table>`;
  }

  return `
  ${headerHtml}
  <h1 style="text-align:center;font-size:18pt;border-top:1.5pt solid ${INK}88;border-bottom:1.5pt solid ${INK}88;padding:8pt 0;margin:12pt 0;">${esc(title)}</h1>

  <table width="100%" style="margin-bottom:10pt;">
    <tr>
      ${m.headerLayout !== "table" ? `<td><b>${esc(S.level)}:</b> ${esc(L.grade)}</td>` : ""}
      <td><b>${esc(S.subject)}:</b> ${esc(L.subject)}</td>
      <td><b>${esc(S.duration)}:</b> ${m.duration} ${esc(S.durationUnit)}</td>
      <td><b>${esc(S.note)}:</b> ........ / ${fmtPoints(total)}</td>
    </tr>
  </table>

  <p style="background:#f4f1e9;padding:6pt;border:1pt solid #b5ad97;font-weight:bold;">${esc(S.includes)}</p>
  <ul style="margin-top:2pt;">
    ${units.map(({ unit, lessons }) => `<li dir="rtl"><b>${esc(unit.t)}</b> (ث${unit.tri}): ${esc(lessons.map((l) => l.t).join("، "))}</li>`).join("")}
  </ul>

  <h2 style="font-size:14pt;margin:14pt 0 6pt;">${esc(S.structure)}</h2>
  <table width="100%" style="border-collapse:collapse;">
    <thead>
      <tr>
        <th style="${border}${headBg}padding:5pt;">${esc(S.exN)}</th>
        <th style="${border}${headBg}padding:5pt;">${esc(S.exName)}</th>
        <th style="${border}${headBg}padding:5pt;">${esc(S.link)}</th>
        ${m.showScale ? `<th style="${border}${headBg}padding:5pt;">${esc(S.points)}</th>` : ""}
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr>
        <td colspan="${m.showScale ? 3 : 4}" style="${border}padding:5pt;font-weight:bold;background:#f4f1e9;">${esc(S.totalRow)}</td>
        ${m.showScale ? `<td style="${border}padding:5pt;font-weight:bold;background:#f4f1e9;text-align:center;">${fmtPoints(total)}</td>` : ""}
      </tr>
    </tbody>
  </table>

  ${m.notes ? `<p style="margin-top:12pt;border:1pt dashed #888;padding:6pt;"><b>${esc(S.notes)}:</b> ${esc(m.notes)}</p>` : ""}

  <table width="100%" style="margin-top:26pt;">
    <tr>
      <td><b>${esc(S.teacher)}:</b> ${esc(m.teacher)} &nbsp;&nbsp;&nbsp; <u>&nbsp;&nbsp;&nbsp;&nbsp;${esc(S.sign)}&nbsp;&nbsp;&nbsp;&nbsp;</u></td>
      <td style="text-align:${S.dir === "rtl" ? "left" : "right"};font-weight:bold;font-size:13pt;">— ${esc(S.closing)} —</td>
    </tr>
  </table>
  <p style="margin-top:16pt;text-align:center;font-size:8pt;color:#999;">${esc(S.generatedBy)}</p>`;
}

export function downloadWordDoc(plan: ExamPlan) {
  const S = docStrings(plan);
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${esc(plan.meta.title || "امتحان")}</title></head><body dir="${S.dir}" style="font-family:'Amiri','Traditional Arabic','Times New Roman',serif;font-size:13pt;">${sheetHtml(plan)}</body></html>`;
  const blob = new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fname(plan);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

export function downloadJsonPayload(plan: ExamPlan) {
  const blob = new Blob([JSON.stringify(buildPayload(plan), null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(plan.meta.title || "exam-payload").replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 50)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}
