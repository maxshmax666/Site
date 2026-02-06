import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type ToastVariant = "error" | "success" | "info";

type ToastProps = {
  title?: string;
  message: ReactNode;
  variant?: ToastVariant;
  inline?: boolean;
  onClose?: () => void;
  className?: string;
};

const variantClass: Record<ToastVariant, string> = {
  error: "bg-danger/15 border-danger/40 text-white",
  success: "bg-emerald-500/15 border-emerald-400/40 text-white",
  info: "bg-white/10 border-white/20 text-white",
};

export function Toast({ title, message, variant = "error", inline = false, onClose, className }: ToastProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-2xl border p-3 text-sm shadow-lg",
        !inline && "fixed right-4 top-4 z-50 max-w-md",
        variantClass[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {title ? <div className="font-semibold">{title}</div> : null}
          <div className={cn(title && "mt-1", "text-white/90")}>{message}</div>
        </div>
        {onClose ? (
          <button type="button" className="text-white/70 hover:text-white" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        ) : null}
      </div>
    </div>
  );
}

