import { ShieldCheck } from "lucide-react";

export function SourceBadge({ name, reliability, isUserReport = false }: { name: string; reliability: number; isUserReport?: boolean }) {
  if (isUserReport) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground" aria-label={`User eyewitness report`}>
        <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
        {name}
      </span>
    );
  }

  const colorClass = reliability >= 85 ? "text-success" : reliability >= 60 ? "text-info" : "text-muted-foreground";

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <ShieldCheck size={12} className={colorClass} aria-hidden="true" />
      <span>{name}</span>
      <span className={`font-semibold ${colorClass}`} aria-label={`Reliability ${reliability}%`}>{reliability}%</span>
    </span>
  );
}
