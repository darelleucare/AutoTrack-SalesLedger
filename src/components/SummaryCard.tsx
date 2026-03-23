interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  colorClass: string;
}

export default function SummaryCard({ title, value, subtitle, colorClass }: SummaryCardProps) {
  return (
    <div className={`${colorClass} rounded p-4 border border-border/50`}>
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</div>
      <div className="text-xl font-bold mt-1 text-foreground">{value}</div>
      {subtitle && <div className="text-sm text-muted-foreground mt-0.5">{subtitle}</div>}
    </div>
  );
}
