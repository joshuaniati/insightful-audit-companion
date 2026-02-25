import jsPDF from "jspdf";
import type { AuditResult, AuditFinding } from "./puter-ai";

export function exportAuditReport(result: AuditResult) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 20;

  const checkPage = (need: number) => {
    if (y + need > 270) {
      doc.addPage();
      y = 20;
    }
  };

  // Header
  doc.setFillColor(15, 30, 61);
  doc.rect(0, 0, pageW, 38, "F");
  doc.setTextColor(240, 244, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("SA Regulatory Audit Report", margin, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Eagle Vision Services  •  Generated ${new Date().toLocaleDateString("en-ZA")}`, margin, 28);
  y = 48;

  // Summary stats
  const stats = [
    { label: "Total Findings", value: result.totalFindings, r: 30, g: 95, b: 212 },
    { label: "High Risk", value: result.highRisk, r: 239, g: 68, b: 68 },
    { label: "Medium Risk", value: result.mediumRisk, r: 245, g: 158, b: 11 },
    { label: "Compliant", value: result.compliant, r: 34, g: 197, b: 94 },
  ];
  const boxW = (contentW - 9) / 4;
  stats.forEach((s, i) => {
    const x = margin + i * (boxW + 3);
    doc.setFillColor(22, 34, 64);
    doc.roundedRect(x, y, boxW, 22, 3, 3, "F");
    doc.setTextColor(s.r, s.g, s.b);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(String(s.value), x + boxW / 2, y + 12, { align: "center" });
    doc.setFontSize(6);
    doc.setTextColor(138, 159, 196);
    doc.text(s.label.toUpperCase(), x + boxW / 2, y + 19, { align: "center" });
  });
  y += 30;

  // Opinion
  const opMap = {
    clean: { label: "Clean Audit Opinion", r: 34, g: 197, b: 94 },
    qualified: { label: "Qualified Audit Opinion", r: 245, g: 158, b: 11 },
    adverse: { label: "Adverse Audit Opinion", r: 239, g: 68, b: 68 },
  };
  const op = opMap[result.opinion];
  doc.setFillColor(op.r, op.g, op.b);
  doc.roundedRect(margin, y, contentW, 12, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(op.label, margin + 6, y + 8);
  y += 20;

  // Findings
  const severityOrder: AuditFinding["severity"][] = ["high", "medium", "low", "compliant"];
  const sevColors = {
    high: { r: 239, g: 68, b: 68, label: "HIGH RISK FINDINGS" },
    medium: { r: 245, g: 158, b: 11, label: "MEDIUM RISK FINDINGS" },
    low: { r: 34, g: 197, b: 94, label: "LOW RISK FINDINGS" },
    compliant: { r: 34, g: 197, b: 94, label: "COMPLIANT AREAS" },
  };

  for (const sev of severityOrder) {
    const items = result.findings.filter((f) => f.severity === sev);
    if (items.length === 0) continue;

    checkPage(20);
    const sc = sevColors[sev];
    doc.setFillColor(sc.r, sc.g, sc.b);
    doc.roundedRect(margin, y, contentW, 8, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(`${sc.label}  (${items.length})`, margin + 4, y + 5.5);
    y += 12;

    for (const f of items) {
      checkPage(30);

      // Title + regulation
      doc.setTextColor(240, 244, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const titleLines = doc.splitTextToSize(f.title, contentW - 4);
      doc.text(titleLines, margin + 2, y);
      y += titleLines.length * 5;

      doc.setTextColor(30, 95, 212);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(f.regulation, margin + 2, y);
      y += 5;

      // Description
      doc.setTextColor(138, 159, 196);
      doc.setFontSize(8);
      const descLines = doc.splitTextToSize(f.description, contentW - 4);
      for (const line of descLines) {
        checkPage(5);
        doc.text(line, margin + 2, y);
        y += 4;
      }
      y += 1;

      // Evidence
      if (f.evidence) {
        checkPage(10);
        doc.setTextColor(30, 95, 212);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("Evidence:", margin + 2, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(138, 159, 196);
        const evLines = doc.splitTextToSize(f.evidence, contentW - 6);
        for (const line of evLines) {
          checkPage(5);
          doc.text(line, margin + 4, y);
          y += 3.5;
        }
        y += 2;
      }

      // Recommendation
      if (f.recommendation) {
        checkPage(10);
        doc.setTextColor(201, 168, 76);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.text("Recommendation:", margin + 2, y);
        y += 4;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(138, 159, 196);
        const recLines = doc.splitTextToSize(f.recommendation, contentW - 6);
        for (const line of recLines) {
          checkPage(5);
          doc.text(line, margin + 4, y);
          y += 3.5;
        }
        y += 2;
      }

      y += 4;
      // Separator line
      doc.setDrawColor(30, 49, 96);
      doc.line(margin, y, margin + contentW, y);
      y += 4;
    }
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(138, 159, 196);
    doc.text(
      `Eagle Vision Services — SA Regulatory Audit Report — Page ${i} of ${totalPages}`,
      pageW / 2,
      287,
      { align: "center" }
    );
  }

  doc.save(`SA-Audit-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
