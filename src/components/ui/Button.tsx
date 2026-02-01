import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "ghost" | "soft" | "danger";
type Size = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-yellow/40 disabled:opacity-50 disabled:cursor-not-allowed";

  const v =
    variant === "primary"
      ? "bg-orange text-black hover:opacity-90"
      : variant === "danger"
      ? "bg-danger text-black hover:opacity-90"
      : variant === "soft"
      ? "bg-white/10 border border-white/10 hover:bg-white/15"
      : "hover:bg-white/10";

  const s = size === "sm" ? "px-3 py-2 text-sm" : size === "lg" ? "px-5 py-3 text-base" : "px-4 py-2.5 text-sm";

  return <button className={cn(base, v, s, className)} {...props} />;
}
