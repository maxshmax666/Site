import { cn } from "../../lib/cn";

export function Badge({
  children,
  tone = "yellow",
  className,
}: {
  children: React.ReactNode;
  tone?: "yellow" | "green" | "orange" | "muted";
  className?: string;
}) {
  const t =
    tone === "green"
      ? "bg-green text-black"
      : tone === "orange"
      ? "bg-orange text-black"
      : tone === "muted"
      ? "bg-white/10 text-white"
      : "bg-yellow text-black";
  return <span className={cn("inline-flex items-center px-2 py-1 rounded-xl text-xs font-bold", t, className)}>{children}</span>;
}
