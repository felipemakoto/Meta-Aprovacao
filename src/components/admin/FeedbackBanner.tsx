import { AlertTriangle, CheckCircle2, X } from "lucide-react";

export function FeedbackBanner({
  type,
  message,
  onClose,
}: {
  type: "success" | "error" | "warning";
  message: string;
  onClose?: () => void;
}) {
  const styles =
    type === "success"
      ? "bg-[var(--primary-subtle)] border-[var(--primary)] text-[var(--text)]"
      : type === "warning"
        ? "bg-[var(--warn-bg)] border-[var(--warn-border)] text-[var(--warn-text)]"
        : "bg-[var(--error-bg)] border-[var(--error-border)] text-[var(--error-text)]";

  return (
    <div
      role="status"
      className={`flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm md:text-base ${styles}`}
    >
      <div className="flex items-start gap-2.5">
        {type === "success" ? (
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-[var(--primary)]" />
        ) : (
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        )}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar aviso"
          className="min-h-[44px] min-w-[44px] -my-2 -mr-2 inline-flex items-center justify-center rounded-xl hover:opacity-75 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 space-y-3">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="h-11 rounded-xl bg-[var(--primary-subtle)] animate-pulse"
        />
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center">
      <p className="font-semibold text-[var(--text)] text-base mb-1">{title}</p>
      <p className="text-[var(--text-secondary)] text-sm md:text-base">{description}</p>
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-[var(--error-bg)] border border-[var(--error-border)] rounded-2xl p-6 text-center space-y-3">
      <p className="text-[var(--error-text)] font-medium text-base">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-[44px] px-5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-text)] font-medium text-sm cursor-pointer"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
