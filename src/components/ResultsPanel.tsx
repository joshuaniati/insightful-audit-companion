interface Finding {
  severity: "high" | "medium" | "low" | "compliant";
  title: string;
  regulation: string;
  description: string;
  evidence?: string;
  recommendation?: string;
}

interface AuditResult {
  totalFindings: number;
  highRisk: number;
  mediumRisk: number;
  compliant: number;
  opinion: "clean" | "qualified" | "adverse";
  findings: Finding[];
}

const MOCK_RESULT: AuditResult = {
  totalFindings: 8,
  highRisk: 2,
  mediumRisk: 3,
  compliant: 3,
  opinion: "qualified",
  findings: [
    {
      severity: "high",
      title: "Missing Annual Financial Statements Disclosure",
      regulation: "PFMA Section 40(1)(b)",
      description: "The document does not contain required annual financial statement disclosures as mandated by the Public Finance Management Act.",
      evidence: "No reference to annual financial statements found in uploaded documents.",
      recommendation: "Prepare and include complete AFS in compliance with PFMA Section 40 requirements.",
    },
    {
      severity: "high",
      title: "Non-Compliant Procurement Process",
      regulation: "PFMA Section 38(1)(a)(iii)",
      description: "Supply chain management procedures do not align with prescribed procurement regulations.",
      recommendation: "Review and update SCM policies to align with National Treasury regulations.",
    },
    {
      severity: "medium",
      title: "Incomplete Risk Management Framework",
      regulation: "King IV Principle 11",
      description: "Risk management governance structures are partially documented but lack key oversight mechanisms.",
      recommendation: "Establish a dedicated risk committee and document risk appetite framework.",
    },
    {
      severity: "medium",
      title: "POPIA Consent Records Insufficient",
      regulation: "POPIA Section 11",
      description: "Data subject consent records are incomplete or not properly maintained.",
      recommendation: "Implement a digital consent management system with audit trail capabilities.",
    },
    {
      severity: "medium",
      title: "OHS Committee Not Properly Constituted",
      regulation: "OHS Act Section 19",
      description: "Health and safety committee does not meet minimum composition requirements.",
      recommendation: "Reconstitute the OHS committee with appropriate representation from management and workers.",
    },
    {
      severity: "compliant",
      title: "B-BBEE Certificate Valid and Current",
      regulation: "B-BBEE Act Section 10",
      description: "Valid B-BBEE certificate on file with appropriate verification agency endorsement.",
    },
    {
      severity: "compliant",
      title: "Employment Equity Plan Filed",
      regulation: "EEA Section 20",
      description: "Employment equity plan has been filed with the Department of Labour within prescribed timelines.",
    },
    {
      severity: "compliant",
      title: "Environmental Impact Assessment Approved",
      regulation: "NEMA Section 24",
      description: "All required environmental impact assessments have been conducted and approved.",
    },
  ],
};

const ResultsPanel = ({ visible }: { visible: boolean }) => {
  if (!visible) return null;

  const r = MOCK_RESULT;

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
      {(Object.entries(severityGroups) as [string, Finding[]][]).map(([sev, items]) =>
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
