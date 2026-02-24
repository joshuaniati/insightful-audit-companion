const AuditHeader = () => {
  return (
    <header className="border-b border-border bg-gradient-to-br from-secondary to-card">
      <div className="max-w-[1100px] mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-gradient-to-br from-accent to-gold-light rounded-[10px] flex items-center justify-center text-[22px] shrink-0">
            ⚖️
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide text-navy-foreground">
              SA REGULATORY AUDIT TOOL
            </h1>
            <p className="text-[0.72rem] text-muted-foreground tracking-widest uppercase">
              Eagle Vision Services · Document Compliance Analysis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/15 border border-primary/30 rounded-full px-3 py-1.5 font-heading text-xs text-primary tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-success" style={{ animation: 'pulse-dot 2s infinite' }} />
          AI-POWERED
        </div>
      </div>
    </header>
  );
};

export default AuditHeader;
