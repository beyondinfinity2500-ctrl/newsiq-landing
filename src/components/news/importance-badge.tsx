import type { ImportanceLevel } from "@/lib/supabase/types";
import { Flame, Zap, ArrowUpRight, Info } from "lucide-react";

const config: Record<ImportanceLevel, { icon: typeof Flame; label: string; className: string }> = {
  breaking: { icon: Flame, label: "Breaking", className: "bg-destructive/10 text-destructive border-destructive/20" },
  high: { icon: Zap, label: "High", className: "bg-warning/10 text-warning border-warning/20" },
  medium: { icon: ArrowUpRight, label: "Medium", className: "bg-info/10 text-info border-info/20" },
  low: { icon: Info, label: "Low", className: "bg-muted text-muted-foreground border-border" },
};

export function ImportanceBadge({ importance }: { importance: ImportanceLevel }) {
  const { icon: Icon, label, className } = config[importance] ?? config.low;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`} role="status" aria-label={`${label} importance`}>
      <Icon size={11} aria-hidden="true" />
      {label}
    </span>
  );
}
