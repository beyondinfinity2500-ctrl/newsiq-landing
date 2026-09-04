import { ShieldCheck, AlertTriangle, CircleHelp, Loader2 } from "lucide-react";
import type { VerificationStatus } from "@/lib/supabase/types";

const config: Record<VerificationStatus, { icon: typeof ShieldCheck; label: string; className: string }> = {
  verified: { icon: ShieldCheck, label: "Verified", className: "text-success bg-success/10 border-success/20" },
  likely: { icon: ShieldCheck, label: "Likely", className: "text-info bg-info/10 border-info/20" },
  developing: { icon: Loader2, label: "Developing", className: "text-warning bg-warning/10 border-warning/20" },
  unverified: { icon: CircleHelp, label: "Unverified", className: "text-muted-foreground bg-muted border-border" },
  disputed: { icon: AlertTriangle, label: "Disputed", className: "text-destructive bg-destructive/10 border-destructive/20" },
};

export function VerificationBadge({ status, label }: { status: VerificationStatus; label?: string }) {
  const { icon: Icon, label: defaultLabel, className } = config[status] ?? config.unverified;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`} role="status" aria-label={label ?? defaultLabel}>
      <Icon size={11} aria-hidden="true" />
      {label ?? defaultLabel}
    </span>
  );
}

export function DevelopingBadge({ label = "Developing" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning" role="status" aria-label={label}>
      <Loader2 size={11} className="animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}
