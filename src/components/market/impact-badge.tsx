import type { MarketImpactAsset } from "@/lib/ai/types";

const levelConfig = {
  high: { label: "High", className: "text-destructive bg-destructive/10 border-destructive/20" },
  medium: { label: "Medium", className: "text-warning bg-warning/10 border-warning/20" },
  low: { label: "Low", className: "text-muted-foreground bg-muted border-border" },
} as const;

export function ImpactBadge({ level }: { level: MarketImpactAsset["impactLevel"] }) {
  const { label, className } = levelConfig[level] ?? levelConfig.low;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`} role="status" aria-label={`Impact level: ${label}`}>
      {label}
    </span>
  );
}
