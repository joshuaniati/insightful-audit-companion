interface AnalyseButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
  progressMessage?: string;
  progressPercent?: number;
}

const AnalyseButton = ({ disabled, loading, onClick, progressMessage, progressPercent }: AnalyseButtonProps) => {
  return (
    <div>
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className="w-full py-4 bg-gradient-to-r from-primary to-[hsl(220,100%,60%)] text-primary-foreground border-none rounded-xl font-heading text-lg font-bold tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2.5 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(30,95,212,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {loading ? (
          <>
            <div className="w-4.5 h-4.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" style={{ width: 18, height: 18, animation: 'spin 0.7s linear infinite' }} />
            ANALYSING...
          </>
        ) : (
          <>⚡ ANALYSE DOCUMENTS</>
        )}
      </button>

      {loading && (
        <div className="mt-4">
          <div className="text-xs text-muted-foreground mb-1.5 font-heading">{progressMessage || "Processing documents..."}</div>
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-[hsl(220,100%,60%)] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent ?? 60}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyseButton;
