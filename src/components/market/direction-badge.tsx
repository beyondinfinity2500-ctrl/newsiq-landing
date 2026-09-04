import { TrendingUp, TrendingDown, Minus, CircleHelp } from "lucide-react";
import type { MarketImpactAsset } from "@/lib/ai/types";

const config = {
  positive: { icon: TrendingUp, label: "Positive", className: "text-success bg-success/10 border-success/20" },
  negative: { icon: TrendingDown, label: "Negative", className: "text-destructive bg-destructive/10 border-destructive/20" },
  neutral: { icon: Minus, label: "Neutral", className: "text-muted-foreground bg-muted border-border" },
} as const;

export function DirectionBadge({ direction }: { direction: MarketImpactAsset["direction"] }) {
  const { icon: Icon, label, className } = config[direction] ?? { icon: CircleHelp, label: "Uncertain", className: "text-warning bg-warning/10 border-warning/20" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`} role="status" aria-label={`Market direction: ${label}`}>
      <Icon size={11} aria-hidden="true" />
      {label}
    </span>
  );
}
