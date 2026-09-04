export function ConfidenceMeter({ score, label = "Confidence" }: { score: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, score));
  const barColor = clamped >= 75 ? "bg-success" : clamped >= 50 ? "bg-info" : clamped >= 25 ? "bg-warning" : "bg-destructive";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs font-semibold text-foreground">{clamped}%</span>
    </div>
  );
}
