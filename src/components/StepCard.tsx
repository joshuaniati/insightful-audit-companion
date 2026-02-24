import { ReactNode } from "react";

interface StepCardProps {
  number: number;
  title: string;
  subtitle: string;
  active?: boolean;
  done?: boolean;
  children: ReactNode;
}

const StepCard = ({ number, title, subtitle, active, done, children }: StepCardProps) => {
  const borderClass = done
    ? "border-success/40"
    : active
    ? "border-primary"
    : "border-border";

  const numClass = done
    ? "bg-success text-primary-foreground"
    : active
    ? "bg-primary text-primary-foreground"
    : "bg-border text-muted-foreground";

  return (
    <div className={`bg-card border ${borderClass} rounded-2xl mb-5 overflow-hidden transition-colors duration-300`}>
      <div className="px-5 py-4 flex items-center gap-3.5 border-b border-border bg-secondary/50">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-heading font-bold text-sm shrink-0 transition-all duration-300 ${numClass}`}>
          {done ? "✓" : number}
        </div>
        <div>
          <div className="font-heading text-base font-semibold tracking-wide text-navy-foreground">
            {title}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
};

export default StepCard;
