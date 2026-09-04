import { AlertTriangle } from "lucide-react";

export function ErrorState({ title = "Something went wrong", description = "We couldn't load this content. Please try again.", action, className }: { title?: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-6 py-16 text-center ${className ?? ""}`} role="alert">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive" aria-hidden="true">
        <AlertTriangle size={20} />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
