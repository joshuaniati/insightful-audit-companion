import type { AuditResult, AuditFinding } from "@/lib/puter-ai";
import { exportAuditReport } from "@/lib/pdf-export";

const ResultsPanel = ({ visible, result }: { visible: boolean; result?: AuditResult | null }) => {
  if (!visible || !result) return null;

  const r = result;

  const opinionConfig = {
    clean: { bg: "bg-success/10 border-success/30", icon: "✅", title: "Clean Audit Opinion", sub: "No material findings identified." },
    qualified: { bg: "bg-warning/10 border-warning/30", icon: "⚠️", title: "Qualified Audit Opinion", sub: "Material findings require attention." },
    adverse: { bg: "bg-destructive/10 border-destructive/30", icon: "❌", title: "Adverse Audit Opinion", sub: "Critical non-compliance issues found." },
  };
  const op = opinionConfig[r.opinion];

  const severityGroups = {
    high: r.findings.filter((f) => f.severity === "high"),
    medium: r.findings.filter((f) => f.severity === "medium"),
    compliant: r.findings.filter((f) => f.severity === "compliant"),
  };

  const badgeClass = {
    high: "bg-destructive/10 text-destructive border border-destructive/30",
    medium: "bg-warning/10 text-warning border border-warning/30",
    low: "bg-success/10 text-success border border-success/20",
    compliant: "bg-success/10 text-success border border-success/30",
  };

  const sectionTitleClass = {
    high: "bg-destructive/15 text-destructive border border-destructive/20",
    medium: "bg-warning/10 text-warning border border-warning/20",
    compliant: "bg-success/8 text-success border border-success/15",
  };

  return (
    <div className="mt-0">
      {/* Export Button */}
      <button
        onClick={() => exportAuditReport(r)}
        className="w-full mb-5 py-3 bg-accent/15 border border-accent/40 text-accent rounded-xl font-heading text-sm font-bold tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2.5 hover:bg-accent/25 hover:border-accent/60"
      >
        📥 DOWNLOAD PDF REPORT
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { num: r.totalFindings, label: "TOTAL FINDINGS", color: "text-primary" },
          { num: r.highRisk, label: "HIGH RISK", color: "text-destructive" },
          { num: r.mediumRisk, label: "MEDIUM RISK", color: "text-warning" },
          { num: r.compliant, label: "COMPLIANT", color: "text-success" },
        ].map((s) => (
          <div key={s.label} className="bg-secondary/50 border border-border rounded-xl p-4 text-center">
            <div className={`font-heading text-3xl font-bold ${s.color}`}>{s.num}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Opinion */}
      <div className={`rounded-xl p-4 px-5 mb-5 flex items-center gap-3.5 border ${op.bg}`}>
        <span className="text-3xl">{op.icon}</span>
        <div>
          <div className="font-heading text-xl font-bold text-navy-foreground">{op.title}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{op.sub}</div>
        </div>
      </div>

      {/* Findings */}
      {(Object.entries(severityGroups) as [string, AuditFinding[]][]).map(([sev, items]) =>
        items.length > 0 ? (
          <div key={sev} className="mb-4">
            <div className={`font-heading text-xs font-bold tracking-widest uppercase px-3.5 py-2 rounded-t-lg flex items-center gap-2 ${sectionTitleClass[sev as keyof typeof sectionTitleClass]}`}>
              {sev === "high" && "🔴"} {sev === "medium" && "🟡"} {sev === "compliant" && "🟢"}
              {sev === "high" ? "HIGH RISK FINDINGS" : sev === "medium" ? "MEDIUM RISK FINDINGS" : "COMPLIANT AREAS"}
              <span className="ml-auto opacity-70">{items.length}</span>
            </div>
            {items.map((f, i) => (
              <div
                key={i}
                className={`bg-card border border-border border-t-0 p-4 transition-colors hover:bg-secondary/50 ${
                  i === items.length - 1 ? "rounded-b-lg" : ""
                }`}
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <span className={`font-heading text-[0.7rem] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 mt-0.5 ${badgeClass[f.severity]}`}>
                    {f.severity.toUpperCase()}
                  </span>
                  <div>
                    <div className="font-heading text-[0.95rem] font-semibold text-navy-foreground">{f.title}</div>
                    <div className="text-xs text-primary mt-0.5">{f.regulation}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                {f.evidence && (
                  <div className="mt-2.5 p-2.5 bg-primary/5 border border-primary/15 rounded-lg text-xs text-muted-foreground">
                    <strong className="text-primary block mb-1 font-heading">Evidence</strong>
                    {f.evidence}
                  </div>
                )}
                {f.recommendation && (
                  <div className="mt-2 p-2 bg-accent/5 border-l-[3px] border-accent rounded-r-md text-xs text-muted-foreground">
                    <strong className="text-accent font-heading">Recommendation: </strong>
                    {f.recommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null
      )}
    </div>
  );
};

export default ResultsPanel;
