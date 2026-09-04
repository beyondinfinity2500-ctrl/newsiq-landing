import { cn } from "@/lib/utils";

/**
 * Reserved advertisement slot.
 * Modular component — will be connected to an ad provider (Google AdSense, etc.) in Phase 3.
 * Clearly labeled as "Advertisement" to distinguish from editorial content.
 * No fake ad content is rendered.
 */

type Placement = "header" | "feed" | "article" | "sidebar" | "between-sections";

const sizeClasses: Record<Placement, string> = {
  header: "h-[90px] w-full max-w-7xl",
  feed: "h-[120px] w-full",
  article: "h-[250px] w-full max-w-2xl",
  sidebar: "h-[600px] w-full max-w-[300px]",
  "between-sections": "h-[90px] w-full max-w-7xl",
};

export function AdSlot({ placement, className }: { placement: Placement; className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/30",
        sizeClasses[placement],
        className,
      )}
      role="complementary"
      aria-label="Advertisement"
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">Advertisement</span>
    </div>
  );
}
