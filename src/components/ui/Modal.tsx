import { useEffect } from "react";
import { cn } from "../../lib/cn";

export function Modal({
  open,
  title,
  onClose,
  children,
  className,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className={cn("w-full max-w-lg rounded-3xl bg-card border border-white/10 shadow-glow", className)}>
          <div className="px-6 pt-6 pb-4 border-b border-white/10">
            <div className="text-lg font-bold">{title ?? "Окно"}</div>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
